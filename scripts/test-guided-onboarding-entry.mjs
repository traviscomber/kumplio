import assert from 'node:assert/strict'
import {
  buildGuidedOnboardingSignUpPath,
  parseGuidedOnboardingDraft,
} from '../lib/product/onboarding/guided-entry.ts'

assert.equal(
  buildGuidedOnboardingSignUpPath(),
  '/sign-up?next=%2Fonboarding',
  'the public resolution entry must continue through contextual onboarding',
)

assert.deepEqual(
  parseGuidedOnboardingDraft(JSON.stringify({ audience: 'person', goal: 'Quiero entender cómo usan mis datos' })),
  { userType: 'persona', problem: 'Quiero entender cómo usan mis datos' },
)
assert.deepEqual(
  parseGuidedOnboardingDraft(JSON.stringify({ audience: 'professional', goal: '  Revisar contratos de clientes  ' })),
  { userType: 'profesional', problem: 'Revisar contratos de clientes' },
)
assert.deepEqual(
  parseGuidedOnboardingDraft(JSON.stringify({ audience: 'company', goal: 'Prepararnos para la Ley 21.719' })),
  { userType: 'empresa', problem: 'Prepararnos para la Ley 21.719' },
)
assert.equal(parseGuidedOnboardingDraft('{invalid'), null)
assert.equal(parseGuidedOnboardingDraft(JSON.stringify({ audience: 'company', goal: 'corto' })), null)

console.log('Guided onboarding entry: PASS')
