-- Supervised production seed for two additional real N3uralia processing activities.
--
-- The migration is portable and idempotent:
--   * it discovers the pilot organization, actor, project, case and control;
--   * it becomes a no-op when the observed account or agentic evidence is absent;
--   * it calls the atomic processing-inventory RPC twice per activity;
--   * it keeps both activities partial and preserves explicit unknowns.

do $seed$
declare
  v_organization_id uuid;
  v_actor_id uuid;
  v_project_id uuid;
  v_case_id uuid;
  v_control_id uuid;
  v_organization_count integer;

  v_confirmed_user_count integer;
  v_identity_count integer;
  v_session_count integer;
  v_refresh_token_count integer;
  v_profile_count integer;
  v_membership_count integer;
  v_legal_metadata_count integer;
  v_account_legal_unknown text;
  v_account_request_key uuid;
  v_account_payload jsonb;
  v_account_first jsonb;
  v_account_second jsonb;

  v_case_count integer;
  v_workflow_count integer;
  v_run_count integer;
  v_approved_run_count integer;
  v_failed_run_count integer;
  v_context_run_count integer;
  v_output_run_count integer;
  v_model_run_count integer;
  v_artifact_count integer;
  v_review_count integer;
  v_tool_call_count integer;
  v_total_tokens bigint;
  v_ai_request_key uuid;
  v_ai_payload jsonb;
  v_ai_first jsonb;
  v_ai_second jsonb;
begin
  select count(*)
  into v_organization_count
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia';

  if v_organization_count <> 1 then
    raise notice 'Skipping supervised core processing seed: expected exactly one N3uralia organization, found %.', v_organization_count;
    return;
  end if;

  select organization.id
  into v_organization_id
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia'
  limit 1;

  select member.user_id
  into v_actor_id
  from public.organization_members member
  where member.organization_id = v_organization_id
    and member.role in ('owner', 'admin', 'compliance')
  order by case member.role when 'owner' then 1 when 'admin' then 2 else 3 end, member.joined_at
  limit 1;

  select project.id
  into v_project_id
  from public.projects project
  where project.organization_id = v_organization_id
    and project.status = 'active'
    and project.compliance_law = 'Ley 21.719'
  order by project.created_at
  limit 1;

  select compliance_case.id
  into v_case_id
  from public.compliance_cases compliance_case
  where compliance_case.organization_id = v_organization_id
    and compliance_case.project_id = v_project_id
    and compliance_case.title ilike 'Preparar N3uralia para la Ley 21.719%'
  order by compliance_case.created_at
  limit 1;

  select control.id
  into v_control_id
  from public.controls control
  where control.organization_id = v_organization_id
    and control.project_id = v_project_id
    and control.lifecycle_status = 'active'
    and control.code like 'BASE-INVENTORY-%'
  order by control.created_at
  limit 1;

  if v_actor_id is null or v_project_id is null or v_case_id is null or v_control_id is null then
    raise notice 'Skipping supervised core processing seed: actor %, project %, case %, control %.',
      v_actor_id, v_project_id, v_case_id, v_control_id;
    return;
  end if;

  -- Account, authentication and access evidence.
  select count(*)
  into v_confirmed_user_count
  from auth.users auth_user
  where auth_user.id = v_actor_id
    and auth_user.email_confirmed_at is not null;

  select count(*)
  into v_identity_count
  from auth.identities identity
  where identity.user_id = v_actor_id;

  select count(*)
  into v_session_count
  from auth.sessions session_row
  where session_row.user_id = v_actor_id;

  select count(*)
  into v_refresh_token_count
  from auth.refresh_tokens refresh_token
  where refresh_token.user_id::text = v_actor_id::text;

  select count(*)
  into v_profile_count
  from public.profiles profile
  where profile.id = v_actor_id
    and profile.organization_id = v_organization_id;

  select count(*)
  into v_membership_count
  from public.organization_members member
  where member.user_id = v_actor_id
    and member.organization_id = v_organization_id;

  select count(*)
  into v_legal_metadata_count
  from auth.users auth_user
  where auth_user.id = v_actor_id
    and nullif(auth_user.raw_user_meta_data ->> 'terms_version', '') is not null
    and nullif(auth_user.raw_user_meta_data ->> 'privacy_version', '') is not null
    and nullif(auth_user.raw_user_meta_data ->> 'legal_accepted_at', '') is not null;

  if v_confirmed_user_count <> 1
     or v_identity_count < 1
     or v_session_count < 1
     or v_refresh_token_count < 1
     or v_profile_count <> 1
     or v_membership_count <> 1 then
    raise notice 'Skipping account processing activity: confirmed users %, identities %, sessions %, refresh tokens %, profiles %, memberships %.',
      v_confirmed_user_count, v_identity_count, v_session_count, v_refresh_token_count, v_profile_count, v_membership_count;
    return;
  end if;

  v_account_legal_unknown := case
    when v_legal_metadata_count = 0 then
      'La cuenta piloto fue creada antes del flujo vigente y no conserva terms_version, privacy_version ni legal_accepted_at.'
    else
      'Debe verificarse la vigencia, versionado y trazabilidad histórica de las aceptaciones legales de la cuenta.'
  end;

  v_account_request_key := md5(v_organization_id::text || ':account-auth-access-v1')::uuid;
  v_account_payload := jsonb_build_object(
    'name', 'Gestión de cuentas, autenticación y acceso al workspace',
    'description', 'Registro, confirmación, inicio de sesión, mantenimiento de sesión y asignación de acceso a la organización de Kumplio.',
    'purpose', 'Crear y administrar cuentas de usuario, autenticar accesos, mantener sesiones y aplicar roles y membresías dentro del workspace.',
    'proposedLegalBasis', 'Ejecución de la relación de servicio y medidas de seguridad solicitadas por el usuario; pendiente de validación jurídica por finalidad y ciclo de vida de la cuenta.',
    'ownerId', v_actor_id,
    'criticality', 'high',
    'dataSubjects', jsonb_build_array('Usuarios de Kumplio', 'Miembros de organizaciones'),
    'dataCategories', jsonb_build_array(
      'Identificación y correo electrónico',
      'Nombre de organización y plan seleccionado cuando existe',
      'Roles, membresías y workspace activo',
      'Metadatos de autenticación, sesión y confirmación',
      'Versiones y fecha de aceptación legal cuando existen'
    ),
    'sensitivity', 'restricted',
    'retentionRule', 'Pendiente de definir y aprobar para cuenta, sesiones, refresh tokens y perfil después del cierre o inactividad.',
    'crossBorderTransfer', true,
    'containsSensitiveData', false,
    'asset', jsonb_build_object(
      'name', 'Supabase Auth, profiles y organization_members',
      'type', 'identity_access_management_database',
      'hostingCountry', 'Estados Unidos (us-east-1)',
      'providerName', 'Supabase'
    ),
    'vendor', jsonb_build_object(
      'name', 'Supabase',
      'serviceCategory', 'Backend, base de datos y autenticación',
      'country', 'Estados Unidos',
      'processesPersonalData', true,
      'crossBorderTransfer', true,
      'riskTier', 'medium'
    ),
    'source', jsonb_build_object(
      'type', 'code_and_database',
      'label', 'Registro y autenticación, onboarding, perfiles, membresías y sesiones de Supabase',
      'reference', 'app/(auth)/sign-up/page.tsx · app/api/onboarding/initialize/route.ts · lib/compliance/accountability/workspace-access.ts · lib/compliance/accountability/team.ts · auth.users/auth.identities/auth.sessions/auth.refresh_tokens · public.profiles/public.organization_members · us-east-1 · Supabase security advisor snapshot 2026-08-07'
    ),
    'review', jsonb_build_object(
      'decision', 'approved',
      'completeness', 'partial',
      'note', format(
        'Se verificaron %s cuenta confirmada, %s identidad, %s sesiones, %s refresh tokens, %s perfil y %s membresía de N3uralia. El código vigente exige contraseña robusta, confirmación y aceptación legal para registros nuevos. La revisión aprueba el inventario operativo observado, no la suficiencia jurídica ni el ciclo completo de eliminación.',
        v_confirmed_user_count,
        v_identity_count,
        v_session_count,
        v_refresh_token_count,
        v_profile_count,
        v_membership_count
      ),
      'unknowns', jsonb_build_array(
        'Plazo de retención y eliminación de cuenta, sesiones, refresh tokens y perfil no aprobado.',
        'Base de licitud por finalidad y rol de responsable o encargado pendiente de validación jurídica.',
        v_account_legal_unknown,
        'Verificar y habilitar Leaked Password Protection; el advisor de producción la reportó desactivada el 7 de agosto de 2026.',
        'MFA y procedimiento de recuperación o compromiso de cuenta no evidenciados end-to-end.',
        'Listado contractual de subencargados y garantías de transferencia pendiente.',
        'Procedimiento de cierre, exportación y eliminación de cuenta no evidenciado.'
      )
    )
  );

  select public.create_processing_activity_inventory_v1(
    v_actor_id,
    v_organization_id,
    v_project_id,
    v_account_request_key,
    v_account_payload,
    v_case_id,
    v_control_id
  ) into v_account_first;

  select public.create_processing_activity_inventory_v1(
    v_actor_id,
    v_organization_id,
    v_project_id,
    v_account_request_key,
    v_account_payload,
    v_case_id,
    v_control_id
  ) into v_account_second;

  if not coalesce((v_account_second ->> 'resumed')::boolean, false) then
    raise exception 'Account processing activity second call was not idempotent: %', v_account_second;
  end if;

  if v_account_first ->> 'processId' is distinct from v_account_second ->> 'processId'
     or v_account_first ->> 'datasetId' is distinct from v_account_second ->> 'datasetId'
     or v_account_first ->> 'assetId' is distinct from v_account_second ->> 'assetId'
     or v_account_first ->> 'vendorId' is distinct from v_account_second ->> 'vendorId'
     or v_account_first ->> 'evidenceId' is distinct from v_account_second ->> 'evidenceId'
     or v_account_first ->> 'reviewId' is distinct from v_account_second ->> 'reviewId' then
    raise exception 'Account processing activity returned different identifiers.';
  end if;

  if (select completeness from public.processing_activity_reviews where id = (v_account_first ->> 'reviewId')::uuid) <> 'partial' then
    raise exception 'Account processing activity must remain partial.';
  end if;

  if (select validation_status from public.evidence where id = (v_account_first ->> 'evidenceId')::uuid) <> 'accepted'
     or (select integrity_status from public.evidence where id = (v_account_first ->> 'evidenceId')::uuid) <> 'verified'
     or length((select integrity_hash from public.evidence where id = (v_account_first ->> 'evidenceId')::uuid)) <> 64 then
    raise exception 'Account processing evidence is not accepted and integrity-verified.';
  end if;

  -- Guided cases and specialist-AI execution evidence.
  select count(*) into v_case_count
  from public.compliance_cases compliance_case
  where compliance_case.organization_id = v_organization_id;

  select count(*) into v_workflow_count
  from public.agent_workflows workflow
  where workflow.organization_id = v_organization_id;

  select count(*) into v_run_count
  from public.agent_runs run
  where run.organization_id = v_organization_id;

  select count(*) into v_approved_run_count
  from public.agent_runs run
  where run.organization_id = v_organization_id
    and run.status = 'approved';

  select count(*) into v_failed_run_count
  from public.agent_runs run
  where run.organization_id = v_organization_id
    and run.status = 'failed';

  select count(*) into v_context_run_count
  from public.agent_runs run
  where run.organization_id = v_organization_id
    and nullif(btrim(run.context_text), '') is not null;

  select count(*) into v_output_run_count
  from public.agent_runs run
  where run.organization_id = v_organization_id
    and run.output_payload is not null;

  select count(*) into v_model_run_count
  from public.agent_runs run
  where run.organization_id = v_organization_id
    and nullif(btrim(run.model), '') is not null
    and coalesce(run.total_tokens, 0) > 0;

  select coalesce(sum(run.total_tokens), 0)::bigint
  into v_total_tokens
  from public.agent_runs run
  where run.organization_id = v_organization_id;

  select count(*) into v_artifact_count
  from public.agent_artifacts artifact
  where artifact.organization_id = v_organization_id;

  select count(*) into v_review_count
  from public.agent_reviews review
  where review.organization_id = v_organization_id;

  select count(*) into v_tool_call_count
  from public.agent_tool_calls tool_call
  where tool_call.organization_id = v_organization_id;

  if v_case_count < 1
     or v_workflow_count < 1
     or v_run_count < 1
     or v_approved_run_count < 1
     or v_context_run_count < 1
     or v_output_run_count < 1
     or v_model_run_count < 1
     or v_artifact_count < 1
     or v_review_count < 1
     or v_tool_call_count < 1
     or v_total_tokens < 1 then
    raise notice 'Skipping AI processing activity: cases %, workflows %, runs %, approved runs %, contexts %, outputs %, model runs %, artifacts %, reviews %, tool calls %, tokens %.',
      v_case_count, v_workflow_count, v_run_count, v_approved_run_count, v_context_run_count, v_output_run_count,
      v_model_run_count, v_artifact_count, v_review_count, v_tool_call_count, v_total_tokens;
    return;
  end if;

  v_ai_request_key := md5(v_organization_id::text || ':guided-cases-ai-specialists-v1')::uuid;
  v_ai_payload := jsonb_build_object(
    'name', 'Gestión de expedientes y análisis asistido por especialistas IA',
    'description', 'Creación, análisis, versionado y revisión de expedientes de cumplimiento mediante workflows de especialistas IA, herramientas de solo lectura y artefactos estructurados.',
    'purpose', 'Ayudar al usuario a analizar una situación de cumplimiento, producir resultados estructurados, conservar evidencia y someter cada etapa a revisión explícita antes de avanzar.',
    'proposedLegalBasis', 'Ejecución del servicio de análisis solicitado por el usuario; pendiente de validación jurídica, minimización y definición de roles cuando el expediente incluya datos personales de terceros.',
    'ownerId', v_actor_id,
    'criticality', 'high',
    'dataSubjects', jsonb_build_array(
      'Usuarios de Kumplio',
      'Personas mencionadas en expedientes y evidencia',
      'Trabajadores, clientes, proveedores u otros titulares según cada caso'
    ),
    'dataCategories', jsonb_build_array(
      'Identificación y contexto profesional',
      'Contenido de expedientes y evidencia',
      'Tareas, prompts y contexto recuperado',
      'Resultados estructurados y comentarios de revisión',
      'Metadatos de modelo, tokens, tiempos y errores',
      'Referencias a fuentes y artefactos'
    ),
    'sensitivity', 'restricted',
    'retentionRule', 'Pendiente de definir y aprobar para casos, contextos, artefactos, revisiones, logs y datos enviados al proveedor; store=false está configurado pero no acredita eliminación integral.',
    'crossBorderTransfer', true,
    'containsSensitiveData', false,
    'asset', jsonb_build_object(
      'name', 'Motor de especialistas IA y OpenAI Responses API',
      'type', 'ai_reasoning_service',
      'hostingCountry', 'Pendiente de confirmar contractualmente',
      'providerName', 'OpenAI'
    ),
    'vendor', jsonb_build_object(
      'name', 'OpenAI',
      'serviceCategory', 'Inferencia de modelos y generación estructurada',
      'country', 'Pendiente de confirmar contractualmente',
      'processesPersonalData', true,
      'crossBorderTransfer', true,
      'riskTier', 'high'
    ),
    'source', jsonb_build_object(
      'type', 'code_and_database',
      'label', 'Runtime OpenAI, ejecutor durable de workflows y tablas de expedientes y agentes',
      'reference', 'lib/agents/openai-runtime.ts · lib/agents/workflow-stage-executor.ts · app/api/internal/agent-worker/route.ts · public.compliance_cases/public.agent_workflows/public.agent_runs/public.agent_artifacts/public.agent_reviews/public.agent_tool_calls'
    ),
    'review', jsonb_build_object(
      'decision', 'approved',
      'completeness', 'partial',
      'note', format(
        'Se verificaron %s casos, %s workflows, %s runs (%s aprobados y %s fallidos), %s contextos persistidos, %s outputs, %s ejecuciones con modelo y tokens, %s artefactos, %s revisiones, %s tool calls y %s tokens acumulados. El runtime usa Structured Outputs, safety_identifier derivado por hash y store=false; la revisión aprueba el proceso observado, no la suficiencia jurídica, residencia ni eliminación del proveedor.',
        v_case_count,
        v_workflow_count,
        v_run_count,
        v_approved_run_count,
        v_failed_run_count,
        v_context_run_count,
        v_output_run_count,
        v_model_run_count,
        v_artifact_count,
        v_review_count,
        v_tool_call_count,
        v_total_tokens
      ),
      'unknowns', jsonb_build_array(
        'Clasificación completa de datos personales y sensibles por expediente pendiente.',
        'Región, retención operativa, monitoreo y subencargados del proveedor pendientes de validación contractual.',
        'Base jurídica y roles de responsable o encargado para datos de terceros pendientes de validación.',
        'Política de minimización, redacción y exclusión de secretos antes de enviar contexto no aprobada.',
        'Plazo de retención y mecanismo de eliminación de casos, prompts, artefactos, logs y respaldos no aprobado.',
        'Evidencia de atención de derechos del titular y propagación de eliminación al proveedor no disponible.',
        'Clasificación de riesgo del proveedor es provisional y requiere metodología aprobada.',
        'No se ha validado mediante piloto humano que la revisión impida exposición o aprobación indebida de datos.'
      )
    )
  );

  select public.create_processing_activity_inventory_v1(
    v_actor_id,
    v_organization_id,
    v_project_id,
    v_ai_request_key,
    v_ai_payload,
    v_case_id,
    v_control_id
  ) into v_ai_first;

  select public.create_processing_activity_inventory_v1(
    v_actor_id,
    v_organization_id,
    v_project_id,
    v_ai_request_key,
    v_ai_payload,
    v_case_id,
    v_control_id
  ) into v_ai_second;

  if not coalesce((v_ai_second ->> 'resumed')::boolean, false) then
    raise exception 'AI processing activity second call was not idempotent: %', v_ai_second;
  end if;

  if v_ai_first ->> 'processId' is distinct from v_ai_second ->> 'processId'
     or v_ai_first ->> 'datasetId' is distinct from v_ai_second ->> 'datasetId'
     or v_ai_first ->> 'assetId' is distinct from v_ai_second ->> 'assetId'
     or v_ai_first ->> 'vendorId' is distinct from v_ai_second ->> 'vendorId'
     or v_ai_first ->> 'evidenceId' is distinct from v_ai_second ->> 'evidenceId'
     or v_ai_first ->> 'reviewId' is distinct from v_ai_second ->> 'reviewId' then
    raise exception 'AI processing activity returned different identifiers.';
  end if;

  if (select completeness from public.processing_activity_reviews where id = (v_ai_first ->> 'reviewId')::uuid) <> 'partial' then
    raise exception 'AI processing activity must remain partial.';
  end if;

  if (select validation_status from public.evidence where id = (v_ai_first ->> 'evidenceId')::uuid) <> 'accepted'
     or (select integrity_status from public.evidence where id = (v_ai_first ->> 'evidenceId')::uuid) <> 'verified'
     or length((select integrity_hash from public.evidence where id = (v_ai_first ->> 'evidenceId')::uuid)) <> 64 then
    raise exception 'AI processing evidence is not accepted and integrity-verified.';
  end if;

  if (
    select count(*)
    from public.organization_processes process
    where process.organization_id = v_organization_id
      and process.process_type = 'processing_activity'
      and process.name in (
        'Gestión de contactos comerciales y solicitudes de demostración',
        'Gestión de cuentas, autenticación y acceso al workspace',
        'Gestión de expedientes y análisis asistido por especialistas IA'
      )
  ) <> 3 then
    raise exception 'N3uralia must expose exactly three supervised real processing activities after the seed.';
  end if;
end;
$seed$;
