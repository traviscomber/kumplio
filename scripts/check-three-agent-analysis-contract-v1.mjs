import assert from 'node:assert/strict'
import fs from 'node:fs'

const schemaSource = fs.readFileSync('lib/agents/schemas.ts', 'utf8')
const promptSource = fs.readFileSync('lib/agents/prompts.ts', 'utf8')

for (const marker of ['riskTriage', 'materiality', 'urgency', 'assumptions', 'requiresDedicatedRiskAnalysis']) {
  assert.ok(schemaSource.includes(marker), `Isidora analysis schema missing marker: ${marker}`)
}

assert.ok(promptSource.includes('triage de riesgo'), 'Isidora prompt must own bounded risk triage')
assert.ok(promptSource.includes('no sustituye un análisis cuantitativo dedicado'), 'Isidora prompt must preserve Rodrigo escalation boundary')

console.log('Three-agent analysis contract: PASS')
