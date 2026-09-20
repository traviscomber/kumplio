import assert from 'node:assert/strict'
import fs from 'node:fs'

const home = fs.readFileSync('app/dashboard/daily-content.tsx', 'utf8')
const route = fs.readFileSync('app/app/casos/[id]/cierre/page.tsx', 'utf8')
const consoleSource = fs.readFileSync('components/agent-workflow-console.tsx', 'utf8')
const model = fs.readFileSync('lib/product/home/authenticated-home.ts', 'utf8')

for (const marker of [
  "from('compliance_action_plans')",
  ".eq('organization_id', organizationId)",
  ".not('source_snapshot_id', 'is', null)",
  ".neq('status', 'completed')",
  "from('compliance_action_plan_tasks')",
  ".neq('verification_status', 'verified')",
  'closureNextAction',
  '/cierre',
]) {
  assert.ok(home.includes(marker), `Inicio closure continuity missing marker: ${marker}`)
}

assert.ok(model.includes('const nextAction = closureNextAction'), 'Approved closure work must outrank generic priorities on Inicio')
assert.ok(model.includes("href.startsWith('/app/')"), 'Closure navigation must remain inside canonical /app surface')

for (const marker of [
  "from('organization_members')",
  ".eq('user_id', user.id)",
  ".eq('organization_id', organizationId)",
  "from('compliance_cases')",
  "from('agent_workflows')",
  '<AgentWorkflowConsole',
  'initialWorkflowId={workflow?.id ||',
]) {
  assert.ok(route.includes(marker), `Canonical closure route missing marker: ${marker}`)
}

assert.ok(route.includes('/sign-in?next=/app/casos/'), 'Closure auth redirect must preserve canonical return path')
assert.ok(consoleSource.includes("initialWorkflowId = ''"), 'Workflow console must accept an explicit workflow target')
assert.ok(consoleSource.includes('useState(initialWorkflowId)'), 'Workflow console must open the intended workflow directly')

for (const forbidden of ['/dashboard/agents', '/agents/workflows?workflow=', 'compliance score', 'cumplimiento total']) {
  assert.ok(!home.toLowerCase().includes(forbidden.toLowerCase()), `Inicio must not regress to technical or unsupported surface: ${forbidden}`)
}

console.log('Verified closure continuity from Inicio: PASS')
