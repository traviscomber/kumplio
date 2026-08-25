import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const checks = [
  ['scripts/check-three-agent-workflow-versioning-v1.mjs'],
  ['scripts/check-three-agent-analysis-contract-v1.mjs'],
  ['scripts/check-three-agent-resolution-contract-v1.mjs'],
  ['scripts/test-three-agent-specialist-routing.mjs'],
  ['scripts/check-three-agent-context-budget-v1.mjs'],
  ['scripts/check-three-agent-historical-compat-v1.mjs'],
  ['scripts/check-three-agent-ui-v1.mjs'],
]

for (const args of checks) execFileSync(process.execPath, args, { stdio: 'inherit' })

const packageJson = fs.readFileSync('package.json', 'utf8')
assert.ok(packageJson.includes('"check:three-agent-core"'), 'package.json missing check:three-agent-core script')

const orchestration = fs.readFileSync('lib/agents/orchestration.ts', 'utf8')
const route = fs.readFileSync('app/api/agents/workflows/route.ts', 'utf8')
const ui = fs.readFileSync('components/cases/case-specialist-contributions.tsx', 'utf8')

assert.ok(orchestration.includes("agentId: 'isidora'"), 'analysis stage missing Isidora')
assert.ok(orchestration.includes("agentId: 'veronica'"), 'resolution stage missing Veronica')
assert.ok(orchestration.includes("agentId: 'catalina'"), 'review stage missing Julieta historical id')
assert.ok(route.includes("getWorkflowDefinition(parsed.data.workflowType, 'v2')"), 'new workflow creation must stay on v2')
assert.ok(ui.includes('Apoyo especializado'), 'optional specialist support surface missing')

console.log('Three-agent core orchestration: PASS')
