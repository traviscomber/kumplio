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
assert.ok(model.priorities.every(item => item.href.startsWith('/app/')))
assert.ok(model.cases.every(item => item.href.startsWith('/app/casos/')))

const onboarding = buildAuthenticatedHomeModel({ health: { status: 'attention', label: 'Información incompleta', explanation: 'Completa el primer trabajo.' }, priorities: [], changes: [], initialNextAction: { title: 'Subir documento inicial', href: '/app/documentos' } })
assert.deepEqual(onboarding.nextAction, { title: 'Subir documento inicial', href: '/app/documentos' })

const invalidInitial = buildAuthenticatedHomeModel({
  health: { status: 'attention', label: 'Atención', explanation: 'Pendiente.' },
  priorities: [],
  changes: [],
  initialNextAction: { title: 'Continuar', href: '/review-center' },
})
assert.deepEqual(invalidInitial.nextAction, { title: 'Continuar', href: '/app/inicio' })

const legacyPriority = buildAuthenticatedHomeModel({
  health: { status: 'attention', label: 'Requiere atención', explanation: 'Hay trabajo pendiente.' },
  priorities: [{ id: 'legacy', title: 'Revisar evidencia pendiente', summary: 'Resumen', href: '/review-center', severity: 'high' }],
  changes: [],
})
assert.equal(legacyPriority.priorities[0].href, '/app/inicio')
assert.equal(legacyPriority.nextAction.href, '/app/inicio')
assert.ok(legacyPriority.priorities.every((priority) => priority.href.startsWith('/app/')))

const canonicalPriority = buildAuthenticatedHomeModel({
  health: { status: 'attention', label: 'Requiere atención', explanation: 'Hay trabajo pendiente.' },
  priorities: [{ id: 'canonical', title: 'Revisar evidencia', summary: 'Resumen', href: '/app/evidencia', severity: 'high' }],
  changes: [],
})
assert.equal(canonicalPriority.priorities[0].href, '/app/evidencia')

console.log('Authenticated home model: PASS')
