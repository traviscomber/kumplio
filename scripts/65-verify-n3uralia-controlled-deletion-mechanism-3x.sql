-- Block 16 intermediate evidence gate.
-- READ ONLY. Validates the mechanism tier without claiming operational deletion.

begin transaction read only;

do $verify$
declare
  v_mechanisms integer;
  v_requests_open integer;
  v_accepted_verified integer;
  v_partial integer;
  v_operational_false integer;
begin
  select count(*)
  into v_mechanisms
  from public.organization_processes process
  where process.organization_id = 'ab928c42-b8f0-44f8-bcf0-d8267398f9b1'::uuid
    and process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired'
    and process.attributes ->> 'controlledDeletionDrillStatus' = 'passed_controlled_test'
    and process.attributes ->> 'controlledDeletionReviewStatus' = 'validated_controlled'
    and process.attributes ->> 'deletionEvidenceStatus' = 'controlled_test_passed';

  select count(*)
  into v_requests_open
  from public.organization_processes process
  join public.evidence_requests request
    on request.id = (process.attributes ->> 'deletionEvidenceRequestId')::uuid
   and request.organization_id = process.organization_id
  where process.organization_id = 'ab928c42-b8f0-44f8-bcf0-d8267398f9b1'::uuid
    and process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired'
    and process.attributes ->> 'controlledDeletionReviewStatus' = 'validated_controlled'
    and request.status = 'changes_requested';

  select count(*)
  into v_accepted_verified
  from public.organization_processes process
  join public.evidence evidence
    on evidence.id = (process.attributes ->> 'controlledDeletionEvidenceId')::uuid
   and evidence.organization_id = process.organization_id
  where process.organization_id = 'ab928c42-b8f0-44f8-bcf0-d8267398f9b1'::uuid
    and process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired'
    and evidence.validation_status = 'accepted'
    and evidence.integrity_status = 'verified'
    and evidence.integrity_hash ~ '^[0-9a-f]{64}$'
    and evidence.metadata ->> 'scope' = 'controlled_deletion_drill'
    and evidence.metadata ->> 'controlledMechanismValidated' = 'true'
    and evidence.metadata ->> 'operationalDeletionDemonstrated' = 'false';

  select count(*)
  into v_partial
  from public.organization_processes process
  join public.evidence_requests request
    on request.id = (process.attributes ->> 'deletionEvidenceRequestId')::uuid
   and request.organization_id = process.organization_id
  join public.control_evidence link
    on link.organization_id = process.organization_id
   and link.project_id = request.project_id
   and link.control_id = request.control_id
   and link.evidence_id = (process.attributes ->> 'controlledDeletionEvidenceId')::uuid
  where process.organization_id = 'ab928c42-b8f0-44f8-bcf0-d8267398f9b1'::uuid
    and process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired'
    and link.sufficiency_status = 'partial';

  select count(*)
  into v_operational_false
  from public.organization_processes process
  join public.evidence evidence
    on evidence.id = (process.attributes ->> 'controlledDeletionEvidenceId')::uuid
   and evidence.organization_id = process.organization_id
  where process.organization_id = 'ab928c42-b8f0-44f8-bcf0-d8267398f9b1'::uuid
    and process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired'
    and evidence.metadata ->> 'operationalDeletionDemonstrated' = 'false'
    and evidence.metadata ->> 'backupPurgeDemonstrated' = 'false'
    and evidence.metadata ->> 'externalProcessorPropagationDemonstrated' = 'false';

  if v_mechanisms <> 3 then
    raise exception 'Controlled deletion mechanisms validated %/3', v_mechanisms;
  end if;
  if v_requests_open <> 3 then
    raise exception 'Deletion requests correctly kept open %/3', v_requests_open;
  end if;
  if v_accepted_verified <> 3 then
    raise exception 'Controlled drill evidence accepted+verified %/3', v_accepted_verified;
  end if;
  if v_partial <> 3 then
    raise exception 'Controlled drill evidence partial sufficiency %/3', v_partial;
  end if;
  if v_operational_false <> 3 then
    raise exception 'Explicit non-operational limitation preserved %/3', v_operational_false;
  end if;

  raise notice 'PASS: controlled deletion mechanism validated 3/3; operational deletion remains intentionally open 0/3.';
end;
$verify$;

rollback;
