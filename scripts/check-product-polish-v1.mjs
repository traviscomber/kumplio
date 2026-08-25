import assert from 'node:assert/strict'
import fs from 'node:fs'

const nav = fs.readFileSync('components/app-navigation.tsx', 'utf8')

for (const href of ['/app/inicio', '/app/casos', '/app/documentos', '/app/evidencia']) {
  assert.ok(nav.includes(href), `App navigation missing canonical destination: ${href}`)
}
assert.match(nav, /aria-current/)
assert.match(nav, /focus-visible:/)
assert.match(nav, /overflow-x-auto/)
assert.doesNotMatch(nav, /href:\s*['"]\/(advisor|cases|documents|evidence)['"]/)

console.log('Product polish: PASS')
