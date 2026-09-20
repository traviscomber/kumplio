import assert from 'node:assert/strict'
import fs from 'node:fs'
const route = fs.readFileSync('app/api/agents/workflows/[workflowId]/closure-plan/route.ts', 'utf8')
const ui = fs.readFileSync('components/agent-workflow-console.tsx', 'utf8')
for (const marker of ['safePreparations', 'prepare_evidence_context', 'requiresHumanVerification: true', "validation_status === 'accepted'", "integrity_status === 'verified'"]) assert.ok(route.includes(marker), `Executable autopilot guard missing: ${marker}`)
assert.ok(ui.includes('ya tienen contexto verificable preparado'))
assert.ok(!route.includes("verification_status = 'verified'"), 'Autopilot must not auto-verify closure')
console.log('Executable Autopilot v1 contract: PASS')
