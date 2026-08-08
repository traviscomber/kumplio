-- Read-only production verification for Block 16 task 3.

begin;
set transaction read only;

do $verify$
declare
  v_organization_id uuid;
  v_notice_evidence_id uuid;
  v_count integer;
begin
  select organization.id
  into v_organization_id
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia'
  limit 1;

  if v_organization_id is null then
    raise exception 'Expected exactly one N3uralia organization.';
  end if;

  select evidence.id
  into v_notice_evidence_id
  from public.evidence evidence
  where evidence.organization_id = v_organization_id
    and evidence.metadata ->> 'scope' = 'public_privacy_notice'
    and evidence.metadata ->> 'privacyNoticeVersion' = '2026-08-03'
    and evidence.metadata ->> 'activitySpecificMapping' = 'false'
    and evidence.metadata ->> 'deletionEvidence' = 'false'
    and evidence.metadata ->> 'limitationsPreserved' = 'true'
    and evidence.metadata #>> '{privacyNoticeSnapshot,route}' = '/privacy'
    and evidence.metadata #>> '{privacyNoticeSnapshot,contact}' = 'info@kumplio.app'
    and evidence.validation_status = 'accepted'
    and evidence.integrity_status = 'verified'
    and evidence.integrity_hash ~ '^[0-9a-f]{64}$'
    and evidence.integrity_hash = pg_catalog.encode(
      extensions.digest((evidence.metadata -> 'privacyNoticeSnapshot')::text, 'sha256'),
      'hex'
    )
  order by evidence.created_at
  limit 1;

  if v_notice_evidence_id is null then
    raise exception 'The versioned public privacy notice evidence is missing or invalid.';
  end if;

  select count(*)
  into v_count
  from public.evidence evidence
  where evidence.organization_id = v_organization_id
    and evidence.metadata ->> 'scope' = 'public_privacy_notice'
    and evidence.metadata ->> 'privacyNoticeVersion' = '2026-08-03';
  if v_count <> 1 then
    raise exception 'Expected exactly one public privacy notice evidence, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.organization_processes process
  where process.organization_id = v_organization_id
    and process.process_type = 'processing_activity'
    and process.lifecycle_status = 'active'
    and process.name in (
      'Gestión de contactos comerciales y solicitudes de demostración',
      'Gestión de cuentas, autenticación y acceso al workspace',
      'Gestión de expedientes y análisis asistido por especialistas IA'
    )
    and process.owner_user_id is not null
    and process.attributes ->> 'privacyNoticeVersion' = '2026-08-03'
    and process.attributes ->> 'privacyNoticeMappingStatus' = 'needs_changes'
    and process.attributes ->> 'deletionEvidenceStatus' = 'pending_evidence'
    and process.attributes ->> 'privacyNoticeEvidenceId' = v_notice_evidence_id::text
    and process.attributes ->> 'privacyRemediationMissionId' is not null
    and process.attributes ->> 'privacyNoticeRequestId' is not null
    and process.attributes ->> 'deletionEvidenceRequestId' is not null;
  if v_count <> 3 then
    raise exception 'Expected exactly three active N3uralia activities with privacy remediation, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.processing_activity_evidence link
  join public.evidence evidence on evidence.id = link.evidence_id
  join public.organization_processes process on process.id = link.process_id
  where link.organization_id = v_organization_id
    and link.relationship_type = 'supporting'
    and evidence.id = v_notice_evidence_id
    and evidence.metadata ->> 'scope' = 'public_privacy_notice'
    and process.organization_id = v_organization_id
    and process.name in (
      'Gestión de contactos comerciales y solicitudes de demostración',
      'Gestión de cuentas, autenticación y acceso al workspace',
      'Gestión de expedientes y análisis asistido por especialistas IA'
    );
  if v_count <> 3 then
    raise exception 'Expected three supporting activity links to the public notice, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.organization_processes process
  join public.missions mission
    on mission.id = (process.attributes ->> 'privacyRemediationMissionId')::uuid
  where process.organization_id = v_organization_id
    and process.process_type = 'processing_activity'
    and process.name in (
      'Gestión de contactos comerciales y solicitudes de demostración',
      'Gestión de cuentas, autenticación y acceso al workspace',
      'Gestión de expedientes y análisis asistido por especialistas IA'
    )
    and mission.organization_id = v_organization_id
    and mission.owner_id = process.owner_user_id
    and mission.priority = 'high'
    and mission.status in ('ready', 'active', 'blocked', 'in_review', 'completed')
    and mission.due_at is not null
    and mission.metadata ->> 'source' = 'processing_privacy_and_deletion_remediation'
    and mission.metadata ->> 'processingActivityId' = process.id::text
    and mission.metadata ->> 'privacyNoticeEvidenceId' = v_notice_evidence_id::text
    and mission.metadata ->> 'privacyNoticeVersion' = '2026-08-03';
  if v_count <> 3 then
    raise exception 'Expected three valid privacy remediation missions, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.organization_processes process
  join public.missions mission
    on mission.id = (process.attributes ->> 'privacyRemediationMissionId')::uuid
  join public.evidence_requests notice_request
    on notice_request.id = (process.attributes ->> 'privacyNoticeRequestId')::uuid
  join public.evidence_requests deletion_request
    on deletion_request.id = (process.attributes ->> 'deletionEvidenceRequestId')::uuid
  where process.organization_id = v_organization_id
    and process.process_type = 'processing_activity'
    and process.name in (
      'Gestión de contactos comerciales y solicitudes de demostración',
      'Gestión de cuentas, autenticación y acceso al workspace',
      'Gestión de expedientes y análisis asistido por especialistas IA'
    )
    and notice_request.organization_id = v_organization_id
    and deletion_request.organization_id = v_organization_id
    and notice_request.requested_from = process.owner_user_id
    and deletion_request.requested_from = process.owner_user_id
    and notice_request.status in ('open', 'submitted', 'under_review', 'accepted', 'changes_requested')
    and deletion_request.status in ('open', 'submitted', 'under_review', 'accepted', 'changes_requested')
    and notice_request.due_at < deletion_request.due_at
    and deletion_request.due_at <= mission.due_at
    and notice_request.description like '%matriz%finalidades%titulares%categorías%destinatarios%derechos%transferencias%'
    and deletion_request.description like '%backup_purga_programada%'
    and deletion_request.description like '%backup_purga_confirmada%'
    and deletion_request.description like '%timestamp%proveedor%activo o dataset%alcance%responsable%resultado%'
    and (deletion_request.status <> 'accepted' or deletion_request.submitted_evidence_id is not null);
  if v_count <> 3 then
    raise exception 'Expected three complete notice/deletion request chains, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.evidence_request_events event
  join public.organization_processes process
    on event.request_id in (
      (process.attributes ->> 'privacyNoticeRequestId')::uuid,
      (process.attributes ->> 'deletionEvidenceRequestId')::uuid
    )
  where process.organization_id = v_organization_id
    and process.process_type = 'processing_activity'
    and process.name in (
      'Gestión de contactos comerciales y solicitudes de demostración',
      'Gestión de cuentas, autenticación y acceso al workspace',
      'Gestión de expedientes y análisis asistido por especialistas IA'
    )
    and event.organization_id = v_organization_id
    and event.event_type = 'created'
    and event.to_status = 'open';
  if v_count <> 6 then
    raise exception 'Expected six creation events for notice and deletion requests, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.compliance_case_events event
  where event.organization_id = v_organization_id
    and event.event_type = 'processing_privacy_remediation_ready'
    and event.changes ->> 'privacy_notice_version' = '2026-08-03';
  if v_count <> 3 then
    raise exception 'Expected three privacy remediation case events, found %.', v_count;
  end if;
end;
$verify$;

with n3uralia as (
  select organization.id
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia'
  limit 1
), notice as (
  select evidence.id
  from public.evidence evidence
  where evidence.organization_id = (select id from n3uralia)
    and evidence.metadata ->> 'scope' = 'public_privacy_notice'
    and evidence.metadata ->> 'privacyNoticeVersion' = '2026-08-03'
  limit 1
), processes as (
  select process.*
  from public.organization_processes process
  where process.organization_id = (select id from n3uralia)
    and process.process_type = 'processing_activity'
    and process.name in (
      'Gestión de contactos comerciales y solicitudes de demostración',
      'Gestión de cuentas, autenticación y acceso al workspace',
      'Gestión de expedientes y análisis asistido por especialistas IA'
    )
)
select jsonb_build_object(
  'status', 'passed',
  'activities', (select count(*) from processes),
  'noticeEvidence', (select count(*) from notice),
  'noticeLinks', (
    select count(*)
    from public.processing_activity_evidence link
    join public.evidence evidence on evidence.id = link.evidence_id
    where link.organization_id = (select id from n3uralia)
      and link.process_id in (select id from processes)
      and link.relationship_type = 'supporting'
      and evidence.id = (select id from notice)
      and evidence.metadata ->> 'scope' = 'public_privacy_notice'
  ),
  'missions', (
    select count(*) from public.missions
    where organization_id = (select id from n3uralia)
      and metadata ->> 'source' = 'processing_privacy_and_deletion_remediation'
  ),
  'noticeRequests', (
    select count(*) from public.evidence_requests
    where organization_id = (select id from n3uralia)
      and title like 'Aviso aplicable y mapeado — %'
  ),
  'deletionRequests', (
    select count(*) from public.evidence_requests
    where organization_id = (select id from n3uralia)
      and title like 'Evidencia de eliminación — %'
  ),
  'caseEvents', (
    select count(*) from public.compliance_case_events
    where organization_id = (select id from n3uralia)
      and event_type = 'processing_privacy_remediation_ready'
  )
) as verification;

rollback;
