import assert from 'node:assert/strict'
import fs from 'node:fs'
const summary = fs.readFileSync('components/cases/case-outcome-status.tsx', 'utf8')
for (const marker of [
  'Aprendizaje de resultados anteriores',
  ".eq('organization_id', organizationId)",
  ".neq('case_id', caseId)",
  'No los aplica automáticamente',
  'comprobar que el caso, la evidencia y los criterios realmente correspondan',
]) assert.ok(summary.includes(marker), `Outcome intelligence safety missing: ${marker}`)
console.log('Outcome Intelligence foundation v1: PASS')
