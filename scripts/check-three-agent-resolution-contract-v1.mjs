import assert from 'node:assert/strict'
import fs from 'node:fs'

const schemaSource = fs.readFileSync('lib/agents/schemas.ts', 'utf8')
const promptSource = fs.readFileSync('lib/agents/prompts.ts', 'utf8')

for (const marker of ['remediationActions', 'ownerRole', 'dependencies', 'closureCriteria', 'requiresDedicatedPlan']) {
  assert.ok(schemaSource.includes(marker), `Veronica resolution schema missing marker: ${marker}`)
}
assert.ok(promptSource.includes('acciones correctivas'), 'Veronica prompt must own routine remediation')
assert.ok(promptSource.includes('escala a Javier'), 'Veronica prompt must preserve Javier escalation boundary')

console.log('Three-agent resolution contract: PASS')
