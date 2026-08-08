-- Supervised Block 16 closure for the three real N3uralia processing activities.
--
-- The accepted evidence proves the mapping exercise and preserves explicit gaps.
-- It does not validate legal basis, retention, vendors, transfers or deletion.

do $seed$
declare
  v_organization_id uuid;
  v_actor_id uuid;
  v_process record;
  v_lifecycle record;
  v_request_key uuid;
  v_primary_scope text;
  v_process_source_label text;
  v_process_source_reference text;
  v_unknowns jsonb;
  v_dimensions jsonb;
  v_mapped_scopes jsonb;
  v_payload jsonb;
  v_first jsonb;
  v_second jsonb;
  v_count integer;
begin
  select organization.id
  into v_organization_id
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia'
  limit 1;

  if v_organization_id is null then
    raise notice 'Skipping notice mapping seed: N3uralia not found.';
    return;
  end if;

  select member.user_id
  into v_actor_id
  from public.organization_members member
  where member.organization_id = v_organization_id
    and member.role in ('owner', 'admin', 'compliance')
  order by case member.role when 'owner' then 1 when 'admin' then 2 else 3 end, member.joined_at
  limit 1;

  if v_actor_id is null then
    raise notice 'Skipping notice mapping seed: accountable reviewer not found.';
    return;
  end if;

  for v_process in
    select process.*
    from public.organization_processes process
    where process.organization_id = v_organization_id
      and process.process_type = 'processing_activity'
      and process.lifecycle_status = 'active'
      and process.name in (
        'Gestión de contactos comerciales y solicitudes de demostración',
        'Gestión de cuentas, autenticación y acceso al workspace',
        'Gestión de expedientes y análisis asistido por especialistas IA'
      )
    order by process.name
  loop
    select review.*
    into v_lifecycle
    from public.processing_activity_lifecycle_reviews review
    where review.organization_id = v_organization_id
      and review.process_id = v_process.id
    order by review.version desc
    limit 1;

    if v_lifecycle.id is null then
      raise exception 'Lifecycle review missing for %.', v_process.name;
    end if;

    v_request_key := md5(v_organization_id::text || ':notice-mapping:' || v_process.id::text || ':2026-08-03:v1')::uuid;
    v_process_source_label := coalesce(v_process.attributes #>> '{source,label}', 'Fuente observada del tratamiento');
    v_process_source_reference := coalesce(v_process.attributes #>> '{source,reference}', 'Referencia no disponible');

    if v_process.name = 'Gestión de contactos comerciales y solicitudes de demostración' then
      v_primary_scope := 'Solicitudes de contacto y demostración';
      v_unknowns := jsonb_build_array(
        'El aviso no enumera de forma específica todas las categorías de datos y titulares de contactos comerciales.',
        'Los destinatarios internos, Supabase y un eventual CRM deben validarse con configuración y contratos vigentes.',
        'Los plazos diferenciados para leads convertidos, descartados e inactivos no están aprobados.',
        'La atención de derechos, eliminación y propagación a terceros no está demostrada.'
      );
      v_dimensions := jsonb_build_object(
        'purpose', jsonb_build_object('status','covered','note','El aviso identifica solicitudes de contacto y demostración, coherentes con la finalidad registrada.'),
        'dataSubjects', jsonb_build_object('status','partial','note','El aviso no enumera todos los tipos de contactos, representantes y prospectos.'),
        'dataCategories', jsonb_build_object('status','partial','note','Las categorías específicas permanecen en el inventario y no se agotan en el aviso.'),
        'recipients', jsonb_build_object('status','partial','note','Destinatarios internos y un eventual CRM requieren validación separada.'),
        'rights', jsonb_build_object('status','partial','note','Existe un canal general; falta evidencia operacional para leads y terceros.'),
        'transfers', jsonb_build_object('status','partial','note','Países, mecanismos y salvaguardas requieren evidencia contractual.'),
        'retention', jsonb_build_object('status','not_covered','note','No existe un plazo específico aprobado para leads convertidos, descartados o inactivos.')
      );
    elsif v_process.name = 'Gestión de cuentas, autenticación y acceso al workspace' then
      v_primary_scope := 'Creación de cuenta, autenticación y workspace';
      v_unknowns := jsonb_build_array(
        'El aviso no detalla por separado credenciales, sesiones, refresh tokens, perfiles y membresías.',
        'Las aceptaciones legales históricas de la cuenta piloto no están disponibles.',
        'El plazo y la propagación de eliminación de cuenta, sesiones, tokens y perfil no están aprobados.',
        'Subencargados, transferencias, MFA y recuperación de cuenta requieren evidencia adicional.'
      );
      v_dimensions := jsonb_build_object(
        'purpose', jsonb_build_object('status','covered','note','El aviso identifica creación de cuenta, autenticación y administración del workspace.'),
        'dataSubjects', jsonb_build_object('status','partial','note','El aviso cubre usuarios en general, pero no diferencia todos los roles y miembros.'),
        'dataCategories', jsonb_build_object('status','partial','note','No enumera de forma específica credenciales, sesiones, tokens, perfil y membresías.'),
        'recipients', jsonb_build_object('status','partial','note','Accesos internos y proveedor de autenticación requieren matriz y contratos.'),
        'rights', jsonb_build_object('status','partial','note','Canal general disponible; cierre, exportación y eliminación no demostrados end-to-end.'),
        'transfers', jsonb_build_object('status','partial','note','Región, subencargados y salvaguardas de Supabase permanecen pendientes.'),
        'retention', jsonb_build_object('status','not_covered','note','No existe plazo aprobado para cuenta, sesiones, refresh tokens y perfil.')
      );
    else
      v_primary_scope := 'Expedientes, documentos, evidencia y resultados asistidos por IA';
      v_unknowns := jsonb_build_array(
        'El aviso no clasifica por expediente las categorías personales, sensibles y datos de terceros.',
        'La minimización y redacción de contexto antes de enviarlo a especialistas no está aprobada.',
        'DPA, residencia, subencargados y salvaguardas del proveedor de IA requieren validación.',
        'Retención, derechos y propagación de eliminación de casos, prompts, artefactos, logs y respaldos no están demostradas.'
      );
      v_dimensions := jsonb_build_object(
        'purpose', jsonb_build_object('status','covered','note','El aviso identifica expedientes, documentos, evidencia y resultados asistidos por IA.'),
        'dataSubjects', jsonb_build_object('status','partial','note','Puede incluir usuarios y terceros; el aviso no los distingue por tipo de expediente.'),
        'dataCategories', jsonb_build_object('status','partial','note','Las categorías y datos sensibles deben clasificarse y minimizarse por expediente.'),
        'recipients', jsonb_build_object('status','partial','note','Revisores internos y proveedor de IA requieren matriz de permisos y roles.'),
        'rights', jsonb_build_object('status','partial','note','Canal general disponible; propagación a artefactos y proveedor no demostrada.'),
        'transfers', jsonb_build_object('status','partial','note','Residencia, mecanismos y salvaguardas del proveedor requieren evidencia contractual.'),
        'retention', jsonb_build_object('status','not_covered','note','No existe plazo aprobado para casos, prompts, artefactos, logs y respaldos.')
      );
    end if;

    v_mapped_scopes := jsonb_build_array(
      jsonb_build_object(
        'scope', v_primary_scope,
        'status', 'covered',
        'note', 'El aviso identifica el ámbito general correspondiente; la cobertura se acepta como mapeo, no como validación jurídica integral.'
      ),
      jsonb_build_object(
        'scope', 'Proveedores tecnológicos y transferencias internacionales',
        'status', 'partial',
        'note', 'El aviso reconoce proveedores y transferencias, pero no acredita roles, países, subencargados ni salvaguardas de esta actividad.'
      ),
      jsonb_build_object(
        'scope', 'Derechos del titular y solicitudes de privacidad',
        'status', 'partial',
        'note', 'Existe un canal general; falta demostrar el procedimiento y la propagación para esta actividad.'
      )
    );

    v_payload := jsonb_build_object(
      'noticeVersion', '2026-08-03',
      'mappingStatus', 'accepted_with_gaps',
      'mappingReviewed', true,
      'limitationsConfirmed', true,
      'primaryScope', v_primary_scope,
      'mappedScopes', v_mapped_scopes,
      'dimensions', v_dimensions,
      'unknowns', v_unknowns,
      'sourceRefs', jsonb_build_array(
        jsonb_build_object(
          'type','public_notice',
          'label','Política de Privacidad de Kumplio · versión 2026-08-03',
          'reference','https://www.kumplio.app/privacy'
        ),
        jsonb_build_object(
          'type','process_source',
          'label',v_process_source_label,
          'reference',v_process_source_reference
        ),
        jsonb_build_object(
          'type','lifecycle_review',
          'label','Revisión lifecycle vigente · ' || v_process.code,
          'reference',v_lifecycle.id::text || ' · ' || v_lifecycle.snapshot_hash
        )
      ),
      'reviewNote',
        'Se acepta el ejercicio de mapeo del aviso 2026-08-03 para “' || v_process.name || '” con brechas explícitas. La aceptación acredita la matriz y sus fuentes; no valida base jurídica, retención, destinatarios, subencargados, transferencias ni eliminación.'
    );

    select public.accept_processing_notice_mapping_v1(
      v_actor_id,
      v_organization_id,
      v_process.id,
      v_request_key,
      v_payload
    ) into v_first;

    select public.accept_processing_notice_mapping_v1(
      v_actor_id,
      v_organization_id,
      v_process.id,
      v_request_key,
      v_payload
    ) into v_second;

    if not coalesce((v_second ->> 'resumed')::boolean, false)
       or v_first ->> 'evidenceId' is distinct from v_second ->> 'evidenceId'
       or v_first ->> 'evidenceRequestId' is distinct from v_second ->> 'evidenceRequestId'
       or v_first ->> 'snapshotHash' is distinct from v_second ->> 'snapshotHash' then
      raise exception 'Notice mapping second call was not idempotent for %.', v_process.name;
    end if;
  end loop;

  select count(*) into v_count
  from public.organization_processes process
  where process.organization_id = v_organization_id
    and process.process_type = 'processing_activity'
    and process.name in (
      'Gestión de contactos comerciales y solicitudes de demostración',
      'Gestión de cuentas, autenticación y acceso al workspace',
      'Gestión de expedientes y análisis asistido por especialistas IA'
    )
    and process.attributes ->> 'privacyNoticeMappingStatus' = 'accepted_with_gaps'
    and process.attributes ->> 'privacyNoticeMappingEvidenceId' is not null
    and jsonb_array_length(process.attributes -> 'privacyNoticeMappingUnknowns') > 0;

  if v_count <> 3 then
    raise exception 'Expected three activities with accepted notice mapping gaps, found %.', v_count;
  end if;

  select count(*) into v_count
  from public.evidence_requests request
  where request.organization_id = v_organization_id
    and request.title like 'Aviso aplicable y mapeado — %'
    and request.status = 'accepted'
    and request.submitted_evidence_id is not null;

  if v_count <> 3 then
    raise exception 'Expected three accepted notice mapping requests, found %.', v_count;
  end if;

  select count(*) into v_count
  from public.evidence evidence
  where evidence.organization_id = v_organization_id
    and evidence.metadata ->> 'scope' = 'processing_notice_mapping_review'
    and evidence.metadata ->> 'mappingStatus' = 'accepted_with_gaps'
    and evidence.metadata ->> 'activitySpecificMapping' = 'true'
    and evidence.metadata ->> 'noticeSufficiencyValidated' = 'false'
    and evidence.metadata ->> 'legalBasisValidated' = 'false'
    and evidence.metadata ->> 'retentionValidated' = 'false'
    and evidence.metadata ->> 'deletionEvidence' = 'false'
    and evidence.validation_status = 'accepted'
    and evidence.integrity_status = 'verified'
    and evidence.integrity_hash ~ '^[0-9a-f]{64}$';

  if v_count <> 3 then
    raise exception 'Expected three accepted and bounded notice mapping evidence records, found %.', v_count;
  end if;

  select count(*) into v_count
  from public.control_evidence link
  join public.evidence evidence on evidence.id = link.evidence_id
  where link.organization_id = v_organization_id
    and evidence.metadata ->> 'scope' = 'processing_notice_mapping_review'
    and link.sufficiency_status = 'partial';

  if v_count <> 3 then
    raise exception 'Expected three partial control-evidence mappings, found %.', v_count;
  end if;

  select count(*) into v_count
  from public.missions mission
  where mission.organization_id = v_organization_id
    and mission.metadata ->> 'source' = 'processing_privacy_and_deletion_remediation'
    and mission.metadata ->> 'noticeMappingStatus' = 'accepted_with_gaps'
    and mission.metadata ->> 'noticeMappingEvidenceId' is not null;

  if v_count <> 3 then
    raise exception 'Expected three missions updated with accepted notice mapping, found %.', v_count;
  end if;

  select count(*) into v_count
  from public.compliance_case_events event
  where event.organization_id = v_organization_id
    and event.event_type = 'processing_notice_mapping_accepted'
    and event.changes ->> 'mapping_status' = 'accepted_with_gaps';

  if v_count <> 3 then
    raise exception 'Expected three notice mapping acceptance events, found %.', v_count;
  end if;
end;
$seed$;
