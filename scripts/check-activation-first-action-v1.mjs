import assert from 'node:assert/strict'
import fs from 'node:fs'

const form = fs.readFileSync('components/onboarding/workspace-onboarding-form.tsx', 'utf8')
const handoff = fs.readFileSync('lib/product/onboarding/activation-handoff.ts', 'utf8')
const cases = fs.readFileSync('app/app/casos/page.tsx', 'utf8')
const documents = fs.readFileSync('app/documents/content.tsx', 'utf8')

for (const marker of ['buildActivationHandoff', 'activationHandoff', 'Ir a mi siguiente acción', 'Ver mi inicio']) {
  assert.ok(form.includes(marker), `onboarding handoff missing marker: ${marker}`)
}

for (const marker of ['/app/casos', '/app/documentos', '?case=', 'activation=1', "secondaryHref: '/app/inicio'"]) {
  assert.ok(handoff.includes(marker), `activation routing missing marker: ${marker}`)
}

for (const marker of ['searchParams', "activation === '1'", 'caseId', '/app/casos/', '?activation=1']) {
  assert.ok(cases.includes(marker), `activation case forwarding missing marker: ${marker}`)
}

for (const marker of [
  'function handleUploadSuccess',
  "searchParams.get('activation') === '1'",
  "searchParams.get('case')",
  'Primer antecedente agregado',
  'Volver al caso',
  '/app/casos/',
  'Ir a Inicio y ver el siguiente paso',
  '/app/inicio?case=',
]) {
  assert.ok(documents.includes(marker), `activation document flow missing marker: ${marker}`)
}

const successIndex = documents.indexOf('function handleUploadSuccess')
const progressIndex = documents.indexOf('Primer antecedente agregado')
assert.ok(successIndex >= 0 && progressIndex > successIndex, 'activation progress must follow successful upload handling')

for (const [name, source] of Object.entries({ form, handoff, cases, documents })) {
  const normalized = source.toLowerCase()
  for (const forbidden of ['/review-center', '/dashboard', 'cumplimiento confirmado', 'evidencia verificada']) {
    assert.ok(!normalized.includes(forbidden), `${name} contains forbidden activation marker: ${forbidden}`)
  }
}

console.log('Activation first action: PASS')
