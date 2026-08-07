-- Repair the tenant-assurance refresh in environments where the foundation
-- migration was already applied. Runs and artifacts belong to a workflow
-- through agent_workflow_stages; neither table owns a workflow_id column.

create or replace function public.refresh_tenant_assurance_run_v1(p_run_key text)
returns jsonb
language plpgsql
set search_path to ''
as $function$
declare
  v_run public.tenant_assurance_runs%rowtype;
  v_workflow_status text;
  v_mission_status text;
  v_request_status text;
  v_total_stages integer := 0;
  v_approved_stages integer := 0;
  v_pending_review integer := 0;
  v_completed_runs integer := 0;
  v_approved_artifacts integer := 0;
  v_reviews integer := 0;
  v_active_jobs integer := 0;
  v_dead_letters integer := 0;
  v_processing_approved boolean := false;
  v_all_static_checks boolean := false;
  v_status text;
  v_error text;
  v_metrics jsonb;
begin
  select assurance.*
  into v_run
  from public.tenant_assurance_runs assurance
  where assurance.run_key = btrim(p_run_key)
  for update;

  if v_run.id is null then
    raise exception using errcode = 'P0002', message = 'Tenant assurance run not found';
  end if;

  select workflow.status
  into v_workflow_status
  from public.agent_workflows workflow
  where workflow.id = v_run.workflow_id
    and workflow.organization_id = v_run.sandbox_organization_id;

  select mission.status
  into v_mission_status
  from public.missions mission
  where mission.id = v_run.mission_id
    and mission.organization_id = v_run.sandbox_organization_id;

  select request.status
  into v_request_status
  from public.evidence_requests request
  where request.id = v_run.evidence_request_id
    and request.organization_id = v_run.sandbox_organization_id;

  select
    count(*),
    count(*) filter (where stage.status = 'approved'),
    count(*) filter (where stage.status = 'pending_review')
  into v_total_stages, v_approved_stages, v_pending_review
  from public.agent_workflow_stages stage
  where stage.workflow_id = v_run.workflow_id
    and stage.organization_id = v_run.sandbox_organization_id;

  select count(distinct run.id)
  into v_completed_runs
  from public.agent_workflow_stages stage
  join public.agent_runs run
    on run.id = stage.run_id
   and run.organization_id = stage.organization_id
  where stage.workflow_id = v_run.workflow_id
    and stage.organization_id = v_run.sandbox_organization_id
    and run.status in ('completed', 'pending_review', 'approved');

  select count(distinct artifact.id)
  into v_approved_artifacts
  from public.agent_workflow_stages stage
  join public.agent_artifacts artifact
    on artifact.run_id = stage.run_id
   and artifact.organization_id = stage.organization_id
  where stage.workflow_id = v_run.workflow_id
    and stage.organization_id = v_run.sandbox_organization_id
    and artifact.status = 'approved'
    and artifact.superseded_at is null;

  select count(distinct review.id)
  into v_reviews
  from public.agent_workflow_stages stage
  join public.agent_reviews review
    on review.run_id = stage.run_id
   and review.organization_id = stage.organization_id
  where stage.workflow_id = v_run.workflow_id
    and stage.organization_id = v_run.sandbox_organization_id
    and review.decision = 'approved';

  select
    count(*) filter (where job.status in ('queued', 'leased', 'retry_wait')),
    count(*) filter (where job.status = 'dead_letter')
  into v_active_jobs, v_dead_letters
  from public.agent_jobs job
  where job.workflow_id = v_run.workflow_id
    and job.organization_id = v_run.sandbox_organization_id;

  select exists (
    select 1
    from public.processing_activity_reviews review
    where review.id in (
      select (process.attributes ->> 'latestReviewId')::uuid
      from public.organization_processes process
      where process.id = v_run.processing_activity_id
        and process.organization_id = v_run.sandbox_organization_id
        and process.attributes ? 'latestReviewId'
    )
      and review.decision = 'approved'
      and review.completeness = 'partial'
      and cardinality(review.unknowns) > 0
  ) into v_processing_approved;

  v_all_static_checks := coalesce((v_run.check_results ->> 'onboardingIdempotent')::boolean, false)
    and coalesce((v_run.check_results ->> 'guidedCaseIdempotent')::boolean, false)
    and coalesce((v_run.check_results ->> 'operationalPlanIdempotent')::boolean, false)
    and coalesce((v_run.check_results ->> 'baselineIdempotent')::boolean, false)
    and coalesce((v_run.check_results ->> 'processingIdempotent')::boolean, false)
    and coalesce((v_run.check_results ->> 'queueIdempotent')::boolean, false)
    and coalesce((v_run.check_results ->> 'sandboxReadsOwnData')::boolean, false)
    and coalesce((v_run.check_results ->> 'sandboxCannotReadPrimary')::boolean, false)
    and coalesce((v_run.check_results ->> 'primaryCannotReadSandbox')::boolean, false)
    and coalesce((v_run.check_results ->> 'workspaceSwitchDeniedBothWays')::boolean, false)
    and coalesce((v_run.check_results ->> 'browserInternalTablesDenied')::boolean, false)
    and coalesce((v_run.check_results ->> 'browserInventoryRpcDenied')::boolean, false)
    and coalesce((v_run.check_results ->> 'wrongTenantServerMutationDenied')::boolean, false);

  if v_dead_letters > 0 or v_workflow_status in ('cancelled', 'paused') then
    v_status := 'failed';
    v_error := case
      when v_dead_letters > 0 then 'One or more agent jobs reached dead-letter.'
      else 'The assurance workflow is paused or cancelled.'
    end;
  elsif v_all_static_checks
    and v_workflow_status = 'completed'
    and v_total_stages > 0
    and v_approved_stages = v_total_stages
    and v_mission_status = 'completed'
    and v_request_status = 'accepted'
    and v_processing_approved
  then
    v_status := 'passed';
    v_error := null;
  elsif v_active_jobs > 0 or v_pending_review > 0 or v_workflow_status in ('draft', 'running', 'pending_review') then
    v_status := 'running';
    v_error := null;
  else
    v_status := 'prepared';
    v_error := null;
  end if;

  v_metrics := jsonb_build_object(
    'workflowStatus', v_workflow_status,
    'missionStatus', v_mission_status,
    'evidenceRequestStatus', v_request_status,
    'totalStages', v_total_stages,
    'approvedStages', v_approved_stages,
    'pendingReviewStages', v_pending_review,
    'completedRuns', v_completed_runs,
    'approvedArtifacts', v_approved_artifacts,
    'approvedReviews', v_reviews,
    'activeJobs', v_active_jobs,
    'deadLetterJobs', v_dead_letters,
    'processingReviewApproved', v_processing_approved,
    'staticChecksPassed', v_all_static_checks
  );

  update public.tenant_assurance_runs assurance
  set status = v_status,
      metrics = coalesce(assurance.metrics, '{}'::jsonb) || v_metrics,
      latest_error = v_error,
      completed_at = case when v_status = 'passed' then coalesce(assurance.completed_at, now()) else null end,
      last_checked_at = now(),
      updated_at = now()
  where assurance.id = v_run.id;

  return jsonb_build_object(
    'runId', v_run.id,
    'runKey', v_run.run_key,
    'status', v_status,
    'checks', v_run.check_results,
    'metrics', v_metrics,
    'latestError', v_error
  );
end;
$function$;

revoke all on function public.refresh_tenant_assurance_run_v1(text)
from public, anon, authenticated;
grant execute on function public.refresh_tenant_assurance_run_v1(text)
to service_role;
