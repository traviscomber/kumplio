import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [
  casePage,
  guidedWorkspace,
  legacyBeta,
  caseCenter,
  casesPage,
  navigation,
  advisor,
  resolutionEntry,
  newCasePage,
  onboardingPage,
  onboardingForm,
  betaCaseEntry,
] = await Promise.all([
  readFile('app/cases/[caseId]/page.tsx', 'utf8'),
  readFile('components/cases/guided-case-workspace.tsx', 'utf8'),
  readFile('app/cases/[caseId]/beta/page.tsx', 'utf8'),
  readFile('components/cases-workspace.tsx', 'utf8'),
  readFile('app/cases/page.tsx', 'utf8'),
  readFile('components/workspace-nav.tsx', 'utf8'),
  readFile('app/advisor/page.tsx', 'utf8'),
  readFile('components/marketing/resolution-entry.tsx', 'utf8'),
  readFile('app/cases/new/page.tsx', 'utf8'),
  readFile('app/onboarding/page.tsx', 'utf8'),
  readFile('components/onboarding/workspace-onboarding-form.tsx', 'utf8'),
  readFile('components/cases/beta-case-entry.tsx', 'utf8'),
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

// Public intent must survive signup -> authentication -> onboarding -> new case.
assert.match(resolutionEntry, /sessionStorage\.setItem/)
assert.match(resolutionEntry, /kumplio:case-draft/)
assert.match(resolutionEntry, /router\.push\('\/sign-up\?next=\/cases\/new'\)/)
assert.match(newCasePage, /onboarding\?next=/)
assert.match(newCasePage, /encodeURIComponent\('\/cases\/new'\)/)
assert.match(onboardingPage, /safeInternalPath/)
assert.match(onboardingPage, /continuation/)
assert.match(onboardingPage, /nextPath=\{continuation\}/)
assert.match(onboardingPage, /redirect\(continuation \|\| '\/dashboard'\)/)
assert.match(onboardingForm, /nextPath\?: string \| null/)
assert.match(onboardingForm, /const destination = nextPath \|\| \(caseId \? `\/cases\/\$\{caseId\}` : '\/dashboard'\)/)
assert.match(onboardingForm, /router\.replace\(destination\)/)
assert.match(onboardingForm, /sin pedirte que la redactes de nuevo/)

// Draft and idempotency continuity must survive reloads within the browser session.
assert.match(betaCaseEntry, /DRAFT_STORAGE_KEY = 'kumplio:case-draft'/)
assert.match(betaCaseEntry, /START_KEY_STORAGE_KEY = 'kumplio:case-start-key'/)
assert.match(betaCaseEntry, /sessionStorage\.getItem\(START_KEY_STORAGE_KEY\)/)
assert.match(betaCaseEntry, /sessionStorage\.setItem\(START_KEY_STORAGE_KEY, startKey\)/)
assert.match(betaCaseEntry, /persistDraft\(normalizedGoal, audience\)/)
assert.match(betaCaseEntry, /sessionStorage\.removeItem\(DRAFT_STORAGE_KEY\)/)
assert.match(betaCaseEntry, /sessionStorage\.removeItem\(START_KEY_STORAGE_KEY\)/)
assert.match(betaCaseEntry, /recargas la página o vuelves a intentar/)

console.log('Authenticated guided resolution contract: OK')
