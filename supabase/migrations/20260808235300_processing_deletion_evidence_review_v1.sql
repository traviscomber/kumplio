-- Block 16 closure: accept a controlled deletion/anonymization proof without
-- overstating lifecycle or legal sufficiency.
--
-- The RPC consumes the deletion evidence request created by
-- prepare_processing_activity_privacy_remediation_v1, creates an immutable
-- attestation snapshot, submits/reviews the request atomically and updates the
-- processing activity + mission with a demonstrated deletion status.

create or replace function public.accept_processing_deletion_evidence_v1(
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
  v_deletion_request_id uuid;
  v_mission_id uuid;
  v_request public.evidence_requests;
  v_method text := nullif(btrim(coalesce(p_payload ->> 'method', '')), '');
  v_provider text := nullif(btrim(coalesce(p_payload ->> 'provider', '')), '');
  v_asset text := nullif(btrim(coalesce(p_payload ->> 'assetOrDataset', '')), '');
  v_scope text := nullif(btrim(coalesce(p_payload ->> 'scope', '')), '');
  v_executor text := nullif(btrim(coalesce(p_payload ->> 'executor', '')), '');
  v_result text := nullif(btrim(coalesce(p_payload ->> 'result', '')), '');
  v_scheduled_ref text := nullif(btrim(coalesce(p_payload ->> 'backupPurgaProgramada', '')), '');
  v_confirmed_ref text := nullif(btrim(coalesce(p_payload ->> 'backupPurgaConfirmada', '')), '');
  v_executed_at timestamptz;
  v_source_refs jsonb := coalesce(p_payload -> 'sourceRefs', '[]'::jsonb);
  v_review_note text := btrim(coalesce(p_payload ->> 'reviewNote', ''));
  v_snapshot jsonb;
  v_snapshot_hash text;
  v_existing_evidence_id uuid;
  v_existing_hash text;
  v_existing_request_key text;
  v_evidence_id uuid;
  v_source_label text;
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
    raise exception using errcode = '22023', message = 'Deletion evidence request key is required';
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

  select review.project_id, review.case_id, review.control_id
  into v_project_id, v_case_id, v_control_id
  from public.processing_activity_reviews review
  where review.organization_id = p_organization_id
    and review.process_id = p_process_id
  order by review.reviewed_at desc, review.created_at desc
  limit 1;

  if v_project_id is null then
    raise exception using errcode = '23514', message = 'A reviewed inventory record is required before deletion evidence';
  end if;

  begin
    v_deletion_request_id := (v_process.attributes ->> 'deletionEvidenceRequestId')::uuid;
    v_mission_id := (v_process.attributes ->> 'privacyRemediationMissionId')::uuid;
  exception when others then
    raise exception using errcode = '23514', message = 'Privacy remediation references are invalid';
  end;

  if v_deletion_request_id is null or v_mission_id is null then
    raise exception using errcode = '23514', message = 'Privacy remediation plan must exist before deletion evidence';
  end if;

  select request.*
  into v_request
  from public.evidence_requests request
  where request.id = v_deletion_request_id
    and request.organization_id = p_organization_id
    and request.project_id = v_project_id
    and request.case_id is not distinct from v_case_id
    and request.control_id is not distinct from v_control_id
    and request.title like 'Evidencia de eliminación — %'
  for update;

  if v_request.id is null then
    raise exception using errcode = '23514', message = 'Deletion evidence request is missing or outside the activity scope';
  end if;

  if coalesce((p_payload ->> 'deletionReviewed')::boolean, false) is not true
     or coalesce((p_payload ->> 'noPersonalDataConfirmed')::boolean, false) is not true then
    raise exception using errcode = '22023', message = 'Deletion execution and evidence minimization must be explicitly confirmed';
  end if;

  if v_method not in ('deletion', 'anonymization') then
    raise exception using errcode = '22023', message = 'Deletion proof method must be deletion or anonymization';
  end if;

  if v_provider is null or v_asset is null or v_scope is null or v_executor is null
     or v_result is null or v_scheduled_ref is null or v_confirmed_ref is null then
    raise exception using errcode = '22023', message = 'Deletion proof requires provider, asset, scope, executor, result and purge references';
  end if;

  if char_length(v_scope) < 20 or char_length(v_result) < 20 then
    raise exception using errcode = '22023', message = 'Deletion scope and result require auditable detail';
  end if;

  if v_scheduled_ref = v_confirmed_ref then
    raise exception using errcode = '23514', message = 'Scheduled and confirmed purge references must be distinct';
  end if;

  begin
    v_executed_at := (p_payload ->> 'executedAt')::timestamptz;
  exception when others then
    raise exception using errcode = '22023', message = 'Deletion execution timestamp is invalid';
  end;

  if v_executed_at is null or v_executed_at > now() + interval '5 minutes' then
    raise exception using errcode = '22023', message = 'Deletion execution timestamp must describe an executed control';
  end if;

  if jsonb_typeof(v_source_refs) <> 'array' or jsonb_array_length(v_source_refs) < 2 then
    raise exception using errcode = '22023', message = 'At least two deletion proof sources are required';
  end if;

  if not exists (
    select 1 from jsonb_array_elements(v_source_refs) source_ref
    where source_ref ->> 'type' = 'backup_purga_programada'
  ) or not exists (
    select 1 from jsonb_array_elements(v_source_refs) source_ref
    where source_ref ->> 'type' = 'backup_purga_confirmada'
  ) then
    raise exception using errcode = '22023', message = 'Scheduled and confirmed purge sources are required';
  end if;

  if exists (
    select 1 from jsonb_array_elements(v_source_refs) source_ref
    where nullif(btrim(coalesce(source_ref ->> 'label', '')), '') is null
       or nullif(btrim(coalesce(source_ref ->> 'reference', '')), '') is null
  ) then
    raise exception using errcode = '22023', message = 'Every deletion proof source requires label and reference';
  end if;

  if char_length(v_review_note) < 30 or char_length(v_review_note) > 1800 then
    raise exception using errcode = '22023', message = 'Deletion evidence review note must contain between 30 and 1800 characters';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_organization_id::text || ':processing-deletion-evidence:' || p_process_id::text,
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
    'method', v_method,
    'executedAt', v_executed_at,
    'provider', v_provider,
    'assetOrDataset', v_asset,
    'scope', v_scope,
    'executor', v_executor,
    'result', v_result,
    'backupPurgaProgramada', v_scheduled_ref,
    'backupPurgaConfirmada', v_confirmed_ref,
    'sourceRefs', v_source_refs,
    'reviewNote', v_review_note,
    'noPersonalDataConfirmed', true
  );

  v_snapshot_hash := pg_catalog.encode(extensions.digest(v_snapshot::text, 'sha256'), 'hex');

  select evidence.id, evidence.integrity_hash, evidence.metadata ->> 'processingDeletionEvidenceRequestKey'
  into v_existing_evidence_id, v_existing_hash, v_existing_request_key
  from public.evidence evidence
  where evidence.organization_id = p_organization_id
    and evidence.project_id = v_project_id
    and evidence.metadata ->> 'scope' = 'processing_deletion_execution'
    and evidence.metadata ->> 'processId' = p_process_id::text
  order by evidence.created_at
  limit 1
  for update;

  if v_existing_evidence_id is not null then
    if v_existing_hash is distinct from v_snapshot_hash then
      raise exception using errcode = '23514', message = 'Deletion evidence already exists with different content for this activity';
    end if;

    if v_request.status <> 'accepted' or v_request.submitted_evidence_id is distinct from v_existing_evidence_id then
      raise exception using errcode = '23514', message = 'Existing deletion evidence is not consistently accepted';
    end if;

    return jsonb_build_object(
      'requestKey', coalesce(v_existing_request_key, p_request_key::text),
      'processId', p_process_id,
      'evidenceRequestId', v_deletion_request_id,
      'evidenceId', v_existing_evidence_id,
      'method', v_method,
      'snapshotHash', v_snapshot_hash,
      'resumed', true
    );
  end if;

  if v_request.status not in ('open', 'changes_requested') then
    raise exception using errcode = '23514', message = 'Deletion evidence request cannot accept a new submission in its current state';
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
    'Prueba de ' || case when v_method = 'anonymization' then 'anonimización' else 'eliminación' end || ' — ' || v_process.name,
    'Snapshot revisado que acredita una ejecución controlada de eliminación o anonimización para esta actividad. No resuelve por sí solo base jurídica, retención ni suficiencia integral del lifecycle.',
    'attestation',
    v_source_label,
    null,
    v_executed_at,
    v_executed_at::date,
    v_executed_at::date,
    now() + interval '90 days',
    v_snapshot_hash,
    'restricted',
    v_control_id
  ) into v_evidence_id;

  update public.evidence evidence
  set validation_status = 'accepted',
      integrity_status = 'verified',
      metadata = coalesce(evidence.metadata, '{}'::jsonb) || jsonb_build_object(
        'scope', 'processing_deletion_execution',
        'processingDeletionEvidenceRequestKey', p_request_key,
        'processId', p_process_id,
        'method', v_method,
        'executedAt', v_executed_at,
        'provider', v_provider,
        'assetOrDataset', v_asset,
        'snapshotHash', v_snapshot_hash,
        'snapshot', v_snapshot,
        'deletionEvidence', true,
        'personalDataIncluded', false,
        'legalBasisValidated', false,
        'retentionValidated', false,
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
    p_actor_id, p_organization_id, v_deletion_request_id, v_evidence_id,
    'Prueba controlada de eliminación o anonimización entregada con referencias de purga.'
  );

  perform public.review_evidence_request_record(
    p_actor_id, p_organization_id, v_deletion_request_id, 'accepted', v_review_note
  );

  update public.organization_processes process
  set attributes = coalesce(process.attributes, '{}'::jsonb) || jsonb_build_object(
        'deletionEvidenceStatus', 'demonstrated',
        'deletionEvidenceId', v_evidence_id,
        'deletionEvidenceRequestKey', p_request_key,
        'deletionEvidenceSnapshotHash', v_snapshot_hash,
        'deletionEvidenceMethod', v_method,
        'deletionExecutedAt', v_executed_at
      ),
      updated_at = now()
  where process.id = p_process_id
    and process.organization_id = p_organization_id;

  update public.missions mission
  set metadata = coalesce(mission.metadata, '{}'::jsonb) || jsonb_build_object(
        'deletionEvidenceStatus', 'demonstrated',
        'deletionEvidenceId', v_evidence_id,
        'deletionEvidenceSnapshotHash', v_snapshot_hash,
        'deletionEvidenceMethod', v_method,
        'deletionEvidenceAcceptedAt', now()
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
      'processing_deletion_evidence_accepted',
      'Prueba de eliminación o anonimización aceptada',
      jsonb_build_object(
        'process_id', p_process_id,
        'request_key', p_request_key,
        'request_id', v_deletion_request_id,
        'evidence_id', v_evidence_id,
        'method', v_method,
        'executed_at', v_executed_at,
        'snapshot_hash', v_snapshot_hash
      )
    );
    v_event_created := true;
  end if;

  return jsonb_build_object(
    'requestKey', p_request_key,
    'processId', p_process_id,
    'evidenceRequestId', v_deletion_request_id,
    'evidenceId', v_evidence_id,
    'method', v_method,
    'snapshotHash', v_snapshot_hash,
    'eventCreated', v_event_created,
    'resumed', false
  );
end;
$function$;

revoke all on function public.accept_processing_deletion_evidence_v1(
  uuid, uuid, uuid, uuid, jsonb
) from public, anon, authenticated;

grant execute on function public.accept_processing_deletion_evidence_v1(
  uuid, uuid, uuid, uuid, jsonb
) to service_role, postgres;
