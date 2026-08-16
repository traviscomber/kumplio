'use client'

import { track } from '@vercel/analytics'

const FUNNEL_STARTED_AT_KEY = 'kumplio:funnel-started-at'

type FunnelAudience = 'person' | 'company' | 'professional' | 'industry'
type PublicFunnelAudience = Exclude<FunnelAudience, 'industry'>
type PublicLocale = 'es' | 'en'

type SignupSource = 'pricing' | 'guided_resolution'
type SignupContinuation = 'guided_case' | 'other'
type SignupConfirmation = 'instant' | 'email'
type WorkspaceContinuation = 'guided_case' | 'default'

function elapsedSeconds() {
  try {
    const startedAt = Number(window.sessionStorage.getItem(FUNNEL_STARTED_AT_KEY))
    if (!Number.isFinite(startedAt) || startedAt <= 0 || startedAt > Date.now()) return null
    return Math.max(0, Math.round((Date.now() - startedAt) / 1000))
  } catch {
    return null
  }
}

function withElapsed<T extends Record<string, string | boolean>>(data: T) {
  const elapsed = elapsedSeconds()
  return elapsed === null ? data : { ...data, elapsed_seconds: elapsed }
}

export function trackFunnelIntentStarted(input: { audience: PublicFunnelAudience; locale: PublicLocale }) {
  try {
    window.sessionStorage.setItem(FUNNEL_STARTED_AT_KEY, String(Date.now()))
  } catch {
    // Telemetry timing must never block the product flow.
  }

  track('Funnel Intent Started', {
    audience: input.audience,
    locale: input.locale,
    destination: 'guided_case',
  })
}

export function trackFunnelSignupCompleted(input: {
  source: SignupSource
  continuation: SignupContinuation
  confirmation: SignupConfirmation
}) {
  track('Funnel Signup Completed', input)
}

export function trackFunnelWorkspaceInitialized(input: { continuation: WorkspaceContinuation }) {
  track('Funnel Workspace Initialized', withElapsed(input))
}

export function trackFunnelGuidedCaseCreated(input: { audience: FunnelAudience; resumed: boolean }) {
  track('Funnel Guided Case Created', withElapsed(input))
}

export function trackFunnelFirstStageQueued(input: { audience: FunnelAudience; recovered: boolean }) {
  track('Funnel First Stage Queued', withElapsed(input))
}

export function clearFunnelTiming() {
  try {
    window.sessionStorage.removeItem(FUNNEL_STARTED_AT_KEY)
  } catch {
    // Telemetry cleanup must never block navigation.
  }
}
