import assert from 'node:assert/strict'
import fs from 'node:fs'
const caseStatus = fs.readFileSync('components/cases/case-outcome-status.tsx', 'utf8')
const home = fs.readFileSync('app/dashboard/daily-content.tsx', 'utf8')
for (const marker of ['Antes', 'Ahora', 'acciones ya tienen cierre verificado']) assert.ok(caseStatus.includes(marker), `Before/after missing: ${marker}`)
for (const marker of ['Impacto verificable', 'Qué cambió con el trabajo realizado', 'Demostrado', 'no constituyen una certificación general de cumplimiento']) assert.ok(home.includes(marker), `Impact summary missing: ${marker}`)
console.log('Outcome value before/after v1: PASS')
