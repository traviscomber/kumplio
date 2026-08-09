-- Block 16 read-only gate: verify three controlled primary-store deletion exercises.
-- This proves deletion in the real production data plane using synthetic records.
-- It explicitly does NOT prove physical backup purge or external processor propagation.

begin transaction read only;

do $verify$
declare
  v_count integer;
  v_bad integer;
begin
  select count(*)
  into v_count
  from public.organization_processes process
  join public.evidence evidence
    on evidence.id = (process.attributes ->> 'primaryDeletionOperationalEvidenceId')::uuid
  where process.id in (
    '26233189-3335-43e6-b382-99fcf2cc4090'::uuid,
    'a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1'::uuid,
    'f3cd212a-3e27-4f27-a722-545e4c44c8b1'::uuid
  )
    and process.attributes ->> 'primaryDeletionOperationalStatus' = 'demonstrated_controlled_primary'
    and process.attributes ->> 'primaryDeletionOperationalSnapshotHash' ~ '^[0-9a-f]{64}$'
    and evidence.validation_status = 'accepted'
    and evidence.integrity_status = 'verified'
    and evidence.metadata ->> 'scope' = 'processing_primary_deletion_exercise'
    and evidence.metadata ->> 'primaryStoreDeletionDemonstrated' = 'true'
    and evidence.metadata ->> 'backupPurgeDemonstrated' = 'false'
    and evidence.metadata ->> 'externalProcessorPropagationDemonstrated' = 'false'
    and evidence.metadata #>> '{snapshot,primaryStoreRemainingMatches}' = '0'
    and evidence.metadata #>> '{snapshot,productionSubjectDataTouched}' = 'false';

  if v_count <> 3 then
    raise exception 'Primary deletion gate is %/3; expected 3/3', v_count;
  end if;

  select count(*)
  into v_bad
  from public.organization_processes process
  join public.evidence evidence
    on evidence.id = (process.attributes ->> 'primaryDeletionOperationalEvidenceId')::uuid
  where process.id in (
    '26233189-3335-43e6-b382-99fcf2cc4090'::uuid,
    'a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1'::uuid,
    'f3cd212a-3e27-4f27-a722-545e4c44c8b1'::uuid
  )
    and (
      evidence.metadata ->> 'backupPurgeDemonstrated' <> 'false'
      or evidence.metadata ->> 'externalProcessorPropagationDemonstrated' <> 'false'
      or evidence.metadata #>> '{snapshot,productionSubjectDataTouched}' <> 'false'
    );

  if v_bad <> 0 then
    raise exception 'Primary deletion evidence overstates backup/external scope or touched production subjects';
  end if;

  raise notice 'PASS: primary deletion demonstrated 3/3 with synthetic records, accepted+verified evidence, zero remaining matches, and explicit backup/external limitations.';
end;
$verify$;

rollback;
