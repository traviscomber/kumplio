import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const hardening = await readFile(
  'supabase/migrations/20260805222000_harden_exposed_operational_tables.sql',
  'utf8',
)
const membershipHelper = await readFile(
  'supabase/migrations/20260805223000_fix_organization_membership_policy_recursion.sql',
  'utf8',
)
const membershipPolicy = await readFile(
  'supabase/migrations/20260805224000_fix_organization_members_policy.sql',
  'utf8',
)

const protectedTables = [
  'compliance_action_plan_items',
  'document_intelligence',
  'compliance_gaps',
  'vendor_compliance_assessments',
  'audit_preparation_packages',
  'compliance_events',
  'automation_rules',
  'compliance_situations',
  'context_nodes',
  'context_edges',
  'organization_memory',
]

for (const table of protectedTables) {
  assert.match(hardening, new RegExp(`'${table}'`))
}

assert.match(hardening, /alter table public[.]%I enable row level security/)
assert.match(hardening, /revoke all on table public[.]%I from anon/)
assert.match(hardening, /grant select, insert, update, delete on table public[.]%I to authenticated/)
assert.match(hardening, /public[.]is_organization_member\(organization_id\)/)

for (const routine of [
  'capture_decision_memory',
  'capture_situation_context_node',
  'publish_decision_resolved_event',
  'publish_mission_completed_event',
  'generate_compliance_action_plan_v1',
  'prepare_audit_package_v1',
  'refresh_compliance_gaps_v1',
  'refresh_vendor_assessments_v1',
]) {
  assert.match(hardening, new RegExp(`revoke all on function public[.]${routine}`))
  assert.match(hardening, new RegExp(`grant execute on function public[.]${routine}`))
}

assert.match(membershipHelper, /create or replace function public[.]is_organization_member/)
assert.match(membershipHelper, /security definer/)
assert.match(membershipHelper, /set search_path = ''/)
assert.match(membershipHelper, /membership[.]user_id = \(select auth[.]uid\(\)\)/)
assert.match(membershipHelper, /revoke all on function public[.]is_organization_member\(uuid\) from public, anon/)

assert.match(membershipPolicy, /drop policy if exists members_read_own/)
assert.match(membershipPolicy, /to authenticated/)
assert.match(membershipPolicy, /public[.]is_organization_member\(organization_id\)/)
assert.doesNotMatch(membershipPolicy, /organization_id in \(\s*select/)
assert.match(membershipPolicy, /revoke all on table public[.]organization_members from anon/)

console.log('Operational security v1 validation passed')
