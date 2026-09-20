import assert from 'node:assert/strict'
import fs from 'node:fs'

const home = fs.readFileSync('app/dashboard/daily-content.tsx', 'utf8')

for (const marker of [
  'Necesitas decidir',
  'Kumplio está resolviendo',
  'Resuelto',
  'Valor conseguido',
  'Resultados cerrados recientemente',
  "verification_status === 'verified'",
  "['ready_for_review', 'changes_requested']",
  ".eq('organization_id', organizationId)",
]) {
  assert.ok(home.includes(marker), `Outcome Home v3 missing marker: ${marker}`)
}

for (const forbidden of ['service_role', '/dashboard/agents', '/agents/workflows']) {
  assert.ok(!home.toLowerCase().includes(forbidden.toLowerCase()), `Outcome Home exposes technical surface: ${forbidden}`)
}

console.log('Outcome Home v3 contract: PASS')
