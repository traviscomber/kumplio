import fs from 'node:fs'

const source = fs.readFileSync('app/dashboard/daily-content.tsx', 'utf8')
for (const marker of ['buildAuthenticatedHomeModel', 'selectedCaseId', 'initialDiagnosis', 'Siguiente acción', 'Prioridades actuales', 'Casos activos', 'Cambios recientes']) {
  if (!source.includes(marker)) throw new Error(`Authenticated home UI missing marker: ${marker}`)
}
for (const forbidden of ['Impacto máximo', 'escala interna 0–100', 'engineVersion', 'Score {priority.score}']) {
  if (source.includes(forbidden)) throw new Error(`Authenticated home exposes technical metric: ${forbidden}`)
}
if (!source.includes('/app/casos')) throw new Error('Home must use canonical case navigation')
console.log('Authenticated home UI contract: PASS')
