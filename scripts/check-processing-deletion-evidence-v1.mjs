import fs from 'node:fs'

const files = {
  migration: 'supabase/migrations/20260808235300_processing_deletion_evidence_review_v1.sql',
  route: 'app/api/processing-activities/[processId]/deletion-evidence/route.ts',
  twin: 'lib/compliance/digital-twin/privacy-remediation.ts',
  productionGate: 'scripts/64-verify-n3uralia-deletion-evidence-3x.sql',
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
  ['digital twin exposes deletion proof', source.twin.includes('deletion: {') && source.twin.includes('deletionsDemonstrated')],
  ['digital twin requires accepted+verified', source.twin.includes("item.deletion.validationStatus === 'accepted'") && source.twin.includes("item.deletion.integrityStatus === 'verified'")],
  ['production gate is read only', source.productionGate.includes('begin transaction read only;')],
  ['production gate requires 3/3', source.productionGate.includes('v_demonstrated_count <> 3')],
  ['production gate rejects future executions', source.productionGate.includes('v_future_execution_count <> 0')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)

if (failed.length) {
  console.error(`\nDeletion evidence contract failed: ${failed.length} check(s).`)
  process.exit(1)
}

console.log('\nProcessing deletion evidence contract: PASS')
