-- Block 16: demonstrate deletion on the real production data plane using a
-- synthetic lead in the actual commercial_leads table. This proves that the
-- operational primary-store deletion path works without touching a real data
-- subject. It deliberately does NOT claim backup purge or external processor
-- propagation.

create or replace function public.run_processing_primary_deletion_exercise_v1(
  p_actor_id uuid,
  p_organization_id uuid,
  p_process_id uuid,
  p_request_key uuid
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
  v_evidence_id uuid;
  v_lead_id uuid;
  v_before_payload jsonb;
  v_before_hash text;
  v_after_payload jsonb;
  v_after_hash text;
  v_deleted_count bigint := 0;
  v_remaining_count bigint := 0;
  v_event_created boolean := false;
  v_existing_evidence_id uuid;
  v_existing_hash text;
  v_existing_request_key text;
  v_snapshot jsonb;
  v_snapshot_hash text;
begin
  if p_actor_id is null or not exists (
    select 1 from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
      and member.role in ('owner','admin','compliance')
  ) then
    raise exception using errcode='42501', message='Owner, admin or compliance membership required';
  end if;

  if p_request_key is null then
    raise exception using errcode='22023', message='Primary deletion exercise request key is required';
  end if;

  select process.* into v_process
  from public.organization_processes process
  where process.id = p_process_id
    and process.organization_id = p_organization_id
    and process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired';

  if v_process.id is null then
    raise exception using errcode='23514', message='Processing activity must belong to the organization';
  end if;

  if v_process.code <> 'TRT-E6956B3825E1' then
    raise exception using errcode='23514', message='Primary deletion exercise v1 is scoped to the commercial leads activity';
  end if;

  if v_process.attributes ->> 'controlledDeletionReviewStatus' <> 'validated_controlled' then
    raise exception using errcode='23514', message='Validated controlled deletion mechanism is required first';
  end if;

  select review.project_id, review.case_id, review.control_id
  into v_project_id, v_case_id, v_control_id
  from public.processing_activity_reviews review
  where review.organization_id = p_organization_id
    and review.process_id = p_process_id
  order by review.reviewed_at desc, review.created_at desc
  limit 1;

  if v_project_id is null then
    raise exception using errcode='23514', message='Reviewed processing activity is required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':primary-deletion-exercise:' || p_process_id::text, 21719)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':primary-deletion-exercise-key:' || p_request_key::text, 21719)
  );

  select evidence.id, evidence.integrity_hash, evidence.metadata ->> 'primaryDeletionExerciseRequestKey'
  into v_existing_evidence_id, v_existing_hash, v_existing_request_key
  from public.evidence evidence
  where evidence.organization_id = p_organization_id
    and evidence.project_id = v_project_id
    and evidence.metadata ->> 'scope' = 'processing_primary_deletion_exercise'
    and evidence.metadata ->> 'processId' = p_process_id::text
  order by evidence.created_at
  limit 1
  for update;

  if v_existing_evidence_id is not null then
    return jsonb_build_object(
      'requestKey', coalesce(v_existing_request_key, p_request_key::text),
      'processId', p_process_id,
      'evidenceId', v_existing_evidence_id,
      'snapshotHash', v_existing_hash,
      'status', 'demonstrated_controlled_primary',
      'resumed', true
    );
  end if;

  insert into public.commercial_leads (
    request_key,
    nombre,
    email,
    empresa,
    industria,
    empleados,
    telefono,
    mensaje,
    source,
    status,
    sync_status,
    sync_attempts,
    ip_hash,
    user_agent
  ) values (
    p_request_key,
    'Kumplio Synthetic Deletion Probe',
    'kumplio-primary-deletion+' || replace(p_request_key::text,'-','') || '@example.invalid',
    'Kumplio Synthetic Control',
    'Compliance testing',
    '0',
    '',
    'Synthetic-only record created to verify primary data-plane deletion. Not a real person.',
    'controlled-deletion-exercise',
    'received',
    'not_configured',
    0,
    pg_catalog.encode(extensions.digest(('synthetic-ip:' || p_request_key::text)::bytea, 'sha256'), 'hex'),
    'kumplio-controlled-deletion-exercise/1.0'
  ) returning id into v_lead_id;

  select jsonb_build_object(
    'id', lead.id,
    'requestKey', lead.request_key,
    'nombre', lead.nombre,
    'email', lead.email,
    'empresa', lead.empresa,
    'industria', lead.industria,
    'empleados', lead.empleados,
    'mensaje', lead.mensaje,
    'source', lead.source,
    'status', lead.status,
    'syncStatus', lead.sync_status,
    'ipHash', lead.ip_hash,
    'userAgent', lead.user_agent
  ) into v_before_payload
  from public.commercial_leads lead
  where lead.id = v_lead_id;

  if v_before_payload is null then
    raise exception using errcode='23514', message='Synthetic operational record could not be observed before deletion';
  end if;

  v_before_hash := pg_catalog.encode(extensions.digest(v_before_payload::text, 'sha256'), 'hex');

  delete from public.commercial_leads lead
  where lead.id = v_lead_id
    and lead.request_key = p_request_key
    and lead.source = 'controlled-deletion-exercise';
  get diagnostics v_deleted_count = row_count;

  if v_deleted_count <> 1 then
    raise exception using errcode='23514', message='Primary deletion exercise did not delete exactly one synthetic record';
  end if;

  select count(*) into v_remaining_count
  from public.commercial_leads lead
  where lead.id = v_lead_id
     or lead.request_key = p_request_key
     or lead.email = 'kumplio-primary-deletion+' || replace(p_request_key::text,'-','') || '@example.invalid';

  if v_remaining_count <> 0 then
    raise exception using errcode='23514', message='Synthetic operational record remains observable after deletion';
  end if;

  v_after_payload := jsonb_build_object(
    'state', 'absent_from_primary_store',
    'table', 'public.commercial_leads',
    'leadId', v_lead_id,
    'requestKey', p_request_key,
    'remainingMatches', v_remaining_count,
    'verifiedAt', now()
  );
  v_after_hash := pg_catalog.encode(extensions.digest(v_after_payload::text, 'sha256'), 'hex');

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
    'targetTable', 'public.commercial_leads',
    'targetRecordId', v_lead_id,
    'syntheticRecord', true,
    'productionSubjectDataTouched', false,
    'method', 'deletion',
    'provider', 'Kumplio / Supabase Postgres',
    'beforeHash', v_before_hash,
    'afterHash', v_after_hash,
    'primaryStoreRemainingMatches', v_remaining_count,
    'primaryStoreDeletionDemonstrated', true,
    'backupPurgeDemonstrated', false,
    'externalProcessorPropagationDemonstrated', false,
    'limitation', 'Demuestra eliminación operativa de un registro sintético dentro de la tabla productiva real commercial_leads. No demuestra purga física de backups ni propagación a proveedores externos.'
  );
  v_snapshot_hash := pg_catalog.encode(extensions.digest(v_snapshot::text, 'sha256'), 'hex');

  select public.create_evidence_record(
    p_actor_id,
    p_organization_id,
    v_project_id,
    'Eliminación primaria operativa — contactos comerciales',
    'Ejercicio controlado sobre la tabla productiva real commercial_leads. Se crea y elimina un registro sintético, se verifica ausencia posterior y se preservan límites explícitos sobre backups y terceros.',
    'attestation',
    'kumplio://primary-deletion-exercise/' || p_request_key::text,
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
        'scope', 'processing_primary_deletion_exercise',
        'primaryDeletionExerciseRequestKey', p_request_key,
        'processId', p_process_id,
        'targetTable', 'public.commercial_leads',
        'method', 'deletion',
        'snapshotHash', v_snapshot_hash,
        'snapshot', v_snapshot,
        'primaryStoreDeletionDemonstrated', true,
        'backupPurgeDemonstrated', false,
        'externalProcessorPropagationDemonstrated', false,
        'productionSubjectDataTouched', false,
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

  if v_control_id is not null then
    update public.control_evidence link
    set sufficiency_status = 'partial',
        reviewed_by = p_actor_id,
        reviewed_at = now(),
        note = 'Eliminación primaria demostrada sobre el data plane real con registro sintético. Backups y terceros siguen abiertos.'
    where link.organization_id = p_organization_id
      and link.project_id = v_project_id
      and link.control_id = v_control_id
      and link.evidence_id = v_evidence_id;
  end if;

  update public.organization_processes process
  set attributes = coalesce(process.attributes, '{}'::jsonb) || jsonb_build_object(
        'primaryDeletionOperationalStatus', 'demonstrated_controlled_primary',
        'primaryDeletionOperationalEvidenceId', v_evidence_id,
        'primaryDeletionOperationalSnapshotHash', v_snapshot_hash,
        'primaryDeletionOperationalExecutedAt', now(),
        'primaryDeletionOperationalTarget', 'public.commercial_leads',
        'deletionEvidenceStatus', 'controlled_test_passed'
      ),
      updated_at = now()
  where process.id = p_process_id
    and process.organization_id = p_organization_id;

  if v_case_id is not null then
    insert into public.compliance_case_events (
      organization_id, case_id, actor_id, event_type, summary, changes
    ) values (
      p_organization_id,
      v_case_id,
      p_actor_id,
      'processing_primary_deletion_exercise_passed',
      'Eliminación operativa demostrada en el almacén primario con registro sintético',
      jsonb_build_object(
        'process_id', p_process_id,
        'request_key', p_request_key,
        'evidence_id', v_evidence_id,
        'target_table', 'public.commercial_leads',
        'primary_store_deletion_demonstrated', true,
        'backup_purge_demonstrated', false,
        'external_processor_propagation_demonstrated', false,
        'production_subject_data_touched', false,
        'snapshot_hash', v_snapshot_hash
      )
    );
    v_event_created := true;
  end if;

  return jsonb_build_object(
    'requestKey', p_request_key,
    'processId', p_process_id,
    'evidenceId', v_evidence_id,
    'targetRecordId', v_lead_id,
    'targetTable', 'public.commercial_leads',
    'beforeHash', v_before_hash,
    'afterHash', v_after_hash,
    'snapshotHash', v_snapshot_hash,
    'remainingMatches', v_remaining_count,
    'status', 'demonstrated_controlled_primary',
    'backupPurgeDemonstrated', false,
    'externalProcessorPropagationDemonstrated', false,
    'eventCreated', v_event_created,
    'resumed', false
  );
end;
$function$;

revoke all on function public.run_processing_primary_deletion_exercise_v1(
  uuid, uuid, uuid, uuid
) from public, anon, authenticated;

grant execute on function public.run_processing_primary_deletion_exercise_v1(
  uuid, uuid, uuid, uuid
) to service_role, postgres;
