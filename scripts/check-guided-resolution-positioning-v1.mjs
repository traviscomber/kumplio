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

// Canonical public positioning: privacy first, secure centralization and expert guidance.
assert.match(home, /Protección de datos \+ guía experta para resolver/)
assert.match(home, /Protege tus datos\. Entiende qué hacer\. Avanza con una guía clara\./)
assert.match(home, /Centraliza información sensible/)
assert.match(home, /Recibe una guía experta/)
assert.match(home, /Cierra con evidencia/)
assert.match(home, /<ResolutionEntry \/>/)
assert.match(home, /Nueva Ley 21\.719/)
assert.match(home, /Información y terceros/)
assert.match(home, /Casos concretos/)

assert.match(entry, /kumplio:case-draft/)
assert.match(entry, /¿Qué necesitas proteger o resolver\?/)
assert.match(entry, /Empezar a resolver/)
assert.match(caseEntry, /sessionStorage\.getItem\('kumplio:case-draft'\)/)
assert.match(caseEntry, /sessionStorage\.removeItem\('kumplio:case-draft'\)/)
assert.match(caseEntry, /Protección de datos · Ley 21\.719/)
assert.match(signUp, /Nombre de tu espacio de trabajo/)
assert.match(signUp, /Tu nombre, estudio o empresa/)
assert.match(signUp, /guided_resolution/)

assert.match(layout, /Protección de datos y guía experta para resolver en Chile/)
assert.match(layout, /Plataforma de protección de datos, privacidad y resolución guiada de obligaciones en Chile/)
assert.match(publicSite, /proteger datos y resolver obligaciones de privacidad/)
assert.match(publicSite, /Preparar a organizaciones para la Ley 21\.719/)
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
