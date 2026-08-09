import fs from 'node:fs'

const files = {
  migration: 'supabase/migrations/20260808235300_processing_deletion_evidence_review_v1.sql',
  providerMigration: 'supabase/migrations/20260809024500_processing_provider_retention_assurance_v1.sql',
  providerRequestMigration: 'supabase/migrations/20260809030500_processing_provider_configuration_requests_v1.sql',
  route: 'app/api/processing-activities/[processId]/deletion-evidence/route.ts',
  twin: 'lib/compliance/digital-twin/privacy-remediation.ts',
  workspace: 'components/digital-twin/processing-privacy-remediation-workspace.tsx',
  productionGate: 'scripts/64-verify-n3uralia-deletion-evidence-3x.sql',
  primaryGate: 'scripts/66-verify-n3uralia-primary-deletion-3x.sql',
  providerGate: 'scripts/67-verify-n3uralia-provider-retention-assurance-3x.sql',
  providerRequestGate: 'scripts/68-verify-n3uralia-provider-configuration-requests-3x.sql',
  providerAssurance: 'docs/assurance/n3uralia-provider-retention-assurance-3x-2026-08-08.md',
  providerRequests: 'docs/assurance/n3uralia-provider-configuration-requests-3x-2026-08-08.md',
}

const source = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, fs.readFileSync(file, 'utf8')]),
)

const checks = [
  ['RPC exists', source.migration.includes('accept_processing_deletion_evidence_v1')],
  ['RPC has empty search_path', source.migration.includes("set search_path to ''")],
  ['RPC blocks browser roles', source.migration.includes('from public, anon, authenticated')],
  ['RPC restricts execution', source.migration.includes('to service_role, postgres')],
  ['tenant-scoped activity', source.migration.includes('process.organization_id = p_organization_id')],
  ['human privileged roles', source.migration.includes("member.role in ('owner', 'admin', 'compliance')")],
  ['deletion/anonymization only', source.migration.includes("v_method not in ('deletion', 'anonymization')")],
  ['scheduled purge required', source.migration.includes("'backup_purga_programada'")],
  ['confirmed purge required', source.migration.includes("'backup_purga_confirmada'")],
  ['purge refs must differ', source.migration.includes('v_scheduled_ref = v_confirmed_ref')],
  ['future execution blocked', source.migration.includes("v_executed_at > now() + interval '5 minutes'")],
  ['explicit evidence minimization', source.migration.includes("'personalDataIncluded', false")],
  ['SHA-256 snapshot', source.migration.includes("extensions.digest(v_snapshot::text, 'sha256')")],
  ['exact idempotency', source.migration.includes("'resumed', true") && source.migration.includes('v_existing_hash is distinct from v_snapshot_hash')],
  ['request submitted atomically', source.migration.includes('submit_evidence_request_record')],
  ['request reviewed atomically', source.migration.includes('review_evidence_request_record')],
  ['process marked demonstrated', source.migration.includes("'deletionEvidenceStatus', 'demonstrated'")],
  ['route requires authentication', source.route.includes('supabase.auth.getUser()')],
  ['route checks workspace', source.route.includes('getWorkspaceAccess')],
  ['route requires two purge source types', source.route.includes("sourceTypes.has('backup_purga_programada')") && source.route.includes("sourceTypes.has('backup_purga_confirmada')")],
  ['route requires human confirmations', source.route.includes('deletionReviewed: z.literal(true)') && source.route.includes('noPersonalDataConfirmed: z.literal(true)')],
  ['digital twin exposes final deletion proof', source.twin.includes('deletion: {') && source.twin.includes('deletionsDemonstrated')],
  ['digital twin exposes primary deletion proof', source.twin.includes('primaryDeletion: {') && source.twin.includes('primaryDeletionsDemonstrated')],
  ['digital twin exposes provider assurance', source.twin.includes('providerAssurance: {') && source.twin.includes('providerAssuranceReviewed')],
  ['digital twin exposes tenant verification count', source.twin.includes('providerTenantConfigurationsVerified')],
  ['digital twin requires accepted+verified for final deletion', source.twin.includes("item.deletion.validationStatus === 'accepted'") && source.twin.includes("item.deletion.integrityStatus === 'verified'")],
  ['workspace shows provider tenant metric', source.workspace.includes('Tenant proveedor') && source.workspace.includes('providerTenantConfigurationsVerified')],
  ['workspace shows external blocker', source.workspace.includes('Bloqueo externo identificado') && source.workspace.includes('tenantBlockerDetail')],
  ['workspace final action gated by tenant verification', source.workspace.includes('action.deletionRequest && tenantVerified && !deletionDemonstrated')],
  ['workspace distinguishes store false from ZDR', source.workspace.includes('store:false') && source.workspace.includes('ZDR/MAM')],
  ['production gate is read only', source.productionGate.includes('begin transaction read only;')],
  ['production gate requires 3/3', source.productionGate.includes('v_demonstrated_count <> 3')],
  ['production gate rejects future executions', source.productionGate.includes('v_future_execution_count <> 0')],
  ['primary gate preserves synthetic-only proof', source.primaryGate.includes('productionSubjectDataTouched') && source.primaryGate.includes('primaryStoreRemainingMatches')],
  ['provider assurance RPC exists', source.providerMigration.includes('record_processing_provider_retention_assurance_v1')],
  ['provider assurance blocks browser roles', source.providerMigration.includes('from public,anon,authenticated')],
  ['provider assurance requires tenant verification for backup claim', source.providerMigration.includes("v_backup_status='demonstrated' and v_tenant_config_status <> 'verified'")],
  ['provider assurance requires tenant verification for external claim', source.providerMigration.includes("v_external_status='demonstrated' and v_tenant_config_status <> 'verified'")],
  ['provider gate is read only', source.providerGate.includes('begin transaction read only;')],
  ['provider gate requires assurance 3/3', source.providerGate.includes('v_assurance_count <> 3')],
  ['provider gate preserves tenant gap 0/3', source.providerGate.includes('v_tenant_verified_count <> 0')],
  ['provider gate keeps final deletion closed', source.providerGate.includes('v_final_demonstrated_count <> 0')],
  ['assurance doc separates policy from purge', source.providerAssurance.includes('no es evidencia de que un objeto específico haya sido purgado')],
  ['provider configuration request RPC exists', source.providerRequestMigration.includes('prepare_processing_provider_configuration_request_v1')],
  ['provider configuration request blocks browser roles', source.providerRequestMigration.includes('from public,anon,authenticated')],
  ['provider configuration request requires reviewed assurance', source.providerRequestMigration.includes('providerRetentionAssuranceStatus') && source.providerRequestMigration.includes('partial_policy_verified')],
  ['provider configuration request assigns process owner', source.providerRequestMigration.includes('v_process.owner_user_id')],
  ['provider configuration request has due date', source.providerRequestMigration.includes("now() + interval '14 days'")],
  ['provider configuration request distinguishes Supabase and OpenAI evidence', source.providerRequestMigration.includes('backups/PITR') && source.providerRequestMigration.includes('Modified Abuse Monitoring') && source.providerRequestMigration.includes('Zero Data Retention')],
  ['provider configuration request gate is read only', source.providerRequestGate.includes('begin transaction read only;')],
  ['provider configuration request gate requires 3/3', source.providerRequestGate.includes('v_total <> 3') && source.providerRequestGate.includes('v_open <> 3')],
  ['provider configuration request assurance preserves tenant gap', source.providerRequests.includes('providerTenantConfigurationStatus = unverified') && source.providerRequests.includes('deletionEvidenceStatus')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)

if (failed.length) {
  console.error(`\nDeletion evidence contract failed: ${failed.length} check(s).`)
  process.exit(1)
}

console.log('\nProcessing deletion evidence contract: PASS')