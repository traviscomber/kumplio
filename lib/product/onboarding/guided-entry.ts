export const GUIDED_ONBOARDING_DRAFT_KEY = 'kumplio:case-draft'

type PublicAudience = 'person' | 'professional' | 'company'

const userTypeByAudience = {
  person: 'persona',
  professional: 'profesional',
  company: 'empresa',
} as const

export type GuidedOnboardingDraft = {
  userType: (typeof userTypeByAudience)[PublicAudience]
  problem: string
}

export function buildGuidedOnboardingSignUpPath() {
  return '/sign-up?next=%2Fonboarding'
}

export function parseGuidedOnboardingDraft(value: string | null): GuidedOnboardingDraft | null {
  if (!value) return null

  try {
    const candidate = JSON.parse(value) as { audience?: unknown; goal?: unknown }
    if (typeof candidate.audience !== 'string' || !(candidate.audience in userTypeByAudience)) return null
    if (typeof candidate.goal !== 'string') return null

    const problem = candidate.goal.trim()
    if (problem.length < 8) return null

    return {
      userType: userTypeByAudience[candidate.audience as PublicAudience],
      problem,
    }
  } catch {
    return null
  }
}
