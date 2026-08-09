import fs from 'node:fs'

const foundationPath = 'supabase/migrations/20260808151723_processing_activity_privacy_remediation_v1.sql'
const seedPath = 'supabase/migrations/20260808152005_seed_n3uralia_privacy_remediation_v1.sql'
const verificationPath = 'scripts/62-verify-n3uralia-processing-privacy-remediation.sql'
const assurancePath = 'docs/assurance/n3uralia-processing-privacy-remediation-3x-2026-08-08.md'

const required = [
  ['lib/privacy/notice.ts', [
    "version: '2026-08-03'",
    "route: '/privacy'",
    "contact: 'info@kumplio.app'",
    'mapeo por actividad de tratamiento',
    'evidencia operativa y trazable',
  ]],
  ['app/privacy/page.tsx', [
    "import { PRIVACY_NOTICE } from '@/lib/privacy/notice'",
    'canonical: PRIVACY_NOTICE.route',
    'versión {PRIVACY_NOTICE.version}',
    'mailto:${PRIVACY_NOTICE.contact}',
  ]],
  ['app/api/processing-activities/[processId]/privacy-remediation/route.ts', [
    'getWorkspaceAccess',
    'access.canAssignWork',
    "rpc('prepare_processing_activity_privacy_remediation_v1'",
    'scopeConfirmed: z.literal(true)',
    'ownerAndDatesConfirmed: z.literal(true)',
    'addUtcDays(now, 14)',
    'addUtcDays(now, 30)',
    'addUtcDays(now, 35)',
  ]],
  ['lib/compliance/digital-twin/privacy-remediation.ts', [
    'getProcessingPrivacyRemediation',
    'privacyRemediationMissionId',
    'privacyNoticeRequestId',
    'deletionEvidenceRequestId',
    'submitted_evidence_id',
    'review_comment',
    "item.deletionRequest?.status === 'accepted'",
    'item.deletionRequest.submittedEvidenceId === item.deletion.evidenceId',
  ]],
  ['components/digital-twin/processing-privacy-remediation-workspace.tsx', [
    'Cada capa necesita su propia evidencia.',
    'Mapeo y mecanismo',
    'Eliminación primaria demostrada',
    'Assurance proveedor',
    'Tenant proveedor',
    'Bloqueo externo identificado',
    'Registrar prueba final',
    'backup_purga_programada',
    'backup_purga_confirmada',
    'action.deletionRequest && tenantVerified && !deletionDemonstrated',
    'store:false',
    'ZDR/MAM',
  ]],
  ['app/digital-twin/page.tsx', [
    'ProcessingPrivacyRemediationWorkspace',
    'getProcessingPrivacyRemediation',
    'privacyRemediation.actions',
    'privacyRemediation.summary',
  ]],
  [foundationPath, [
    'prepare_processing_activity_privacy_remediation_v1',
    "set search_path to ''",
    'pg_advisory_xact_lock',
    ':processing-privacy-remediation-request:',
    ':processing-privacy-remediation:',
    ':public-privacy-notice:',
    'create_evidence_record',
    'create_mission_from_playbook',
    'create_evidence_request_record',
    "'supporting'",
    'is not distinct from',
    "'activitySpecificMapping', false",
    "'deletionEvidence', false",
    'Persisted privacy remediation due dates are inconsistent',
    'Privacy remediation request key already belongs to another activity or notice version',
    'to service_role, postgres',
  ]],
  [seedPath, [
    'Gestión de contactos comerciales y solicitudes de demostración',
    'Gestión de cuentas, autenticación y acceso al workspace',
    'Gestión de expedientes y análisis asistido por especialistas IA',
    "'contact', 'info@kumplio.app'",
    'prepare_processing_activity_privacy_remediation_v1',
    'second call was not idempotent',
    'owner-scoped privacy remediation missions',
    'owner-scoped notice mapping requests',
    'auditable deletion evidence requests',
  ]],
  [verificationPath, [
    'set transaction read only;',
    'exactly three active N3uralia activities with privacy remediation',
    'exactly one public privacy notice evidence',
    'three supporting activity links',
    'three valid privacy remediation missions',
    'three complete notice/deletion request chains',
    'six creation events',
    "'status', 'passed'",
    'rollback;',
  ]],
  [assurancePath, [
    '`VALIDATED INICIAL / TRABAJO ABIERTO`',
    '`20260808151723`',
    '`20260808152005`',
    'Evidencias del aviso | 1',
    'Enlaces específicos al aviso | 3',
    'Trabajo creado no equivale a cumplimiento demostrado',
  ]],
  ['README.md', [
    'Aviso y eliminación como trabajo trazable',
    '`DEPLOYED / VALIDATED INICIAL`',
    'Mapeos de aviso aceptados con evidencia | 3/3',
    'Eliminaciones demostradas con evidencia | 0/3',
    '20260808151723_processing_activity_privacy_remediation_v1',
    '20260808152005_seed_n3uralia_privacy_remediation_v1',
  ]],
  ['ROADMAP.md', [
    'Assurance aviso y eliminación 3/3',
    '`20260808151723`',
    '`20260808152005`',
    '### Bloque 16 — Ampliación y calidad del inventario real — `NEXT`',
    '3/3 mapeos aceptados con brechas',
    '0/3 eliminaciones demostradas',
  ]],
  ['package.json', [
    'check:processing-privacy-remediation',
    'node scripts/check-processing-privacy-remediation-v1.mjs',
  ]],
  ['scripts/release-check.mjs', [
    "['check:processing-privacy-remediation']",
  ]],
]

for (const [file, markers] of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`)
  const text = fs.readFileSync(file, 'utf8')
  for (const marker of markers) {
    if (!text.includes(marker)) throw new Error(`${file} missing marker: ${marker}`)
  }
}

for (const stalePath of [
  'supabase/migrations/20260808060000_processing_privacy_remediation_v1.sql',
  'supabase/migrations/20260808061000_seed_n3uralia_privacy_remediation_v1.sql',
]) {
  if (fs.existsSync(stalePath)) throw new Error(`Stale unreconciled migration remains: ${stalePath}`)
}

const foundation = fs.readFileSync(foundationPath, 'utf8')
if (/security\s+definer/i.test(foundation)) throw new Error('Privacy remediation RPC must remain SECURITY INVOKER')
if (!foundation.includes('from public, anon, authenticated')) throw new Error('Privacy remediation RPC must be revoked from browser roles')
if (!foundation.includes('to service_role, postgres')) throw new Error('Privacy remediation RPC must remain restricted to trusted server roles')
if (!foundation.includes("'activitySpecificMapping', false") || !foundation.includes("'deletionEvidence', false")) {
  throw new Error('The public notice must not be presented as activity-specific or deletion evidence')
}
if (!foundation.includes("request.case_id is not distinct from v_case_id")
  || !foundation.includes("request.control_id is not distinct from v_control_id")) {
  throw new Error('Nullable case and control idempotency must use IS NOT DISTINCT FROM')
}
if ((foundation.match(/pg_advisory_xact_lock/g) || []).length < 3) {
  throw new Error('Privacy remediation needs request, process and shared-notice advisory locks')
}
if (!foundation.includes('v_effective_notice_due_at')
  || !foundation.includes('v_effective_deletion_due_at')
  || !foundation.includes('v_effective_mission_due_at')) {
  throw new Error('Resumed privacy remediation must preserve persisted due dates')
}

const route = fs.readFileSync('app/api/processing-activities/[processId]/privacy-remediation/route.ts', 'utf8')
if (route.includes("from 'date-fns'") || route.includes('addDays(')) {
  throw new Error('Privacy remediation route must not depend on undeclared date-fns')
}
for (const directMutation of [
  ".from('missions').insert",
  ".from('evidence_requests').insert",
  ".from('evidence').insert",
  ".from('organization_processes').update",
]) {
  if (route.includes(directMutation)) throw new Error(`Privacy remediation route bypasses the atomic RPC: ${directMutation}`)
}
if (!route.includes(".eq('organization_id', access.organizationId)")) {
  throw new Error('Privacy remediation route must validate the active tenant')
}

const loader = fs.readFileSync('lib/compliance/digital-twin/privacy-remediation.ts', 'utf8')
if (loader.includes('review_note')) throw new Error('Evidence requests use review_comment, not review_note')
if (loader.includes("['42P01', '42703'")) throw new Error('Privacy loader must not hide undefined-column errors')
if (!loader.includes("item.deletionRequest?.status === 'accepted'")
  || !loader.includes('item.deletionRequest.submittedEvidenceId === item.deletion.evidenceId')) {
  throw new Error('Accepted deletion must require submitted evidence')
}

const notice = fs.readFileSync('lib/privacy/notice.ts', 'utf8')
const privacyPage = fs.readFileSync('app/privacy/page.tsx', 'utf8')
const seed = fs.readFileSync(seedPath, 'utf8')
if (notice.includes('privacidad@kumplio.app') || seed.includes('privacidad@kumplio.app')) {
  throw new Error('Do not invent a privacy contact that differs from the public notice')
}
if (!privacyPage.includes('PRIVACY_NOTICE.contact') || !privacyPage.includes('PRIVACY_NOTICE.version')) {
  throw new Error('The public privacy page must render canonical notice metadata')
}
if ((seed.match(/prepare_processing_activity_privacy_remediation_v1/g) || []).length !== 2) {
  throw new Error('The looped N3uralia privacy seed must call the RPC twice per activity')
}

const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
for (const file of [foundationPath, seedPath, verificationPath]) {
  const text = fs.readFileSync(file, 'utf8')
  const literalIds = [...new Set(text.match(uuidPattern) || [])]
  if (literalIds.length) throw new Error(`${file} must discover production IDs dynamically: ${literalIds.join(', ')}`)
}

for (const forbidden of [
  /'activitySpecificMapping',\s*true/i,
  /'deletionEvidence',\s*true/i,
  /eliminaci[oó]n\s+demostrada[^\n]*sin\s+evidencia/i,
  /aviso\s+general[^\n]*cubre\s+todas/i,
]) {
  if (forbidden.test(foundation + seed)) throw new Error(`Privacy remediation overstates its evidence: ${forbidden}`)
}

const verification = fs.readFileSync(verificationPath, 'utf8')
if (!/rollback;\s*$/i.test(verification.trim())) throw new Error('Privacy remediation verification must end in ROLLBACK')
if (/\b(insert|update|delete|merge|truncate|alter|drop|create)\b/i.test(stripSqlComments(verification))) {
  throw new Error('Privacy remediation verification must remain read-only')
}
if (verification.includes('prepare_processing_activity_privacy_remediation_v1')) {
  throw new Error('Read-only verification must not call the mutation RPC')
}

console.log('Processing privacy remediation guardrail: PASS')

function stripSqlComments(sql) {
  return sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
}
