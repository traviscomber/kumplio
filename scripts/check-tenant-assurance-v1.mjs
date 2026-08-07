import fs from 'node:fs'

const required = [
  ['app/operations/page.tsx', [
    'Tenant assurance interno',
    'getLatestTenantAssuranceRun',
    'Aislamiento y golden path aprobados.',
    'Golden path del segundo tenant en ejecución.',
    'Abrir expediente de prueba',
  ]],
  ['lib/compliance/assurance/tenant-assurance.ts', [
    'getLatestTenantAssuranceRun',
    "from('tenant_assurance_runs')",
    'primary_organization_id',
    'sandbox_organization_id',
  ]],
  ['supabase/migrations/20260807223000_tenant_assurance_foundation_v1.sql', [
    'tenant_assurance_runs',
    'refresh_tenant_assurance_run_v1',
    "set search_path to ''",
    'tenant assurance browser deny',
    'to service_role',
    "status in ('prepared', 'running', 'passed', 'failed')",
  ]],
  ['supabase/migrations/20260807223500_seed_tenant_assurance_sandbox_v1.sql', [
    'Kumplio Tenant Assurance Sandbox',
    "kumplio_service_account' = 'golden_path_e2e'",
    "set local role authenticated",
    'public.initialize_workspace',
    'public.start_guided_case_record',
    'public.create_case_operational_plan_record',
    'public.finalize_case_baseline_assurance',
    'public.create_processing_activity_inventory_v1',
    'public.enqueue_agent_job',
    'workspace_forbidden',
    'Wrong-tenant server mutation was not denied.',
    'TENANT ASSURANCE PREPARED',
  ]],
  ['scripts/59-verify-tenant-assurance.sql', [
    'begin;',
    'Sandbox user can read primary',
    'Primary user can read sandbox',
    'Wrong-tenant service mutation was not denied.',
    'TENANT ASSURANCE VERIFICATION PASS',
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

const foundation = fs.readFileSync('supabase/migrations/20260807223000_tenant_assurance_foundation_v1.sql', 'utf8')
if (/security\s+definer/i.test(foundation)) {
  throw new Error('Tenant assurance refresh must remain SECURITY INVOKER')
}
if (!foundation.includes('from public, anon, authenticated')) {
  throw new Error('Tenant assurance table and refresh RPC must be revoked from browser roles')
}
if (!foundation.includes('using (false)') || !foundation.includes('with check (false)')) {
  throw new Error('Tenant assurance registry requires explicit browser-deny RLS')
}

const seed = fs.readFileSync('supabase/migrations/20260807223500_seed_tenant_assurance_sandbox_v1.sql', 'utf8')
for (const forbiddenId of [
  'ab928c42-b8f0-44f8-bcf0-d8267398f9b1',
  '05a0536f-2f8b-438f-b945-e685f40af447',
  '044c7969-d8e3-47a6-bb5a-ab25a7fc74e3',
  'f82bba3d-988b-48d4-9893-097f176ae122',
  '91ae9174-be4c-4ddd-8980-4a671571afdc',
  'd2046022-8dad-4c4b-a885-006f9ef2edd9',
]) {
  if (seed.includes(forbiddenId)) throw new Error(`Tenant sandbox must discover IDs dynamically: ${forbiddenId}`)
}

if (!seed.includes("'synthetic', true") || !seed.includes("'scope', 'internal_qa'")) {
  throw new Error('Tenant assurance data must be explicitly marked synthetic and internal')
}
if (!seed.includes('not coalesce((v_guided_second ->> \'resumed\')::boolean, false)')) {
  throw new Error('Guided case retry must be asserted as resumed')
}
if (!seed.includes('not coalesce((v_plan_second ->> \'resumed\')::boolean, false)')) {
  throw new Error('Operational plan retry must be asserted as resumed')
}
if (!seed.includes('not coalesce((v_baseline_second ->> \'resumed\')::boolean, false)')) {
  throw new Error('Baseline retry must be asserted as resumed')
}
if (!seed.includes('not coalesce((v_processing_second ->> \'resumed\')::boolean, false)')) {
  throw new Error('Processing retry must be asserted as resumed')
}

const operations = fs.readFileSync('app/operations/page.tsx', 'utf8')
if (!operations.includes('datos sintéticos') || !operations.includes('cuenta E2E independiente')) {
  throw new Error('Operations UI must disclose that tenant assurance uses synthetic internal data')
}

console.log('Tenant assurance v1 guardrail: PASS')
