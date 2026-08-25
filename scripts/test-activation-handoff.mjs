import assert from 'node:assert/strict'
import { buildActivationHandoff } from '../lib/product/onboarding/activation-handoff.ts'

const contextDiagnosis = {
  caseTitle: 'Resolver situación personal: revisar contexto',
  status: 'information_incomplete',
  nextAction: { title: 'Revisar el contexto de tu situación personal', href: '/app/casos' },
}

const documentDiagnosis = {
  caseTitle: 'Resolver para la organización: documentos',
  status: 'action_required',
  nextAction: { title: 'Subir el primer documento disponible', href: '/app/documentos' },
}

assert.equal(buildActivationHandoff(contextDiagnosis, 'case-123').primaryHref, '/app/casos?case=case-123&activation=1')
assert.equal(buildActivationHandoff(documentDiagnosis, 'case-123').primaryHref, '/app/documentos?case=case-123&activation=1')
assert.equal(buildActivationHandoff(contextDiagnosis, null).primaryHref, '/app/inicio')
assert.equal(buildActivationHandoff({ ...contextDiagnosis, nextAction: { ...contextDiagnosis.nextAction, href: '/review-center' } }, 'case-123').primaryHref, '/app/inicio')
assert.equal(buildActivationHandoff(contextDiagnosis, 'case-123').secondaryHref, '/app/inicio')
assert.equal(buildActivationHandoff(contextDiagnosis, 'case-123').primaryLabel, contextDiagnosis.nextAction.title)
assert.ok(!buildActivationHandoff(contextDiagnosis, 'case-123').explanation.toLowerCase().includes('cumplimiento confirmado'))

console.log('Activation handoff: PASS')
