import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync('lib/agents/orchestration.ts', 'utf8')

assert.ok(source.includes('WORKFLOW_DEFINITIONS_V1'), 'historical v1 workflow catalog must remain available')
assert.ok(source.includes('WORKFLOW_DEFINITIONS_V2'), 'new v2 workflow catalog must exist')
assert.ok(source.includes("version: 'v2'"), 'v2 workflow definitions must be explicit')
assert.ok(source.includes("agentId: 'isidora'"), 'v2 analysis must use Isidora')
assert.ok(source.includes("agentId: 'veronica'"), 'v2 resolution must use Veronica')
assert.ok(source.includes("agentId: 'catalina'"), 'v2 review must preserve Julieta historical id')
assert.ok(source.includes("agentId: 'rodrigo'"), 'historical v1 must remain readable')
assert.ok(source.includes("agentId: 'javier'"), 'historical v1 must remain readable')

console.log('Three-agent workflow versioning: PASS')
