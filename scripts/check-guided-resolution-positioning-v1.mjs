import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [home, demo, layout, publicSite, entry, caseEntry, footer, signUp] = await Promise.all([
  readFile('app/page.tsx', 'utf8'),
  readFile('app/demo/page.tsx', 'utf8'),
  readFile('app/layout.tsx', 'utf8'),
  readFile('lib/public-site.ts', 'utf8'),
  readFile('components/marketing/resolution-entry.tsx', 'utf8'),
  readFile('components/cases/beta-case-entry.tsx', 'utf8'),
  readFile('components/footer.tsx', 'utf8'),
  readFile('app/(auth)/sign-up/page.tsx', 'utf8'),
])

assert.match(home, /Resolución guiada de obligaciones/)
assert.match(home, /Describe el problema\. Kumplio te acompaña hasta cerrarlo\./)
assert.match(home, /No solo te muestra qué falta\. Te ayuda a resolverlo\./)
assert.match(home, /<ResolutionEntry \/>/)
assert.match(home, /Personas/)
assert.match(home, /Empresas/)
assert.match(home, /Profesionales/)

assert.match(entry, /kumplio:case-draft/)
assert.match(entry, /¿Qué necesitas resolver\?/)
assert.match(entry, /Empezar a resolver/)
assert.match(caseEntry, /sessionStorage\.getItem\('kumplio:case-draft'\)/)
assert.match(caseEntry, /sessionStorage\.removeItem\('kumplio:case-draft'\)/)
assert.match(signUp, /Nombre de tu espacio de trabajo/)
assert.match(signUp, /Tu nombre, estudio o empresa/)
assert.match(signUp, /guided_resolution/)

assert.match(layout, /Resolución guiada de obligaciones y cumplimiento en Chile/)
assert.match(layout, /Guided obligation resolution and compliance case management/)
assert.match(publicSite, /situaciones regulatorias, contractuales y de cumplimiento/)
assert.match(footer, /Resolución guiada de situaciones regulatorias/)

const publicCopy = [home, demo, layout, publicSite, footer].join('\n')
const forbiddenClaims = [
  /diagnóstico gratis en 60 segundos/i,
  /brecha exacta/i,
  /exposición exacta/i,
  /34 obligaciones/i,
  /agentes analizando 24\/7/i,
  /de 21 documentos/i,
  /decisión clara en 4 minutos/i,
  /6 horas.*revisión manual/i,
]

for (const claim of forbiddenClaims) {
  assert.doesNotMatch(publicCopy, claim)
}

console.log('Guided resolution positioning contract: OK')
