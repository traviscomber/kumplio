-- Block 16 closure: accept the mapping exercise without overstating notice sufficiency.
--
-- The request is accepted because the mapping matrix, sources and limits were
-- reviewed. Control sufficiency remains partial while gaps or unknowns remain.

create or replace function public.accept_processing_notice_mapping_v1(
  p_actor_id uuid,
  p_organization_id uuid,
  p_process_id uuid,
  p_request_key uuid,
  p_payload jsonb
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
  v_lifecycle_snapshot_hash text;
  v_notice_evidence_id uuid;
  v_notice_request_id uuid;
  v_mission_id uuid;
  v_notice_version text := nullif(btrim(coalesce(p_payload ->> 'noticeVersion', '')), '');
  v_mapping_status text := coalesce(nullif(btrim(p_payload ->> 'mappingStatus'), ''), 'accepted_with_gaps');
  v_mapped_scopes jsonb := coalesce(p_payload -> 'mappedScopes', '[]'::jsonb);
  v_dimensions jsonb := coalesce(p_payload -> 'dimensions', '{}'::jsonb);
  v_source_refs jsonb := coalesce(p_payload -> 'sourceRefs', '[]'::jsonb);
  v_review_note text := btrim(coalesce(p_payload ->> 'reviewNote', ''));
  v_unknowns text[];
  v_notice_hash text;
  v_request public.evidence_requests;
  v_existing_evidence_id uuid;
  v_existing_hash text;
  v_existing_request_key text;
  v_snapshot jsonb;
  v_snapshot_hash text;
  v_evidence_id uuid;
  v_source_label text;
  v_non_final_count integer := 0;
  v_event_created boolean := false;
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
      and member.role in ('owner', 'admin', 'compliance')
  ) then
    raise exception using errcode = '42501', message = 'Owner, admin or compliance membership required';
  end if;

  if p_request_key is null then
    raise exception using errcode = '22023', message = 'Notice mapping request key is required';
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
    raise exception using errcode = '23514', message = 'A reviewed inventory record is required before notice mapping';
  end if;

  select review.id, review.snapshot_hash
  into v_lifecycle_review_id, v_lifecycle_snapshot_hash
  from public.processing_activity_lifecycle_reviews review
  where review.organization_id = p_organization_id
    and review.process_id = p_process_id
  order by review.version desc
  limit 1;

  if v_lifecycle_review_id is null then
    raise exception using errcode = '23514', message = 'Lifecycle review is required before notice mapping';
  end if;

  begin
    v_notice_evidence_id := (v_process.attributes ->> 'privacyNoticeEvidenceId')::uuid;
    v_notice_request_id := (v_process.attributes ->> 'privacyNoticeRequestId')::uuid;
    v_mission_id := (v_process.attributes ->> 'privacyRemediationMissionId')::uuid;
  exception when others then
    raise exception using errcode = '23514', message = 'Privacy remediation references are invalid';
  end;

  if v_notice_evidence_id is null or v_notice_request_id is null or v_mission_id is null then
    raise exception using errcode = '23514', message = 'Privacy remediation plan must exist before notice mapping';
  end if;

  select evidence.integrity_hash
  into v_notice_hash
  from public.evidence evidence
  where evidence.id = v_notice_evidence_id
    and evidence.organization_id = p_organization_id
    and evidence.project_id = v_project_id
    and evidence.validation_status = 'accepted'
    and evidence.integrity_status = 'verified'
    and evidence.metadata ->> 'scope' = 'public_privacy_notice'
    and evidence.metadata ->> 'privacyNoticeVersion' = v_notice_version;

  if v_notice_hash is null or v_notice_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '23514', message = 'Accepted and verified public notice evidence is required';
  end if;

  select request.*
  into v_request
  from public.evidence_requests request
  where request.id = v_notice_request_id
    and request.organization_id = p_organization_id
    and request.project_id = v_project_id
    and request.case_id is not distinct from v_case_id
    and request.control_id is not distinct from v_control_id
    and request.title like 'Aviso aplicable y mapeado — %'
  for update;

  if v_request.id is null then
    raise exception using errcode = '23514', message = 'Notice mapping evidence request is missing or outside the activity scope';
  end if;

  if v_notice_version is null or v_notice_version is distinct from v_process.attributes ->> 'privacyNoticeVersion' then
    raise exception using errcode = '23514', message = 'Notice mapping version must match the linked public notice';
  end if;

  if v_mapping_status not in ('accepted_with_gaps', 'accepted_complete') then
    raise exception using errcode = '22023', message = 'Invalid notice mapping status';
  end if;

  if coalesce((p_payload ->> 'mappingReviewed')::boolean, false) is not true
     or coalesce((p_payload ->> 'limitationsConfirmed')::boolean, false) is not true then
    raise exception using errcode = '22023', message = 'Notice mapping and its limitations must be explicitly confirmed';
  end if;

  if jsonb_typeof(v_mapped_scopes) <> 'array' or jsonb_array_length(v_mapped_scopes) = 0 then
    raise exception using errcode = '22023', message = 'At least one mapped notice scope is required';
  end if;

  if jsonb_typeof(v_dimensions) <> 'object'
     or jsonb_typeof(v_source_refs) <> 'array'
     or jsonb_array_length(v_source_refs) < 2 then
    raise exception using errcode = '22023', message = 'Mapping dimensions and at least two sources are required';
  end if;

  if char_length(v_review_note) < 30 or char_length(v_review_note) > 1800 then
    raise exception using errcode = '22023', message = 'Notice mapping review note must contain between 30 and 1800 characters';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_mapped_scopes) scope_item
    where nullif(btrim(coalesce(scope_item ->> 'scope', '')), '') is null
       or nullif(btrim(coalesce(scope_item ->> 'note', '')), '') is null
       or coalesce(scope_item ->> 'status', '') not in ('covered', 'partial', 'not_covered', 'not_applicable')
  ) then
    raise exception using errcode = '22023', message = 'Mapped scopes require scope, note and a valid status';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(v_mapped_scopes) scope_item
    where scope_item ->> 'status' in ('covered', 'partial')
  ) then
    raise exception using errcode = '22023', message = 'The mapping must identify at least one applicable notice scope';
  end if;

  if exists (
    select 1
    from jsonb_each(v_dimensions) dimension
    where jsonb_typeof(dimension.value) <> 'object'
       or coalesce(dimension.value ->> 'status', '') not in ('covered', 'partial', 'not_covered', 'not_applicable')
       or nullif(btrim(coalesce(dimension.value ->> 'note', '')), '') is null
  ) then
    raise exception using errcode = '22023', message = 'Every mapping dimension requires a valid status and note';
  end if;

  if not (v_dimensions ?& array['purpose','dataSubjects','dataCategories','recipients','rights','transfers','retention']) then
    raise exception using errcode = '22023', message = 'All notice mapping dimensions are required';
  end if;

  if not exists (
    select 1 from jsonb_array_elements(v_source_refs) source_ref
    where source_ref ->> 'type' = 'public_notice'
  ) or not exists (
    select 1 from jsonb_array_elements(v_source_refs) source_ref
    where source_ref ->> 'type' = 'lifecycle_review'
  ) then
    raise exception using errcode = '22023', message = 'Public notice and lifecycle review sources are required';
  end if;

  select coalesce(array_agg(value order by value), '{}'::text[])
  into v_unknowns
  from (
    select distinct btrim(item.value) as value
    from jsonb_array_elements_text(coalesce(p_payload -> 'unknowns', '[]'::jsonb)) item(value)
    where btrim(item.value) <> ''
  ) normalized;

  select count(*)
  into v_non_final_count
  from (
    select scope_item ->> 'status' as status
    from jsonb_array_elements(v_mapped_scopes) scope_item
    union all
    select dimension.value ->> 'status'
    from jsonb_each(v_dimensions) dimension
  ) statuses
  where status not in ('covered', 'not_applicable');

  if v_mapping_status = 'accepted_complete' and (
    cardinality(v_unknowns) > 0 or v_non_final_count > 0
  ) then
    raise exception using errcode = '23514', message = 'Complete mapping cannot retain gaps or unknowns';
  end if;

  if v_mapping_status = 'accepted_with_gaps' and (
    cardinality(v_unknowns) = 0 or v_non_final_count = 0
  ) then
    raise exception using errcode = '23514', message = 'Mapping with gaps must preserve explicit gaps and unknowns';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_organization_id::text || ':processing-notice-mapping:' || p_process_id::text || ':' || v_notice_version,
      21719
    )
  );

  v_snapshot := jsonb_build_object(
    'schemaVersion', 1,
    'requestKey', p_request_key,
    'organizationId', p_organization_id,
    'projectId', v_project_id,
    'caseId', v_case_id,
    'controlId', v_control_id,
    'processId', p_process_id,
    'processCode', v_process.code,
    'processName', v_process.name,
    'noticeVersion', v_notice_version,
    'noticeEvidenceId', v_notice_evidence_id,
    'noticeHash', v_notice_hash,
    'lifecycleReviewId', v_lifecycle_review_id,
    'lifecycleSnapshotHash', v_lifecycle_snapshot_hash,
    'mappingStatus', v_mapping_status,
    'primaryScope', nullif(btrim(coalesce(p_payload ->> 'primaryScope', '')), ''),
    'mappedScopes', v_mapped_scopes,
    'dimensions', v_dimensions,
    'sourceRefs', v_source_refs,
    'unknowns', to_jsonb(v_unknowns),
    'reviewNote', v_review_note,
    'limitationsConfirmed', true
  );
  v_snapshot_hash := pg_catalog.encode(extensions.digest(v_snapshot::text, 'sha256'), 'hex');

  select evidence.id, evidence.integrity_hash, evidence.metadata ->> 'processingNoticeMappingRequestKey'
  into v_existing_evidence_id, v_existing_hash, v_existing_request_key
  from public.evidence evidence
  where evidence.organization_id = p_organization_id
    and evidence.project_id = v_project_id
    and evidence.metadata ->> 'scope' = 'processing_notice_mapping_review'
    and evidence.metadata ->> 'processId' = p_process_id::text
    and evidence.metadata ->> 'noticeVersion' = v_notice_version
  order by evidence.created_at
  limit 1
  for update;

  if v_existing_evidence_id is not null then
    if v_existing_hash is distinct from v_snapshot_hash then
      raise exception using errcode = '23514', message = 'Notice mapping already exists with different content for this activity and notice version';
    end if;

    if v_request.status <> 'accepted' or v_request.submitted_evidence_id is distinct from v_existing_evidence_id then
      raise exception using errcode = '23514', message = 'Existing notice mapping evidence is not consistently accepted';
    end if;

    return jsonb_build_object(
      'requestKey', coalesce(v_existing_request_key, p_request_key::text),
      'processId', p_process_id,
      'evidenceRequestId', v_notice_request_id,
      'evidenceId', v_existing_evidence_id,
      'mappingStatus', v_mapping_status,
      'snapshotHash', v_snapshot_hash,
      'unknownCount', cardinality(v_unknowns),
      'resumed', true
    );
  end if;

  if v_request.status not in ('open', 'changes_requested') then
    raise exception using errcode = '23514', message = 'Notice mapping request cannot accept a new submission in its current state';
  end if;

  select string_agg(
    coalesce(source_ref ->> 'label', 'Fuente revisada'),
    ' · ' order by coalesce(source_ref ->> 'label', '')
  )
  into v_source_label
  from jsonb_array_elements(v_source_refs) source_ref;

  select public.create_evidence_record(
    p_actor_id,
    p_organization_id,
    v_project_id,
    'Mapeo del aviso de privacidad — ' || v_process.name,
    'Snapshot revisado que acredita el ejercicio de mapeo del aviso y conserva sus brechas. No acredita cumplimiento integral, eliminación ni validación jurídica de lifecycle.',
    'attestation',
    v_source_label,
    null,
    now(),
    current_date,
    current_date,
    now() + interval '90 days',
    v_snapshot_hash,
    'restricted',
    v_control_id
  ) into v_evidence_id;

  update public.evidence evidence
  set validation_status = 'accepted',
      integrity_status = 'verified',
      metadata = coalesce(evidence.metadata, '{}'::jsonb) || jsonb_build_object(
        'scope', 'processing_notice_mapping_review',
        'processingNoticeMappingRequestKey', p_request_key,
        'processId', p_process_id,
        'noticeVersion', v_notice_version,
        'mappingStatus', v_mapping_status,
        'unknownCount', cardinality(v_unknowns),
        'snapshotHash', v_snapshot_hash,
        'snapshot', v_snapshot,
        'activitySpecificMapping', true,
        'noticeSufficiencyValidated', v_mapping_status = 'accepted_complete',
        'legalBasisValidated', false,
        'retentionValidated', false,
        'deletionEvidence', false,
        'limitationsPreserved', true
      ),
      updated_at = now()
  where evidence.id = v_evidence_id
    and evidence.organization_id = p_organization_id;

  insert into public.processing_activity_evidence (
    organization_id, project_id, process_id, evidence_id, relationship_type, linked_by
  ) values (
    p_organization_id, v_project_id, p_process_id, v_evidence_id, 'supporting', p_actor_id
  ) on conflict do nothing;

  perform public.submit_evidence_request_record(
    p_actor_id, p_organization_id, v_notice_request_id, v_evidence_id,
    'Mapeo estructurado entregado con brechas y fuentes explícitas.'
  );

  perform public.review_evidence_request_record(
    p_actor_id, p_organization_id, v_notice_request_id, 'accepted', v_review_note
  );

  if v_mapping_status = 'accepted_with_gaps' and v_control_id is not null then
    update public.control_evidence link
    set sufficiency_status = 'partial',
        note = 'Mapeo del aviso aceptado como evidencia parcial; conserva brechas jurídicas y operacionales.',
        reviewed_by = p_actor_id,
        reviewed_at = now()
    where link.organization_id = p_organization_id
      and link.project_id = v_project_id
      and link.control_id = v_control_id
      and link.evidence_id = v_evidence_id;
  end if;

  update public.organization_processes process
  set attributes = coalesce(process.attributes, '{}'::jsonb) || jsonb_build_object(
        'privacyNoticeMappingStatus', v_mapping_status,
        'privacyNoticeMappingEvidenceId', v_evidence_id,
        'privacyNoticeMappingRequestKey', p_request_key,
        'privacyNoticeMappingSnapshotHash', v_snapshot_hash,
        'privacyNoticeMappingUnknowns', to_jsonb(v_unknowns),
        'privacyNoticeMappedAt', now()
      ),
      updated_at = now()
  where process.id = p_process_id
    and process.organization_id = p_organization_id;

  update public.missions mission
  set metadata = coalesce(mission.metadata, '{}'::jsonb) || jsonb_build_object(
        'noticeMappingStatus', v_mapping_status,
        'noticeMappingEvidenceId', v_evidence_id,
        'noticeMappingSnapshotHash', v_snapshot_hash,
        'noticeMappingUnknownCount', cardinality(v_unknowns),
        'noticeMappingAcceptedAt', now()
      ),
      updated_at = now()
  where mission.id = v_mission_id
    and mission.organization_id = p_organization_id;

  if v_case_id is not null then
    insert into public.compliance_case_events (
      organization_id, case_id, actor_id, event_type, summary, changes
    ) values (
      p_organization_id,
      v_case_id,
      p_actor_id,
      'processing_notice_mapping_accepted',
      'Mapeo del aviso aceptado con límites explícitos',
      jsonb_build_object(
        'process_id', p_process_id,
        'request_key', p_request_key,
        'request_id', v_notice_request_id,
        'evidence_id', v_evidence_id,
        'notice_version', v_notice_version,
        'mapping_status', v_mapping_status,
        'snapshot_hash', v_snapshot_hash,
        'unknown_count', cardinality(v_unknowns)
      )
    );
    v_event_created := true;
  end if;

  return jsonb_build_object(
    'requestKey', p_request_key,
    'processId', p_process_id,
    'evidenceRequestId', v_notice_request_id,
    'evidenceId', v_evidence_id,
    'mappingStatus', v_mapping_status,
    'snapshotHash', v_snapshot_hash,
    'unknownCount', cardinality(v_unknowns),
    'eventCreated', v_event_created,
    'resumed', false
  );
end;
$function$;

revoke all on function public.accept_processing_notice_mapping_v1(
  uuid, uuid, uuid, uuid, jsonb
) from public, anon, authenticated;

grant execute on function public.accept_processing_notice_mapping_v1(
  uuid, uuid, uuid, uuid, jsonb
) to service_role, postgres;
