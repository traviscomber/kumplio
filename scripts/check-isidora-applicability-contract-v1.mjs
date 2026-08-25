import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const schemas = readFileSync('lib/agents/schemas.ts', 'utf8')
const prompts = readFileSync('lib/agents/prompts.ts', 'utf8')

for (const token of [
  "applicabilityToClient: z.enum(['direct', 'conditional', 'other_subject', 'unknown'])",
  'applicabilityReason: z.string()',
  'requiresApplicabilityReview: z.boolean()',
  "agentId === 'isidora'",
  "'1.2.0'",
]) {
  assert.ok(schemas.includes(token), `Isidora applicability schema missing: ${token}`)
}

for (const token of [
  'applicabilityToClient=direct',
  'applicabilityToClient=other_subject',
  'requiresApplicabilityReview=true',
  'no trates como riesgo de incumplimiento del cliente aquellas con applicabilityToClient=other_subject o unknown',
  'No conviertas obligaciones marcadas como other_subject o unknown en tareas de cumplimiento del cliente',
]) {
  assert.ok(prompts.includes(token), `Applicability prompt guard missing: ${token}`)
}

console.log('Isidora applicability contract: PASS')
