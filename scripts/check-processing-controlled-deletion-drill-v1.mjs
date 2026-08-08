import fs from 'node:fs'

const migrationPath = 'supabase/migrations/20260808234542_processing_controlled_deletion_drill_v1.sql'
const verificationPath = 'scripts/64-verify-n3uralia-controlled-deletion-drills.sql'

const required = [
  [migrationPath, [
    'processing_deletion_drills',
    'processing_deletion_probe_records',
    'run_processing_controlled_deletion_drill_v1',
    "set search_path to ''",
    'controlled_synthetic_probe',
    "'productionSubjectDataTouched',false",
    "'backup_purga_programada','not_applicable_to_controlled_probe'",
    "'backup_purga_confirmada','not_applicable_to_controlled_probe'",
    "'externalProcessorPropagation','not_tested'",
    'submit_evidence_request_record',
    "'requestStatus','submitted'",
    'to service_role, postgres',
  ]],
  ['app/api/processing-activities/[processId]/controlled-deletion-drill/route.ts', [
    'getWorkspaceAccess',
    'access.canAssignWork',
    'syntheticOnlyConfirmed: z.literal(true)',
    'limitationsConfirmed: z.literal(true)',
    "rpc('run_processing_controlled_deletion_drill_v1'",
    'Primero debe existir un mapeo del aviso aceptado.',
  ]],
  ['components/digital-twin/controlled-deletion-drill-workspace.tsx', [
    'Probar el mecanismo sin tocar datos reales.',
    'Ejecutar drill sintético',
    'Eliminación real: <strong className="text-foreground">no demostrada</strong>',
    'La solicitud de eliminación no será aceptada automáticamente.',
  ]],
  ['lib/compliance/digital-twin/privacy-remediation.ts', [
    'controlledDeletion',
    'controlledDeletionDrillStatus',
    'controlledDeletionDrillsPassed',
  ]],
  ['app/digital-twin/page.tsx', [
    'ControlledDeletionDrillWorkspace',
    'actions={privacyRemediation.actions}',
  ]],
  [verificationPath, [
    'set transaction read only;',
    'Expected three controlled deletion drills with submitted evidence',
    'Expected three anonymized probes with identifiers removed',
    'Controlled drills must not auto-accept deletion requests',
    'rollback;',
  ]],
]

for (const [file, markers] of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`)
  const text = fs.readFileSync(file, 'utf8')
  for (const marker of markers) {
    if (!text.includes(marker)) throw new Error(`${file} missing marker: ${marker}`)
  }
}

const migration = fs.readFileSync(migrationPath, 'utf8')
if (/security\s+definer/i.test(migration)) throw new Error('Controlled deletion drill must remain SECURITY INVOKER')
if (!migration.includes('from public, anon, authenticated')) throw new Error('Controlled deletion drill RPC must be revoked from browser roles')
if (!migration.includes("v_request.status in ('open','changes_requested')")) throw new Error('Controlled drill must submit only an open or changes-requested deletion request')
if (migration.includes("review_evidence_request_record")) throw new Error('Controlled drill must never auto-accept deletion evidence')
if (!migration.includes("'deletionEvidenceStatus','controlled_test_passed'")) throw new Error('Controlled status must remain distinct from accepted deletion')

const endpoint = fs.readFileSync('app/api/processing-activities/[processId]/controlled-deletion-drill/route.ts', 'utf8')
for (const forbidden of [".from('processing_deletion_drills').insert", ".from('processing_deletion_probe_records').insert", ".from('evidence').insert"]) {
  if (endpoint.includes(forbidden)) throw new Error(`Endpoint bypasses atomic RPC: ${forbidden}`)
}

const verification = fs.readFileSync(verificationPath, 'utf8')
if (!/rollback;\s*$/i.test(verification.trim())) throw new Error('Controlled deletion verification must end in ROLLBACK')
if (/\b(insert|update|delete|merge|truncate|alter|drop|create)\b/i.test(stripSqlComments(verification))) {
  throw new Error('Controlled deletion verification must remain read-only')
}

console.log('Processing controlled deletion drill guardrail: PASS')

function stripSqlComments(sql) {
  return sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
}
