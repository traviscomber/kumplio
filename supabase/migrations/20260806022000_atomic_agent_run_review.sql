create or replace function public.review_agent_run_record(
  p_actor_id uuid,
  p_organization_id uuid,
  p_run_id uuid,
  p_decision text,
  p_comment text default null,
  p_checklist jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  run_record public.agent_runs;
  artifact_record public.agent_artifacts;
  stage_record public.agent_workflow_stages;
  workflow_record public.agent_workflows;
  review_id uuid;
  review_created_at timestamptz;
  run_status text;
  artifact_status text;
  stage_status text;
  workflow_status text;
  reviewed_at timestamptz := now();
  is_final_stage boolean := false;
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  if p_decision not in ('approved', 'rejected', 'changes_requested', 'commented') then
    raise exception using errcode = '22023', message = 'Invalid review decision';
  end if;

  if p_decision in ('rejected', 'changes_requested')
    and char_length(coalesce(trim(p_comment), '')) < 3 then
    raise exception using errcode = '22023', message = 'Review comment required';
  end if;

  select * into run_record
  from public.agent_runs run
  where run.id = p_run_id
    and run.organization_id = p_organization_id
  for update;

  if run_record.id is null then
    raise exception using errcode = 'P0002', message = 'Agent run not found';
  end if;

  if run_record.status not in ('completed', 'pending_review') then
    raise exception using errcode = '22023', message = 'Run is not reviewable';
  end if;

  select * into artifact_record
  from public.agent_artifacts artifact
  where artifact.run_id = p_run_id
    and artifact.organization_id = p_organization_id
  order by artifact.version desc
  limit 1
  for update;

  select * into stage_record
  from public.agent_workflow_stages stage
  where stage.run_id = p_run_id
    and stage.organization_id = p_organization_id
  limit 1
  for update;

  if stage_record.id is not null then
    select * into workflow_record
    from public.agent_workflows workflow
    where workflow.id = stage_record.workflow_id
      and workflow.organization_id = p_organization_id
    for update;
  end if;

  insert into public.agent_reviews (
    organization_id,
    case_id,
    run_id,
    artifact_id,
    reviewer_id,
    decision,
    comment,
    checklist
  ) values (
    p_organization_id,
    run_record.case_id,
    p_run_id,
    artifact_record.id,
    p_actor_id,
    p_decision,
    nullif(trim(p_comment), ''),
    coalesce(p_checklist, '{}'::jsonb)
  )
  returning id, created_at into review_id, review_created_at;

  run_status := case
    when p_decision = 'approved' then 'approved'
    when p_decision = 'rejected' then 'rejected'
    else 'pending_review'
  end;

  artifact_status := case
    when p_decision = 'approved' then 'approved'
    when p_decision = 'rejected' then 'rejected'
    when p_decision = 'changes_requested' then 'changes_requested'
    else 'pending_review'
  end;

  update public.agent_runs
  set status = run_status,
      updated_at = reviewed_at
  where id = p_run_id
    and organization_id = p_organization_id;

  if artifact_record.id is not null then
    if p_decision = 'approved' then
      update public.agent_artifacts
      set status = artifact_status,
          approved_by = p_actor_id,
          approved_at = reviewed_at,
          locked_at = reviewed_at
      where id = artifact_record.id
        and organization_id = p_organization_id;
    else
      update public.agent_artifacts
      set status = artifact_status
      where id = artifact_record.id
        and organization_id = p_organization_id;
    end if;
  end if;

  if stage_record.id is not null then
    stage_status := case
      when p_decision = 'approved' then 'approved'
      when p_decision = 'commented' then 'pending_review'
      else 'changes_requested'
    end;

    update public.agent_workflow_stages
    set status = stage_status,
        updated_at = reviewed_at
    where id = stage_record.id
      and organization_id = p_organization_id;

    if workflow_record.id is not null then
      is_final_stage := stage_record.stage_index >= workflow_record.total_stages - 1;
      workflow_status := case
        when p_decision = 'approved' and is_final_stage then 'completed'
        when p_decision = 'approved' then 'running'
        when p_decision = 'commented' then 'pending_review'
        else 'paused'
      end;

      update public.agent_workflows
      set status = workflow_status,
          current_stage = case
            when workflow_status = 'paused' then stage_record.stage_index
            else current_stage
          end,
          completed_at = case
            when workflow_status = 'completed' then reviewed_at
            else null
          end,
          error_code = null,
          error_message = null,
          updated_at = reviewed_at
      where id = workflow_record.id
        and organization_id = p_organization_id;

      if run_record.case_id is not null then
        insert into public.compliance_case_events (
          organization_id,
          case_id,
          actor_id,
          event_type,
          summary,
          changes
        ) values (
          p_organization_id,
          run_record.case_id,
          p_actor_id,
          'workflow_stage_reviewed',
          case
            when p_decision = 'approved' then 'Etapa agentic aprobada'
            when p_decision = 'commented' then 'Etapa agentic comentada'
            when p_decision = 'rejected' then 'Etapa agentic rechazada'
            else 'Se solicitaron cambios a una etapa agentic'
          end,
          jsonb_build_object(
            'workflow_id', workflow_record.id,
            'workflow_type', workflow_record.workflow_type,
            'stage_id', stage_record.id,
            'stage_index', stage_record.stage_index,
            'run_id', p_run_id,
            'artifact_id', artifact_record.id,
            'review_id', review_id,
            'decision', p_decision,
            'workflow_status', workflow_status
          )
        );
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'review', jsonb_build_object(
      'id', review_id,
      'decision', p_decision,
      'comment', nullif(trim(p_comment), ''),
      'created_at', review_created_at
    ),
    'runId', p_run_id,
    'status', run_status,
    'workflowStageId', stage_record.id,
    'workflowStatus', workflow_status
  );
end;
$$;

revoke all on function public.review_agent_run_record(uuid, uuid, uuid, text, text, jsonb)
from public, anon, authenticated;
grant execute on function public.review_agent_run_record(uuid, uuid, uuid, text, text, jsonb)
to service_role;
