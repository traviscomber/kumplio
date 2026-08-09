-- Block 16: formally review controlled deletion drills without overstating them
-- as operational deletion evidence.
--
-- A passed synthetic drill proves that the primary-database mechanism can remove
-- synthetic identifiers. It does NOT prove deletion of a real data subject,
-- backup purge, or propagation to external processors. The deletion evidence
-- request therefore remains open as changes_requested after this review.

create or replace function public.review_processing_controlled_deletion_drill_v1(
  p_actor_id uuid,
  p_organization_id uuid,
  p_process_id uuid,
  p_review_note text
)
returns jsonb
language plpgsql
set search_path to ''
as $function$
declare
  v_process public.organization_processes;
  v_request public.evidence_requests;
  v_evidence public.evidence;
  v_drill public.processing_deletion_drills;
  v_request_id uuid;
  v_evidence_id uuid;
  v_mission_id uuid;
  v_case_id uuid;
  v_control_id uuid;
  v_note text := btrim(coalesce(p_review_note, ''));
  v_before_hash text;
  v_after_hash text;
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

  if char_length(v_note) < 30 or char_length(v_note) > 1800 then
    raise exception using errcode = '22023', message = 'Controlled deletion drill review note must contain between 30 and 1800 characters';
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

  begin
    v_request_id := (v_process.attributes ->> 'deletionEvidenceRequestId')::uuid;
    v_evidence_id := (v_process.attributes ->> 'controlledDeletionEvidenceId')::uuid;
    v_mission_id := nullif(v_process.attributes ->> 'privacyRemediationMissionId', '')::uuid;
  exception when others then
    raise exception using errcode = '23514', message = 'Controlled deletion drill references are invalid';
  end;

  if v_request_id is null or v_evidence_id is null then
    raise exception using errcode = '23514', message = 'Controlled deletion drill evidence is required before review';
  end if;

  select drill.*
  into v_drill
  from public.processing_deletion_drills drill
  where drill.organization_id = p_organization_id
    and drill.process_id = p_process_id
    and drill.evidence_request_id = v_request_id
    and drill.evidence_id = v_evidence_id
  order by drill.executed_at desc nulls last, drill.created_at desc
  limit 1
  for update;

  if v_drill.id is null or v_drill.status <> 'passed_controlled_test' then
    raise exception using errcode = '23514', message = 'A passed controlled deletion drill is required before review';
  end if;

  select request.*
  into v_request
  from public.evidence_requests request
  where request.id = v_request_id
    and request.organization_id = p_organization_id
    and request.submitted_evidence_id = v_evidence_id
  for update;

  if v_request.id is null then
    raise exception using errcode = '23514', message = 'Controlled drill evidence request is missing or inconsistent';
  end if;

  select evidence.*
  into v_evidence
  from public.evidence evidence
  where evidence.id = v_evidence_id
    and evidence.organization_id = p_organization_id
    and evidence.project_id = v_request.project_id
  for update;

  if v_evidence.id is null
     or v_evidence.integrity_status <> 'verified'
     or v_evidence.integrity_hash !~ '^[0-9a-f]{64}$'
     or v_evidence.metadata ->> 'scope' <> 'controlled_deletion_drill'
     or coalesce((v_evidence.metadata ->> 'syntheticIdentifiersRemoved')::boolean, false) is not true
     or coalesce((v_evidence.metadata ->> 'productionSubjectDataTouched')::boolean, true) is not false
     or v_evidence.metadata ->> 'externalProcessorPropagation' <> 'not_tested'
     or nullif(btrim(coalesce(v_evidence.metadata ->> 'limitation', '')), '') is null then
    raise exception using errcode = '23514', message = 'Controlled deletion drill evidence does not preserve the required integrity and limitations';
  end if;

  v_before_hash := nullif(btrim(coalesce(v_evidence.metadata ->> 'beforeHash', '')), '');
  v_after_hash := nullif(btrim(coalesce(v_evidence.metadata ->> 'afterHash', '')), '');

  if v_before_hash !~ '^[0-9a-f]{64}$'
     or v_after_hash !~ '^[0-9a-f]{64}$'
     or v_before_hash = v_after_hash
     or v_after_hash is distinct from v_evidence.integrity_hash then
    raise exception using errcode = '23514', message = 'Controlled deletion drill before/after hash evidence is invalid';
  end if;

  if coalesce((v_evidence.metadata ->> 'controlledMechanismValidated')::boolean, false) is true then
    return jsonb_build_object(
      'processId', p_process_id,
      'drillId', v_drill.id,
      'evidenceRequestId', v_request_id,
      'evidenceId', v_evidence_id,
      'mechanismStatus', 'validated_controlled',
      'operationalDeletionStatus', coalesce(v_process.attributes ->> 'deletionEvidenceStatus', 'controlled_test_passed'),
      'resumed', true
    );
  end if;

  if v_request.status not in ('submitted', 'under_review') then
    raise exception using errcode = '23514', message = 'Controlled deletion drill submission is not reviewable in its current state';
  end if;

  perform public.review_evidence_request_record(
    p_actor_id,
    p_organization_id,
    v_request_id,
    'changes_requested',
    v_note
  );

  update public.evidence evidence
  set validation_status = 'accepted',
      metadata = coalesce(evidence.metadata, '{}'::jsonb) || jsonb_build_object(
        'controlledMechanismValidated', true,
        'controlledMechanismValidatedAt', now(),
        'controlledMechanismValidatedBy', p_actor_id,
        'operationalDeletionDemonstrated', false,
        'backupPurgeDemonstrated', false,
        'externalProcessorPropagationDemonstrated', false,
        'reviewNote', v_note,
        'limitationsPreserved', true
      ),
      updated_at = now()
  where evidence.id = v_evidence_id
    and evidence.organization_id = p_organization_id;

  if v_request.control_id is not null then
    update public.control_evidence link
    set sufficiency_status = 'partial',
        reviewed_by = p_actor_id,
        reviewed_at = now(),
        note = 'Drill controlado aceptado como evidencia parcial del mecanismo. Faltan eliminación operacional, backups y propagación a terceros.'
    where link.organization_id = p_organization_id
      and link.project_id = v_request.project_id
      and link.control_id = v_request.control_id
      and link.evidence_id = v_evidence_id;
  end if;

  update public.processing_deletion_drills drill
  set verification = coalesce(drill.verification, '{}'::jsonb) || jsonb_build_object(
        'humanReviewed', true,
        'mechanismValidated', true,
        'operationalDeletionDemonstrated', false,
        'backupPurgeDemonstrated', false,
        'externalProcessorPropagationDemonstrated', false
      ),
      updated_at = now()
  where drill.id = v_drill.id
    and drill.organization_id = p_organization_id;

  update public.organization_processes process
  set attributes = coalesce(process.attributes, '{}'::jsonb) || jsonb_build_object(
        'controlledDeletionReviewStatus', 'validated_controlled',
        'controlledDeletionReviewedAt', now(),
        'deletionEvidenceStatus', 'controlled_test_passed'
      ),
      updated_at = now()
  where process.id = p_process_id
    and process.organization_id = p_organization_id;

  if v_mission_id is not null then
    update public.missions mission
    set metadata = coalesce(mission.metadata, '{}'::jsonb) || jsonb_build_object(
          'controlledDeletionReviewStatus', 'validated_controlled',
          'controlledDeletionReviewedAt', now(),
          'deletionEvidenceStatus', 'controlled_test_passed'
        ),
        updated_at = now()
    where mission.id = v_mission_id
      and mission.organization_id = p_organization_id;
  end if;

  v_case_id := v_request.case_id;
  v_control_id := v_request.control_id;

  if v_case_id is not null and not exists (
    select 1
    from public.compliance_case_events event
    where event.organization_id = p_organization_id
      and event.case_id = v_case_id
      and event.event_type = 'processing_controlled_deletion_drill_reviewed'
      and event.changes ->> 'drill_id' = v_drill.id::text
  ) then
    insert into public.compliance_case_events (
      organization_id, case_id, actor_id, event_type, summary, changes
    ) values (
      p_organization_id,
      v_case_id,
      p_actor_id,
      'processing_controlled_deletion_drill_reviewed',
      'Mecanismo de anonimización validado en drill controlado; eliminación operacional sigue abierta',
      jsonb_build_object(
        'drill_id', v_drill.id,
        'process_id', p_process_id,
        'request_id', v_request_id,
        'evidence_id', v_evidence_id,
        'mechanism_status', 'validated_controlled',
        'operational_deletion_demonstrated', false,
        'backup_purge_demonstrated', false,
        'external_processor_propagation_demonstrated', false
      )
    );
    v_event_created := true;
  end if;

  return jsonb_build_object(
    'processId', p_process_id,
    'drillId', v_drill.id,
    'evidenceRequestId', v_request_id,
    'evidenceId', v_evidence_id,
    'mechanismStatus', 'validated_controlled',
    'operationalDeletionStatus', 'controlled_test_passed',
    'requestStatus', 'changes_requested',
    'eventCreated', v_event_created,
    'resumed', false
  );
end;
$function$;

revoke all on function public.review_processing_controlled_deletion_drill_v1(
  uuid, uuid, uuid, text
) from public, anon, authenticated;

grant execute on function public.review_processing_controlled_deletion_drill_v1(
  uuid, uuid, uuid, text
) to service_role, postgres;
