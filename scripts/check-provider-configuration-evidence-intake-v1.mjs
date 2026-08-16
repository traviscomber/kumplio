import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [migration, route, loader, workspace, page] = await Promise.all([
  readFile('supabase/migrations/20260816211617_provider_tenant_configuration_evidence_intake_v1.sql', 'utf8'),
  readFile('app/api/processing-activities/[processId]/provider-configuration/route.ts', 'utf8'),
  readFile('lib/compliance/digital-twin/provider-configuration.ts', 'utf8'),
  readFile('components/digital-twin/provider-configuration-workspace.tsx', 'utf8'),
  readFile('app/digital-twin/page.tsx', 'utf8'),
])
const compact = (value) => value.replace(/\s+/g, '').toLowerCase()
const sql = compact(migration)

for (const marker of [
  'submit_processing_provider_tenant_configuration_evidence_v1',
  'review_processing_provider_tenant_configuration_evidence_v1',
  'promote_processing_provider_tenant_configuration_v1',
  "source_ref->>'type'notin('management_api','provider_dashboard','provider_contract')",
  "v_request.statusnotin('open','changes_requested')",
  "validation_status='pending'",
  'submit_evidence_request_record',
  "p_decisionnotin('accepted','rejected','changes_requested')",
  "ifp_decision='accepted'then",
  "validation_status='accepted'",
  'review_evidence_request_record',
  'backupModeObserved',
  "v_pitr_state='enabled'andv_backup_mode<>'pitr'",
  "v_pitr_state='disabled'andv_backup_mode<>'daily'",
  'projectBindingObserved',
  "v_openai_modenotin('standard','modified_abuse_monitoring','zero_data_retention')",
  'frompublic,anon,authenticated',
  'toservice_role,postgres',
]) {
  assert.ok(sql.includes(compact(marker)), `Provider configuration intake missing guardrail: ${marker}`)
}

assert.ok(!sql.includes(compact("v_daily_backups_observed is not true")), 'PITR evidence must not require simultaneous daily backups')
assert.ok(!sql.includes(compact("providerTenantConfigurationStatus','verified'")) || sql.indexOf(compact("v_request.status <> 'accepted'")) < sql.indexOf(compact("providerTenantConfigurationStatus','verified'")), 'Promotion must remain after accepted-request prerequisite')

for (const marker of [
  "z.enum(['management_api', 'provider_dashboard', 'provider_contract'])",
  "configurationKind: z.literal('supabase_backup_pitr')",
  "configurationKind: z.literal('openai_data_retention')",
  "projectBindingObserved: z.literal(true)",
  "dataRetentionMode: z.enum(['standard', 'modified_abuse_monitoring', 'zero_data_retention'])",
  "body.action === 'submit'",
  "admin.rpc('submit_processing_provider_tenant_configuration_evidence_v1'",
  "admin.rpc('review_processing_provider_tenant_configuration_evidence_v1'",
  'access.canAssignWork',
]) {
  assert.ok(route.includes(marker), `Provider configuration API missing guardrail: ${marker}`)
}

for (const marker of [
  'providerTenantConfigurationEvidenceRequestId',
  'providerTenantConfigurationVendor',
  'submitted_evidence_id',
]) assert.ok(loader.includes(marker), `Provider configuration loader missing marker: ${marker}`)

for (const marker of [
  'Cierra el dato administrado, no la inferencia.',
  'Entregar configuración',
  'Revisar configuración',
  "management_api",
  "provider_dashboard",
  "provider_contract",
  "modified_abuse_monitoring",
  "fetch(`/api/processing-activities/${selected.processId}/provider-configuration`",
]) assert.ok(workspace.includes(marker), `Provider configuration workspace missing marker: ${marker}`)

assert.ok(page.includes('getProviderConfigurationWork(admin, access.organizationId)'))
assert.ok(page.includes('<ProviderConfigurationWorkspace'))

console.log('Provider tenant configuration evidence intake v1: PASS')
