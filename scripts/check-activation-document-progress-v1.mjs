import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync('app/documents/content.tsx', 'utf8')

for (const marker of [
  'useSearchParams',
  "searchParams.get('activation') === '1'",
  "searchParams.get('case')",
  'Primer antecedente agregado',
  '/app/inicio',
]) assert.ok(source.includes(marker), `missing marker: ${marker}`)

const successIndex = source.indexOf('function handleUploadSuccess')
const activationCopyIndex = source.indexOf('Primer antecedente agregado')
assert.ok(successIndex >= 0 && activationCopyIndex > successIndex, 'activation confirmation must be driven by upload success')

for (const forbidden of ['evidencia verificada', 'cumplimiento confirmado']) {
  assert.ok(!source.toLowerCase().includes(forbidden), `forbidden activation claim: ${forbidden}`)
}

console.log('Activation document progress: PASS')
