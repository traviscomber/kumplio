-- Supervised Block 16 task 3 seed.
--
-- The current general notice is linked as versioned evidence. It is not treated
-- as activity-specific proof. Each real activity receives one remediation
-- mission and two evidence requests: notice mapping and deletion proof.

do $seed$
declare
  v_organization_id uuid;
  v_actor_id uuid;
  v_process record;
  v_notice_snapshot jsonb;
  v_notice_due_at timestamptz := date_trunc('minute', now()) + interval '14 days';
  v_deletion_due_at timestamptz := date_trunc('minute', now()) + interval '30 days';
  v_mission_due_at timestamptz := date_trunc('minute', now()) + interval '35 days';
  v_request_key uuid;
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
    raise notice 'Skipping privacy remediation seed: N3uralia not found.';
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
    raise notice 'Skipping privacy remediation seed: accountable actor not found.';
    return;
  end if;

  v_notice_snapshot := jsonb_build_object(
    'version', '2026-08-03',
    'effectiveDate', '2026-08-03',
    'route', '/privacy',
    'publicUrl', 'https://www.kumplio.app/privacy',
    'title', 'Política de Privacidad de Kumplio',
    'controllerLabel', 'Kumplio',
    'contact', 'info@kumplio.app',
    'country', 'Chile',
    'scopes', jsonb_build_array(
      'Navegación y seguridad del sitio',
      'Solicitudes de contacto y demostración',
      'Creación de cuenta, autenticación y workspace',
      'Expedientes, documentos, evidencia y resultados asistidos por IA',
      'Proveedores tecnológicos y transferencias internacionales',
      'Derechos del titular y solicitudes de privacidad'
    ),
    'limitations', jsonb_build_array(
      'El aviso público es general y no reemplaza el mapeo por actividad de tratamiento.',
      'Su existencia no demuestra que todos los destinatarios, subencargados o transferencias estén contractualmente validados.',
      'La sección de conservación no define por sí sola plazos aprobados por categoría de dato.',
      'La eliminación debe demostrarse con evidencia operativa y trazable.'
    )
  );

  for v_process in
    select process.id, process.name
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
    v_request_key := md5(v_organization_id::text || ':privacy-remediation:' || v_process.id::text || ':v1')::uuid;

    select public.prepare_processing_activity_privacy_remediation_v1(
      v_actor_id,
      v_organization_id,
      v_process.id,
      v_request_key,
      v_notice_snapshot,
      v_notice_due_at,
      v_deletion_due_at,
      v_mission_due_at
    ) into v_first;

    select public.prepare_processing_activity_privacy_remediation_v1(
      v_actor_id,
      v_organization_id,
      v_process.id,
      v_request_key,
      v_notice_snapshot,
      v_notice_due_at,
      v_deletion_due_at,
      v_mission_due_at
    ) into v_second;

    if not coalesce((v_second ->> 'resumed')::boolean, false)
       or v_first ->> 'missionId' is distinct from v_second ->> 'missionId'
       or v_first ->> 'privacyNoticeRequestId' is distinct from v_second ->> 'privacyNoticeRequestId'
       or v_first ->> 'deletionEvidenceRequestId' is distinct from v_second ->> 'deletionEvidenceRequestId'
       or v_first ->> 'privacyNoticeEvidenceId' is distinct from v_second ->> 'privacyNoticeEvidenceId' then
      raise exception 'Privacy remediation second call was not idempotent for %.', v_process.name;
    end if;
  end loop;

  select count(*)
  into v_count
  from public.organization_processes process
  where process.organization_id = v_organization_id
    and process.process_type = 'processing_activity'
    and process.name in (
      'Gestión de contactos comerciales y solicitudes de demostración',
      'Gestión de cuentas, autenticación y acceso al workspace',
      'Gestión de expedientes y análisis asistido por especialistas IA'
    )
    and process.attributes ->> 'privacyNoticeVersion' = '2026-08-03'
    and process.attributes ->> 'privacyNoticeMappingStatus' = 'needs_changes'
    and process.attributes ->> 'deletionEvidenceStatus' = 'pending_evidence'
    and process.attributes ->> 'privacyRemediationMissionId' is not null
    and process.attributes ->> 'privacyNoticeRequestId' is not null
    and process.attributes ->> 'deletionEvidenceRequestId' is not null;

  if v_count <> 3 then
    raise exception 'Expected three N3uralia activities with privacy remediation, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.missions mission
  join public.organization_processes process
    on process.id = (mission.metadata ->> 'processingActivityId')::uuid
  where mission.organization_id = v_organization_id
    and process.organization_id = v_organization_id
    and mission.metadata ->> 'source' = 'processing_privacy_and_deletion_remediation'
    and mission.metadata ->> 'privacyNoticeVersion' = '2026-08-03'
    and mission.owner_id = process.owner_user_id
    and mission.priority = 'high'
    and mission.status = 'ready'
    and mission.due_at = v_mission_due_at;

  if v_count <> 3 then
    raise exception 'Expected three owner-scoped privacy remediation missions, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.evidence_requests request
  join public.organization_processes process
    on process.attributes ->> 'privacyNoticeRequestId' = request.id::text
  where request.organization_id = v_organization_id
    and process.organization_id = v_organization_id
    and request.title like 'Aviso aplicable y mapeado — %'
    and request.requested_from = process.owner_user_id
    and request.status = 'open'
    and request.due_at = v_notice_due_at
    and request.description like '%matriz%finalidades%titulares%categorías%destinatarios%derechos%transferencias%';

  if v_count <> 3 then
    raise exception 'Expected three owner-scoped notice mapping requests, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.evidence_requests request
  join public.organization_processes process
    on process.attributes ->> 'deletionEvidenceRequestId' = request.id::text
  where request.organization_id = v_organization_id
    and process.organization_id = v_organization_id
    and request.title like 'Evidencia de eliminación — %'
    and request.requested_from = process.owner_user_id
    and request.status = 'open'
    and request.due_at = v_deletion_due_at
    and request.description like '%backup_purga_programada%'
    and request.description like '%backup_purga_confirmada%'
    and request.description like '%timestamp%proveedor%activo o dataset%alcance%responsable%resultado%';

  if v_count <> 3 then
    raise exception 'Expected three auditable deletion evidence requests, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.evidence evidence
  where evidence.organization_id = v_organization_id
    and evidence.metadata ->> 'scope' = 'public_privacy_notice'
    and evidence.metadata ->> 'privacyNoticeVersion' = '2026-08-03'
    and evidence.metadata ->> 'activitySpecificMapping' = 'false'
    and evidence.metadata ->> 'deletionEvidence' = 'false'
    and evidence.metadata #>> '{privacyNoticeSnapshot,contact}' = 'info@kumplio.app'
    and evidence.validation_status = 'accepted'
    and evidence.integrity_status = 'verified'
    and evidence.integrity_hash ~ '^[0-9a-f]{64}$';

  if v_count <> 1 then
    raise exception 'Expected one accepted and verified public privacy notice evidence, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.processing_activity_evidence link
  join public.evidence evidence on evidence.id = link.evidence_id
  where link.organization_id = v_organization_id
    and link.relationship_type = 'supporting'
    and evidence.metadata ->> 'scope' = 'public_privacy_notice';

  if v_count <> 3 then
    raise exception 'Expected three supporting activity links to the privacy notice, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.compliance_case_events event
  where event.organization_id = v_organization_id
    and event.event_type = 'processing_privacy_remediation_ready'
    and event.changes ->> 'privacy_notice_version' = '2026-08-03';

  if v_count <> 3 then
    raise exception 'Expected three auditable privacy remediation case events, found %.', v_count;
  end if;
end;
$seed$;
