import assert from 'node:assert/strict'
import fs from 'node:fs'

const ui = fs.readFileSync('app/dashboard/daily-content.tsx', 'utf8')
const model = fs.readFileSync('lib/product/home/authenticated-home.ts', 'utf8')

for (const marker of ['Estado actual', 'Siguiente acción', 'Prioridades actuales', 'Casos activos', 'Cambios relevantes', '/app/inicio', '/app/casos/']) {
  assert.ok(ui.includes(marker) || model.includes(marker), `Daily operations missing marker: ${marker}`)
}

for (const forbidden of ['/review-center', '/dashboard', 'provider trace', 'token usage', 'queue job', 'agent prompt', 'cumplimiento confirmado', 'certificado']) {
  assert.ok(!ui.toLowerCase().includes(forbidden.toLowerCase()), `Daily operations exposes forbidden surface or claim: ${forbidden}`)
}

assert.ok(model.includes('slice(0, 3)'), 'Daily operations must cap priorities at three')
assert.ok(model.includes('canonicalHref(input.initialNextAction.href)'), 'Initial next action must use canonical routing')
assert.ok(model.includes("item.changesFound > 0 || item.criticalItems > 0"), 'Relevant changes must exclude zero-delta noise')
assert.equal(ui.split('Siguiente acción').length - 1, 1, 'Daily operations must expose one dominant next action')

console.log('Daily operations close: PASS')
