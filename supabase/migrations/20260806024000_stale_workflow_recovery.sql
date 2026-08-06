create or replace function public.recover_stale_workflow_stage(
  p_actor_id uuid,
  p_organization_id uuid,
  p_workflow_id uuid,
  p_stale_after_seconds integer default 420
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  workflow_record public.agent_workflows;
  stage_record public.agent_workflow_stages;
  run_record public.agent_runs;
  recovered_at timestamptz := now();
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  if p_stale_after_seconds < 300 or p_stale_after_seconds > 3600 then
    raise exception using errcode = '22023', message = 'Invalid stale threshold';
  end if;

  select * into workflow_record
  from public.agent_workflows workflow
  where workflow.id = p_workflow_id
    and workflow.organization_id = p_organization_id
  for update;

  if workflow_record.id is null then
    raise exception using errcode = 'P0002', message = 'Workflow not found';
  end if;

  select * into stage_record
  from public.agent_workflow_stages stage
  where stage.workflow_id = p_workflow_id
    and stage.organization_id = p_organization_id
    and stage.status = 'running'
  order by stage.stage_index
  limit 1
  for update;

  if stage_record.id is null then
    return jsonb_build_object(
      'recovered', false,
      'reason', 'stage_not_running',
      'workflowId', p_workflow_id
    );
  end if;

  if stage_record.started_at is null
    or stage_record.started_at > recovered_at - make_interval(secs => p_stale_after_seconds) then
    return jsonb_build_object(
      'recovered', false,
      'reason', 'stage_not_stale',
      'workflowId', p_workflow_id,
      'stageId', stage_record.id,
      'startedAt', stage_record.started_at,
      'staleAfterSeconds', p_stale_after_seconds
    );
  end if;

  if stage_record.run_id is not null then
    select * into run_record
    from public.agent_runs run
    where run.id = stage_record.run_id
      and run.organization_id = p_organization_id
    for update;

    if run_record.id is not null and run_record.status in ('queued', 'running') then
      update public.agent_runs
      set status = 'failed',
          error_code = 'stale_execution',
          error_message = 'The execution exceeded the server runtime and was recovered',
          elapsed_ms = greatest(
            0,
            floor(extract(epoch from (recovered_at - coalesce(run_record.started_at, stage_record.started_at))) * 1000)::integer
          ),
          completed_at = recovered_at,
          updated_at = recovered_at
      where id = run_record.id
        and organization_id = p_organization_id;
    end if;
  end if;

  update public.agent_workflow_stages
  set status = 'failed',
      completed_at = recovered_at,
      updated_at = recovered_at
  where id = stage_record.id
    and organization_id = p_organization_id;

  update public.agent_workflows
  set status = 'failed',
      current_stage = stage_record.stage_index,
      error_code = 'stale_execution',
      error_message = 'A stale workflow execution was recovered',
      updated_at = recovered_at
  where id = workflow_record.id
    and organization_id = p_organization_id;

  insert into public.compliance_case_events (
    organization_id,
    case_id,
    actor_id,
    event_type,
    summary,
    changes
  ) values (
    p_organization_id,
    workflow_record.case_id,
    p_actor_id,
    'workflow_stage_recovered',
    'Ejecución agentic detenida recuperada',
    jsonb_build_object(
      'workflow_id', workflow_record.id,
      'stage_id', stage_record.id,
      'stage_index', stage_record.stage_index,
      'run_id', stage_record.run_id,
      'attempt_count', stage_record.attempt_count,
      'started_at', stage_record.started_at,
      'recovered_at', recovered_at,
      'stale_after_seconds', p_stale_after_seconds,
      'error_code', 'stale_execution'
    )
  );

  return jsonb_build_object(
    'recovered', true,
    'workflowId', workflow_record.id,
    'stageId', stage_record.id,
    'runId', stage_record.run_id,
    'attemptCount', stage_record.attempt_count,
    'maxAttempts', stage_record.max_attempts,
    'status', 'failed',
    'errorCode', 'stale_execution',
    'recoveredAt', recovered_at
  );
end;
$$;

revoke all on function public.recover_stale_workflow_stage(uuid, uuid, uuid, integer)
from public, anon, authenticated;
grant execute on function public.recover_stale_workflow_stage(uuid, uuid, uuid, integer)
to service_role;
