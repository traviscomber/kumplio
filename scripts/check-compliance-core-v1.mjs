import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migration = await readFile(
  'supabase/migrations/20260804130000_compliance_core_v1.sql',
  'utf8',
)

for (const table of [
  'organization_compliance_profiles',
  'compliance_applicability_rules',
  'organization_obligation_assignments',
  'regulatory_impact_runs',
  'regulatory_impact_changes',
]) {
  assert.match(migration, new RegExp(`create table if not exists public[.]${table}`))
  assert.match(migration, new RegExp(`alter table public[.]${table} enable row level security`))
  assert.match(migration, new RegExp(`grant all on public[.]${table} to service_role`))
}

assert.match(migration, /requires_human_review boolean not null default true/)
assert.match(migration, /validation_status text not null default 'pending'/)
assert.match(migration, /unique \(organization_id, profile_version\)/)
assert.match(migration, /unique \(organization_id, assignment_key\)/)
assert.match(migration, /idempotency_key text not null unique/)
assert.match(migration, /queue_regulatory_impact_run/)
assert.match(migration, /security invoker/i)
assert.match(migration, /set search_path = ''/)
assert.match(migration, /extensions[.]digest/)
assert.match(migration, /on conflict \(idempotency_key\) do update/)
assert.match(migration, /revoke all on function public[.]queue_regulatory_impact_run/)
assert.match(migration, /grant execute on function public[.]queue_regulatory_impact_run[\s\S]*to service_role/)
assert.doesNotMatch(migration, /security definer/i)
assert.doesNotMatch(migration, /grant execute[\s\S]*to (?:public|anon|authenticated)/i)

console.log('Compliance Core v1 validation passed')
