create or replace function public.review_agent_workflow_run(
  p_actor_id uuid,
  p_organization_id uuid,
  p_run_id uuid,
  p_decision text,
  p_comment text default null,
  p_checklist jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_run public.agent_runs%rowtype;
  v_artifact public.agent_artifacts%rowtype;
  v_stage public.agent_workflow_stages%rowtype;
  v_workflow public.agent_workflows%rowtype;
  v_review public.agent_reviews%rowtype;
  v_run_status text;
  v_artifact_status text;
  v_stage_status text;
  v_workflow_status text;
  v_is_final boolean;
begin
  if p_decision not in ('approved', 'rejected', 'changes_requested', 'commented') then
    raise exception 'invalid_review_decision' using errcode = '22023';
  end if;

  if p_decision in ('rejected', 'changes_requested') and coalesce(length(trim(p_comment)), 0) < 3 then
    raise exception 'review_comment_required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = p_actor_id
  ) then
    raise exception 'organization_membership_required' using errcode = '42501';
  end if;

  select * into v_run
  from public.agent_runs
  where id = p_run_id and organization_id = p_organization_id
  for update;

  if not found then
    raise exception 'agent_run_not_found' using errcode = 'P0002';
  end if;

  if v_run.status not in ('completed', 'pending_review', 'approved', 'rejected') then
    raise exception 'agent_run_not_reviewable' using errcode = '55000';
  end if;

  select * into v_artifact
  from public.agent_artifacts
  where run_id = p_run_id and organization_id = p_organization_id
  order by version desc
  limit 1
  for update;

  select * into v_stage
  from public.agent_workflow_stages
  where run_id = p_run_id and organization_id = p_organization_id
  limit 1
  for update;

  if v_stage.id is null then
    raise exception 'workflow_stage_not_found' using errcode = 'P0002';
  end if;

  select * into v_workflow
  from public.agent_workflows
  where id = v_stage.workflow_id and organization_id = p_organization_id
  for update;

  if v_workflow.id is null then
    raise exception 'workflow_not_found' using errcode = 'P0002';
  end if;

  insert into public.agent_reviews (
    organization_id, case_id, run_id, artifact_id, reviewer_id,
    decision, comment, checklist
  ) values (
    p_organization_id, v_run.case_id, p_run_id, v_artifact.id, p_actor_id,
    p_decision, nullif(trim(p_comment), ''), coalesce(p_checklist, '{}'::jsonb)
  ) returning * into v_review;

  v_run_status := case
    when p_decision = 'approved' then 'approved'
    when p_decision = 'rejected' then 'rejected'
    else 'pending_review'
  end;

  v_artifact_status := case
    when p_decision = 'approved' then 'approved'
    when p_decision = 'rejected' then 'rejected'
    else 'pending_review'
  end;

  v_stage_status := case
    when p_decision = 'approved' then 'approved'
    when p_decision = 'commented' then 'pending_review'
    else 'changes_requested'
  end;

  v_is_final := v_stage.stage_index >= v_workflow.total_stages - 1;
  v_workflow_status := case
    when p_decision = 'approved' and v_is_final then 'completed'
    when p_decision = 'approved' then 'running'
    when p_decision = 'commented' then 'pending_review'
    else 'paused'
  end;

  update public.agent_runs
  set status = v_run_status, updated_at = now()
  where id = v_run.id;

  if v_artifact.id is not null then
    update public.agent_artifacts
    set status = v_artifact_status
    where id = v_artifact.id;
  end if;

  update public.agent_workflow_stages
  set status = v_stage_status, updated_at = now()
  where id = v_stage.id;

  update public.agent_workflows
  set status = v_workflow_status,
      current_stage = case when v_workflow_status = 'paused' then v_stage.stage_index else current_stage end,
      completed_at = case when v_workflow_status = 'completed' then now() else null end,
      error_code = null,
      error_message = null,
      updated_at = now()
  where id = v_workflow.id;

  insert into public.compliance_case_events (
    organization_id, case_id, actor_id, event_type, summary, changes
  ) values (
    p_organization_id,
    v_run.case_id,
    p_actor_id,
    'workflow_stage_reviewed',
    case p_decision
      when 'approved' then 'Etapa agentic aprobada'
      when 'commented' then 'Etapa agentic comentada'
      when 'rejected' then 'Etapa agentic rechazada'
      else 'Se solicitaron cambios a una etapa agentic'
    end,
    jsonb_build_object(
      'workflow_id', v_workflow.id,
      'workflow_type', v_workflow.workflow_type,
      'stage_id', v_stage.id,
      'stage_index', v_stage.stage_index,
      'run_id', v_run.id,
      'artifact_id', v_artifact.id,
      'review_id', v_review.id,
      'decision', p_decision,
      'workflow_status', v_workflow_status
    )
  );

  return jsonb_build_object(
    'review', jsonb_build_object(
      'id', v_review.id,
      'decision', v_review.decision,
      'comment', v_review.comment,
      'created_at', v_review.created_at
    ),
    'runId', v_run.id,
    'status', v_run_status,
    'workflowStageId', v_stage.id,
    'workflowStatus', v_workflow_status,
    'artifactId', v_artifact.id
  );
end;
$$;

revoke all on function public.review_agent_workflow_run(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.review_agent_workflow_run(uuid, uuid, uuid, text, text, jsonb) to service_role;
