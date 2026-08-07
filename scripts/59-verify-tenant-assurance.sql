begin;

do $verify$
declare
  v_run public.tenant_assurance_runs%rowtype;
  v_primary_user uuid;
  v_sandbox_user uuid;
  v_own_count integer;
  v_cross_count integer;
  v_workspace_count integer;
  v_denied boolean;
  v_wrong_actor_denied boolean := false;
  v_refresh jsonb;
  v_duplicate_counts jsonb;
  v_payload jsonb;
begin
  select assurance.*
  into v_run
  from public.tenant_assurance_runs assurance
  where assurance.run_key = 'tenant-assurance-v1';

  if v_run.id is null then
    raise exception 'Tenant assurance run tenant-assurance-v1 does not exist.';
  end if;

  v_primary_user := v_run.primary_user_id;
  v_sandbox_user := v_run.sandbox_user_id;

  if v_run.primary_organization_id = v_run.sandbox_organization_id
     or v_primary_user = v_sandbox_user then
    raise exception 'Tenant assurance does not use independent organizations and users.';
  end if;

  if not exists (
    select 1 from public.organization_members membership
    where membership.organization_id = v_run.primary_organization_id
      and membership.user_id = v_primary_user
      and membership.role = 'owner'
  ) then
    raise exception 'Primary owner membership is missing.';
  end if;

  if not exists (
    select 1 from public.organization_members membership
    where membership.organization_id = v_run.sandbox_organization_id
      and membership.user_id = v_sandbox_user
      and membership.role = 'owner'
  ) then
    raise exception 'Sandbox owner membership is missing.';
  end if;

  select jsonb_build_object(
    'sandboxOrganizations', (select count(*) from public.organizations where id = v_run.sandbox_organization_id),
    'sandboxMemberships', (select count(*) from public.organization_members where organization_id = v_run.sandbox_organization_id and user_id = v_sandbox_user),
    'sandboxProjects', (select count(*) from public.projects where id = v_run.sandbox_project_id and organization_id = v_run.sandbox_organization_id),
    'guidedCases', (select count(*) from public.compliance_cases where id = v_run.guided_case_id and organization_id = v_run.sandbox_organization_id),
    'workflows', (select count(*) from public.agent_workflows where id = v_run.workflow_id and organization_id = v_run.sandbox_organization_id),
    'missions', (select count(*) from public.missions where id = v_run.mission_id and organization_id = v_run.sandbox_organization_id),
    'requests', (select count(*) from public.evidence_requests where id = v_run.evidence_request_id and organization_id = v_run.sandbox_organization_id),
    'processingActivities', (select count(*) from public.organization_processes where id = v_run.processing_activity_id and organization_id = v_run.sandbox_organization_id),
    'processingReviews', (
      select count(*)
      from public.processing_activity_reviews review
      where review.process_id = v_run.processing_activity_id
        and review.organization_id = v_run.sandbox_organization_id
    ),
    'stageZeroJobs', (
      select count(*)
      from public.agent_jobs job
      where job.workflow_id = v_run.workflow_id
        and job.organization_id = v_run.sandbox_organization_id
        and job.stage_index = 0
    )
  ) into v_duplicate_counts;

  if v_duplicate_counts <> jsonb_build_object(
    'sandboxOrganizations', 1,
    'sandboxMemberships', 1,
    'sandboxProjects', 1,
    'guidedCases', 1,
    'workflows', 1,
    'missions', 1,
    'requests', 1,
    'processingActivities', 1,
    'processingReviews', 1,
    'stageZeroJobs', 1
  ) then
    raise exception 'Tenant assurance contains missing or duplicated canonical records: %', v_duplicate_counts;
  end if;

  perform set_config('request.jwt.claim.sub', v_sandbox_user::text, true);
  execute 'set local role authenticated';

  select count(*) into v_workspace_count from public.list_my_workspaces();
  if v_workspace_count <> 1 then
    raise exception 'Sandbox user should have exactly one workspace, found %.', v_workspace_count;
  end if;

  select count(*) into v_own_count
  from public.projects project
  where project.organization_id = v_run.sandbox_organization_id;
  if v_own_count <> 1 then raise exception 'Sandbox user cannot read its own project.'; end if;

  select count(*) into v_cross_count
  from public.projects project
  where project.organization_id = v_run.primary_organization_id;
  if v_cross_count <> 0 then raise exception 'Sandbox user can read primary projects.'; end if;

  select count(*) into v_cross_count
  from public.compliance_cases compliance_case
  where compliance_case.organization_id = v_run.primary_organization_id;
  if v_cross_count <> 0 then raise exception 'Sandbox user can read primary cases.'; end if;

  select count(*) into v_cross_count
  from public.controls control
  where control.organization_id = v_run.primary_organization_id;
  if v_cross_count <> 0 then raise exception 'Sandbox user can read primary controls.'; end if;

  select count(*) into v_cross_count
  from public.evidence item
  where item.organization_id = v_run.primary_organization_id;
  if v_cross_count <> 0 then raise exception 'Sandbox user can read primary evidence.'; end if;

  begin
    perform public.set_active_workspace(v_run.primary_organization_id);
    raise exception 'Sandbox user switched into primary workspace.';
  exception when others then
    if sqlerrm <> 'workspace_forbidden' then raise; end if;
  end;

  v_denied := false;
  begin
    perform count(*) from public.processing_activity_reviews;
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then raise exception 'Browser access to processing reviews is not denied.'; end if;

  v_denied := false;
  begin
    perform public.refresh_tenant_assurance_run_v1(v_run.run_key);
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then raise exception 'Browser execution of assurance refresh is not denied.'; end if;

  execute 'reset role';

  perform set_config('request.jwt.claim.sub', v_primary_user::text, true);
  execute 'set local role authenticated';

  select count(*) into v_cross_count
  from public.projects project
  where project.organization_id = v_run.sandbox_organization_id;
  if v_cross_count <> 0 then raise exception 'Primary user can read sandbox projects.'; end if;

  select count(*) into v_cross_count
  from public.compliance_cases compliance_case
  where compliance_case.organization_id = v_run.sandbox_organization_id;
  if v_cross_count <> 0 then raise exception 'Primary user can read sandbox cases.'; end if;

  select count(*) into v_cross_count
  from public.controls control
  where control.organization_id = v_run.sandbox_organization_id;
  if v_cross_count <> 0 then raise exception 'Primary user can read sandbox controls.'; end if;

  select count(*) into v_cross_count
  from public.evidence item
  where item.organization_id = v_run.sandbox_organization_id;
  if v_cross_count <> 0 then raise exception 'Primary user can read sandbox evidence.'; end if;

  begin
    perform public.set_active_workspace(v_run.sandbox_organization_id);
    raise exception 'Primary user switched into sandbox workspace.';
  exception when others then
    if sqlerrm <> 'workspace_forbidden' then raise; end if;
  end;

  execute 'reset role';

  select jsonb_build_object(
    'name', snapshot #>> '{process,name}',
    'description', snapshot #>> '{process,description}',
    'purpose', snapshot #>> '{process,purpose}',
    'proposedLegalBasis', snapshot #>> '{process,proposedLegalBasis}',
    'ownerId', snapshot #>> '{process,ownerId}',
    'criticality', snapshot #>> '{process,criticality}',
    'dataSubjects', snapshot #> '{dataset,dataSubjects}',
    'dataCategories', snapshot #> '{dataset,dataCategories}',
    'sensitivity', snapshot #>> '{dataset,sensitivity}',
    'retentionRule', snapshot #>> '{dataset,retentionRule}',
    'crossBorderTransfer', (snapshot #>> '{dataset,crossBorderTransfer}')::boolean,
    'containsSensitiveData', (snapshot #>> '{asset,containsSensitiveData}')::boolean,
    'asset', snapshot -> 'asset',
    'vendor', snapshot -> 'vendor',
    'source', snapshot -> 'source',
    'review', snapshot -> 'review'
  )
  into v_payload
  from public.processing_activity_reviews review
  where review.process_id = v_run.processing_activity_id
    and review.organization_id = v_run.sandbox_organization_id
  order by review.reviewed_at desc
  limit 1;

  begin
    perform public.create_processing_activity_inventory_v1(
      v_primary_user,
      v_run.sandbox_organization_id,
      v_run.sandbox_project_id,
      gen_random_uuid(),
      v_payload,
      v_run.guided_case_id,
      v_run.baseline_control_id
    );
  exception when sqlstate '42501' then
    v_wrong_actor_denied := true;
  end;

  if not v_wrong_actor_denied then
    raise exception 'Wrong-tenant service mutation was not denied.';
  end if;

  select public.refresh_tenant_assurance_run_v1(v_run.run_key)
  into v_refresh;

  if v_refresh ->> 'status' not in ('running', 'passed') then
    raise exception 'Tenant assurance has an unexpected status: %', v_refresh;
  end if;

  raise notice 'TENANT ASSURANCE VERIFICATION PASS run %, status %, counts %',
    v_run.id,
    v_refresh ->> 'status',
    v_duplicate_counts;
end;
$verify$;

rollback;
