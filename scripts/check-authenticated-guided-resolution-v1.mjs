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
  signUp,
  newCasePage,
  onboardingPage,
  onboardingForm,
  betaCaseEntry,
  artifactPreview,
  funnelTelemetry,
] = await Promise.all([
  readFile('app/cases/[caseId]/page.tsx', 'utf8'),
  readFile('components/cases/guided-case-workspace.tsx', 'utf8'),
  readFile('app/cases/[caseId]/beta/page.tsx', 'utf8'),
  readFile('components/cases-workspace.tsx', 'utf8'),
  readFile('app/cases/page.tsx', 'utf8'),
  readFile('components/workspace-nav.tsx', 'utf8'),
  readFile('app/advisor/page.tsx', 'utf8'),
  readFile('components/marketing/resolution-entry.tsx', 'utf8'),
  readFile('app/(auth)/sign-up/page.tsx', 'utf8'),
  readFile('app/cases/new/page.tsx', 'utf8'),
  readFile('app/onboarding/page.tsx', 'utf8'),
  readFile('components/onboarding/workspace-onboarding-form.tsx', 'utf8'),
  readFile('components/cases/beta-case-entry.tsx', 'utf8'),
  readFile('components/cases/artifact-result-preview.tsx', 'utf8'),
  readFile('lib/analytics/funnel-client.ts', 'utf8'),
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
assert.ok(resolutionEntry.includes('window.sessionStorage.setItem('))
assert.ok(resolutionEntry.includes("'kumplio:case-draft'"))
assert.ok(resolutionEntry.includes("router.push('/sign-up?next=/cases/new')"))
assert.ok(newCasePage.includes("redirect(`/onboarding?next=${encodeURIComponent('/cases/new')}`)"))
assert.ok(onboardingPage.includes("safeInternalPath(requestedNext, '/dashboard')"))
assert.ok(onboardingPage.includes('nextPath={continuation}'))
assert.ok(onboardingPage.includes("redirect(continuation || '/dashboard')"))
assert.ok(onboardingForm.includes('nextPath?: string | null'))
assert.ok(onboardingForm.includes("const destination = nextPath || (caseId ? `/cases/${caseId}` : '/dashboard')"))
assert.ok(onboardingForm.includes('router.replace(destination)'))
assert.ok(onboardingForm.includes('sin pedirte que la redactes de nuevo'))

// Draft and idempotency continuity must survive reloads within the browser session.
assert.ok(betaCaseEntry.includes("const DRAFT_STORAGE_KEY = 'kumplio:case-draft'"))
assert.ok(betaCaseEntry.includes("const START_KEY_STORAGE_KEY = 'kumplio:case-start-key'"))
assert.ok(betaCaseEntry.includes('window.sessionStorage.getItem(START_KEY_STORAGE_KEY)'))
assert.ok(betaCaseEntry.includes('window.sessionStorage.setItem(START_KEY_STORAGE_KEY, startKey)'))
assert.ok(betaCaseEntry.includes('persistDraft(normalizedGoal, audience)'))
assert.ok(betaCaseEntry.includes('window.sessionStorage.removeItem(DRAFT_STORAGE_KEY)'))
assert.ok(betaCaseEntry.includes('window.sessionStorage.removeItem(START_KEY_STORAGE_KEY)'))
assert.ok(betaCaseEntry.includes('recargas la página o vuelves a intentar'))

// Review UI must expose evidence and limitations before treating findings as actionable.
const evidenceIndex = artifactPreview.indexOf('Fuentes y evidencia de respaldo')
const caveatsIndex = artifactPreview.indexOf('Reservas y pendientes')
const findingsIndex = artifactPreview.indexOf('Hallazgos (')
assert.ok(evidenceIndex >= 0, 'Artifact preview must expose evidence sources')
assert.ok(caveatsIndex > evidenceIndex, 'Reservations must follow evidence')
assert.ok(findingsIndex > caveatsIndex, 'Findings must appear after evidence and reservations')
assert.ok(artifactPreview.includes('Fuentes no expuestas en este resumen.'))
assert.ok(artifactPreview.includes('Antes de aprobar, revisa la trazabilidad del expediente'))

// Funnel telemetry is centralized and typed. Callers cannot send free-text context or record identifiers.
assert.ok(resolutionEntry.includes('trackFunnelIntentStarted({ audience, locale })'))
assert.ok(signUp.includes('trackFunnelSignupCompleted({'))
assert.ok(onboardingForm.includes('trackFunnelWorkspaceInitialized({'))
assert.ok(betaCaseEntry.includes('trackFunnelGuidedCaseCreated({'))
assert.ok(betaCaseEntry.includes('trackFunnelFirstStageQueued({ audience, recovered: recoverable })'))
assert.ok(betaCaseEntry.includes('clearFunnelTiming()'))

for (const source of [resolutionEntry, signUp, onboardingForm, betaCaseEntry]) {
  assert.doesNotMatch(source, /from '@vercel\/analytics'/)
}

assert.ok(funnelTelemetry.includes("const FUNNEL_STARTED_AT_KEY = 'kumplio:funnel-started-at'"))
assert.ok(funnelTelemetry.includes('String(Date.now())'))
assert.ok(funnelTelemetry.includes('elapsed_seconds: elapsed'))
for (const eventName of [
  'Funnel Intent Started',
  'Funnel Signup Completed',
  'Funnel Workspace Initialized',
  'Funnel Guided Case Created',
  'Funnel First Stage Queued',
]) {
  assert.ok(funnelTelemetry.includes(`track('${eventName}'`), `Missing typed telemetry event: ${eventName}`)
}

for (const typeContract of [
  "type FunnelAudience = 'person' | 'company' | 'professional' | 'industry'",
  "type SignupSource = 'pricing' | 'guided_resolution'",
  "type SignupContinuation = 'guided_case' | 'other'",
  "type SignupConfirmation = 'instant' | 'email'",
  "type WorkspaceContinuation = 'guided_case' | 'default'",
]) {
  assert.ok(funnelTelemetry.includes(typeContract), `Missing telemetry type contract: ${typeContract}`)
}

assert.doesNotMatch(
  funnelTelemetry,
  /\b(email|organizationName|firstName|lastName|goal|caseId|workflowId|userId)\b/i,
  'Funnel telemetry helper must not accept identity, free-text goal or record identifiers',
)

console.log('Authenticated guided resolution contract: OK')
