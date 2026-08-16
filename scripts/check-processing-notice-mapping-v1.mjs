import fs from 'node:fs'

const foundationPath = 'supabase/migrations/20260808174718_processing_notice_mapping_review_v1.sql'
const seedPath = 'supabase/migrations/20260808175012_seed_n3uralia_notice_mapping_reviews_v1.sql'
const verificationPath = 'scripts/63-verify-n3uralia-notice-mapping-reviews.sql'
const assurancePath = 'docs/assurance/n3uralia-processing-notice-mapping-3x-2026-08-08.md'

const required = [
  ['lib/privacy/processing-notice-mapping.ts', [
    'buildProcessingNoticeMappingSuggestion',
    "status: 'partial'",
    "status: 'not_covered'",
    'El aviso público no enumera de forma específica',
    'Aceptar este mapeo no significa que el aviso sea suficiente',
  ]],
  ['app/api/processing-activities/[processId]/notice-mapping/route.ts', [
    'getWorkspaceAccess',
    'access.canAssignWork',
    'mappingReviewed: z.literal(true)',
    'limitationsConfirmed: z.literal(true)',
    "rpc('accept_processing_notice_mapping_v1'",
    "mappingStatus: 'accepted_with_gaps'",
    ".eq('organization_id', access.organizationId)",
  ]],
  ['lib/compliance/digital-twin/privacy-remediation.ts', [
    'ProcessingNoticeMappingSuggestion',
    'privacyNoticeMappingEvidenceId',
    'privacyNoticeMappingSnapshotHash',
    'privacyNoticeMappingUnknowns',
    'noticeRequestsAccepted',
    "noticeRequest?.status === 'accepted' && item.noticeRequest.submittedEvidenceId",
  ]],
  ['components/digital-twin/processing-privacy-remediation-workspace.tsx', [
    'Revisión humana del mapeo',
    'Aceptar mapeo con brechas',
    'Metric label="Mapeos"',
    'Brechas preservadas',
    'selected.mappingSuggestion.unknowns',
    'Cada capa necesita su propia evidencia.',
    'Una política pública o una fila eliminada no cierran por sí solas las capas de backup o proveedor.',
  ]],
  [foundationPath, [
    'accept_processing_notice_mapping_v1',
    "set search_path to ''",
    'pg_advisory_xact_lock',
    ':processing-notice-mapping:',
    'submit_evidence_request_record',
    'review_evidence_request_record',
    "'accepted_with_gaps'",
    "sufficiency_status = 'partial'",
    "'activitySpecificMapping', true",
    "'noticeSufficiencyValidated', v_mapping_status = 'accepted_complete'",
    "'legalBasisValidated', false",
    "'retentionValidated', false",
    "'deletionEvidence', false",
    'Complete mapping cannot retain gaps or unknowns',
    'Mapping with gaps must preserve explicit gaps and unknowns',
    'to service_role, postgres',
  ]],
  [seedPath, [
    'Gestión de contactos comerciales y solicitudes de demostración',
    'Gestión de cuentas, autenticación y acceso al workspace',
    'Gestión de expedientes y análisis asistido por especialistas IA',
    'accept_processing_notice_mapping_v1',
    'accepted_with_gaps',
    'Notice mapping second call was not idempotent',
    'Expected three accepted notice mapping requests',
    'Expected three partial control-evidence mappings',
    'Expected three notice mapping acceptance events',
  ]],
  [verificationPath, [
    'set transaction read only;',
    'exactly three N3uralia activities with accepted notice mappings and explicit gaps',
    'three accepted, verified and bounded notice mapping evidence records',
    'three accepted notice mapping evidence requests',
    'three partial control-evidence mappings',
    'three still-open deletion evidence requests',
    'zero demonstrated deletions',
    "'status', 'passed'",
    'rollback;',
  ]],
  [assurancePath, [
    '`VALIDATED INICIAL / ACEPTADO CON BRECHAS`',
    '`20260808174718`',
    '`20260808175012`',
    'Mapeos `accepted_with_gaps` | 3',
    'Solicitudes aceptadas con evidencia | 3',
    'Enlaces de suficiencia `partial` | 3',
    'Eliminaciones demostradas | 0',
    'Mapeo aceptado no equivale a aviso suficiente',
  ]],
  ['README.md', [
    '3/3 mapeos aceptados con brechas',
    'mapeo del aviso                    3/3',
    'configuración tenant               0/3',
    'eliminación operacional final      0/3',
    './docs/assurance/n3uralia-processing-notice-mapping-3x-2026-08-08.md',
  ]],
  ['ROADMAP.md', [
    '| Mapeo del aviso | `accepted_with_gaps` 3/3 |',
    '| Lifecycle V2 | `changes_requested` 3/3 |',
    '| Eliminación primaria controlada | 3/3 |',
    '| Eliminación operacional final | 0/3 |',
    '### Bloque 16 — Cierre técnico y evidencia externa — `NEXT`',
    'aviso suficiente porque un mapeo fue aceptado con brechas',
    'No se validan base, retención, destinatarios, subencargados ni transferencias sin evidencia independiente suficiente.',
  ]],
  ['package.json', [
    'check:processing-notice-mapping',
    'node scripts/check-processing-notice-mapping-v1.mjs',
  ]],
  ['scripts/release-check.mjs', [
    "['check:processing-notice-mapping']",
  ]],
]

for (const [file, markers] of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`)
  const text = fs.readFileSync(file, 'utf8')
  for (const marker of markers) {
    if (!text.includes(marker)) throw new Error(`${file} missing marker: ${marker}`)
  }
}

const foundation = fs.readFileSync(foundationPath, 'utf8')
if (/security\s+definer/i.test(foundation)) {
  throw new Error('Notice mapping RPC must remain SECURITY INVOKER')
}
if (!foundation.includes('from public, anon, authenticated')) {
  throw new Error('Notice mapping RPC must remain unavailable to browser roles')
}
if (!foundation.includes('to service_role, postgres')) {
  throw new Error('Notice mapping RPC must remain restricted to trusted server roles')
}
if (!foundation.includes("sufficiency_status = 'partial'")) {
  throw new Error('Mappings with gaps must not leave the control evidence sufficient')
}
for (const marker of [
  "'noticeSufficiencyValidated', v_mapping_status = 'accepted_complete'",
  "'legalBasisValidated', false",
  "'retentionValidated', false",
  "'deletionEvidence', false",
  "'limitationsPreserved', true",
]) {
  if (!foundation.includes(marker)) throw new Error(`Notice mapping evidence boundary missing: ${marker}`)
}
if (!foundation.includes("v_request.status not in ('open', 'changes_requested')")) {
  throw new Error('Notice mapping RPC must reject invalid request state transitions')
}
if (!foundation.includes("v_request.status <> 'accepted'") || !foundation.includes('Existing notice mapping evidence is not consistently accepted')) {
  throw new Error('Notice mapping retry must verify persisted request consistency')
}

const route = fs.readFileSync('app/api/processing-activities/[processId]/notice-mapping/route.ts', 'utf8')
for (const directMutation of [
  ".from('evidence').insert",
  ".from('evidence_requests').update",
  ".from('organization_processes').update",
  ".from('missions').update",
]) {
  if (route.includes(directMutation)) {
    throw new Error(`Notice mapping route bypasses the atomic RPC: ${directMutation}`)
  }
}
if (!route.includes('buildProcessingNoticeMappingSuggestion')) {
  throw new Error('Notice mapping payload must be built server-side from observed sources')
}

const component = fs.readFileSync('components/digital-twin/processing-privacy-remediation-workspace.tsx', 'utf8')
if (!component.includes('mappingReviewed') || !component.includes('limitationsConfirmed')) {
  throw new Error('Notice mapping UI must require two explicit human confirmations')
}
if (!component.includes('Aceptar mapeo con brechas')) {
  throw new Error('Notice mapping UI must name the bounded acceptance honestly')
}

const seed = fs.readFileSync(seedPath, 'utf8')
if ((seed.match(/accept_processing_notice_mapping_v1/g) || []).length !== 2) {
  throw new Error('The looped notice mapping seed must call the RPC twice per activity')
}
for (const forbidden of [
  /'mappingStatus',\s*'accepted_complete'/i,
  /'noticeSufficiencyValidated',\s*true/i,
  /'legalBasisValidated',\s*true/i,
  /'retentionValidated',\s*true/i,
  /'deletionEvidence',\s*true/i,
  /cumplimiento\s+integral/i,
]) {
  if (forbidden.test(seed)) throw new Error(`Notice mapping seed overstates its evidence: ${forbidden}`)
}

const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
for (const file of [foundationPath, seedPath, verificationPath]) {
  const text = fs.readFileSync(file, 'utf8')
  const literalIds = [...new Set(text.match(uuidPattern) || [])]
  if (literalIds.length) {
    throw new Error(`${file} must discover production IDs dynamically: ${literalIds.join(', ')}`)
  }
}

const verification = fs.readFileSync(verificationPath, 'utf8')
if (!/rollback;\s*$/i.test(verification.trim())) {
  throw new Error('Notice mapping verification must end in ROLLBACK')
}
if (/\b(insert|update|delete|merge|truncate|alter|drop|create)\b/i.test(stripSqlComments(verification))) {
  throw new Error('Notice mapping verification must remain read-only')
}
if (verification.includes('accept_processing_notice_mapping_v1(')) {
  throw new Error('Read-only notice mapping verification must not call the mutation RPC')
}

console.log('Processing notice mapping guardrail: PASS')

function stripSqlComments(sql) {
  return sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
}
