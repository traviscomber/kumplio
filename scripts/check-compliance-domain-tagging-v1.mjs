import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const tools = readFileSync('lib/agents/tools.ts', 'utf8')
const migration = readFileSync('supabase/migrations/20260810023549_compliance_domain_tagging_v1.sql', 'utf8')

for (const table of ['obligations', 'risks', 'controls', 'evidence']) {
  assert.ok(migration.includes(`alter table public.${table}`), `migration missing ${table}`)
}
for (const domain of ['unknown', 'general', 'privacy', 'sst', 'environment', 'procurement', 'contract']) {
  assert.ok(migration.includes(`'${domain}'`), `migration missing domain ${domain}`)
}
for (const token of [
  'compliance_domain',
  "['sst', 'general']",
  'DOMAIN_FILTERABLE_TOOLS',
  'SST_SCOPED_TOOLS',
  'sst_case_domain_isolation',
  'domainFilter',
]) {
  assert.ok(tools.includes(token), `tools missing domain-tagging token: ${token}`)
}
assert.ok(tools.includes("query.in('compliance_domain', options.allowedDomains)"), 'SST retrieval must use compliance_domain filtering')
assert.ok(!tools.includes("['sst', 'general', 'privacy']"), 'privacy must never be included in SST retrieval')
assert.ok(!tools.includes("['sst', 'general', 'unknown']"), 'unknown must never be included in SST retrieval')
console.log('Compliance domain tagging contract: PASS')
