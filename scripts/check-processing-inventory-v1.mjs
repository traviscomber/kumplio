import fs from 'node:fs'

const coreSeedPath = 'supabase/migrations/20260808020905_seed_n3uralia_core_processing_activities_v1.sql'
const obsoleteCoreSeedPath = 'supabase/migrations/20260808023000_seed_n3uralia_core_processing_activities_v1.sql'
const coreVerificationPath = 'scripts/60-verify-n3uralia-core-processing-activities.sql'

const required = [
  ['app/digital-twin/page.tsx', [
    'ProcessingInventoryWorkspace',
    'getWorkspaceAccess',
    'getProcessingInventory',
    'initialRequestKey={randomUUID()}',
  ]],
  ['components/digital-twin/processing-inventory-workspace.tsx', [
    'Inventario de tratamientos',
    'Qué datos usas, para qué y dónde están.',
    'Revisé esta actividad y confirmo que la evidencia solo respalda el alcance declarado.',
    'Entiendo que la base registrada es una propuesta pendiente de validación jurídica.',
    'Lo que todavía no sabemos',
    'SHA-256',
  ]],
  ['app/api/processing-activities/route.ts', [
    'getWorkspaceAccess',
    'access.canAssignWork',
    "rpc('create_processing_activity_inventory_v1'",
    'scopeConfirmed: z.literal(true)',
    'legalBasisIsProposed: z.literal(true)',
  ]],
  ['lib/compliance/digital-twin/processing-inventory.ts', [
    'getProcessingInventory',
    'processing_activity_reviews',
    'activityScore',
    "activity.completeness === 'partial'",
  ]],
  ['lib/compliance/confidence.ts', [
    "key: 'processing_inventory'",
    "key: 'inventory_partial'",
    'desconocidos abiertos',
    'processingActivities',
    'processingReviews',
  ]],
  ['app/insights/page.tsx', [
    'processing_activity_reviews',
    'processingActivities',
    'processingReviews',
    'tratamientos revisados',
  ]],
  ['app/(auth)/sign-up/page.tsx', [
    'supabase.auth.signUp',
    'isStrongPassword',
    'terms_version',
    'privacy_version',
    'legal_accepted_at',
  ]],
  ['lib/agents/openai-runtime.ts', [
    'openai.responses.create',
    "type: 'json_schema'",
    'safety_identifier: safetyIdentifier',
    'store: false',
    'parseAgentOutput',
  ]],
  ['lib/agents/workflow-stage-executor.ts', [
    ".from('agent_runs').insert",
    'context_text: workflowContext',
    'output_payload: result.output',
    ".from('agent_artifacts').insert",
    "status: 'pending_review'",
  ]],
  ['supabase/migrations/20260807204500_processing_activity_inventory_v1.sql', [
    'processing_activity_reviews',
    'processing_activity_evidence',
    'create_processing_activity_inventory_v1',
    "set search_path to ''",
    'pg_advisory_xact_lock',
    'extensions.digest',
    "'operating',",
    "'partial',",
    'to service_role',
  ]],
  ['supabase/migrations/20260807205000_processing_inventory_explicit_browser_deny.sql', [
    'processing activity evidence browser deny',
    'processing activity reviews browser deny',
    'to anon, authenticated',
    'using (false)',
    'with check (false)',
  ]],
  ['supabase/migrations/20260807213000_seed_n3uralia_commercial_processing_activity.sql', [
    'commercial_leads',
    "lower(btrim(organization.name)) = 'n3uralia'",
    "md5(v_organization_id::text || ':commercial-contact-v1')::uuid",
    'Skipping supervised processing seed',
    'second call was not idempotent',
  ]],
  [coreSeedPath, [
    "lower(btrim(organization.name)) = 'n3uralia'",
    "md5(v_organization_id::text || ':account-auth-access-v1')::uuid",
    "md5(v_organization_id::text || ':guided-cases-ai-specialists-v1')::uuid",
    'Gestión de cuentas, autenticación y acceso al workspace',
    'Gestión de expedientes y análisis asistido por especialistas IA',
    'auth.users/auth.identities/auth.sessions/auth.refresh_tokens',
    'Supabase security advisor snapshot 2026-08-07',
    'Verificar y habilitar Leaked Password Protection',
    'lib/agents/openai-runtime.ts',
    'lib/agents/workflow-stage-executor.ts',
    'OpenAI Responses API',
    'v_approved_run_count < 1',
    'store=false está configurado pero no acredita eliminación integral.',
    'No se ha validado mediante piloto humano',
    'Account processing activity second call was not idempotent',
    'AI processing activity second call was not idempotent',
    'N3uralia must expose exactly three supervised real processing activities after the seed.',
  ]],
  ['scripts/58-verify-processing-inventory.sql', [
    'begin;',
    'create_processing_activity_inventory_v1',
    'Second verification call was not idempotent',
    'rollback;',
  ]],
  [coreVerificationPath, [
    'set transaction read only;',
    'Expected exactly three supervised N3uralia processing activities',
    ':account-auth-access-v1',
    ':guided-cases-ai-specialists-v1',
    'cardinality(review.unknowns)',
    '= any(review.unknowns)',
    'Account activity review does not preserve its partial scope and security unknowns.',
    'AI activity review does not preserve its partial scope and privacy unknowns.',
    'one tenant-scoped Supabase asset/vendor chain',
    'one tenant-scoped OpenAI asset/vendor chain',
    'AI evidence has no approved run.',
    "'status', 'passed'",
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

if (fs.existsSync(obsoleteCoreSeedPath)) {
  throw new Error(`Obsolete duplicate migration timestamp remains: ${obsoleteCoreSeedPath}`)
}

const migration = fs.readFileSync('supabase/migrations/20260807204500_processing_activity_inventory_v1.sql', 'utf8')
if (/security\s+definer/i.test(migration)) throw new Error('Processing inventory RPC must remain SECURITY INVOKER')
if (!migration.includes('from public, anon, authenticated')) throw new Error('Processing inventory RPC/table access must be revoked from browser roles')

const route = fs.readFileSync('app/api/processing-activities/route.ts', 'utf8')
if (route.includes(".from('organization_processes').insert") || route.includes(".from('processing_activity_reviews').insert")) {
  throw new Error('The browser route must not bypass the atomic RPC')
}

const page = fs.readFileSync('app/digital-twin/page.tsx', 'utf8')
if (page.includes(".eq('user_id', user.id).limit(1)")) {
  throw new Error('Digital twin must use the explicit active workspace')
}

const supervisedSeedPaths = [
  'supabase/migrations/20260807213000_seed_n3uralia_commercial_processing_activity.sql',
  coreSeedPath,
]
const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
for (const seedPath of supervisedSeedPaths) {
  const seed = fs.readFileSync(seedPath, 'utf8')
  const literalIds = [...new Set(seed.match(uuidPattern) || [])]
  if (literalIds.length) {
    throw new Error(`${seedPath} must discover production IDs dynamically: ${literalIds.join(', ')}`)
  }
}

const coreSeed = fs.readFileSync(coreSeedPath, 'utf8')
if ((coreSeed.match(/create_processing_activity_inventory_v1/g) || []).length !== 4) {
  throw new Error('Core N3uralia seed must call the atomic RPC exactly twice per activity')
}
if ((coreSeed.match(/'decision', 'approved'/g) || []).length !== 2) {
  throw new Error('Both new activity payloads must preserve an explicit approved inventory review')
}
if ((coreSeed.match(/'completeness', 'partial'/g) || []).length !== 2) {
  throw new Error('Both new activity payloads must remain partial')
}
if ((coreSeed.match(/second call was not idempotent/g) || []).length !== 2) {
  throw new Error('Both new activities must prove RPC idempotency')
}
for (const forbidden of [
  /'completeness',\s*'complete'/i,
  /'basisStatus',\s*'validated'/i,
  /cumplimiento\s+integral/i,
  /sin\s+datos\s+sensibles/i,
]) {
  if (forbidden.test(coreSeed)) throw new Error(`Core N3uralia seed overstates its evidence: ${forbidden}`)
}

const verification = fs.readFileSync(coreVerificationPath, 'utf8')
if (!/rollback;\s*$/i.test(verification.trim())) {
  throw new Error('Core N3uralia verification must end in ROLLBACK')
}
if (/\b(insert|update|delete|merge|truncate|alter|drop|create)\b/i.test(stripSqlComments(verification))) {
  throw new Error('Core N3uralia verification must remain read-only')
}
if (verification.includes('create_processing_activity_inventory_v1')) {
  throw new Error('Read-only verification must not call the inventory mutation RPC')
}
if (verification.includes('jsonb_array_length(review.unknowns)') || verification.includes('review.unknowns ?')) {
  throw new Error('processing_activity_reviews.unknowns is text[]; verification must use cardinality and ANY')
}
const verificationLiteralIds = [...new Set(verification.match(uuidPattern) || [])]
if (verificationLiteralIds.length) {
  throw new Error(`Core verification must discover IDs dynamically: ${verificationLiteralIds.join(', ')}`)
}
for (const missingBridgeColumn of [
  'organization_process_datasets link\n  where link.organization_id',
  'organization_process_assets link\n  where link.organization_id',
  'organization_vendor_assets vendor_asset\n  where vendor_asset.organization_id',
]) {
  if (verification.includes(missingBridgeColumn)) {
    throw new Error(`Verification references a tenant column that does not exist on a bridge table: ${missingBridgeColumn}`)
  }
}

const confidence = fs.readFileSync('lib/compliance/confidence.ts', 'utf8')
if (!confidence.includes("maximum: 65, reason: 'el inventario de tratamientos conserva actividades parciales o desconocidos abiertos.'")) {
  throw new Error('Partial processing inventory must cap confidence at 65%')
}

console.log('Processing inventory v1 guardrail: PASS')

function stripSqlComments(sql) {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}
