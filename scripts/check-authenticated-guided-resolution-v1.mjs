import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [canonicalEntry, canonicalCase, legacyCase, guidedWorkspace, specialistSurface, legacyBeta, caseCenter, casesPage, navigation, advisor] = await Promise.all([
  readFile('app/app/casos/[id]/page.tsx', 'utf8'),
  readFile('components/cases/canonical-case-page.tsx', 'utf8'),
  readFile('app/cases/[caseId]/page.tsx', 'utf8'),
  readFile('components/cases/guided-case-workspace.tsx', 'utf8'),
  readFile('components/cases/case-specialist-contributions.tsx', 'utf8'),
  readFile('app/cases/[caseId]/beta/page.tsx', 'utf8'),
  readFile('components/cases-workspace.tsx', 'utf8'),
  readFile('app/cases/page.tsx', 'utf8'),
  readFile('components/workspace-nav.tsx', 'utf8'),
  readFile('app/advisor/page.tsx', 'utf8'),
])

assert.match(canonicalEntry, /CanonicalCasePage/)
assert.match(canonicalCase, /GuidedCaseWorkspace/)
assert.match(canonicalCase, /<GuidedCaseWorkspace caseId=\{caseId\} \/>/)
assert.match(legacyCase, /redirect\(`\/app\/casos\/\$\{caseId\}`\)/)
assert.match(legacyBeta, /redirect\(`\/app\/casos\/\$\{caseId\}`\)/)

assert.match(guidedWorkspace, /Qué necesitas resolver/)
assert.match(guidedWorkspace, /Qué importa ahora/)
assert.match(guidedWorkspace, /CaseSpecialistContributions/)
assert.match(guidedWorkspace, /Conclusiones y respaldo/)
assert.match(guidedWorkspace, /Últimos avances/)
assert.match(guidedWorkspace, /StartCaseResolution/)
assert.match(specialistSurface, /Contribuciones al expediente/)
assert.match(specialistSurface, /Revisión humana/)
assert.doesNotMatch(guidedWorkspace, /Ejecuciones IA/)
assert.doesNotMatch(guidedWorkspace, /Workflow ·/)
assert.doesNotMatch(guidedWorkspace, /Intentos utilizados/)
assert.doesNotMatch(guidedWorkspace, /\/cases\/\$\{caseId\}\/live/)

assert.match(caseCenter, /Nuevo caso/)
assert.match(caseCenter, /Necesitan decisión/)
assert.match(caseCenter, /Con bloqueo/)
assert.match(caseCenter, /href=\{`\/app\/casos\/\$\{item\.id\}`\}/)
assert.doesNotMatch(caseCenter, /\/cases\/\$\{item\.id\}\/live/)
assert.doesNotMatch(caseCenter, />Trazabilidad</)
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
