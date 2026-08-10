import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const tools = readFileSync('lib/agents/tools.ts', 'utf8')

for (const token of [
  'hasSstGrounding',
  'SST_SCOPED_TOOLS',
  'DOMAIN_FILTERABLE_TOOLS',
  'SST_ALLOWED_PROJECT_DOMAINS',
  "reason: 'sst_case_domain_isolation'",
  "groundingTool: 'read_sst_regulatory_grounding'",
  'domainFilterUnavailable: true',
  'allowedDomains: SST_ALLOWED_PROJECT_DOMAINS',
]) {
  assert.ok(tools.includes(token), `SST input isolation missing required token: ${token}`)
}

const groundingPosition = tools.indexOf('retrieveSstRegulatoryGrounding(supabase, scope)')
const loopPosition = tools.indexOf('for (const tool of TOOL_REGISTRY[scope.agentId])')
assert.ok(groundingPosition >= 0 && loopPosition > groundingPosition, 'SST grounding must be resolved before generic tool loop')
assert.ok(tools.includes("query.in('compliance_domain', options.allowedDomains)"), 'Domain-capable SST tools must filter by compliance_domain')
assert.ok(tools.includes('source_refs: []'), 'Unsafe unfilterable SST tools must emit no source refs')

console.log('SST input domain isolation contract: PASS')
