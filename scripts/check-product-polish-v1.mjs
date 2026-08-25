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

const homePage = fs.readFileSync('app/app/inicio/page.tsx', 'utf8')
const daily = fs.readFileSync('app/dashboard/daily-content.tsx', 'utf8')

for (const marker of ['Estado actual', 'Siguiente acción', 'Prioridades actuales', 'Casos activos', 'Cambios relevantes']) {
  assert.ok(`${homePage}\n${daily}`.includes(marker), `Missing Inicio marker: ${marker}`)
}
assert.equal((daily.match(/Siguiente acción/g) || []).length, 1, 'Inicio must expose one dominant next-action section')
assert.doesNotMatch(
  homePage,
  /Tu situación hoy[\s\S]*Qué necesita tu atención[\s\S]*Kumplio ordena lo importante/,
  'Inicio intro remains overly layered',
)

console.log('Product polish: PASS')
