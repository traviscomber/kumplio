import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [helper, resolutionEntry, signUp, onboardingForm, betaCaseEntry] = await Promise.all([
  readFile('lib/analytics/funnel-client.ts', 'utf8'),
  readFile('components/marketing/resolution-entry.tsx', 'utf8'),
  readFile('app/(auth)/sign-up/page.tsx', 'utf8'),
  readFile('components/onboarding/workspace-onboarding-form.tsx', 'utf8'),
  readFile('components/cases/beta-case-entry.tsx', 'utf8'),
])

// Only the typed helper is allowed to talk to Vercel Analytics for this funnel.
assert.ok(helper.includes("from '@vercel/analytics'"), 'Typed funnel helper must own the Vercel Analytics import')
for (const source of [resolutionEntry, signUp, onboardingForm, betaCaseEntry]) {
  assert.ok(!source.includes("from '@vercel/analytics'"), 'Funnel callers must not import Vercel Analytics directly')
}

// Call sites send only categorical state; the helper owns timing and event names.
for (const [source, expected] of [
  [resolutionEntry, 'trackFunnelIntentStarted({ audience, locale })'],
  [signUp, 'trackFunnelSignupCompleted({'],
  [onboardingForm, 'trackFunnelWorkspaceInitialized({'],
  [betaCaseEntry, 'trackFunnelGuidedCaseCreated({'],
  [betaCaseEntry, 'trackFunnelFirstStageQueued({ audience, recovered: recoverable })'],
  [betaCaseEntry, 'clearFunnelTiming()'],
]) {
  assert.ok(source.includes(expected), `Funnel caller contract missing: ${expected}`)
}

for (const expected of [
  "const FUNNEL_STARTED_AT_KEY = 'kumplio:funnel-started-at'",
  "type FunnelAudience = 'person' | 'company' | 'professional' | 'industry'",
  "type SignupSource = 'pricing' | 'guided_resolution'",
  "type SignupContinuation = 'guided_case' | 'other'",
  "type SignupConfirmation = 'instant' | 'email'",
  "type WorkspaceContinuation = 'guided_case' | 'default'",
  "track('Funnel Intent Started'",
  "track('Funnel Signup Completed'",
  "track('Funnel Workspace Initialized'",
  "track('Funnel Guided Case Created'",
  "track('Funnel First Stage Queued'",
  'elapsed_seconds: elapsed',
  'String(Date.now())',
]) {
  assert.ok(helper.includes(expected), `Funnel telemetry contract missing: ${expected}`)
}

// Privacy boundary: categorical string literals may contain words such as "email";
// identifiers, object fields and variables must not expose identity, free-text case content or record IDs.
const helperIdentifiers = helper
  .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, "''")
  .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""')

for (const forbidden of ['email', 'organizationName', 'firstName', 'lastName', 'goal', 'caseId', 'workflowId', 'userId']) {
  const identifierPattern = new RegExp(`\\b${forbidden}\\b`, 'i')
  assert.ok(!identifierPattern.test(helperIdentifiers), `Funnel telemetry helper exposes forbidden identifier: ${forbidden}`)
}

console.log('Privacy-safe funnel telemetry contract: OK')
