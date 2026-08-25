import assert from 'node:assert/strict'
import fs from 'node:fs'

const nav = fs.readFileSync('components/app-navigation.tsx', 'utf8')
for (const href of ['/app/inicio', '/app/casos', '/app/documentos', '/app/evidencia']) assert.ok(nav.includes(href), `App navigation missing canonical destination: ${href}`)
assert.match(nav, /aria-current/)
assert.match(nav, /focus-visible:/)
assert.match(nav, /overflow-x-auto/)
assert.doesNotMatch(nav, /href:\s*['"]\/(advisor|cases|documents|evidence)['"]/)

const homePage = fs.readFileSync('app/app/inicio/page.tsx', 'utf8')
const daily = fs.readFileSync('app/dashboard/daily-content.tsx', 'utf8')
for (const marker of ['Estado actual', 'Siguiente acción', 'Prioridades actuales', 'Casos activos', 'Cambios relevantes']) assert.ok(`${homePage}\n${daily}`.includes(marker), `Missing Inicio marker: ${marker}`)
assert.equal((daily.match(/Siguiente acción/g) || []).length, 1, 'Inicio must expose one dominant next-action section')
assert.doesNotMatch(homePage, /Tu situación hoy[\s\S]*Qué necesita tu atención[\s\S]*Kumplio ordena lo importante/, 'Inicio intro remains overly layered')

const cases = fs.readFileSync('components/cases-workspace.tsx', 'utf8')
assert.doesNotMatch(cases, /href=\{`\/cases\/\$\{item\.id\}`\}/)
assert.doesNotMatch(cases, /\/cases\/\$\{item\.id\}\/live/)
assert.doesNotMatch(cases, />Trazabilidad</)
assert.match(cases, /`\/app\/casos\/\$\{item\.id\}`/)
assert.match(cases, /router\.push\(`\/app\/casos\/\$\{data\.complianceCase\.id\}`\)/)
assert.match(cases, /focus-visible:/)

const guided = fs.readFileSync('components/cases/guided-case-workspace.tsx', 'utf8')
assert.match(guided, /workspaceModel\.nextAction/)
assert.match(guided, /break-words|overflow-wrap|truncate|line-clamp/)
assert.match(guided, /focus-visible:/)
assert.doesNotMatch(guided, /WorkspaceNav|Intentos utilizados|Ver trazabilidad|Ejecuciones IA|Workflow ·/)

const docsClient = fs.readFileSync('app/documents/client.tsx', 'utf8')
const docs = fs.readFileSync('app/documents/content.tsx', 'utf8')
assert.match(docsClient, /px-4[^\n]*sm:px-6|px-4/)
assert.match(docs, /Volver al caso/)
assert.match(docs, /requiere revisión humana/)
assert.doesNotMatch(docs, /cumplimiento confirmado|evidencia verificada automáticamente/i)

const evidencePage = fs.readFileSync('app/evidence/page.tsx', 'utf8')
assert.match(evidencePage, /Pendiente de revisión|revisión/i)
assert.doesNotMatch(evidencePage, /Biblioteca verificable/, 'Page metadata/copy must not imply all stored evidence is verified')
assert.match(evidencePage, /px-4[^\n]*sm:px-6|px-4/)

console.log('Product polish: PASS')
