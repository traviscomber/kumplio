import assert from 'node:assert/strict'
import { buildInitialDiagnosis } from '../lib/product/onboarding/contextual-diagnosis.ts'

const common = { problem: 'Ordenar documentos y saber qué hacer primero', urgency: 'medium', documentsAvailable: 'some' }

for (const userType of ['persona', 'profesional', 'empresa']) {
  const diagnosis = buildInitialDiagnosis({ ...common, userType })
  assert.equal(diagnosis.userType, userType)
  assert.ok(diagnosis.caseTitle.length > 3)
  assert.ok(['information_incomplete', 'attention_required', 'action_required'].includes(diagnosis.status))
  assert.ok(diagnosis.nextAction.title.length > 3)
  assert.ok(diagnosis.gaps.length <= 3)
  assert.ok(diagnosis.actions.length <= 3)
  assert.equal(diagnosis.evidenceStatus, 'not_verified')
  assert.equal(diagnosis.complianceVerified, false)
}

const urgent = buildInitialDiagnosis({ ...common, userType: 'empresa', urgency: 'critical', documentsAvailable: 'none' })
assert.equal(urgent.status, 'action_required')
assert.equal(urgent.actions[0].priority, 'critical')

assert.throws(() => buildInitialDiagnosis({ ...common, userType: 'persona', problem: '   ' }), /problem_required/)

console.log('Contextual onboarding diagnosis: PASS')
