import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { buildCaseWorkspaceModel } from '../lib/product/cases/case-workspace-model.ts'

const base = {
  caseId: 'case-1',
  caseStatus: 'active',
  summary: 'Solicitud de titular que requiere respuesta.',
  whyItMatters: 'Existe trabajo pendiente y debe quedar trazado.',
}

const withAction = buildCaseWorkspaceModel({
  ...base,
  openAction: { title: 'Completar acción pendiente', href: '/cases/case-1' },
})
assert.equal(withAction.nextAction?.title, 'Completar acción pendiente')
assert.equal(withAction.nextAction?.href, '/app/casos/case-1')
assert.equal(withAction.context.summary, base.summary)
assert.equal(withAction.context.whyItMatters, base.whyItMatters)

const evidenceReview = buildCaseWorkspaceModel({ ...base, evidenceReviewRequired: true })
assert.deepEqual(evidenceReview.nextAction, { title: 'Revisar evidencia pendiente', href: '/app/casos/case-1' })

const humanReview = buildCaseWorkspaceModel({ ...base, humanReviewRequired: true })
assert.deepEqual(humanReview.nextAction, { title: 'Completar revisión humana', href: '/app/casos/case-1' })

const closable = buildCaseWorkspaceModel({ ...base, closureEligible: true })
assert.deepEqual(closable.nextAction, { title: 'Cerrar caso', href: '/app/casos/case-1' })

const blocked = buildCaseWorkspaceModel({ ...base, blockers: ['Revisión humana pendiente'] })
assert.equal(blocked.nextAction, null)
assert.ok(blocked.blockers.includes('Revisión humana pendiente'))

const completed = buildCaseWorkspaceModel({ ...base, caseStatus: 'approved' })
assert.equal(completed.nextAction, null)
assert.ok(completed.status.label.length > 0)

for (const model of [withAction, evidenceReview, humanReview, closable]) {
  assert.ok(model.nextAction?.href.startsWith('/app/'), `Non-canonical case action: ${model.nextAction?.href}`)
}

const guided = await readFile('components/cases/guided-case-workspace.tsx', 'utf8')
assert.match(guided, /buildCaseWorkspaceModel/, 'Canonical case workspace must consume the bounded read model')
assert.match(guided, /Estado del caso/, 'Canonical case workspace must render the bounded case status')
assert.match(guided, /workspaceModel\.nextAction/, 'Canonical case workspace must render at most one dominant next action from the model')

console.log('Case workspace model: PASS')
