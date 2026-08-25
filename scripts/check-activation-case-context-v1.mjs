import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync('app/app/casos/page.tsx', 'utf8')
for (const marker of ['searchParams', 'activation', 'case', '/app/casos/']) {
  assert.ok(source.includes(marker), `missing marker: ${marker}`)
}
assert.ok(!source.includes('redirect(`/cases/${'), 'activation entry must not construct a legacy case URL')
console.log('Activation case context: PASS')
