import assert from 'node:assert/strict'
import fs from 'node:fs'

const orchestration = fs.readFileSync('lib/agents/orchestration.ts', 'utf8')
const executor = fs.readFileSync('lib/agents/workflow-stage-executor.ts', 'utf8')
const route = fs.readFileSync('app/api/agents/workflows/route.ts', 'utf8')
const catalog = fs.readFileSync('lib/agents/catalog.ts', 'utf8')

for (const marker of ['WORKFLOW_DEFINITIONS_V1', 'WORKFLOW_DEFINITIONS_V2', 'resolveWorkflowVersion']) {
  assert.ok(orchestration.includes(marker), `historical compatibility missing marker: ${marker}`)
}

for (const id of ['isidora', 'rodrigo', 'javier', 'beatriz', 'veronica', 'andres', 'catalina']) {
  assert.ok(catalog.includes(`'${id}'`), `historical agent id missing: ${id}`)
}

assert.ok(executor.includes('resolveWorkflowVersion'), 'executor must resolve persisted workflow version')
assert.ok(route.includes("getWorkflowDefinition(parsed.data.workflowType, 'v2')"), 'new workflow creation must explicitly use v2')
assert.ok(route.includes("getWorkflowTemplates('v2')"), 'workflow template listing must explicitly use v2')
assert.ok(!route.includes("getWorkflowDefinition(parsed.data.workflowType, 'v1')"), 'new workflow creation must never default to v1')

console.log('Three-agent historical compatibility: PASS')
