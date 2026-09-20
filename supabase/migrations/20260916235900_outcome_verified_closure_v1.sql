-- Outcome -> Action -> Verified Closure v1
--
-- Extends the existing compliance action-plan model so an approved frozen
-- agent workflow outcome can become a durable, evidence-backed closure plan.
-- Existing regulatory-impact plans remain valid; outcome plans use the new
-- source_workflow/source_snapshot provenance instead of impact_run_id.

alter table public.compliance_action_plans
  alter column impact_run_id drop not null;

alter table public.compliance_action_plans
  add column if not exists project_id uuid references public.projects(id) on delete cascade,
  add column if not exists case_id uuid references public.compliance_cases(id) on delete cascade,
  add column if not exists source_workflow_id uuid references public.agent_workflows(id) on delete cascade,
  add column if not exists source_snapshot_id uuid references public.agent_workflow_outcome_snapshots(id) on delete restrict,
  add column if not exists source_contract_version text;

alter table public.compliance_action_plans
  drop constraint if exists compliance_action_plans_source_check;

alter table public.compliance_action_plans
  add constraint compliance_action_plans_source_check
  check (impact_run_id is not null or source_snapshot_id is not null);

create unique index if not exists compliance_action_plans_source_snapshot_uidx
  on public.compliance_action_plans(source_snapshot_id)
  where source_snapshot_id is not null;

create index if not exists compliance_action_plans_org_case_idx
  on public.compliance_action_plans(organization_id, case_id, created_at desc);

create index if not exists compliance_action_plans_source_workflow_idx
  on public.compliance_action_plans(source_workflow_id)
  where source_workflow_id is not null;

alter table public.compliance_action_plan_tasks
  add column if not exists owner_role text,
  add column if not exists target_label text,
  add column if not exists dependencies text[] not null default '{}',
  add column if not exists closure_criteria text[] not null default '{}',
  add column if not exists evidence_requirements text[] not null default '{}',
  add column if not exists source_snapshot_id uuid references public.agent_workflow_outcome_snapshots(id) on delete restrict,
  add column if not exists source_outcome_action_index integer,
  add column if not exists verification_status text not null default 'pending_evidence',
  add column if not exists completion_note text,
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by uuid references auth.users(id) on delete set null,
  add column if not exists verification_notes text,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null;

alter table public.compliance_action_plan_tasks
  drop constraint if exists compliance_action_plan_tasks_verification_status_check;

alter table public.compliance_action_plan_tasks
  add constraint compliance_action_plan_tasks_verification_status_check
  check (verification_status in ('pending_evidence', 'ready_for_review', 'verified', 'changes_requested'));

create unique index if not exists compliance_action_plan_tasks_source_action_uidx
  on public.compliance_action_plan_tasks(action_plan_id, source_outcome_action_index)
  where source_outcome_action_index is not null;

create index if not exists compliance_action_plan_tasks_snapshot_idx
  on public.compliance_action_plan_tasks(source_snapshot_id)
  where source_snapshot_id is not null;

create table if not exists public.compliance_action_task_evidence (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.compliance_action_plan_tasks(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete restrict,
  linked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (task_id, evidence_id)
);

alter table public.compliance_action_task_evidence enable row level security;
revoke all on table public.compliance_action_task_evidence from anon, authenticated;
grant all on table public.compliance_action_task_evidence to service_role;

create index if not exists compliance_action_task_evidence_org_task_idx
  on public.compliance_action_task_evidence(organization_id, task_id);
create index if not exists compliance_action_task_evidence_evidence_idx
  on public.compliance_action_task_evidence(evidence_id);

create or replace function public.materialize_outcome_closure_plan(
  p_actor_id uuid,
  p_organization_id uuid,
  p_workflow_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_role text;
  v_workflow public.agent_workflows%rowtype;
  v_snapshot public.agent_workflow_outcome_snapshots%rowtype;
  v_case_title text;
  v_project_id uuid;
  v_plan_id uuid;
  v_plan_created boolean := false;
  v_task_count integer := 0;
  v_plan_priority text := 'medium';
  v_action jsonb;
  v_ordinality bigint;
  v_priority text;
  v_closure text[];
  v_dependencies text[];
begin
  select member.role into v_member_role
  from public.organization_members member
  where member.organization_id = p_organization_id
    and member.user_id = p_actor_id
  for share;

  if not found then
    raise exception 'organization_membership_required' using errcode = '42501';
  end if;

  select workflow.* into v_workflow
  from public.agent_workflows workflow
  where workflow.id = p_workflow_id
    and workflow.organization_id = p_organization_id
  for update;

  if not found then
    raise exception 'workflow_not_found' using errcode = 'P0002';
  end if;

  if v_workflow.status <> 'completed' then
    raise exception 'workflow_not_completed' using errcode = '55000';
  end if;

  select c.title, c.project_id
    into v_case_title, v_project_id
  from public.compliance_cases c
  where c.id = v_workflow.case_id
    and c.organization_id = p_organization_id;

  if v_project_id is null then
    raise exception 'workflow_case_project_missing' using errcode = '55000';
  end if;

  select snapshot.* into v_snapshot
  from public.agent_workflow_outcome_snapshots snapshot
  where snapshot.workflow_id = v_workflow.id
    and snapshot.organization_id = p_organization_id
  order by snapshot.frozen_at desc
  limit 1
  for share;

  if not found then
    raise exception 'approved_outcome_snapshot_required' using errcode = '55000';
  end if;

  if coalesce(v_snapshot.outcome #>> '{humanReviewStatus}', '') <> 'approved' then
    raise exception 'approved_human_review_required' using errcode = '55000';
  end if;

  if jsonb_typeof(v_snapshot.outcome -> 'actions') <> 'array'
     or jsonb_array_length(v_snapshot.outcome -> 'actions') < 1 then
    raise exception 'outcome_has_no_actions' using errcode = '22023';
  end if;

  select plan.id into v_plan_id
  from public.compliance_action_plans plan
  where plan.source_snapshot_id = v_snapshot.id
    and plan.organization_id = p_organization_id
  limit 1;

  if v_plan_id is not null then
    select count(*) into v_task_count
    from public.compliance_action_plan_tasks task
    where task.action_plan_id = v_plan_id;

    return jsonb_build_object(
      'planId', v_plan_id,
      'created', false,
      'taskCount', v_task_count,
      'snapshotId', v_snapshot.id,
      'contractVersion', v_snapshot.contract_version
    );
  end if;

  select case
    when bool_or(coalesce(action.value ->> 'priority', '') = 'critical') then 'critical'
    when bool_or(coalesce(action.value ->> 'priority', '') = 'high') then 'high'
    when bool_or(coalesce(action.value ->> 'priority', '') = 'medium') then 'medium'
    when bool_or(coalesce(action.value ->> 'priority', '') = 'low') then 'low'
    else 'medium'
  end
  into v_plan_priority
  from jsonb_array_elements(v_snapshot.outcome -> 'actions') action(value);

  insert into public.compliance_action_plans (
    organization_id,
    impact_run_id,
    project_id,
    case_id,
    source_workflow_id,
    source_snapshot_id,
    source_contract_version,
    title,
    description,
    status,
    priority,
    source_snapshot,
    created_by
  ) values (
    p_organization_id,
    null,
    v_project_id,
    v_workflow.case_id,
    v_workflow.id,
    v_snapshot.id,
    v_snapshot.contract_version,
    'Plan de cierre verificable — ' || coalesce(v_case_title, 'Caso de cumplimiento'),
    nullif(v_snapshot.outcome ->> 'summary', ''),
    'approved',
    v_plan_priority,
    jsonb_build_object(
      'workflowId', v_workflow.id,
      'snapshotId', v_snapshot.id,
      'contractVersion', v_snapshot.contract_version,
      'contentHash', v_snapshot.content_hash,
      'humanReviewStatus', v_snapshot.outcome #>> '{humanReviewStatus}'
    ),
    p_actor_id
  )
  returning id into v_plan_id;

  v_plan_created := true;

  for v_action, v_ordinality in
    select action.value, action.ordinality
    from jsonb_array_elements(v_snapshot.outcome -> 'actions') with ordinality action(value, ordinality)
  loop
    v_priority := case
      when v_action ->> 'priority' in ('low', 'medium', 'high', 'critical') then v_action ->> 'priority'
      else 'medium'
    end;

    select coalesce(array_agg(value order by ordinality), '{}'::text[])
      into v_dependencies
    from jsonb_array_elements_text(coalesce(v_action -> 'dependencies', '[]'::jsonb)) with ordinality dep(value, ordinality);

    select coalesce(array_agg(value order by ordinality), '{}'::text[])
      into v_closure
    from jsonb_array_elements_text(coalesce(v_action -> 'closureCriteria', '[]'::jsonb)) with ordinality criterion(value, ordinality);

    insert into public.compliance_action_plan_tasks (
      action_plan_id,
      title,
      description,
      status,
      priority,
      owner_role,
      target_label,
      due_date,
      sequence,
      dependencies,
      closure_criteria,
      evidence_requirements,
      source_snapshot_id,
      source_outcome_action_index,
      verification_status
    ) values (
      v_plan_id,
      coalesce(nullif(trim(v_action ->> 'title'), ''), 'Acción de cierre'),
      null,
      'pending',
      v_priority,
      nullif(trim(v_action ->> 'ownerRole'), ''),
      nullif(trim(v_action ->> 'target'), ''),
      null,
      v_ordinality::integer,
      v_dependencies,
      v_closure,
      v_closure,
      v_snapshot.id,
      (v_ordinality - 1)::integer,
      'pending_evidence'
    );

    v_task_count := v_task_count + 1;
  end loop;

  insert into public.compliance_case_events (
    organization_id, case_id, actor_id, event_type, summary, changes
  ) values (
    p_organization_id,
    v_workflow.case_id,
    p_actor_id,
    'outcome_closure_plan_created',
    'Outcome aprobado convertido en plan de cierre verificable',
    jsonb_build_object(
      'workflow_id', v_workflow.id,
      'snapshot_id', v_snapshot.id,
      'action_plan_id', v_plan_id,
      'task_count', v_task_count,
      'contract_version', v_snapshot.contract_version
    )
  );

  return jsonb_build_object(
    'planId', v_plan_id,
    'created', v_plan_created,
    'taskCount', v_task_count,
    'snapshotId', v_snapshot.id,
    'contractVersion', v_snapshot.contract_version
  );
end;
$$;

create or replace function public.submit_outcome_closure_task(
  p_actor_id uuid,
  p_organization_id uuid,
  p_task_id uuid,
  p_evidence_ids uuid[],
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_role text;
  v_task public.compliance_action_plan_tasks%rowtype;
  v_plan public.compliance_action_plans%rowtype;
  v_requested_count integer;
  v_valid_count integer;
  v_ready boolean;
begin
  select member.role into v_member_role
  from public.organization_members member
  where member.organization_id = p_organization_id
    and member.user_id = p_actor_id
  for share;

  if not found then
    raise exception 'organization_membership_required' using errcode = '42501';
  end if;

  select task.* into v_task
  from public.compliance_action_plan_tasks task
  join public.compliance_action_plans plan on plan.id = task.action_plan_id
  where task.id = p_task_id
    and plan.organization_id = p_organization_id
  for update of task;

  if not found then
    raise exception 'closure_task_not_found' using errcode = 'P0002';
  end if;

  select * into v_plan
  from public.compliance_action_plans plan
  where plan.id = v_task.action_plan_id
    and plan.organization_id = p_organization_id
  for update;

  v_requested_count := coalesce(cardinality(p_evidence_ids), 0);
  if v_requested_count < 1 then
    raise exception 'closure_evidence_required' using errcode = '22023';
  end if;

  select count(*) into v_valid_count
  from public.evidence evidence
  where evidence.id = any(p_evidence_ids)
    and evidence.organization_id = p_organization_id
    and evidence.project_id = v_plan.project_id
    and evidence.validation_status = 'accepted'
    and evidence.integrity_status = 'verified';

  if v_valid_count <> v_requested_count then
    raise exception 'closure_evidence_not_verified' using errcode = '22023';
  end if;

  insert into public.compliance_action_task_evidence (
    organization_id, task_id, evidence_id, linked_by
  )
  select p_organization_id, v_task.id, evidence_id, p_actor_id
  from unnest(p_evidence_ids) evidence_id
  on conflict (task_id, evidence_id) do nothing;

  v_ready := cardinality(v_task.closure_criteria) > 0;

  update public.compliance_action_plan_tasks
  set status = case when v_ready then 'completed' else 'in_progress' end,
      verification_status = case when v_ready then 'ready_for_review' else 'pending_evidence' end,
      completion_note = nullif(trim(p_note), ''),
      completed_at = case when v_ready then now() else null end,
      completed_by = case when v_ready then p_actor_id else null end,
      updated_at = now()
  where id = v_task.id;

  update public.compliance_action_plans
  set status = case when status in ('completed', 'archived') then status else 'in_progress' end,
      updated_at = now()
  where id = v_plan.id;

  insert into public.compliance_case_events (
    organization_id, case_id, actor_id, event_type, summary, changes
  ) values (
    p_organization_id,
    v_plan.case_id,
    p_actor_id,
    'outcome_closure_task_submitted',
    case when v_ready then 'Acción enviada a verificación de cierre' else 'Evidencia vinculada; faltan criterios de cierre verificables' end,
    jsonb_build_object(
      'action_plan_id', v_plan.id,
      'task_id', v_task.id,
      'evidence_ids', to_jsonb(p_evidence_ids),
      'verification_status', case when v_ready then 'ready_for_review' else 'pending_evidence' end
    )
  );

  return jsonb_build_object(
    'taskId', v_task.id,
    'status', case when v_ready then 'completed' else 'in_progress' end,
    'verificationStatus', case when v_ready then 'ready_for_review' else 'pending_evidence' end,
    'evidenceCount', v_requested_count,
    'closureCriteriaPresent', v_ready
  );
end;
$$;

create or replace function public.review_outcome_closure_task(
  p_actor_id uuid,
  p_organization_id uuid,
  p_task_id uuid,
  p_decision text,
  p_comment text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role text;
  v_task public.compliance_action_plan_tasks%rowtype;
  v_plan public.compliance_action_plans%rowtype;
  v_verified_evidence integer;
  v_remaining integer;
  v_plan_status text;
begin
  if p_decision not in ('verified', 'changes_requested') then
    raise exception 'invalid_closure_review_decision' using errcode = '22023';
  end if;

  if coalesce(length(trim(p_comment)), 0) < 3 then
    raise exception 'closure_review_comment_required' using errcode = '22023';
  end if;

  select member.role into v_actor_role
  from public.organization_members member
  where member.organization_id = p_organization_id
    and member.user_id = p_actor_id
  for share;

  if not found or v_actor_role not in ('owner', 'admin', 'compliance', 'reviewer') then
    raise exception 'closure_review_forbidden' using errcode = '42501';
  end if;

  select task.* into v_task
  from public.compliance_action_plan_tasks task
  join public.compliance_action_plans plan on plan.id = task.action_plan_id
  where task.id = p_task_id
    and plan.organization_id = p_organization_id
  for update of task;

  if not found then
    raise exception 'closure_task_not_found' using errcode = 'P0002';
  end if;

  select * into v_plan
  from public.compliance_action_plans plan
  where plan.id = v_task.action_plan_id
    and plan.organization_id = p_organization_id
  for update;

  if p_decision = 'verified' then
    if v_task.status <> 'completed' or v_task.verification_status <> 'ready_for_review' then
      raise exception 'closure_task_not_reviewable' using errcode = '55000';
    end if;

    if cardinality(v_task.closure_criteria) < 1 then
      raise exception 'closure_criteria_required' using errcode = '55000';
    end if;

    select count(*) into v_verified_evidence
    from public.compliance_action_task_evidence link
    join public.evidence evidence on evidence.id = link.evidence_id
    where link.task_id = v_task.id
      and link.organization_id = p_organization_id
      and evidence.organization_id = p_organization_id
      and evidence.validation_status = 'accepted'
      and evidence.integrity_status = 'verified';

    if v_verified_evidence < 1 then
      raise exception 'verified_closure_evidence_required' using errcode = '55000';
    end if;

    update public.compliance_action_plan_tasks
    set verification_status = 'verified',
        verification_notes = trim(p_comment),
        verified_at = now(),
        verified_by = p_actor_id,
        updated_at = now()
    where id = v_task.id;
  else
    update public.compliance_action_plan_tasks
    set status = 'in_progress',
        verification_status = 'changes_requested',
        verification_notes = trim(p_comment),
        completed_at = null,
        completed_by = null,
        verified_at = null,
        verified_by = null,
        updated_at = now()
    where id = v_task.id;
  end if;

  select count(*) into v_remaining
  from public.compliance_action_plan_tasks task
  where task.action_plan_id = v_plan.id
    and task.verification_status <> 'verified';

  v_plan_status := case
    when v_remaining = 0 then 'completed'
    when p_decision = 'changes_requested' then 'in_progress'
    else 'in_progress'
  end;

  update public.compliance_action_plans
  set status = v_plan_status,
      updated_at = now()
  where id = v_plan.id;

  insert into public.compliance_case_events (
    organization_id, case_id, actor_id, event_type, summary, changes
  ) values (
    p_organization_id,
    v_plan.case_id,
    p_actor_id,
    'outcome_closure_task_reviewed',
    case when p_decision = 'verified' then 'Cierre de acción verificado con evidencia' else 'Se solicitaron cambios al cierre de una acción' end,
    jsonb_build_object(
      'action_plan_id', v_plan.id,
      'task_id', v_task.id,
      'decision', p_decision,
      'comment', trim(p_comment),
      'remaining_unverified_tasks', v_remaining,
      'action_plan_status', v_plan_status
    )
  );

  if v_plan_status = 'completed' then
    insert into public.compliance_case_events (
      organization_id, case_id, actor_id, event_type, summary, changes
    ) values (
      p_organization_id,
      v_plan.case_id,
      p_actor_id,
      'outcome_closure_plan_completed',
      'Todas las acciones del outcome tienen cierre verificado',
      jsonb_build_object(
        'action_plan_id', v_plan.id,
        'source_workflow_id', v_plan.source_workflow_id,
        'source_snapshot_id', v_plan.source_snapshot_id
      )
    );
  end if;

  return jsonb_build_object(
    'taskId', v_task.id,
    'decision', p_decision,
    'verificationStatus', p_decision,
    'planStatus', v_plan_status,
    'remainingUnverifiedTasks', v_remaining
  );
end;
$$;

revoke all on function public.materialize_outcome_closure_plan(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.submit_outcome_closure_task(uuid, uuid, uuid, uuid[], text) from public, anon, authenticated;
revoke all on function public.review_outcome_closure_task(uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.materialize_outcome_closure_plan(uuid, uuid, uuid) to service_role;
grant execute on function public.submit_outcome_closure_task(uuid, uuid, uuid, uuid[], text) to service_role;
grant execute on function public.review_outcome_closure_task(uuid, uuid, uuid, text, text) to service_role;
