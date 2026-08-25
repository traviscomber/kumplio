import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync('app/dashboard/daily-content.tsx', 'utf8')
for (const marker of ['buildAuthenticatedHomeModel', 'selectedCaseId', 'initialDiagnosis', 'Estado actual', 'Siguiente acción', 'Prioridades actuales', 'Casos activos', 'Cambios relevantes', 'resolveInitialActionHref']) {
  if (!source.includes(marker)) throw new Error(`Authenticated home UI missing marker: ${marker}`)
}
for (const forbidden of ['Impacto máximo', 'escala interna 0–100', 'engineVersion', 'Score {priority.score}', '/sign-in?next=/dashboard', "'/review-center'", 'provider trace', 'token usage', 'queue job', 'agent prompt']) {
  if (source.toLowerCase().includes(forbidden.toLowerCase())) throw new Error(`Authenticated home exposes forbidden legacy or technical surface: ${forbidden}`)
}
if (!source.includes('/app/casos')) throw new Error('Home must use canonical case navigation')
if (!source.includes('/sign-in?next=/app/inicio')) throw new Error('Home auth fallback must return to canonical Inicio')

const hierarchy = ['Estado actual', 'Siguiente acción', 'Prioridades actuales', 'Casos activos', 'Cambios relevantes']
let cursor = -1
for (const marker of hierarchy) {
  const next = source.indexOf(marker)
  assert.ok(next > cursor, `${marker} must appear in operating order`)
  cursor = next
}
assert.equal(source.split('Siguiente acción').length - 1, 1, 'Home must render one dominant next-action section')

console.log('Authenticated home UI contract: PASS')
