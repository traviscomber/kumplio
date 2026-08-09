-- Block 16 provider boundary gate. READ ONLY.
-- Verifies that each real processing activity has accepted+verified provider
-- assurance while preserving the distinction between policy review and a
-- tenant-specific backup / external deletion guarantee.

begin transaction read only;

do $verify$
declare
  v_assurance_count integer;
  v_verified_count integer;
  v_hash_count integer;
  v_partial_count integer;
  v_tenant_verified_count integer;
  v_final_demonstrated_count integer;
begin
  select count(*)
    into v_assurance_count
  from public.organization_processes process
  where process.id in (
    '26233189-3335-43e6-b382-99fcf2cc4090'::uuid,
    'a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1'::uuid,
    'f3cd212a-3e27-4f27-a722-545e4c44c8b1'::uuid
  )
    and process.attributes ->> 'providerRetentionAssuranceStatus' = 'partial_policy_verified'
    and nullif(process.attributes ->> 'providerRetentionAssuranceEvidenceId','') is not null;

  select count(*)
    into v_verified_count
  from public.organization_processes process
  join public.evidence evidence
    on evidence.id=(process.attributes ->> 'providerRetentionAssuranceEvidenceId')::uuid
   and evidence.organization_id=process.organization_id
  where process.id in (
    '26233189-3335-43e6-b382-99fcf2cc4090'::uuid,
    'a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1'::uuid,
    'f3cd212a-3e27-4f27-a722-545e4c44c8b1'::uuid
  )
    and evidence.validation_status='accepted'
    and evidence.integrity_status='verified'
    and evidence.metadata ->> 'scope'='processing_provider_retention_assurance'
    and evidence.metadata ->> 'limitationsPreserved'='true';

  select count(*)
    into v_hash_count
  from public.organization_processes process
  join public.evidence evidence
    on evidence.id=(process.attributes ->> 'providerRetentionAssuranceEvidenceId')::uuid
   and evidence.organization_id=process.organization_id
  where process.id in (
    '26233189-3335-43e6-b382-99fcf2cc4090'::uuid,
    'a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1'::uuid,
    'f3cd212a-3e27-4f27-a722-545e4c44c8b1'::uuid
  )
    and evidence.integrity_hash ~ '^[0-9a-f]{64}$'
    and evidence.integrity_hash=process.attributes ->> 'providerRetentionAssuranceSnapshotHash'
    and evidence.integrity_hash=evidence.metadata ->> 'snapshotHash';

  select count(*)
    into v_partial_count
  from public.organization_processes process
  where process.id in (
    '26233189-3335-43e6-b382-99fcf2cc4090'::uuid,
    'a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1'::uuid,
    'f3cd212a-3e27-4f27-a722-545e4c44c8b1'::uuid
  )
    and process.attributes ->> 'providerTenantConfigurationStatus'='unverified'
    and process.attributes ->> 'backupPurgeStatus' in ('policy_known_configuration_unverified','not_demonstrated');

  select count(*)
    into v_tenant_verified_count
  from public.organization_processes process
  where process.id in (
    '26233189-3335-43e6-b382-99fcf2cc4090'::uuid,
    'a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1'::uuid,
    'f3cd212a-3e27-4f27-a722-545e4c44c8b1'::uuid
  )
    and process.attributes ->> 'providerTenantConfigurationStatus'='verified';

  select count(*)
    into v_final_demonstrated_count
  from public.organization_processes process
  where process.id in (
    '26233189-3335-43e6-b382-99fcf2cc4090'::uuid,
    'a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1'::uuid,
    'f3cd212a-3e27-4f27-a722-545e4c44c8b1'::uuid
  )
    and process.attributes ->> 'deletionEvidenceStatus'='demonstrated';

  if v_assurance_count <> 3 then
    raise exception 'Expected provider assurance 3/3, found %/3',v_assurance_count;
  end if;
  if v_verified_count <> 3 then
    raise exception 'Expected accepted+verified provider assurance 3/3, found %/3',v_verified_count;
  end if;
  if v_hash_count <> 3 then
    raise exception 'Expected provider assurance SHA-256 integrity 3/3, found %/3',v_hash_count;
  end if;
  if v_partial_count <> 3 then
    raise exception 'Expected all 3 activities to preserve tenant-specific provider gaps, found %/3',v_partial_count;
  end if;
  if v_tenant_verified_count <> 0 then
    raise exception 'Tenant-specific provider configuration must remain 0/3 until independently evidenced, found %',v_tenant_verified_count;
  end if;
  if v_final_demonstrated_count <> 0 then
    raise exception 'Final deletion must remain 0/3 while provider tenant guarantees are unverified, found %',v_final_demonstrated_count;
  end if;

  raise notice 'PASS: provider retention assurance 3/3 accepted+verified; tenant-specific backup/ZDR guarantees remain 0/3 and final deletion remains 0/3.';
end;
$verify$;

rollback;
