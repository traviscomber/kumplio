import fs from 'node:fs'

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
  ['scripts/58-verify-processing-inventory.sql', [
    'begin;',
    'create_processing_activity_inventory_v1',
    'Second verification call was not idempotent',
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

const seed = fs.readFileSync('supabase/migrations/20260807213000_seed_n3uralia_commercial_processing_activity.sql', 'utf8')
for (const forbiddenId of [
  'ab928c42-b8f0-44f8-bcf0-d8267398f9b1',
  '05a0536f-2f8b-438f-b945-e685f40af447',
  'f82bba3d-988b-48d4-9893-097f176ae122',
  '91ae9174-be4c-4ddd-8980-4a671571afdc',
  '81c256bd-0a5e-4663-a96a-67bf7de2008a',
]) {
  if (seed.includes(forbiddenId)) throw new Error(`Supervised seed must discover IDs dynamically: ${forbiddenId}`)
}

const confidence = fs.readFileSync('lib/compliance/confidence.ts', 'utf8')
if (!confidence.includes("maximum: 65, reason: 'el inventario de tratamientos conserva actividades parciales o desconocidos abiertos.'")) {
  throw new Error('Partial processing inventory must cap confidence at 65%')
}

console.log('Processing inventory v1 guardrail: PASS')
