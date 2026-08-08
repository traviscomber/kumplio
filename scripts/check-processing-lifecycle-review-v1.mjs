import fs from 'node:fs'

const foundationPath = 'supabase/migrations/20260808050000_processing_activity_lifecycle_review_v1.sql'
const seedPath = 'supabase/migrations/20260808051000_seed_n3uralia_processing_lifecycle_reviews_v1.sql'
const verificationPath = 'scripts/61-verify-n3uralia-processing-lifecycle-reviews.sql'

const required = [
  [foundationPath, [
    'processing_activity_lifecycle_reviews',
    'review_processing_activity_lifecycle_v1',
    "set search_path to ''",
    'pg_advisory_xact_lock',
    'supersedes_id',
    'unique (process_id, version)',
    'processing_activity_lifecycle_approved_check',
    'processing activity lifecycle review',
    "'processing_activity_lifecycle_reviewed'",
    'create_evidence_record',
    'extensions.digest',
    'to service_role, postgres',
  ]],
  ['app/api/processing-activities/[processId]/lifecycle-review/route.ts', [
    'getWorkspaceAccess',
    'access.canAssignWork',
    "rpc('review_processing_activity_lifecycle_v1'",
    'scopeConfirmed: z.literal(true)',
    'legalDecisionConfirmed: z.literal(true)',
    "decision: z.enum(['approved', 'changes_requested', 'rejected'])",
    'Approved lifecycle review cannot retain',
  ]],
  ['lib/compliance/digital-twin/processing-inventory.ts', [
    'ProcessingLifecycleReview',
    'processing_activity_lifecycle_reviews',
    'lifecycleReview',
    'lifecycleNeedsChanges',
    "activity.lifecycleReview?.statuses.basis === 'validated'",
    "return Math.min(score, 65)",
  ]],
  ['components/digital-twin/processing-lifecycle-review-workspace.tsx', [
    'Cinco decisiones que no deben mezclarse.',
    'Base jurídica',
    'Retención',
    'Destinatarios',
    'Subencargados',
    'Transferencias',
    'Nueva versión',
    'La versión anterior no se sobrescribe.',
  ]],
  ['app/digital-twin/page.tsx', [
    'ProcessingLifecycleReviewWorkspace',
    'activities={inventory.activities}',
    'canManage={access.canAssignWork}',
  ]],
  [seedPath, [
    'Gestión de contactos comerciales y solicitudes de demostración',
    'Gestión de cuentas, autenticación y acceso al workspace',
    'Gestión de expedientes y análisis asistido por especialistas IA',
    "'changes_requested'",
    'PIPEDRIVE_WEBHOOK_URL no está configurado',
    'review_processing_activity_lifecycle_v1',
    'second call was not idempotent',
    'exactly three lifecycle reviews',
  ]],
  [verificationPath, [
    'set transaction read only;',
    'exactly three lifecycle reviews',
    'cardinality(review.unknowns)',
    "review.decision = 'changes_requested'",
    'evidence.integrity_hash = review.snapshot_hash',
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

const foundation = fs.readFileSync(foundationPath, 'utf8')
if (/security\s+definer/i.test(foundation)) throw new Error('Lifecycle review RPC must remain SECURITY INVOKER')
if (!foundation.includes('revoke all on table public.processing_activity_lifecycle_reviews from public, anon, authenticated')) {
  throw new Error('Lifecycle review table must remain unavailable to browser roles')
}
if (!foundation.includes('for all\n  to anon, authenticated\n  using (false)\n  with check (false)')) {
  throw new Error('Lifecycle review table must keep an explicit browser deny policy')
}
if (!foundation.includes("decision <> 'approved'") || !foundation.includes('cardinality(unknowns) = 0')) {
  throw new Error('Approved lifecycle reviews must be blocked while unknowns remain')
}
if (!foundation.includes('review.request_key = p_request_key') || !foundation.includes('snapshot_hash is distinct from v_snapshot_hash')) {
  throw new Error('Lifecycle review idempotency contract is missing')
}
if (!foundation.includes('review.supersedes_id')) {
  throw new Error('Retry and version snapshot must preserve supersedes_id')
}

const route = fs.readFileSync('app/api/processing-activities/[processId]/lifecycle-review/route.ts', 'utf8')
if (route.includes(".from('processing_activity_lifecycle_reviews').insert")) {
  throw new Error('Lifecycle API must not bypass the atomic RPC')
}
if (!route.includes(".eq('organization_id', access.organizationId)")) {
  throw new Error('Lifecycle API must validate the active tenant')
}

const component = fs.readFileSync('components/digital-twin/processing-lifecycle-review-workspace.tsx', 'utf8')
if (!component.includes("decision === 'approved'") || !component.includes('scopeConfirmed') || !component.includes('legalDecisionConfirmed')) {
  throw new Error('Lifecycle UI must preserve explicit human approval boundaries')
}

const seed = fs.readFileSync(seedPath, 'utf8')
if ((seed.match(/review_processing_activity_lifecycle_v1/g) || []).length !== 6) {
  throw new Error('N3uralia lifecycle seed must call the RPC twice for each of three activities')
}
if ((seed.match(/'decision', 'changes_requested'/g) || []).length !== 3) {
  throw new Error('The supervised lifecycle seed must preserve changes_requested for all three activities')
}
for (const forbidden of [
  /'decision',\s*'approved'/i,
  /'basis',\s*jsonb_build_object\(\s*'status',\s*'validated'/i,
  /'retention',\s*jsonb_build_object\(\s*'status',\s*'validated'/i,
  /cumplimiento\s+integral/i,
]) {
  if (forbidden.test(seed)) throw new Error(`Lifecycle seed overstates its evidence: ${forbidden}`)
}

const verification = fs.readFileSync(verificationPath, 'utf8')
if (!/rollback;\s*$/i.test(verification.trim())) throw new Error('Lifecycle verification must end in ROLLBACK')
if (/\b(insert|update|delete|merge|truncate|alter|drop|create)\b/i.test(stripSqlComments(verification))) {
  throw new Error('Lifecycle verification must remain read-only')
}

console.log('Processing lifecycle review guardrail: PASS')

function stripSqlComments(sql) {
  return sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
}
