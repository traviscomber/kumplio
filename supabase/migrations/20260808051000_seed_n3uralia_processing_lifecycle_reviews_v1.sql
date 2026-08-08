-- Supervised lifecycle reviews for the three real N3uralia processing activities.
--
-- Every conclusion remains changes_requested. The seed records what was
-- observed and preserves every legal, retention, recipient, subprocessor and
-- transfer gap that still requires evidence or approval.

do $seed$
declare
  v_organization_id uuid;
  v_actor_id uuid;
  v_organization_count integer;
  v_commercial_process_id uuid;
  v_account_process_id uuid;
  v_ai_process_id uuid;
  v_lead_count integer;
  v_not_configured_count integer;
  v_account_session_count integer;
  v_ai_run_count integer;
  v_ai_approved_count integer;
  v_ai_token_count bigint;
  v_payload jsonb;
  v_first jsonb;
  v_second jsonb;
  v_request_key uuid;
begin
  select count(*)
  into v_organization_count
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia';

  if v_organization_count <> 1 then
    raise notice 'Skipping supervised lifecycle seed: expected exactly one N3uralia organization, found %.', v_organization_count;
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

  select process.id into v_commercial_process_id
  from public.organization_processes process
  where process.organization_id = v_organization_id
    and process.name = 'Gestión de contactos comerciales y solicitudes de demostración'
    and process.process_type = 'processing_activity'
  limit 1;

  select process.id into v_account_process_id
  from public.organization_processes process
  where process.organization_id = v_organization_id
    and process.name = 'Gestión de cuentas, autenticación y acceso al workspace'
    and process.process_type = 'processing_activity'
  limit 1;

  select process.id into v_ai_process_id
  from public.organization_processes process
  where process.organization_id = v_organization_id
    and process.name = 'Gestión de expedientes y análisis asistido por especialistas IA'
    and process.process_type = 'processing_activity'
  limit 1;

  if v_actor_id is null or v_commercial_process_id is null or v_account_process_id is null or v_ai_process_id is null then
    raise notice 'Skipping supervised lifecycle seed: actor %, commercial %, account %, AI %.',
      v_actor_id, v_commercial_process_id, v_account_process_id, v_ai_process_id;
    return;
  end if;

  select count(*) into v_lead_count from public.commercial_leads;
  select count(*) into v_not_configured_count
  from public.commercial_leads lead
  where lead.sync_status = 'not_configured';
  select count(*) into v_account_session_count
  from auth.sessions session_row
  where session_row.user_id = v_actor_id;
  select count(*) into v_ai_run_count
  from public.agent_runs run
  where run.organization_id = v_organization_id;
  select count(*) into v_ai_approved_count
  from public.agent_runs run
  where run.organization_id = v_organization_id
    and run.status = 'approved';
  select coalesce(sum(run.total_tokens), 0)::bigint
  into v_ai_token_count
  from public.agent_runs run
  where run.organization_id = v_organization_id;

  if v_lead_count < 1 or v_not_configured_count < 1 or v_account_session_count < 1
     or v_ai_run_count < 1 or v_ai_approved_count < 1 or v_ai_token_count < 1 then
    raise notice 'Skipping supervised lifecycle seed: leads %, Pipedrive not configured %, sessions %, AI runs %, approved %, tokens %.',
      v_lead_count, v_not_configured_count, v_account_session_count, v_ai_run_count, v_ai_approved_count, v_ai_token_count;
    return;
  end if;

  -- 1. Commercial contacts and demo requests.
  v_request_key := md5(v_organization_id::text || ':lifecycle:commercial-contact-v1')::uuid;
  v_payload := jsonb_build_object(
    'decision', 'changes_requested',
    'basis', jsonb_build_object(
      'status', 'pending_evidence',
      'type', 'Medidas precontractuales propuestas',
      'summary', 'La finalidad de responder una solicitud es observable, pero falta aprobación jurídica por finalidad adicional, seguimiento y conservación.'
    ),
    'retention', jsonb_build_object(
      'status', 'needs_changes',
      'rule', 'Pendiente de aprobar para leads atendidos, no convertidos y solicitudes abandonadas.',
      'trigger', 'Pendiente: última interacción, cierre comercial o revocación.',
      'period', 'Pendiente de aprobación.'
    ),
    'recipientsReview', jsonb_build_object('status', 'pending_evidence'),
    'subprocessorsReview', jsonb_build_object('status', 'pending_evidence'),
    'transfersReview', jsonb_build_object('status', 'pending_evidence'),
    'recipients', jsonb_build_array(
      jsonb_build_object(
        'name', 'Pipedrive',
        'role', 'CRM destinatario condicional',
        'country', 'Pendiente de confirmar',
        'evidenceStatus', 'PIPEDRIVE_WEBHOOK_URL no está configurado; el único lead observado conserva sync_status not_configured.'
      )
    ),
    'subprocessors', jsonb_build_array(
      jsonb_build_object(
        'name', 'Supabase',
        'service', 'Base de datos y backend de captura',
        'country', 'Estados Unidos (us-east-1)',
        'contractStatus', 'Proveedor observado; DPA, lista de subencargados y garantías pendientes de revisión.'
      )
    ),
    'transfers', jsonb_build_array(
      jsonb_build_object(
        'destination', 'Estados Unidos (us-east-1)',
        'mechanism', 'Pendiente de validación contractual',
        'safeguardStatus', 'Pendiente de revisar garantías, subencargados y documentación de transferencia.',
        'dataScope', 'Datos de contacto, empresa, mensaje y metadatos técnicos limitados.'
      )
    ),
    'sourceRefs', jsonb_build_array(
      jsonb_build_object(
        'label', 'Endpoint de captura comercial',
        'reference', 'app/api/leads/route.ts',
        'type', 'code'
      ),
      jsonb_build_object(
        'label', 'Estado operacional del lead',
        'reference', format('public.commercial_leads: %s registro, %s con sync_status not_configured', v_lead_count, v_not_configured_count),
        'type', 'code_and_database'
      )
    ),
    'unknowns', jsonb_build_array(
      'Base de licitud pendiente de validación por finalidad y uso posterior.',
      'Plazos diferenciados de retención para leads convertidos, descartados e inactivos no aprobados.',
      'Matriz de accesos y destinatarios internos no adjuntada.',
      'Pipedrive está previsto en código pero no configurado; falta decidir si será destinatario o encargado y revisar su contrato.',
      'DPA y listado vigente de subencargados de Supabase no adjuntados.',
      'Mecanismo y salvaguardas de transferencia internacional pendientes de validación.',
      'Aviso de privacidad aplicable al formulario no relacionado con esta actividad.',
      'Eliminación de leads y propagación a terceros no demostrada.'
    ),
    'reviewNote', 'Se verificó la captura en Supabase y que el envío a Pipedrive es condicional y actualmente no está configurado. La revisión identifica destinatarios y transferencias posibles, pero solicita cambios porque no existe evidencia suficiente para aprobar base, retención, accesos, subencargados, garantías ni eliminación.'
  );

  select public.review_processing_activity_lifecycle_v1(
    v_actor_id, v_organization_id, v_commercial_process_id, v_request_key, v_payload
  ) into v_first;
  select public.review_processing_activity_lifecycle_v1(
    v_actor_id, v_organization_id, v_commercial_process_id, v_request_key, v_payload
  ) into v_second;
  if not coalesce((v_second ->> 'resumed')::boolean, false)
     or v_first ->> 'reviewId' is distinct from v_second ->> 'reviewId'
     or v_first ->> 'evidenceId' is distinct from v_second ->> 'evidenceId' then
    raise exception 'Commercial lifecycle review second call was not idempotent.';
  end if;

  -- 2. Accounts, authentication and workspace access.
  v_request_key := md5(v_organization_id::text || ':lifecycle:account-auth-access-v1')::uuid;
  v_payload := jsonb_build_object(
    'decision', 'changes_requested',
    'basis', jsonb_build_object(
      'status', 'pending_evidence',
      'type', 'Ejecución del servicio y seguridad propuestas',
      'summary', 'La autenticación y el control de acceso son necesarios para el servicio, pero falta validar cada finalidad, aceptación histórica y ciclo posterior al cierre de cuenta.'
    ),
    'retention', jsonb_build_object(
      'status', 'needs_changes',
      'rule', 'Pendiente para cuenta, sesiones, refresh tokens, perfil y auditoría después de inactividad o cierre.',
      'trigger', 'Pendiente: cierre solicitado, término contractual o inactividad definida.',
      'period', 'Pendiente de aprobación por categoría.'
    ),
    'recipientsReview', jsonb_build_object('status', 'pending_evidence'),
    'subprocessorsReview', jsonb_build_object('status', 'pending_evidence'),
    'transfersReview', jsonb_build_object('status', 'pending_evidence'),
    'recipients', jsonb_build_array(
      jsonb_build_object(
        'name', 'Miembros autorizados del workspace',
        'role', 'Acceso interno según membresía y rol',
        'country', 'No determinado por la evidencia actual',
        'evidenceStatus', 'Existen roles y membresías; falta matriz de acceso aprobada y revisión periódica.'
      )
    ),
    'subprocessors', jsonb_build_array(
      jsonb_build_object(
        'name', 'Supabase',
        'service', 'Autenticación, sesiones, perfiles y base de datos',
        'country', 'Estados Unidos (us-east-1)',
        'contractStatus', 'Proveedor observado; DPA, subencargados, MFA y compromisos de seguridad pendientes de revisión.'
      )
    ),
    'transfers', jsonb_build_array(
      jsonb_build_object(
        'destination', 'Estados Unidos (us-east-1)',
        'mechanism', 'Pendiente de validación contractual',
        'safeguardStatus', 'Pendiente de revisar garantías y subencargados.',
        'dataScope', 'Identidad, correo, organización, roles, sesiones y metadatos de autenticación.'
      )
    ),
    'sourceRefs', jsonb_build_array(
      jsonb_build_object(
        'label', 'Registro y política de contraseña',
        'reference', 'app/(auth)/sign-up/page.tsx · lib/auth/password-policy.ts',
        'type', 'code'
      ),
      jsonb_build_object(
        'label', 'Cuenta, identidad y sesiones observadas',
        'reference', format('auth.users/auth.identities/auth.sessions/auth.refresh_tokens: %s sesiones activas observadas', v_account_session_count),
        'type', 'code_and_database'
      ),
      jsonb_build_object(
        'label', 'Advisor de seguridad de Supabase',
        'reference', 'Leaked Password Protection reportada como desactivada el 7 de agosto de 2026',
        'type', 'system'
      )
    ),
    'unknowns', jsonb_build_array(
      'Base de licitud pendiente de validación por finalidad y categoría de dato.',
      'Plazo de retención y eliminación de cuenta, sesiones, tokens y perfil no aprobado.',
      'Aceptaciones legales históricas de la cuenta piloto no disponibles.',
      'Matriz de accesos, revisiones periódicas y destinatarios internos no aprobada.',
      'DPA y lista vigente de subencargados de Supabase no adjuntados.',
      'Mecanismo y garantías de transferencia internacional pendientes.',
      'Leaked Password Protection continúa desactivada.',
      'MFA, recuperación, cierre, exportación y eliminación de cuenta no demostrados.'
    ),
    'reviewNote', 'Se verificaron cuenta confirmada, identidad, sesiones, perfil, membresía y controles de contraseña. La revisión solicita cambios porque el acceso técnico observado no sustituye base aprobada, retención, matriz de destinatarios, contrato de subencargados, salvaguardas de transferencia ni evidencia de cierre y eliminación.'
  );

  select public.review_processing_activity_lifecycle_v1(
    v_actor_id, v_organization_id, v_account_process_id, v_request_key, v_payload
  ) into v_first;
  select public.review_processing_activity_lifecycle_v1(
    v_actor_id, v_organization_id, v_account_process_id, v_request_key, v_payload
  ) into v_second;
  if not coalesce((v_second ->> 'resumed')::boolean, false)
     or v_first ->> 'reviewId' is distinct from v_second ->> 'reviewId'
     or v_first ->> 'evidenceId' is distinct from v_second ->> 'evidenceId' then
    raise exception 'Account lifecycle review second call was not idempotent.';
  end if;

  -- 3. Cases and specialist-AI analysis.
  v_request_key := md5(v_organization_id::text || ':lifecycle:guided-cases-ai-v1')::uuid;
  v_payload := jsonb_build_object(
    'decision', 'changes_requested',
    'basis', jsonb_build_object(
      'status', 'pending_evidence',
      'type', 'Ejecución del análisis solicitado propuesta',
      'summary', 'El análisis responde a una solicitud del usuario, pero falta validar roles, datos de terceros, minimización y finalidades secundarias por tipo de expediente.'
    ),
    'retention', jsonb_build_object(
      'status', 'needs_changes',
      'rule', 'Pendiente para casos, contexto, prompts, artefactos, revisiones, logs, respaldos y registros del proveedor.',
      'trigger', 'Pendiente: cierre del expediente, término contractual o solicitud del titular.',
      'period', 'Pendiente de aprobación por activo y finalidad.'
    ),
    'recipientsReview', jsonb_build_object('status', 'pending_evidence'),
    'subprocessorsReview', jsonb_build_object('status', 'pending_evidence'),
    'transfersReview', jsonb_build_object('status', 'pending_evidence'),
    'recipients', jsonb_build_array(
      jsonb_build_object(
        'name', 'OpenAI',
        'role', 'Proveedor que recibe tarea y contexto para inferencia',
        'country', 'Pendiente de confirmar contractualmente',
        'evidenceStatus', 'Integración observada con store=false; residencia, retención y rol contractual pendientes.'
      ),
      jsonb_build_object(
        'name', 'Revisores autorizados del workspace',
        'role', 'Revisión humana de resultados y evidencia',
        'country', 'No determinado por la evidencia actual',
        'evidenceStatus', 'Revisiones persistidas; falta matriz de acceso y minimización aprobada.'
      )
    ),
    'subprocessors', jsonb_build_array(
      jsonb_build_object(
        'name', 'OpenAI',
        'service', 'Inferencia de modelos y salidas estructuradas',
        'country', 'Pendiente de confirmar contractualmente',
        'contractStatus', 'DPA, subencargados, residencia y retención pendientes de revisión.'
      )
    ),
    'transfers', jsonb_build_array(
      jsonb_build_object(
        'destination', 'Pendiente de confirmar contractualmente',
        'mechanism', 'Pendiente de validación',
        'safeguardStatus', 'Pendiente de revisar garantías, residencia, retención y subencargados.',
        'dataScope', 'Tareas, contexto, evidencia citada, resultados estructurados y metadatos de ejecución.'
      )
    ),
    'sourceRefs', jsonb_build_array(
      jsonb_build_object(
        'label', 'Runtime de OpenAI',
        'reference', 'lib/agents/openai-runtime.ts: Structured Outputs, safety_identifier y store=false',
        'type', 'code'
      ),
      jsonb_build_object(
        'label', 'Ejecución durable y revisión',
        'reference', 'lib/agents/workflow-stage-executor.ts · public.agent_runs/public.agent_artifacts/public.agent_reviews/public.agent_tool_calls',
        'type', 'code_and_database'
      ),
      jsonb_build_object(
        'label', 'Uso operacional observado',
        'reference', format('%s runs, %s aprobados y %s tokens acumulados en N3uralia', v_ai_run_count, v_ai_approved_count, v_ai_token_count),
        'type', 'system'
      )
    ),
    'unknowns', jsonb_build_array(
      'Base jurídica, roles y datos de terceros pendientes de validación por tipo de expediente.',
      'Clasificación y minimización de datos antes de enviar contexto no aprobadas.',
      'Plazos de retención y eliminación de casos, prompts, artefactos, logs y respaldos no aprobados.',
      'Matriz de destinatarios internos y permisos de revisores no adjuntada.',
      'DPA, residencia y lista de subencargados de OpenAI pendientes.',
      'Mecanismo y salvaguardas de transferencia internacional no validados.',
      'Atención de derechos y propagación de eliminación al proveedor no demostradas.',
      'No existe todavía piloto humano que valide prevención de exposición o aprobación indebida.'
    ),
    'reviewNote', 'Se verificaron workflows, contextos, outputs, modelos, tokens, artefactos, revisiones, tool calls y store=false. La revisión solicita cambios porque la existencia de controles técnicos no demuestra base, minimización, destinatarios, contrato, residencia, retención, transferencias ni eliminación suficientes para datos personales de terceros.'
  );

  select public.review_processing_activity_lifecycle_v1(
    v_actor_id, v_organization_id, v_ai_process_id, v_request_key, v_payload
  ) into v_first;
  select public.review_processing_activity_lifecycle_v1(
    v_actor_id, v_organization_id, v_ai_process_id, v_request_key, v_payload
  ) into v_second;
  if not coalesce((v_second ->> 'resumed')::boolean, false)
     or v_first ->> 'reviewId' is distinct from v_second ->> 'reviewId'
     or v_first ->> 'evidenceId' is distinct from v_second ->> 'evidenceId' then
    raise exception 'AI lifecycle review second call was not idempotent.';
  end if;

  if (
    select count(*)
    from public.processing_activity_lifecycle_reviews review
    where review.organization_id = v_organization_id
      and review.process_id in (v_commercial_process_id, v_account_process_id, v_ai_process_id)
      and review.version = 1
      and review.decision = 'changes_requested'
  ) <> 3 then
    raise exception 'N3uralia must have exactly three lifecycle reviews after the supervised seed.';
  end if;
end;
$seed$;
