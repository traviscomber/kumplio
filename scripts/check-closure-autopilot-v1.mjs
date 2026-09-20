import assert from 'node:assert/strict'
import fs from 'node:fs'

const route = fs.readFileSync('app/api/agents/workflows/[workflowId]/closure-plan/route.ts', 'utf8')
const ui = fs.readFileSync('components/agent-workflow-console.tsx', 'utf8')

for (const marker of [
  "mode: 'human_controlled_autopilot'",
  "needsHuman",
  "waitingForEvidence",
  "canContinueWithoutHuman",
  "No action is verified automatically",
]) assert.ok(route.includes(marker), `Safe autopilot route missing: ${marker}`)

for (const marker of [
  'Kumplio está trabajando',
  'requieren decisión',
  'esperan evidencia',
  'Kumplio no presumirá que están resueltas',
]) assert.ok(ui.includes(marker), `Safe autopilot UI missing: ${marker}`)

assert.ok(route.includes("['ready_for_review', 'changes_requested']"), 'Human review states must stay explicit')
assert.ok(route.includes("verification_status === 'verified'"), 'Verified closure must remain explicit')

console.log('Closure Autopilot v1 safety contract: PASS')
