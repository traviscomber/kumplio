-- Read-only verification for Block 16 controlled deletion drills.
begin;
set transaction read only;

do $verify$
declare
  v_org uuid;
  v_count integer;
begin
  select id into v_org from public.organizations where lower(btrim(name))='n3uralia' limit 1;
  if v_org is null then raise exception 'N3uralia organization not found'; end if;

  select count(*) into v_count
  from public.processing_deletion_drills drill
  join public.organization_processes process on process.id=drill.process_id
  join public.evidence_requests request on request.id=drill.evidence_request_id
  join public.evidence evidence on evidence.id=drill.evidence_id
  where drill.organization_id=v_org
    and process.organization_id=v_org
    and process.process_type='processing_activity'
    and process.lifecycle_status='active'
    and drill.status='passed_controlled_test'
    and drill.method='anonymization'
    and drill.provider='Kumplio / Supabase Postgres'
    and drill.target_label='controlled_synthetic_probe'
    and drill.before_hash ~ '^[0-9a-f]{64}$'
    and drill.after_hash ~ '^[0-9a-f]{64}$'
    and drill.before_hash <> drill.after_hash
    and drill.verification->>'syntheticIdentifiersRemoved'='true'
    and drill.verification->>'productionSubjectDataTouched'='false'
    and request.organization_id=v_org
    and request.status='submitted'
    and request.submitted_evidence_id=drill.evidence_id
    and evidence.organization_id=v_org
    and evidence.validation_status='pending'
    and evidence.integrity_status='verified'
    and evidence.integrity_hash=drill.after_hash
    and evidence.metadata->>'scope'='controlled_deletion_drill'
    and evidence.metadata->>'productionSubjectDataTouched'='false'
    and evidence.metadata->>'backup_purga_programada'='not_applicable_to_controlled_probe'
    and evidence.metadata->>'backup_purga_confirmada'='not_applicable_to_controlled_probe'
    and evidence.metadata->>'externalProcessorPropagation'='not_tested';

  if v_count <> 3 then raise exception 'Expected three controlled deletion drills with submitted evidence, found %', v_count; end if;

  select count(*) into v_count
  from public.processing_deletion_probe_records probe
  where probe.organization_id=v_org
    and probe.anonymized_at is not null
    and probe.synthetic_payload->>'state'='anonymized'
    and probe.synthetic_payload->>'scope'='controlled_synthetic_probe'
    and probe.synthetic_payload::text not like '%@example.invalid%'
    and probe.synthetic_payload::text not like '%synthetic-only-%'
    and probe.synthetic_payload::text not like '%probe-subject-%';

  if v_count <> 3 then raise exception 'Expected three anonymized probes with identifiers removed, found %', v_count; end if;

  select count(*) into v_count
  from public.organization_processes process
  where process.organization_id=v_org
    and process.process_type='processing_activity'
    and process.lifecycle_status='active'
    and process.attributes->>'controlledDeletionDrillStatus'='passed_controlled_test'
    and process.attributes->>'deletionEvidenceStatus'='controlled_test_passed'
    and process.attributes->>'controlledDeletionDrillId' is not null
    and process.attributes->>'controlledDeletionEvidenceId' is not null;

  if v_count <> 3 then raise exception 'Expected three activities with controlled-test status, found %', v_count; end if;

  select count(*) into v_count
  from public.evidence_requests request
  where request.organization_id=v_org
    and request.title like 'Evidencia de eliminación — %'
    and request.status='accepted';

  if v_count <> 0 then raise exception 'Controlled drills must not auto-accept deletion requests; found % accepted', v_count; end if;
end;
$verify$;

select jsonb_build_object(
  'status','passed',
  'drills',(select count(*) from public.processing_deletion_drills drill join public.organizations org on org.id=drill.organization_id where lower(btrim(org.name))='n3uralia' and drill.status='passed_controlled_test'),
  'anonymizedProbes',(select count(*) from public.processing_deletion_probe_records probe join public.organizations org on org.id=probe.organization_id where lower(btrim(org.name))='n3uralia' and probe.anonymized_at is not null),
  'submittedRequests',(select count(*) from public.evidence_requests request join public.organizations org on org.id=request.organization_id where lower(btrim(org.name))='n3uralia' and request.title like 'Evidencia de eliminación — %' and request.status='submitted'),
  'acceptedRequests',(select count(*) from public.evidence_requests request join public.organizations org on org.id=request.organization_id where lower(btrim(org.name))='n3uralia' and request.title like 'Evidencia de eliminación — %' and request.status='accepted')
) as verification;
rollback;
