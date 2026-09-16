begin;

create table if not exists public.agent_workflow_outcome_snapshots (
  id uuid primary key default extensions.gen_random_uuid(),
  workflow_id uuid not null references public.agent_workflows(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.compliance_cases(id) on delete cascade,
  review_id uuid not null references public.agent_reviews(id) on delete restrict,
  reviewer_id uuid references auth.users(id) on delete set null,
  contract_version text not null,
  outcome jsonb not null,
  quality jsonb not null,
  source_artifact_ids uuid[] not null default '{}',
  source_review_ids uuid[] not null default '{}',
  content_hash text not null,
  frozen_at timestamptz not null default now(),
  constraint agent_workflow_outcome_snapshots_contract_version_check
    check (contract_version ~ '^outcome-v[0-9]+$'),
  constraint agent_workflow_outcome_snapshots_outcome_object_check
    check (jsonb_typeof(outcome) = 'object'),
  constraint agent_workflow_outcome_snapshots_quality_object_check
    check (jsonb_typeof(quality) = 'object'),
  constraint agent_workflow_outcome_snapshots_content_hash_check
    check (content_hash ~ '^[a-f0-9]{64}$'),
  unique (workflow_id, contract_version)
);

comment on table public.agent_workflow_outcome_snapshots is
  'Immutable application-level snapshot of the human-approved workflow outcome. The legacy agent_workflows.final_payload remains untouched.';

create index if not exists agent_workflow_outcome_snapshots_org_frozen_idx
  on public.agent_workflow_outcome_snapshots(organization_id, frozen_at desc);

alter table public.agent_workflow_outcome_snapshots enable row level security;

revoke all on table public.agent_workflow_outcome_snapshots from public, anon, authenticated;
grant select on table public.agent_workflow_outcome_snapshots to authenticated;
grant all on table public.agent_workflow_outcome_snapshots to service_role;

create policy agent_workflow_outcome_snapshots_select_organization
  on public.agent_workflow_outcome_snapshots
  for select
  to authenticated
  using (public.is_organization_member(organization_id));

create policy agent_workflow_outcome_snapshots_service_role_all
  on public.agent_workflow_outcome_snapshots
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.review_agent_workflow_run(
  p_actor_id uuid,
  p_organization_id uuid,
  p_run_id uuid,
  p_decision text,
  p_comment text,
  p_checklist jsonb,
  p_outcome_snapshot jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stage public.agent_workflow_stages%rowtype;
  v_workflow public.agent_workflows%rowtype;
  v_is_final boolean := false;
  v_result jsonb;
  v_review_id uuid;
  v_snapshot public.agent_workflow_outcome_snapshots%rowtype;
  v_expected_artifact_ids uuid[] := '{}';
  v_expected_review_ids uuid[] := '{}';
  v_source_artifact_ids uuid[] := '{}';
  v_source_review_ids uuid[] := '{}';
  v_contract_version text;
begin
  select *
    into v_stage
  from public.agent_workflow_stages
  where run_id = p_run_id
    and organization_id = p_organization_id
  limit 1;

  if v_stage.id is not null then
    select *
      into v_workflow
    from public.agent_workflows
    where id = v_stage.workflow_id
      and organization_id = p_organization_id;

    if v_workflow.id is not null then
      v_is_final := v_stage.stage_index >= v_workflow.total_stages - 1;
    end if;
  end if;

  if p_decision = 'approved' and v_is_final then
    if p_outcome_snapshot is null or jsonb_typeof(p_outcome_snapshot) <> 'object' then
      raise exception 'final_outcome_snapshot_required' using errcode = '22023';
    end if;

    v_contract_version := nullif(trim(p_outcome_snapshot ->> 'contractVersion'), '');
    if v_contract_version is null or v_contract_version !~ '^outcome-v[0-9]+$' then
      raise exception 'invalid_outcome_snapshot_contract' using errcode = '22023';
    end if;

    if jsonb_typeof(p_outcome_snapshot -> 'outcome') <> 'object'
       or jsonb_typeof(p_outcome_snapshot -> 'quality') <> 'object'
       or p_outcome_snapshot #>> '{outcome,humanReviewStatus}' <> 'approved' then
      raise exception 'invalid_outcome_snapshot_payload' using errcode = '22023';
    end if;

    select coalesce(array_agg(stage.output_artifact_id order by stage.output_artifact_id), '{}'::uuid[])
      into v_expected_artifact_ids
    from public.agent_workflow_stages stage
    where stage.workflow_id = v_workflow.id
      and stage.organization_id = p_organization_id
      and stage.output_artifact_id is not null;

    select coalesce(array_agg(review.id order by review.id), '{}'::uuid[])
      into v_expected_review_ids
    from public.agent_reviews review
    where review.organization_id = p_organization_id
      and review.run_id in (
        select stage.run_id
        from public.agent_workflow_stages stage
        where stage.workflow_id = v_workflow.id
          and stage.organization_id = p_organization_id
          and stage.run_id is not null
      );

    select coalesce(array_agg(value::uuid order by value::uuid), '{}'::uuid[])
      into v_source_artifact_ids
    from jsonb_array_elements_text(coalesce(p_outcome_snapshot -> 'sourceArtifactIds', '[]'::jsonb)) as source(value);

    select coalesce(array_agg(value::uuid order by value::uuid), '{}'::uuid[])
      into v_source_review_ids
    from jsonb_array_elements_text(coalesce(p_outcome_snapshot -> 'sourceReviewIds', '[]'::jsonb)) as source(value);

    if v_source_artifact_ids is distinct from v_expected_artifact_ids
       or v_source_review_ids is distinct from v_expected_review_ids then
      raise exception 'outcome_snapshot_stale' using errcode = '40001';
    end if;
  elsif p_outcome_snapshot is not null then
    raise exception 'outcome_snapshot_not_final' using errcode = '22023';
  end if;

  v_result := public.review_agent_workflow_run(
    p_actor_id,
    p_organization_id,
    p_run_id,
    p_decision,
    p_comment,
    p_checklist
  );

  if p_decision = 'approved' and v_is_final then
    v_review_id := nullif(v_result #>> '{review,id}', '')::uuid;
    if v_review_id is null then
      raise exception 'outcome_snapshot_review_missing' using errcode = '55000';
    end if;

    insert into public.agent_workflow_outcome_snapshots (
      workflow_id,
      organization_id,
      case_id,
      review_id,
      reviewer_id,
      contract_version,
      outcome,
      quality,
      source_artifact_ids,
      source_review_ids,
      content_hash
    ) values (
      v_workflow.id,
      p_organization_id,
      v_workflow.case_id,
      v_review_id,
      p_actor_id,
      v_contract_version,
      p_outcome_snapshot -> 'outcome',
      p_outcome_snapshot -> 'quality',
      v_source_artifact_ids,
      array_append(v_source_review_ids, v_review_id),
      encode(extensions.digest(convert_to(p_outcome_snapshot::text, 'UTF8'), 'sha256'), 'hex')
    )
    returning * into v_snapshot;

    v_result := v_result || jsonb_build_object(
      'outcomeSnapshot', jsonb_build_object(
        'id', v_snapshot.id,
        'frozen', true,
        'contractVersion', v_snapshot.contract_version,
        'reviewId', v_snapshot.review_id,
        'frozenAt', v_snapshot.frozen_at,
        'contentHash', v_snapshot.content_hash
      )
    );
  end if;

  return v_result;
end;
$$;

revoke all on function public.review_agent_workflow_run(uuid,uuid,uuid,text,text,jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function public.review_agent_workflow_run(uuid,uuid,uuid,text,text,jsonb,jsonb)
  to service_role;

commit;
