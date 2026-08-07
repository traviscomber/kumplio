import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [casePage, guidedWorkspace, legacyBeta, caseCenter, casesPage, navigation, advisor] = await Promise.all([
  readFile('app/cases/[caseId]/page.tsx', 'utf8'),
  readFile('components/cases/guided-case-workspace.tsx', 'utf8'),
  readFile('app/cases/[caseId]/beta/page.tsx', 'utf8'),
  readFile('components/cases-workspace.tsx', 'utf8'),
  readFile('app/cases/page.tsx', 'utf8'),
  readFile('components/workspace-nav.tsx', 'utf8'),
  readFile('app/advisor/page.tsx', 'utf8'),
])

assert.match(casePage, /GuidedCaseWorkspace/)
assert.match(casePage, /<GuidedCaseWorkspace caseId=\{caseId\} \/>/)
assert.match(legacyBeta, /redirect\(`\/cases\/\$\{caseId\}`\)/)

assert.match(guidedWorkspace, /Qué necesitas resolver/)
assert.match(guidedWorkspace, /Qué importa ahora/)
assert.match(guidedWorkspace, /Qué está haciendo Kumplio/)
assert.match(guidedWorkspace, /Resultados y respaldo/)
assert.match(guidedWorkspace, /Ver trazabilidad/)
assert.match(guidedWorkspace, /StartCaseResolution/)
assert.doesNotMatch(guidedWorkspace, /Ejecuciones IA/)
assert.doesNotMatch(guidedWorkspace, /Workflow ·/)

assert.match(caseCenter, /Resolver una situación/)
assert.match(caseCenter, /Necesitan decisión/)
assert.match(caseCenter, /Con bloqueo/)
assert.match(caseCenter, /href=\{`\/cases\/\$\{item\.id\}`\}/)
assert.match(caseCenter, /Trazabilidad/)
assert.match(casesPage, /Cada caso reúne lo que necesitas resolver/)

assert.match(navigation, /label: 'Casos'/)
assert.match(navigation, /label: 'Seguimiento'/)
assert.doesNotMatch(navigation, /label: 'Cumplimiento'/)
assert.doesNotMatch(navigation, /label: 'Ejecutivo'/)

assert.match(advisor, /Resolver (esta situación|prioridad principal)/)
assert.match(advisor, /Describir otra situación/)
assert.match(advisor, /WhyDetails/)
assert.match(advisor, /summary\.confidence\.value/)
assert.match(advisor, /Briefing de las últimas 24 horas/)
assert.doesNotMatch(advisor, /Ejecuciones IA/)

console.log('Authenticated guided resolution contract: OK')
