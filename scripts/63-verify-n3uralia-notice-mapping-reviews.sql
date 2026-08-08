-- Read-only production verification for Block 16 notice mapping closure.

begin;
set transaction read only;

do $verify$
declare
  v_organization_id uuid;
  v_function_oid oid;
  v_count integer;
begin
  select count(*)
  into v_count
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia';

  if v_count <> 1 then
    raise exception 'Expected exactly one N3uralia organization, found %.', v_count;
  end if;

  select organization.id
  into v_organization_id
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia'
  limit 1;

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
    and process.attributes ->> 'privacyNoticeMappingStatus' = 'accepted_with_gaps'
    and process.attributes ->> 'privacyNoticeMappingEvidenceId' is not null
    and process.attributes ->> 'privacyNoticeMappingSnapshotHash' ~ '^[0-9a-f]{64}$'
    and jsonb_array_length(process.attributes -> 'privacyNoticeMappingUnknowns') > 0;

  if v_count <> 3 then
    raise exception 'Expected exactly three N3uralia activities with accepted notice mappings and explicit gaps, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.evidence evidence
  join public.organization_processes process
    on evidence.id = (process.attributes ->> 'privacyNoticeMappingEvidenceId')::uuid
  where process.organization_id = v_organization_id
    and process.process_type = 'processing_activity'
    and process.name in (
      'Gestión de contactos comerciales y solicitudes de demostración',
      'Gestión de cuentas, autenticación y acceso al workspace',
      'Gestión de expedientes y análisis asistido por especialistas IA'
    )
    and evidence.organization_id = v_organization_id
    and evidence.metadata ->> 'scope' = 'processing_notice_mapping_review'
    and evidence.metadata ->> 'mappingStatus' = 'accepted_with_gaps'
    and evidence.metadata ->> 'activitySpecificMapping' = 'true'
    and evidence.metadata ->> 'noticeSufficiencyValidated' = 'false'
    and evidence.metadata ->> 'legalBasisValidated' = 'false'
    and evidence.metadata ->> 'retentionValidated' = 'false'
    and evidence.metadata ->> 'deletionEvidence' = 'false'
    and evidence.metadata ->> 'limitationsPreserved' = 'true'
    and evidence.validation_status = 'accepted'
    and evidence.integrity_status = 'verified'
    and evidence.integrity_hash ~ '^[0-9a-f]{64}$'
    and evidence.integrity_hash = process.attributes ->> 'privacyNoticeMappingSnapshotHash'
    and evidence.integrity_hash = pg_catalog.encode(
      extensions.digest((evidence.metadata -> 'snapshot')::text, 'sha256'),
      'hex'
    )
    and jsonb_array_length(evidence.metadata #> '{snapshot,unknowns}') > 0;

  if v_count <> 3 then
    raise exception 'Expected three accepted, verified and bounded notice mapping evidence records, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.organization_processes process
  join public.evidence_requests request
    on request.id = (process.attributes ->> 'privacyNoticeRequestId')::uuid
  where process.organization_id = v_organization_id
    and process.process_type = 'processing_activity'
    and process.name in (
      'Gestión de contactos comerciales y solicitudes de demostración',
      'Gestión de cuentas, autenticación y acceso al workspace',
      'Gestión de expedientes y análisis asistido por especialistas IA'
    )
    and request.organization_id = v_organization_id
    and request.status = 'accepted'
    and request.submitted_evidence_id = (process.attributes ->> 'privacyNoticeMappingEvidenceId')::uuid
    and request.reviewed_by is not null
    and request.reviewed_at is not null
    and char_length(btrim(request.review_comment)) >= 30;

  if v_count <> 3 then
    raise exception 'Expected three accepted notice mapping evidence requests, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.control_evidence link
  join public.evidence evidence on evidence.id = link.evidence_id
  where link.organization_id = v_organization_id
    and evidence.organization_id = v_organization_id
    and evidence.metadata ->> 'scope' = 'processing_notice_mapping_review'
    and link.sufficiency_status = 'partial'
    and link.reviewed_by is not null
    and link.reviewed_at is not null;

  if v_count <> 3 then
    raise exception 'Expected three partial control-evidence mappings, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.missions mission
  where mission.organization_id = v_organization_id
    and mission.metadata ->> 'source' = 'processing_privacy_and_deletion_remediation'
    and mission.metadata ->> 'noticeMappingStatus' = 'accepted_with_gaps'
    and mission.metadata ->> 'noticeMappingEvidenceId' is not null
    and mission.metadata ->> 'noticeMappingSnapshotHash' ~ '^[0-9a-f]{64}$'
    and (mission.metadata ->> 'noticeMappingUnknownCount')::integer > 0;

  if v_count <> 3 then
    raise exception 'Expected three privacy missions updated with accepted mapping evidence, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.compliance_case_events event
  where event.organization_id = v_organization_id
    and event.event_type = 'processing_notice_mapping_accepted'
    and event.changes ->> 'mapping_status' = 'accepted_with_gaps'
    and event.changes ->> 'snapshot_hash' ~ '^[0-9a-f]{64}$'
    and (event.changes ->> 'unknown_count')::integer > 0;

  if v_count <> 3 then
    raise exception 'Expected three notice mapping acceptance events, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.evidence_requests request
  where request.organization_id = v_organization_id
    and request.title like 'Evidencia de eliminación — %'
    and request.status in ('open', 'submitted', 'under_review', 'changes_requested')
    and request.submitted_evidence_id is null;

  if v_count <> 3 then
    raise exception 'Expected three still-open deletion evidence requests, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.evidence_requests request
  where request.organization_id = v_organization_id
    and request.title like 'Evidencia de eliminación — %'
    and request.status = 'accepted'
    and request.submitted_evidence_id is not null;

  if v_count <> 0 then
    raise exception 'Expected zero demonstrated deletions, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.processing_activity_lifecycle_reviews review
  join public.organization_processes process
    on process.id = review.process_id
   and review.id = (process.attributes ->> 'latestLifecycleReviewId')::uuid
  where process.organization_id = v_organization_id
    and process.process_type = 'processing_activity'
    and process.name in (
      'Gestión de contactos comerciales y solicitudes de demostración',
      'Gestión de cuentas, autenticación y acceso al workspace',
      'Gestión de expedientes y análisis asistido por especialistas IA'
    )
    and review.organization_id = v_organization_id
    and review.decision = 'changes_requested';

  if v_count <> 3 then
    raise exception 'Expected lifecycle to remain changes_requested in three activities, found %.', v_count;
  end if;

  select function.oid
  into v_function_oid
  from pg_catalog.pg_proc function
  join pg_catalog.pg_namespace namespace on namespace.oid = function.pronamespace
  where namespace.nspname = 'public'
    and function.proname = 'accept_processing_notice_mapping_v1'
    and pg_catalog.pg_get_function_arguments(function.oid) = 'p_actor_id uuid, p_organization_id uuid, p_process_id uuid, p_request_key uuid, p_payload jsonb';

  if v_function_oid is null then
    raise exception 'Notice mapping review RPC is missing.';
  end if;

  if pg_catalog.prosecdef(v_function_oid)
     or pg_catalog.pg_get_functiondef(v_function_oid) not like '%SET search_path TO ''''%'
     or pg_catalog.has_function_privilege('public', v_function_oid, 'EXECUTE')
     or pg_catalog.has_function_privilege('anon', v_function_oid, 'EXECUTE')
     or pg_catalog.has_function_privilege('authenticated', v_function_oid, 'EXECUTE')
     or not pg_catalog.has_function_privilege('service_role', v_function_oid, 'EXECUTE')
     or not pg_catalog.has_function_privilege('postgres', v_function_oid, 'EXECUTE') then
    raise exception 'Notice mapping review RPC security contract is invalid.';
  end if;
end;
$verify$;

with n3uralia as (
  select organization.id
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia'
  limit 1
), activities as (
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
  'activities', (select count(*) from activities),
  'acceptedMappings', (
    select count(*) from activities
    where attributes ->> 'privacyNoticeMappingStatus' = 'accepted_with_gaps'
  ),
  'mappingEvidence', (
    select count(*)
    from public.evidence evidence
    where evidence.organization_id = (select id from n3uralia)
      and evidence.metadata ->> 'scope' = 'processing_notice_mapping_review'
  ),
  'acceptedNoticeRequests', (
    select count(*)
    from public.evidence_requests request
    where request.organization_id = (select id from n3uralia)
      and request.title like 'Aviso aplicable y mapeado — %'
      and request.status = 'accepted'
      and request.submitted_evidence_id is not null
  ),
  'partialControlEvidence', (
    select count(*)
    from public.control_evidence link
    join public.evidence evidence on evidence.id = link.evidence_id
    where link.organization_id = (select id from n3uralia)
      and evidence.metadata ->> 'scope' = 'processing_notice_mapping_review'
      and link.sufficiency_status = 'partial'
  ),
  'openDeletionRequests', (
    select count(*)
    from public.evidence_requests request
    where request.organization_id = (select id from n3uralia)
      and request.title like 'Evidencia de eliminación — %'
      and request.status in ('open', 'submitted', 'under_review', 'changes_requested')
  ),
  'demonstratedDeletions', (
    select count(*)
    from public.evidence_requests request
    where request.organization_id = (select id from n3uralia)
      and request.title like 'Evidencia de eliminación — %'
      and request.status = 'accepted'
      and request.submitted_evidence_id is not null
  ),
  'details', (
    select jsonb_agg(jsonb_build_object(
      'processId', activity.id,
      'code', activity.code,
      'name', activity.name,
      'mappingStatus', activity.attributes ->> 'privacyNoticeMappingStatus',
      'mappingEvidenceId', activity.attributes ->> 'privacyNoticeMappingEvidenceId',
      'snapshotHash', activity.attributes ->> 'privacyNoticeMappingSnapshotHash',
      'unknownCount', jsonb_array_length(activity.attributes -> 'privacyNoticeMappingUnknowns')
    ) order by activity.name)
    from activities activity
  )
) as verification;

rollback;
