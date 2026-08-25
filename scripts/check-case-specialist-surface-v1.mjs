import assert from 'node:assert/strict'
import fs from 'node:fs'

const guided = fs.readFileSync('components/cases/guided-case-workspace.tsx', 'utf8')
const specialists = fs.readFileSync('components/cases/case-specialist-contributions.tsx', 'utf8')

for (const marker of [
  'Análisis normativo',
  'Evaluación de riesgo',
  'Controles y evidencia',
  'Plan de acción',
  'Revisión jurídica/calidad',
]) {
  assert.ok(specialists.includes(marker), `Specialist surface missing product label: ${marker}`)
}

for (const forbidden of [
  'Intentos utilizados',
  'token usage',
  'chain of thought',
  'reasoning trace',
  'provider request',
  'queue job',
  'raw payload',
]) {
  assert.ok(!guided.toLowerCase().includes(forbidden.toLowerCase()), `Guided case exposes execution plumbing: ${forbidden}`)
  assert.ok(!specialists.toLowerCase().includes(forbidden.toLowerCase()), `Specialist surface exposes execution plumbing: ${forbidden}`)
}

assert.ok(guided.includes('CaseSpecialistContributions'), 'Guided case must render product-facing specialist contributions')
assert.ok(specialists.includes('Revisión humana'), 'Specialist surface must keep the human review boundary visible')

console.log('Case specialist surface: PASS')
