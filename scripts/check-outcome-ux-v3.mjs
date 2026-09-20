import assert from 'node:assert/strict'
import fs from 'node:fs'

const summary = fs.readFileSync('components/cases/case-outcome-status.tsx', 'utf8')
const closure = fs.readFileSync('app/app/casos/[id]/cierre/page.tsx', 'utf8')

for (const marker of [
  'Qué encontramos',
  'Qué necesitas hacer',
  'Qué hará Kumplio',
  'Resolver siguiente paso',
  'Resultado demostrado con evidencia y revisión humana',
]) {
  assert.ok(summary.includes(marker), `Outcome UX v3 missing user-facing marker: ${marker}`)
}

for (const marker of [
  'Tu siguiente paso',
  'Resuelve sólo lo que necesita tu intervención',
  'evidencia aceptada',
  'integridad verificada',
  'revisión humana',
]) {
  assert.ok(closure.includes(marker), `Closure UX v3 missing marker: ${marker}`)
}

for (const forbidden of ['service_role', '/dashboard/agents', '/agents/workflows', 'cumplimiento total', 'certificado']) {
  assert.ok(!summary.toLowerCase().includes(forbidden.toLowerCase()), `Outcome UX exposes forbidden surface: ${forbidden}`)
  assert.ok(!closure.toLowerCase().includes(forbidden.toLowerCase()), `Closure UX exposes forbidden surface: ${forbidden}`)
}

console.log('Outcome UX v3 user-first contract: PASS')
