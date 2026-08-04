import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const coreMigration = await readFile(
  'supabase/migrations/20260804130000_compliance_core_v1.sql',
  'utf8',
)
const evaluatorMigration = await readFile(
  'supabase/migrations/20260804143000_compliance_applicability_evaluator_v1.sql',
  'utf8',
)
const candidateRulesMigration = await readFile(
  'supabase/migrations/20260804160000_ley21719_candidate_applicability_rules_v1.sql',
  'utf8',
)

for (const table of [
  'organization_compliance_profiles',
  'compliance_applicability_rules',
  'organization_obligation_assignments',
  'regulatory_impact_runs',
  'regulatory_impact_changes',
]) {
  assert.match(coreMigration, new RegExp(`create table if not exists public[.]${table}`))
  assert.match(coreMigration, new RegExp(`alter table public[.]${table} enable row level security`))
  assert.match(coreMigration, new RegExp(`grant all on public[.]${table} to service_role`))
}

assert.match(coreMigration, /requires_human_review boolean not null default true/)
assert.match(coreMigration, /validation_status text not null default 'pending'/)
assert.match(coreMigration, /unique \(organization_id, profile_version\)/)
assert.match(coreMigration, /unique \(organization_id, assignment_key\)/)
assert.match(coreMigration, /idempotency_key text not null unique/)
assert.match(coreMigration, /queue_regulatory_impact_run/)
assert.match(coreMigration, /security invoker/i)
assert.match(coreMigration, /set search_path = ''/)
assert.match(coreMigration, /extensions[.]digest/)
assert.match(coreMigration, /on conflict \(idempotency_key\) do update/)
assert.match(coreMigration, /revoke all on function public[.]queue_regulatory_impact_run/)
assert.match(coreMigration, /grant execute on function public[.]queue_regulatory_impact_run[\s\S]*to service_role/)
assert.doesNotMatch(coreMigration, /security definer/i)
assert.doesNotMatch(coreMigration, /grant execute[\s\S]*to (?:public|anon|authenticated)/i)

assert.match(evaluatorMigration, /private[.]evaluate_compliance_conditions/)
assert.match(evaluatorMigration, /public[.]run_regulatory_impact/)
assert.match(evaluatorMigration, /validation_status = 'validated'/)
assert.match(evaluatorMigration, /c[.]validation_status = 'validated'/)
assert.match(evaluatorMigration, /unknown_condition/)
assert.match(evaluatorMigration, /needs_review/)
assert.match(evaluatorMigration, /industry_any/)
assert.match(evaluatorMigration, /region_any/)
assert.match(evaluatorMigration, /employee_count_min/)
assert.match(evaluatorMigration, /annual_revenue_clp_min/)
assert.match(evaluatorMigration, /attributes_contains/)
assert.match(evaluatorMigration, /v_assignment_key := encode\(extensions[.]digest/)
assert.match(evaluatorMigration, /last_evaluated_at = now\(\)/)
assert.match(evaluatorMigration, /regulatory_impact_changes/)
assert.match(evaluatorMigration, /v_created = 0 and v_updated = 0 then 'unchanged'/)
assert.match(evaluatorMigration, /security invoker/gi)
assert.match(evaluatorMigration, /set search_path = ''/g)
assert.match(evaluatorMigration, /revoke all on function private[.]evaluate_compliance_conditions/)
assert.match(evaluatorMigration, /revoke all on function public[.]run_regulatory_impact/)
assert.match(evaluatorMigration, /grant execute on function public[.]run_regulatory_impact[\s\S]*to service_role/)
assert.doesNotMatch(evaluatorMigration, /security definer/i)
assert.doesNotMatch(evaluatorMigration, /grant execute[\s\S]*to (?:public|anon|authenticated)/i)

assert.match(candidateRulesMigration, /generate_ley21719_candidate_rules_v1/)
assert.match(candidateRulesMigration, /preview_organization_applicability_v1/)
assert.match(candidateRulesMigration, /canonical_identifier = 'LEY-21719'/)
assert.match(candidateRulesMigration, /validation_status = 'pending'/)
assert.match(candidateRulesMigration, /requires_human_review = true/)
assert.match(candidateRulesMigration, /rule_key like 'ley21719[.]%'/)
assert.match(candidateRulesMigration, /on conflict \(rule_key, rule_version\) do nothing/)
assert.match(candidateRulesMigration, /private[.]evaluate_compliance_conditions/)
assert.match(candidateRulesMigration, /revoke all on function public[.]generate_ley21719_candidate_rules_v1/)
assert.match(candidateRulesMigration, /revoke all on function public[.]preview_organization_applicability_v1/)
assert.match(candidateRulesMigration, /grant execute on function public[.]preview_organization_applicability_v1[\s\S]*to service_role/)
assert.doesNotMatch(candidateRulesMigration, /security definer/i)
assert.doesNotMatch(candidateRulesMigration, /grant execute[\s\S]*to (?:public|anon|authenticated)/i)

console.log('Compliance Core v1 validation passed')
