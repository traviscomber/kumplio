import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync('components/cases/case-specialist-contributions.tsx', 'utf8')

for (const marker of ['Análisis', 'Resolución', 'Revisión', 'Apoyo especializado', 'Cambio regulatorio', 'Análisis cuantitativo de riesgo', 'Plan de ejecución', 'Aprendizaje organizacional']) {
  assert.ok(source.includes(marker), `three-agent UI missing marker: ${marker}`)
}

for (const legacyPrimary of ['Evaluación de riesgo', 'Controles y evidencia', 'Plan de acción', 'Revisión jurídica/calidad']) {
  assert.ok(!source.includes(`'${legacyPrimary}'`), `legacy five-stage primary category remains: ${legacyPrimary}`)
}

assert.ok(source.includes('Revisión humana'), 'human review boundary must remain visible')
assert.ok(source.includes('supportByAgent'), 'optional specialist artifacts must remain renderable')

console.log('Three-agent case surface: PASS')
