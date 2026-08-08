-- Block 16 task 3: attach the current public privacy notice and turn every
-- missing notice mapping or deletion proof into existing Kumplio work objects.
--
-- This migration deliberately reuses missions, evidence requests and evidence;
-- it does not create a parallel task system.

create or replace function public.prepare_processing_activity_privacy_remediation_v1(
  p_actor_id uuid,
  p_organization_id uuid,
  p_process_id uuid,
  p_request_key uuid,
  p_notice_snapshot jsonb,
  p_notice_due_at timestamptz,
  p_deletion_due_at timestamptz,
  p_mission_due_at timestamptz
)
returns jsonb
language plpgsql
set search_path to ''
as $function$
declare
  v_process public.organization_processes;
  v_project_id uuid;
  v_case_id uuid;
  v_control_id uuid;
  v_lifecycle_review_id uuid;
  v_playbook_id uuid;
  v_notice_version text := nullif(btrim(coalesce(p_notice_snapshot ->> 'version', '')), '');
  v_notice_effective_date date;
  v_notice_hash text;
  v_notice_evidence_id uuid;
  v_existing_notice_hash text;
  v_mission_id uuid;
  v_existing_mission_process_id text;
  v_existing_mission_notice_version text;
  v_existing_mission_request_key text;
  v_effective_request_key text := p_request_key::text;
  v_notice_request_id uuid;
  v_deletion_request_id uuid;
  v_notice_title text;
  v_deletion_title text;
  v_remediation_title text;
  v_notice_link_count bigint := 0;
  v_event_created boolean := false;
  v_notice_created boolean := false;
  v_notice_link_created boolean := false;
  v_mission_created boolean := false;
  v_notice_request_created boolean := false;
  v_deletion_request_created boolean := false;
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  if p_request_key is null then
    raise exception using errcode = '22023', message = 'Privacy remediation request key is required';
  end if;

  select process.*
  into v_process
  from public.organization_processes process
  where process.id = p_process_id
    and process.organization_id = p_organization_id
    and process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired';

  if v_process.id is null then
    raise exception using errcode = '23514', message = 'Processing activity must belong to the organization';
  end if;

  if v_process.owner_user_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = v_process.owner_user_id
  ) then
    raise exception using errcode = '23514', message = 'Processing activity requires an accountable owner';
  end if;

  select review.project_id, review.case_id, review.control_id
  into v_project_id, v_case_id, v_control_id
  from public.processing_activity_reviews review
  where review.organization_id = p_organization_id
    and review.process_id = p_process_id
  order by review.reviewed_at desc, review.created_at desc
  limit 1;

  if v_project_id is null then
    raise exception using errcode = '23514', message = 'A reviewed inventory record and project are required';
  end if;

  select review.id
  into v_lifecycle_review_id
  from public.processing_activity_lifecycle_reviews review
  where review.organization_id = p_organization_id
    and review.process_id = p_process_id
  order by review.version desc
  limit 1;

  if v_lifecycle_review_id is null then
    raise exception using errcode = '23514', message = 'Lifecycle review is required before privacy remediation';
  end if;

  select playbook.id
  into v_playbook_id
  from public.mission_playbooks playbook
  where playbook.slug = 'preparar-ley-21719'
    and playbook.status = 'published'
  limit 1;

  if v_playbook_id is null then
    raise exception using errcode = '23514', message = 'Published privacy remediation playbook is required';
  end if;

  if v_notice_version is null
     or p_notice_snapshot ->> 'route' <> '/privacy'
     or nullif(btrim(coalesce(p_notice_snapshot ->> 'title', '')), '') is null
     or nullif(btrim(coalesce(p_notice_snapshot ->> 'contact', '')), '') is null
     or jsonb_typeof(coalesce(p_notice_snapshot -> 'scopes', 'null'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_notice_snapshot -> 'limitations', 'null'::jsonb)) <> 'array' then
    raise exception using errcode = '22023', message = 'A complete versioned privacy notice snapshot is required';
  end if;

  begin
    v_notice_effective_date := (p_notice_snapshot ->> 'effectiveDate')::date;
  exception when others then
    raise exception using errcode = '22023', message = 'Privacy notice effective date is invalid';
  end;

  if p_notice_due_at is null or p_deletion_due_at is null or p_mission_due_at is null
     or p_notice_due_at <= now()
     or p_deletion_due_at <= p_notice_due_at
     or p_mission_due_at < p_deletion_due_at then
    raise exception using errcode = '22023', message = 'Privacy remediation due dates are invalid';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_organization_id::text || ':processing-privacy-remediation-request:' || p_request_key::text,
      21719
    )
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_organization_id::text || ':processing-privacy-remediation:' || p_process_id::text,
      21719
    )
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_organization_id::text || ':public-privacy-notice:' || v_project_id::text || ':' || v_notice_version,
      21719
    )
  );

  v_notice_hash := pg_catalog.encode(extensions.digest(p_notice_snapshot::text, 'sha256'), 'hex');

  select evidence.id, evidence.integrity_hash
  into v_notice_evidence_id, v_existing_notice_hash
  from public.evidence evidence
  where evidence.organization_id = p_organization_id
    and evidence.project_id = v_project_id
    and evidence.metadata ->> 'scope' = 'public_privacy_notice'
    and evidence.metadata ->> 'privacyNoticeVersion' = v_notice_version
  order by evidence.created_at
  limit 1
  for update;

  if v_notice_evidence_id is null then
    select public.create_evidence_record(
      p_actor_id,
      p_organization_id,
      v_project_id,
      'Aviso de privacidad público — versión ' || v_notice_version,
      'Snapshot del aviso público general. Acredita la versión visible y su contenido declarado, no el mapeo suficiente de cada actividad ni la eliminación operativa.',
      'document',
      coalesce(p_notice_snapshot ->> 'publicUrl', '/privacy'),
      null,
      v_notice_effective_date::timestamptz,
      v_notice_effective_date,
      v_notice_effective_date,
      v_notice_effective_date::timestamptz + interval '1 year',
      v_notice_hash,
      'internal',
      null
    ) into v_notice_evidence_id;

    v_notice_created := true;
  elsif v_existing_notice_hash is distinct from v_notice_hash then
    raise exception using errcode = '23514', message = 'Privacy notice version already exists with a different snapshot';
  end if;

  update public.evidence
  set validation_status = 'accepted',
      integrity_status = 'verified',
      integrity_hash = v_notice_hash,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'scope', 'public_privacy_notice',
        'privacyNoticeVersion', v_notice_version,
        'privacyNoticeSnapshot', p_notice_snapshot,
        'snapshotHash', v_notice_hash,
        'activitySpecificMapping', false,
        'deletionEvidence', false,
        'limitationsPreserved', true
      ),
      updated_at = now()
  where id = v_notice_evidence_id
    and organization_id = p_organization_id;

  insert into public.processing_activity_evidence (
    organization_id,
    project_id,
    process_id,
    evidence_id,
    relationship_type,
    linked_by
  ) values (
    p_organization_id,
    v_project_id,
    p_process_id,
    v_notice_evidence_id,
    'supporting',
    p_actor_id
  )
  on conflict do nothing;

  get diagnostics v_notice_link_count = row_count;
  v_notice_link_created := v_notice_link_count > 0;

  v_remediation_title := left('Cerrar aviso y eliminación — ' || v_process.name, 180);
  v_notice_title := left('Aviso aplicable y mapeado — ' || v_process.name || ' (' || v_process.code || ')', 180);
  v_deletion_title := left('Evidencia de eliminación — ' || v_process.name || ' (' || v_process.code || ')', 180);

  select
    mission.id,
    mission.metadata ->> 'processingActivityId',
    mission.metadata ->> 'privacyNoticeVersion',
    mission.metadata ->> 'processingPrivacyRemediationKey'
  into
    v_mission_id,
    v_existing_mission_process_id,
    v_existing_mission_notice_version,
    v_existing_mission_request_key
  from public.missions mission
  where mission.organization_id = p_organization_id
    and mission.metadata ->> 'source' = 'processing_privacy_and_deletion_remediation'
    and (
      mission.metadata ->> 'processingPrivacyRemediationKey' = p_request_key::text
      or (
        mission.metadata ->> 'processingActivityId' = p_process_id::text
        and mission.metadata ->> 'privacyNoticeVersion' = v_notice_version
      )
    )
  order by
    case when mission.metadata ->> 'processingPrivacyRemediationKey' = p_request_key::text then 0 else 1 end,
    mission.created_at
  limit 1
  for update;

  if v_mission_id is not null and (
    v_existing_mission_process_id is distinct from p_process_id::text
    or v_existing_mission_notice_version is distinct from v_notice_version
  ) then
    raise exception using errcode = '23514', message = 'Privacy remediation request key already belongs to another activity or notice version';
  end if;

  if v_mission_id is null then
    select public.create_mission_from_playbook(
      p_organization_id,
      v_playbook_id,
      p_actor_id,
      v_remediation_title,
      'Mapear el aviso público al tratamiento, resolver sus brechas y demostrar una eliminación trazable o documentar por qué todavía no puede cerrarse.',
      null,
      'high',
      v_process.owner_user_id,
      p_mission_due_at,
      jsonb_build_object(
        'source', 'processing_privacy_and_deletion_remediation',
        'processingPrivacyRemediationKey', p_request_key,
        'processingActivityId', p_process_id,
        'processingActivityName', v_process.name,
        'lifecycleReviewId', v_lifecycle_review_id,
        'projectId', v_project_id,
        'caseId', v_case_id,
        'controlId', v_control_id,
        'privacyNoticeEvidenceId', v_notice_evidence_id,
        'privacyNoticeVersion', v_notice_version,
        'noticeMappingStatus', 'needs_changes',
        'deletionEvidenceStatus', 'pending_evidence'
      )
    ) into v_mission_id;

    v_existing_mission_request_key := p_request_key::text;
    v_mission_created := true;
  end if;

  v_effective_request_key := coalesce(v_existing_mission_request_key, p_request_key::text);

  select request.id
  into v_notice_request_id
  from public.evidence_requests request
  where request.organization_id = p_organization_id
    and request.project_id = v_project_id
    and request.case_id is not distinct from v_case_id
    and request.control_id is not distinct from v_control_id
    and request.title = v_notice_title
  order by request.created_at
  limit 1
  for update;

  if v_notice_request_id is null then
    select public.create_evidence_request_record(
      p_actor_id,
      p_organization_id,
      v_project_id,
      v_case_id,
      v_control_id,
      v_notice_title,
      'Revisar el aviso público versión ' || v_notice_version || ' y entregar una matriz que demuestre qué finalidades, titulares, categorías, destinatarios, derechos y transferencias cubre esta actividad. Si el aviso no es suficiente, adjuntar la versión corregida y su aprobación.',
      v_process.owner_user_id,
      p_notice_due_at
    ) into v_notice_request_id;

    v_notice_request_created := true;
  end if;

  select request.id
  into v_deletion_request_id
  from public.evidence_requests request
  where request.organization_id = p_organization_id
    and request.project_id = v_project_id
    and request.case_id is not distinct from v_case_id
    and request.control_id is not distinct from v_control_id
    and request.title = v_deletion_title
  order by request.created_at
  limit 1
  for update;

  if v_deletion_request_id is null then
    select public.create_evidence_request_record(
      p_actor_id,
      p_organization_id,
      v_project_id,
      v_case_id,
      v_control_id,
      v_deletion_title,
      'Ejecutar una prueba controlada de eliminación o anonimización y adjuntar evidencia auditable: `backup_purga_programada` y `backup_purga_confirmada`, timestamp, proveedor, activo o dataset afectado, alcance, responsable persona/sistema y resultado. No incluir datos personales innecesarios en la evidencia.',
      v_process.owner_user_id,
      p_deletion_due_at
    ) into v_deletion_request_id;

    v_deletion_request_created := true;
  end if;

  update public.missions mission
  set metadata = coalesce(mission.metadata, '{}'::jsonb) || jsonb_build_object(
        'processingPrivacyRemediationKey', v_effective_request_key,
        'processingActivityId', p_process_id,
        'lifecycleReviewId', v_lifecycle_review_id,
        'projectId', v_project_id,
        'caseId', v_case_id,
        'controlId', v_control_id,
        'privacyNoticeEvidenceId', v_notice_evidence_id,
        'privacyNoticeVersion', v_notice_version,
        'privacyNoticeRequestId', v_notice_request_id,
        'deletionEvidenceRequestId', v_deletion_request_id,
        'noticeMappingStatus', 'needs_changes',
        'deletionEvidenceStatus', 'pending_evidence'
      ),
      updated_at = now()
  where mission.id = v_mission_id
    and mission.organization_id = p_organization_id;

  update public.organization_processes process
  set attributes = coalesce(process.attributes, '{}'::jsonb) || jsonb_build_object(
        'privacyNoticeEvidenceId', v_notice_evidence_id,
        'privacyNoticeVersion', v_notice_version,
        'privacyNoticeMappingStatus', 'needs_changes',
        'privacyRemediationMissionId', v_mission_id,
        'privacyNoticeRequestId', v_notice_request_id,
        'deletionEvidenceRequestId', v_deletion_request_id,
        'deletionEvidenceStatus', 'pending_evidence',
        'privacyRemediationDueAt', p_mission_due_at
      ),
      updated_at = now()
  where process.id = p_process_id
    and process.organization_id = p_organization_id;

  if v_case_id is not null and not exists (
    select 1
    from public.compliance_case_events event
    where event.organization_id = p_organization_id
      and event.case_id = v_case_id
      and event.event_type = 'processing_privacy_remediation_ready'
      and event.changes ->> 'process_id' = p_process_id::text
      and event.changes ->> 'privacy_notice_version' = v_notice_version
  ) then
    insert into public.compliance_case_events (
      organization_id,
      case_id,
      actor_id,
      event_type,
      summary,
      changes
    ) values (
      p_organization_id,
      v_case_id,
      p_actor_id,
      'processing_privacy_remediation_ready',
      'Aviso y eliminación convertidos en trabajo trazable',
      jsonb_build_object(
        'request_key', v_effective_request_key,
        'process_id', p_process_id,
        'lifecycle_review_id', v_lifecycle_review_id,
        'privacy_notice_evidence_id', v_notice_evidence_id,
        'privacy_notice_version', v_notice_version,
        'mission_id', v_mission_id,
        'notice_request_id', v_notice_request_id,
        'deletion_request_id', v_deletion_request_id,
        'notice_due_at', p_notice_due_at,
        'deletion_due_at', p_deletion_due_at,
        'mission_due_at', p_mission_due_at
      )
    );

    v_event_created := true;
  end if;

  return jsonb_build_object(
    'requestKey', v_effective_request_key,
    'processId', p_process_id,
    'lifecycleReviewId', v_lifecycle_review_id,
    'privacyNoticeEvidenceId', v_notice_evidence_id,
    'privacyNoticeVersion', v_notice_version,
    'missionId', v_mission_id,
    'privacyNoticeRequestId', v_notice_request_id,
    'deletionEvidenceRequestId', v_deletion_request_id,
    'noticeDueAt', p_notice_due_at,
    'deletionDueAt', p_deletion_due_at,
    'missionDueAt', p_mission_due_at,
    'created', jsonb_build_object(
      'privacyNoticeEvidence', v_notice_created,
      'privacyNoticeLink', v_notice_link_created,
      'mission', v_mission_created,
      'privacyNoticeRequest', v_notice_request_created,
      'deletionEvidenceRequest', v_deletion_request_created,
      'caseEvent', v_event_created
    ),
    'resumed', not (
      v_notice_created
      or v_notice_link_created
      or v_mission_created
      or v_notice_request_created
      or v_deletion_request_created
      or v_event_created
    )
  );
end;
$function$;

revoke all on function public.prepare_processing_activity_privacy_remediation_v1(
  uuid, uuid, uuid, uuid, jsonb, timestamptz, timestamptz, timestamptz
) from public, anon, authenticated;

grant execute on function public.prepare_processing_activity_privacy_remediation_v1(
  uuid, uuid, uuid, uuid, jsonb, timestamptz, timestamptz, timestamptz
) to service_role, postgres;
