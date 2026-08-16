import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migration = await readFile(
  'supabase/migrations/20260816161000_processing_provider_tenant_configuration_review_v1.sql',
  'utf8',
)

for (const marker of [
  'promote_processing_provider_tenant_configuration_v1',
  'security invoker',
  "set search_path = ''",
  "member.role in ('owner','admin','compliance')",
  "v_request.status <> 'accepted'",
  'v_request.submitted_evidence_id is distinct from p_evidence_id',
  "v_evidence.validation_status <> 'accepted'",
  "v_evidence.integrity_status <> 'verified'",
  "'processing_provider_tenant_configuration'",
  "'tenantConfigurationStatus', '') <> 'verified'",
  "'effectiveConfigurationObserved')::boolean",
  "v_kind not in ('supabase_backup_pitr','openai_data_retention')",
  "v_pitr_state not in ('enabled','disabled')",
  "v_openai_mode not in ('standard','modified_abuse_monitoring','zero_data_retention')",
  'v_project_binding_observed is not true',
  "'providerTenantConfigurationStatus','verified'",
  "'processing_provider_tenant_configuration_verified'",
  "'Tenant configuration is already verified by different evidence'",
  'revoke all on function public.promote_processing_provider_tenant_configuration_v1',
  'from authenticated',
  'grant execute on function public.promote_processing_provider_tenant_configuration_v1',
  'to service_role',
]) {
  assert.ok(migration.toLowerCase().includes(marker.toLowerCase()), `Tenant configuration guardrail missing: ${marker}`)
}

for (const forbidden of [
  "v_request.status = 'changes_requested'",
  "v_request.status = 'submitted'",
  "validation_status = 'accepted'",
  "integrity_status = 'verified'",
  "'backupPurgeStatus','demonstrated'",
  "'externalPropagationStatus','demonstrated'",
  "'finalDeletionDemonstrated',true",
]) {
  assert.ok(!migration.includes(forbidden), `Promotion RPC must not manufacture prerequisite/final state: ${forbidden}`)
}

const acceptedCheck = migration.indexOf("v_request.status <> 'accepted'")
const processPromotion = migration.indexOf("'providerTenantConfigurationStatus','verified'")
assert.ok(acceptedCheck >= 0 && processPromotion > acceptedCheck, 'Accepted evidence must be checked before process promotion')

const integrityCheck = migration.indexOf("v_evidence.integrity_status <> 'verified'")
assert.ok(integrityCheck >= 0 && processPromotion > integrityCheck, 'Integrity verification must precede process promotion')

console.log('Processing provider tenant configuration promotion v1: PASS')
