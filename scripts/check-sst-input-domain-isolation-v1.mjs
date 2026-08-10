import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const tools = readFileSync('lib/agents/tools.ts', 'utf8')

for (const token of [
  'hasSstGrounding',
  'SST_GENERIC_TOOL_SKIP',
  "isidora: new Set(['read_obligations'])",
  'sstSkippedTools?.has(tool.name)',
  "status: 'skipped'",
  "reason: 'sst_case_domain_isolation'",
  "groundingTool: 'read_sst_regulatory_grounding'",
]) {
  assert.ok(tools.includes(token), `SST input isolation missing required token: ${token}`)
}

const groundingPosition = tools.indexOf('retrieveSstRegulatoryGrounding(supabase, scope)')
const loopPosition = tools.indexOf('for (const tool of TOOL_REGISTRY[scope.agentId])')
assert.ok(groundingPosition >= 0 && loopPosition > groundingPosition, 'SST grounding must be resolved before generic tool loop')
assert.ok(tools.includes("{ name: 'read_obligations', table: 'obligations', limit: 40 }"), 'Generic obligations tool must remain available outside SST-isolated paths')
assert.ok(tools.includes('source_refs: []'), 'Skipped SST cross-domain tools must emit no source refs')

console.log('SST input domain isolation contract: PASS')
