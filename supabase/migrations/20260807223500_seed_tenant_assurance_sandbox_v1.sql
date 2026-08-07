-- Persistent internal tenant-assurance sandbox.
-- Uses the same public onboarding and guided-case contracts as an authenticated user.
-- It never creates credentials and becomes a no-op when the dedicated E2E account is absent.

do $assurance$
declare
  v_run_key text := 'tenant-assurance-v1';
  v_sandbox_name text := 'Kumplio Tenant Assurance Sandbox';
  v_e2e_user uuid;
  v_primary_user uuid;
  v_primary_org uuid;
  v_existing_memberships integer := 0;
  v_conflicting_memberships integer := 0;
  v_sandbox_org uuid;
  v_sandbox_project uuid;
  v_onboarding_case uuid;
  v_initialized boolean;
  v_second_initialized boolean;
  v_second_org uuid;
  v_second_project uuid;
  v_second_case uuid;
  v_guided_first jsonb;
  v_guided_second jsonb;
  v_guided_case uuid;
  v_workflow uuid;
  v_playbook uuid;
  v_plan_first jsonb;
  v_plan_second jsonb;
  v_mission uuid;
  v_request uuid;
  v_baseline_first jsonb;
  v_baseline_second jsonb;
  v_control uuid;
  v_baseline_evidence uuid;
  v_processing_first jsonb;
  v_processing_second jsonb;
  v_processing_key uuid;
  v_processing_activity uuid;
  v_processing_evidence uuid;
  v_queue_first jsonb;
  v_queue_second jsonb;
  v_job_id uuid;
  v_job_status text;
  v_workspace_count integer;
  v_own_count integer;
  v_cross_count integer;
  v_denied boolean;
  v_wrong_actor_denied boolean := false;
  v_stages jsonb;
  v_payload jsonb;
  v_checks jsonb;
  v_metrics jsonb;
  v_run_id uuid;
  v_refresh jsonb;
begin
  select u.id
  into v_e2e_user
  from auth.users u
  where u.raw_app_meta_data ->> 'kumplio_service_account' = 'golden_path_e2e'
  order by u.created_at
  limit 1;

  select o.id
  into v_primary_org
  from public.organizations o
  where lower(btrim(o.name)) = 'n3uralia'
  order by o.created_at
  limit 1;

  if v_e2e_user is null or v_primary_org is null then
    raise notice 'Skipping tenant assurance seed: E2E account or N3uralia organization is missing.';
    return;
  end if;

  select om.user_id
  into v_primary_user
  from public.organization_members om
  where om.organization_id = v_primary_org
    and om.role = 'owner'
  order by om.joined_at
  limit 1;

  if v_primary_user is null then
    raise notice 'Skipping tenant assurance seed: primary owner is missing.';
    return;
  end if;

  select count(*)
  into v_existing_memberships
  from public.organization_members om
  where om.user_id = v_e2e_user;

  select count(*)
  into v_conflicting_memberships
  from public.organization_members om
  join public.organizations organization on organization.id = om.organization_id
  where om.user_id = v_e2e_user
    and organization.name <> v_sandbox_name;

  if v_conflicting_memberships > 0 or v_existing_memberships > 1 then
    raise exception 'Dedicated E2E account has a conflicting organization membership.';
  end if;

  perform set_config('request.jwt.claim.sub', v_e2e_user::text, true);
  execute 'set local role authenticated';

  select workspace.organization_id, workspace.project_id, workspace.case_id, workspace.initialized
  into v_sandbox_org, v_sandbox_project, v_onboarding_case, v_initialized
  from public.initialize_workspace(
    v_sandbox_name,
    'general',
    'micro',
    'Tenant',
    'Assurance',
    'Ley 21.719 — Tenant Assurance',
    'Caso inicial del tenant de assurance'
  ) workspace;

  select workspace.organization_id, workspace.project_id, workspace.case_id, workspace.initialized
  into v_second_org, v_second_project, v_second_case, v_second_initialized
  from public.initialize_workspace(
    v_sandbox_name,
    'general',
    'micro',
    'Tenant',
    'Assurance',
    'Ley 21.719 — Tenant Assurance',
    'Caso inicial del tenant de assurance'
  ) workspace;

  if v_second_initialized
     or v_sandbox_org is distinct from v_second_org
     or v_sandbox_project is distinct from v_second_project
     or v_onboarding_case is distinct from v_second_case then
    raise exception 'Tenant assurance onboarding was not idempotent.';
  end if;

  if not exists (
    select 1
    from public.organizations organization
    where organization.id = v_sandbox_org
      and organization.name = v_sandbox_name
  ) then
    raise exception 'Dedicated E2E account resolved to an unexpected organization.';
  end if;

  select count(*) into v_workspace_count from public.list_my_workspaces();
  if v_workspace_count <> 1 then
    raise exception 'E2E workspace list expected one workspace, got %.', v_workspace_count;
  end if;

  select count(*) into v_own_count
  from public.projects project
  where project.organization_id = v_sandbox_org;

  select count(*) into v_cross_count
  from public.projects project
  where project.organization_id = v_primary_org;

  if v_own_count <> 1 or v_cross_count <> 0 then
    raise exception 'E2E project isolation failed: own %, cross %.', v_own_count, v_cross_count;
  end if;

  begin
    perform public.set_active_workspace(v_primary_org);
    raise exception 'E2E account switched into the primary organization.';
  exception when others then
    if sqlerrm <> 'workspace_forbidden' then raise; end if;
  end;

  v_stages := jsonb_build_array(
    jsonb_build_object(
      'index', 0,
      'agentId', 'isidora',
      'label', 'Obligaciones',
      'task', 'Extrae obligaciones, responsables, plazos, evidencia exigida, citas y limitaciones desde las fuentes del caso. Separa hechos expresos de inferencias.',
      'dependsOn', jsonb_build_array()
    ),
    jsonb_build_object(
      'index', 1,
      'agentId', 'rodrigo',
      'label', 'Riesgos',
      'task', 'Evalúa riesgos inherentes y residuales. Explicita probabilidad, impacto, supuestos y ausencia de datos. No inventes multas ni montos.',
      'dependsOn', jsonb_build_array(0)
    ),
    jsonb_build_object(
      'index', 2,
      'agentId', 'veronica',
      'label', 'Brechas y controles',
      'task', 'Realiza un gap analysis entre obligaciones, riesgos, controles y evidencia. Distingue ausencia de evidencia de incumplimiento confirmado.',
      'dependsOn', jsonb_build_array(0, 1)
    ),
    jsonb_build_object(
      'index', 3,
      'agentId', 'javier',
      'label', 'Plan de acción',
      'task', 'Construye un roadmap ejecutable con responsables sugeridos, dependencias, entregables y criterios de cierre sin inventar recursos.',
      'dependsOn', jsonb_build_array(0, 1, 2)
    ),
    jsonb_build_object(
      'index', 4,
      'agentId', 'catalina',
      'label', 'Revisión de calidad',
      'task', 'Revisa críticamente los artefactos. Clasifica afirmaciones como verificadas, inferidas o no sustentadas y determina qué requiere aprobación humana.',
      'dependsOn', jsonb_build_array(0, 1, 2, 3)
    )
  );

  select public.start_guided_case_record(
    v_e2e_user,
    v_sandbox_org,
    'tenant-assurance-guided-v1',
    'Preparar el tenant de assurance para la Ley 21.719',
    'Caso sintético interno para validar aislamiento, idempotencia y el golden path de Kumplio.',
    'medium',
    v_sandbox_project,
    'compliance_assessment',
    jsonb_build_object(
      'source', 'tenant_assurance',
      'synthetic', true,
      'scope', 'internal_qa'
    ),
    v_stages
  ) into v_guided_first;

  select public.start_guided_case_record(
    v_e2e_user,
    v_sandbox_org,
    'tenant-assurance-guided-v1',
    'Preparar el tenant de assurance para la Ley 21.719',
    'Caso sintético interno para validar aislamiento, idempotencia y el golden path de Kumplio.',
    'medium',
    v_sandbox_project,
    'compliance_assessment',
    jsonb_build_object(
      'source', 'tenant_assurance',
      'synthetic', true,
      'scope', 'internal_qa'
    ),
    v_stages
  ) into v_guided_second;

  if not coalesce((v_guided_second ->> 'resumed')::boolean, false)
     or v_guided_first ->> 'caseId' is distinct from v_guided_second ->> 'caseId'
     or v_guided_first ->> 'workflowId' is distinct from v_guided_second ->> 'workflowId' then
    raise exception 'Tenant assurance guided case was not idempotent.';
  end if;

  v_guided_case := (v_guided_first ->> 'caseId')::uuid;
  v_workflow := (v_guided_first ->> 'workflowId')::uuid;

  execute 'reset role';

  select playbook.id
  into v_playbook
  from public.mission_playbooks playbook
  where playbook.slug = 'preparar-ley-21719'
    and playbook.status = 'published'
  order by playbook.version desc
  limit 1;

  if v_playbook is null then
    raise exception 'Published Ley 21.719 playbook is missing.';
  end if;

  select public.create_case_operational_plan_record(
    v_e2e_user,
    v_sandbox_org,
    v_guided_case,
    v_sandbox_project,
    v_playbook,
    'Completar línea base del tenant de assurance',
    'Crear evidencia, control, revisión y trazabilidad sintética para probar el golden path.',
    'medium',
    v_e2e_user,
    now() + interval '14 days',
    'Inventario sintético del tenant de assurance',
    'Entregar una línea base sintética con desconocidos explícitos y sin afirmar cumplimiento.',
    now() + interval '7 days'
  ) into v_plan_first;

  select public.create_case_operational_plan_record(
    v_e2e_user,
    v_sandbox_org,
    v_guided_case,
    v_sandbox_project,
    v_playbook,
    'Completar línea base del tenant de assurance',
    'Crear evidencia, control, revisión y trazabilidad sintética para probar el golden path.',
    'medium',
    v_e2e_user,
    now() + interval '14 days',
    'Inventario sintético del tenant de assurance',
    'Entregar una línea base sintética con desconocidos explícitos y sin afirmar cumplimiento.',
    now() + interval '7 days'
  ) into v_plan_second;

  if not coalesce((v_plan_second ->> 'resumed')::boolean, false)
     or v_plan_first ->> 'missionId' is distinct from v_plan_second ->> 'missionId'
     or v_plan_first ->> 'evidenceRequestId' is distinct from v_plan_second ->> 'evidenceRequestId' then
    raise exception 'Tenant assurance operational plan was not idempotent.';
  end if;

  v_mission := (v_plan_first ->> 'missionId')::uuid;
  v_request := (v_plan_first ->> 'evidenceRequestId')::uuid;

  select public.finalize_case_baseline_assurance(
    v_e2e_user,
    v_sandbox_org,
    v_guided_case,
    v_mission,
    v_request,
    'Aprobación sintética limitada al alcance interno de assurance; no acredita inventario completo ni cumplimiento legal.',
    'Se cierra la misión sintética de baseline y se conservan expresamente todos los desconocidos pendientes.'
  ) into v_baseline_first;

  select public.finalize_case_baseline_assurance(
    v_e2e_user,
    v_sandbox_org,
    v_guided_case,
    v_mission,
    v_request,
    'Aprobación sintética limitada al alcance interno de assurance; no acredita inventario completo ni cumplimiento legal.',
    'Se cierra la misión sintética de baseline y se conservan expresamente todos los desconocidos pendientes.'
  ) into v_baseline_second;

  if not coalesce((v_baseline_second ->> 'resumed')::boolean, false)
     or v_baseline_first ->> 'controlId' is distinct from v_baseline_second ->> 'controlId'
     or v_baseline_first ->> 'evidenceId' is distinct from v_baseline_second ->> 'evidenceId'
     or v_baseline_first ->> 'missionResultId' is distinct from v_baseline_second ->> 'missionResultId' then
    raise exception 'Tenant assurance baseline closure was not idempotent.';
  end if;

  v_control := (v_baseline_first ->> 'controlId')::uuid;
  v_baseline_evidence := (v_baseline_first ->> 'evidenceId')::uuid;
  v_processing_key := md5(v_sandbox_org::text || ':tenant-assurance-processing-v1')::uuid;

  v_payload := jsonb_build_object(
    'name', 'Actividad sintética de tenant assurance',
    'description', 'Actividad interna y sintética para validar aislamiento multiempresa y trazabilidad.',
    'purpose', 'Verificar que el inventario de un tenant no pueda leerse ni modificarse desde otro tenant.',
    'proposedLegalBasis', 'No aplica como conclusión jurídica; dato sintético para QA y assurance.',
    'ownerId', v_e2e_user,
    'criticality', 'low',
    'dataSubjects', jsonb_build_array('Titulares sintéticos'),
    'dataCategories', jsonb_build_array('Datos sintéticos de assurance'),
    'sensitivity', 'internal',
    'retentionRule', 'Eliminar cuando termine el ciclo interno de assurance.',
    'crossBorderTransfer', false,
    'containsSensitiveData', false,
    'asset', jsonb_build_object(
      'name', 'Sistema sintético del tenant',
      'type', 'qa_system',
      'hostingCountry', 'Chile',
      'providerName', 'Kumplio'
    ),
    'vendor', jsonb_build_object(
      'name', 'Proveedor sintético del tenant',
      'serviceCategory', 'QA',
      'country', 'Chile',
      'processesPersonalData', false,
      'crossBorderTransfer', false,
      'riskTier', 'low'
    ),
    'source', jsonb_build_object(
      'type', 'other',
      'label', 'Tenant assurance sandbox',
      'reference', 'Kumplio internal QA'
    ),
    'review', jsonb_build_object(
      'decision', 'approved',
      'completeness', 'partial',
      'note', 'Revisión sintética para comprobar aislamiento, evidencia e idempotencia sin afirmar cumplimiento.',
      'unknowns', jsonb_build_array('Cobertura organizacional fuera del alcance de esta prueba.')
    )
  );

  select public.create_processing_activity_inventory_v1(
    v_e2e_user,
    v_sandbox_org,
    v_sandbox_project,
    v_processing_key,
    v_payload,
    v_guided_case,
    v_control
  ) into v_processing_first;

  select public.create_processing_activity_inventory_v1(
    v_e2e_user,
    v_sandbox_org,
    v_sandbox_project,
    v_processing_key,
    v_payload,
    v_guided_case,
    v_control
  ) into v_processing_second;

  if not coalesce((v_processing_second ->> 'resumed')::boolean, false)
     or v_processing_first ->> 'processId' is distinct from v_processing_second ->> 'processId'
     or v_processing_first ->> 'evidenceId' is distinct from v_processing_second ->> 'evidenceId'
     or v_processing_first ->> 'reviewId' is distinct from v_processing_second ->> 'reviewId' then
    raise exception 'Tenant assurance processing inventory was not idempotent.';
  end if;

  v_processing_activity := (v_processing_first ->> 'processId')::uuid;
  v_processing_evidence := (v_processing_first ->> 'evidenceId')::uuid;

  select job.id, job.status
  into v_job_id, v_job_status
  from public.agent_jobs job
  where job.workflow_id = v_workflow
    and job.organization_id = v_sandbox_org
    and job.stage_index = 0
  order by job.created_at
  limit 1;

  if v_job_id is null then
    select public.enqueue_agent_job(v_e2e_user, v_sandbox_org, v_workflow, 0, null)
    into v_queue_first;

    select public.enqueue_agent_job(v_e2e_user, v_sandbox_org, v_workflow, 0, null)
    into v_queue_second;

    if coalesce((v_queue_first ->> 'resumed')::boolean, true)
       or not coalesce((v_queue_second ->> 'resumed')::boolean, false)
       or v_queue_first ->> 'jobId' is distinct from v_queue_second ->> 'jobId' then
      raise exception 'Tenant assurance agent queue was not idempotent.';
    end if;

    v_job_id := (v_queue_first ->> 'jobId')::uuid;
    v_job_status := v_queue_first ->> 'status';
  end if;

  begin
    perform public.create_processing_activity_inventory_v1(
      v_primary_user,
      v_sandbox_org,
      v_sandbox_project,
      gen_random_uuid(),
      v_payload,
      v_guided_case,
      v_control
    );
  exception when sqlstate '42501' then
    v_wrong_actor_denied := true;
  end;

  if not v_wrong_actor_denied then
    raise exception 'Wrong-tenant server mutation was not denied.';
  end if;

  perform set_config('request.jwt.claim.sub', v_e2e_user::text, true);
  execute 'set local role authenticated';

  select count(*) into v_cross_count
  from public.compliance_cases compliance_case
  where compliance_case.organization_id = v_primary_org;
  if v_cross_count <> 0 then raise exception 'E2E user can read primary cases.'; end if;

  select count(*) into v_cross_count
  from public.controls control
  where control.organization_id = v_primary_org;
  if v_cross_count <> 0 then raise exception 'E2E user can read primary controls.'; end if;

  select count(*) into v_cross_count
  from public.evidence item
  where item.organization_id = v_primary_org;
  if v_cross_count <> 0 then raise exception 'E2E user can read primary evidence.'; end if;

  select count(*) into v_own_count
  from public.compliance_cases compliance_case
  where compliance_case.organization_id = v_sandbox_org;
  if v_own_count < 2 then raise exception 'E2E user cannot read own cases.'; end if;

  v_denied := false;
  begin
    perform count(*) from public.processing_activity_reviews;
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then raise exception 'Direct processing review access was not denied.'; end if;

  v_denied := false;
  begin
    perform public.create_processing_activity_inventory_v1(
      v_e2e_user,
      v_sandbox_org,
      v_sandbox_project,
      gen_random_uuid(),
      v_payload,
      v_guided_case,
      v_control
    );
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then raise exception 'Direct inventory RPC execution was not denied.'; end if;

  execute 'reset role';

  perform set_config('request.jwt.claim.sub', v_primary_user::text, true);
  execute 'set local role authenticated';

  select count(*) into v_cross_count
  from public.projects project
  where project.organization_id = v_sandbox_org;
  if v_cross_count <> 0 then raise exception 'Primary user can read sandbox projects.'; end if;

  select count(*) into v_cross_count
  from public.compliance_cases compliance_case
  where compliance_case.organization_id = v_sandbox_org;
  if v_cross_count <> 0 then raise exception 'Primary user can read sandbox cases.'; end if;

  select count(*) into v_cross_count
  from public.controls control
  where control.organization_id = v_sandbox_org;
  if v_cross_count <> 0 then raise exception 'Primary user can read sandbox controls.'; end if;

  select count(*) into v_cross_count
  from public.evidence item
  where item.organization_id = v_sandbox_org;
  if v_cross_count <> 0 then raise exception 'Primary user can read sandbox evidence.'; end if;

  begin
    perform public.set_active_workspace(v_sandbox_org);
    raise exception 'Primary user switched into sandbox organization.';
  exception when others then
    if sqlerrm <> 'workspace_forbidden' then raise; end if;
  end;

  execute 'reset role';

  v_checks := jsonb_build_object(
    'onboardingIdempotent', true,
    'guidedCaseIdempotent', true,
    'operationalPlanIdempotent', true,
    'baselineIdempotent', true,
    'processingIdempotent', true,
    'queueIdempotent', true,
    'sandboxReadsOwnData', true,
    'sandboxCannotReadPrimary', true,
    'primaryCannotReadSandbox', true,
    'workspaceSwitchDeniedBothWays', true,
    'browserInternalTablesDenied', true,
    'browserInventoryRpcDenied', true,
    'wrongTenantServerMutationDenied', true
  );

  v_metrics := jsonb_build_object(
    'sandboxName', v_sandbox_name,
    'onboardingCreatedThisRun', coalesce(v_initialized, false),
    'guidedCaseFirstResumed', coalesce((v_guided_first ->> 'resumed')::boolean, false),
    'operationalPlanFirstResumed', coalesce((v_plan_first ->> 'resumed')::boolean, false),
    'baselineFirstResumed', coalesce((v_baseline_first ->> 'resumed')::boolean, false),
    'processingFirstResumed', coalesce((v_processing_first ->> 'resumed')::boolean, false),
    'initialJobStatus', v_job_status,
    'expectedWorkflowStages', 5,
    'syntheticDataOnly', true
  );

  insert into public.tenant_assurance_runs (
    run_key,
    primary_organization_id,
    primary_user_id,
    sandbox_organization_id,
    sandbox_user_id,
    sandbox_project_id,
    onboarding_case_id,
    guided_case_id,
    workflow_id,
    mission_id,
    evidence_request_id,
    baseline_control_id,
    baseline_evidence_id,
    processing_activity_id,
    processing_evidence_id,
    initial_job_id,
    status,
    check_results,
    metrics,
    latest_error,
    last_checked_at,
    updated_at
  ) values (
    v_run_key,
    v_primary_org,
    v_primary_user,
    v_sandbox_org,
    v_e2e_user,
    v_sandbox_project,
    v_onboarding_case,
    v_guided_case,
    v_workflow,
    v_mission,
    v_request,
    v_control,
    v_baseline_evidence,
    v_processing_activity,
    v_processing_evidence,
    v_job_id,
    'running',
    v_checks,
    v_metrics,
    null,
    now(),
    now()
  )
  on conflict (run_key) do update
  set primary_organization_id = excluded.primary_organization_id,
      primary_user_id = excluded.primary_user_id,
      sandbox_organization_id = excluded.sandbox_organization_id,
      sandbox_user_id = excluded.sandbox_user_id,
      sandbox_project_id = excluded.sandbox_project_id,
      onboarding_case_id = excluded.onboarding_case_id,
      guided_case_id = excluded.guided_case_id,
      workflow_id = excluded.workflow_id,
      mission_id = excluded.mission_id,
      evidence_request_id = excluded.evidence_request_id,
      baseline_control_id = excluded.baseline_control_id,
      baseline_evidence_id = excluded.baseline_evidence_id,
      processing_activity_id = excluded.processing_activity_id,
      processing_evidence_id = excluded.processing_evidence_id,
      initial_job_id = coalesce(excluded.initial_job_id, public.tenant_assurance_runs.initial_job_id),
      check_results = excluded.check_results,
      metrics = coalesce(public.tenant_assurance_runs.metrics, '{}'::jsonb) || excluded.metrics,
      latest_error = null,
      last_checked_at = now(),
      updated_at = now()
  returning id into v_run_id;

  select public.refresh_tenant_assurance_run_v1(v_run_key)
  into v_refresh;

  raise notice 'TENANT ASSURANCE PREPARED run %, sandbox %, workflow %, job %, status %',
    v_run_id,
    v_sandbox_org,
    v_workflow,
    v_job_id,
    v_refresh ->> 'status';
end;
$assurance$;
