import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const tools = readFileSync('lib/agents/tools.ts', 'utf8')

for (const token of [
  'SST_SCOPED_TOOLS',
  'DOMAIN_FILTERABLE_TOOLS',
  'SST_ALLOWED_PROJECT_DOMAINS',
  "rodrigo: new Set(['read_obligations', 'read_risks', 'read_controls'])",
  "javier: new Set(['read_risks', 'read_findings', 'read_actions'])",
  "veronica: new Set(['read_controls', 'read_evidence', 'read_findings'])",
  "catalina: new Set(['read_obligations', 'read_controls', 'read_evidence', 'read_risks', 'read_findings', 'read_actions'])",
  "reason: 'sst_case_domain_isolation'",
  "groundingTool: 'read_sst_regulatory_grounding'",
  "parserVersion: 'sst-ds44-suseso-v4'",
]) {
  assert.ok(tools.includes(token), `Missing SST committee isolation contract: ${token}`)
}

const groundingIndex = tools.indexOf('sstGrounding = await retrieveSstRegulatoryGrounding')
const loopIndex = tools.indexOf('for (const tool of TOOL_REGISTRY[scope.agentId])')
assert.ok(groundingIndex >= 0 && loopIndex > groundingIndex, 'SST grounding must be resolved before generic project tools')
assert.ok(tools.includes('needsSstScope && !DOMAIN_FILTERABLE_TOOLS.has(tool.name)'), 'Unfilterable SST tools must be skipped before queryTool')
assert.ok(tools.includes('allowedDomains: SST_ALLOWED_PROJECT_DOMAINS'), 'Domain-capable SST tools must use the SST/general allowlist')
assert.ok(tools.includes("source_refs: []"), 'Skipped cross-domain tools must not emit source refs')

console.log('SST committee domain isolation contract: PASS')
