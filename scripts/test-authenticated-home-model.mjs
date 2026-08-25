import assert from 'node:assert/strict'
import { buildAuthenticatedHomeModel } from '../lib/product/home/authenticated-home.ts'

const model = buildAuthenticatedHomeModel({
  health: { status: 'attention', label: 'Requiere atención', explanation: 'Hay trabajo pendiente.' },
  priorities: Array.from({ length: 5 }, (_, index) => ({ id: `p${index}`, title: `Prioridad ${index}`, summary: 'Resumen', href: index === 0 ? '/cases/c1' : '/documents', severity: 'high' })),
  changes: [{ id: 'empty', headline: 'Sin cambios', changesFound: 0, criticalItems: 0 }, { id: 'real', headline: 'Cambió una obligación', changesFound: 1, criticalItems: 0 }],
  cases: [{ id: 'c1', title: 'Caso activo', status: 'active' }],
  expirations: [{ id: 'd1', title: 'Documento', expiresAt: null }],
})
assert.equal(model.priorities.length, 3)
assert.equal(model.nextAction.title, 'Prioridad 0')
assert.equal(model.nextAction.href, '/app/casos/c1')
assert.deepEqual(model.changes.map(x => x.id), ['real'])
assert.equal(model.cases[0].href, '/app/casos/c1')
assert.equal(model.expirations.length, 0)
assert.equal('score' in model.primaryStatus, false)

const onboarding = buildAuthenticatedHomeModel({ health: { status: 'attention', label: 'Información incompleta', explanation: 'Completa el primer trabajo.' }, priorities: [], changes: [], initialNextAction: { title: 'Subir documento inicial', href: '/app/documentos' } })
assert.deepEqual(onboarding.nextAction, { title: 'Subir documento inicial', href: '/app/documentos' })

console.log('Authenticated home model: PASS')
