-- Block 16 release evidence gate: three real deletion/anonymization executions.
-- READ ONLY. This script never creates, accepts or mutates evidence.
-- It intentionally fails while the productive state remains below 3/3.

begin transaction read only;

do $verify$
declare
  v_activity_count integer;
  v_demonstrated_count integer;
  v_accepted_request_count integer;
  v_verified_evidence_count integer;
  v_valid_hash_count integer;
  v_distinct_purge_refs_count integer;
  v_future_execution_count integer;
  v_personal_data_flag_count integer;
begin
  select count(*)
  into v_activity_count
  from public.organization_processes process
  where process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired'
    and process.attributes ? 'deletionEvidenceRequestId';

  select count(*)
  into v_demonstrated_count
  from public.organization_processes process
  where process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired'
    and process.attributes ->> 'deletionEvidenceStatus' = 'demonstrated'
    and nullif(process.attributes ->> 'deletionEvidenceId', '') is not null
    and nullif(process.attributes ->> 'deletionEvidenceSnapshotHash', '') ~ '^[0-9a-f]{64}$'
    and process.attributes ->> 'deletionEvidenceMethod' in ('deletion', 'anonymization')
    and (process.attributes ->> 'deletionExecutedAt')::timestamptz <= now();

  select count(*)
  into v_accepted_request_count
  from public.organization_processes process
  join public.evidence_requests request
    on request.id = (process.attributes ->> 'deletionEvidenceRequestId')::uuid
   and request.organization_id = process.organization_id
  where process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired'
    and process.attributes ->> 'deletionEvidenceStatus' = 'demonstrated'
    and request.status = 'accepted'
    and request.submitted_evidence_id = (process.attributes ->> 'deletionEvidenceId')::uuid;

  select count(*)
  into v_verified_evidence_count
  from public.organization_processes process
  join public.evidence evidence
    on evidence.id = (process.attributes ->> 'deletionEvidenceId')::uuid
   and evidence.organization_id = process.organization_id
  where process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired'
    and process.attributes ->> 'deletionEvidenceStatus' = 'demonstrated'
    and evidence.validation_status = 'accepted'
    and evidence.integrity_status = 'verified'
    and evidence.metadata ->> 'scope' = 'processing_deletion_execution'
    and evidence.metadata ->> 'deletionEvidence' = 'true'
    and evidence.metadata ->> 'personalDataIncluded' = 'false';

  select count(*)
  into v_valid_hash_count
  from public.organization_processes process
  join public.evidence evidence
    on evidence.id = (process.attributes ->> 'deletionEvidenceId')::uuid
   and evidence.organization_id = process.organization_id
  where process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired'
    and process.attributes ->> 'deletionEvidenceStatus' = 'demonstrated'
    and evidence.integrity_hash ~ '^[0-9a-f]{64}$'
    and evidence.integrity_hash = process.attributes ->> 'deletionEvidenceSnapshotHash'
    and evidence.metadata ->> 'snapshotHash' = evidence.integrity_hash;

  select count(*)
  into v_distinct_purge_refs_count
  from public.organization_processes process
  join public.evidence evidence
    on evidence.id = (process.attributes ->> 'deletionEvidenceId')::uuid
   and evidence.organization_id = process.organization_id
  where process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired'
    and process.attributes ->> 'deletionEvidenceStatus' = 'demonstrated'
    and nullif(evidence.metadata #>> '{snapshot,backupPurgaProgramada}', '') is not null
    and nullif(evidence.metadata #>> '{snapshot,backupPurgaConfirmada}', '') is not null
    and evidence.metadata #>> '{snapshot,backupPurgaProgramada}'
        <> evidence.metadata #>> '{snapshot,backupPurgaConfirmada}'
    and exists (
      select 1
      from jsonb_array_elements(evidence.metadata #> '{snapshot,sourceRefs}') source_ref
      where source_ref ->> 'type' = 'backup_purga_programada'
    )
    and exists (
      select 1
      from jsonb_array_elements(evidence.metadata #> '{snapshot,sourceRefs}') source_ref
      where source_ref ->> 'type' = 'backup_purga_confirmada'
    );

  select count(*)
  into v_future_execution_count
  from public.evidence evidence
  where evidence.metadata ->> 'scope' = 'processing_deletion_execution'
    and (evidence.metadata #>> '{snapshot,executedAt}')::timestamptz > now();

  select count(*)
  into v_personal_data_flag_count
  from public.evidence evidence
  where evidence.metadata ->> 'scope' = 'processing_deletion_execution'
    and coalesce((evidence.metadata ->> 'personalDataIncluded')::boolean, true) is true;

  if v_activity_count <> 3 then
    raise exception 'Expected exactly 3 tracked processing activities with deletion requests, found %', v_activity_count;
  end if;

  if v_demonstrated_count <> 3 then
    raise exception 'Deletion/anonymization demonstrations are %/3; release gate remains closed', v_demonstrated_count;
  end if;

  if v_accepted_request_count <> 3 then
    raise exception 'Accepted deletion evidence requests are %/3', v_accepted_request_count;
  end if;

  if v_verified_evidence_count <> 3 then
    raise exception 'Accepted + verified deletion evidence records are %/3', v_verified_evidence_count;
  end if;

  if v_valid_hash_count <> 3 then
    raise exception 'Deletion evidence hash integrity is %/3', v_valid_hash_count;
  end if;

  if v_distinct_purge_refs_count <> 3 then
    raise exception 'Distinct scheduled/confirmed purge references are %/3', v_distinct_purge_refs_count;
  end if;

  if v_future_execution_count <> 0 then
    raise exception 'Found % deletion evidence records with future execution timestamps', v_future_execution_count;
  end if;

  if v_personal_data_flag_count <> 0 then
    raise exception 'Found % deletion evidence records that do not confirm evidence minimization', v_personal_data_flag_count;
  end if;

  raise notice 'PASS: deletion/anonymization evidence demonstrated 3/3 with accepted requests, verified evidence, SHA-256 integrity, distinct purge references and no future executions.';
end;
$verify$;

rollback;
