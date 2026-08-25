import fs from 'node:fs'

const migration = 'supabase/migrations/20260825010000_contextual_onboarding_v2.sql'
const required = {
  [migration]: [
    'initialize_contextual_workspace_v2', 'set search_path to', 'pg_advisory_xact_lock',
    'p_actor_user_id', "set_config('request.jwt.claim.sub'", 'private.initialize_workspace', 'organization_compliance_profiles',
    'onboarding:v2:', 'organization_audit_events', 'to service_role',
    "'persona'", "'profesional'", "'empresa'", "'not_verified'",
  ],
  'app/api/onboarding/initialize/route.ts': [
    'buildInitialDiagnosis', 'createAdminClient', 'z.discriminatedUnion', "rpc('initialize_contextual_workspace_v2'",
    'p_actor_user_id:', 'p_user_type:', 'p_problem:', 'p_intent:', 'p_urgency:',
    'p_documents_available:', 'p_context:', 'p_diagnosis:', 'p_first_name:', 'p_last_name:', "code: 'invalid_request'",
    "error?.code === 'PGRST202'", "rpc('initialize_workspace'", 'legacyWorkspaceFallback',
  ],
}

for (const [file, markers] of Object.entries(required)) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`)
  const text = fs.readFileSync(file, 'utf8')
  for (const marker of markers) if (!text.includes(marker)) throw new Error(`${file} missing marker: ${marker}`)
}

const route = fs.readFileSync('app/api/onboarding/initialize/route.ts', 'utf8')
if ((route.match(/\.rpc\('initialize_contextual_workspace_v2'/g) || []).length !== 1) throw new Error('Route must call contextual initialization exactly once')
const migrationSource = fs.readFileSync('supabase/migrations/20260825010000_contextual_onboarding_v2.sql', 'utf8')
if (/grant execute on function private\.initialize_contextual_workspace_v2[\s\S]*to authenticated/i.test(migrationSource)) throw new Error('Trusted implementation must not be executable by authenticated browser roles')
if (!/grant execute on function public\.initialize_contextual_workspace_v2[\s\S]*to service_role/i.test(migrationSource)) throw new Error('Contextual initializer must be service-role only')
if (!migrationSource.includes("attributes->>'onboardingKey' = v_onboarding_key") || !migrationSource.includes("status = 'active', effective_to = null")) throw new Error('Retry must reactivate/reuse the matching profile')
console.log('Contextual onboarding persistence contract: PASS')
