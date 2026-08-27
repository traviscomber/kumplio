import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [home, homeCopy, homeClarityCopy, demo, layout, metadataCopy, publicSite, entry, caseEntry, footer, signUp, faqCopy, legalCopy, pricingCopy] = await Promise.all([
  readFile('app/page.tsx', 'utf8'), readFile('lib/i18n/home-public-copy.ts', 'utf8'), readFile('lib/i18n/home-clarity-copy.ts', 'utf8'), readFile('app/demo/page.tsx', 'utf8'), readFile('app/layout.tsx', 'utf8'), readFile('lib/i18n/public-copy.ts', 'utf8'), readFile('lib/public-site.ts', 'utf8'), readFile('components/marketing/resolution-entry.tsx', 'utf8'), readFile('components/cases/beta-case-entry.tsx', 'utf8'), readFile('components/footer.tsx', 'utf8'), readFile('app/(auth)/sign-up/page.tsx', 'utf8'), readFile('lib/i18n/faq-public-copy.ts', 'utf8'), readFile('lib/i18n/legal-public-copy.ts', 'utf8'), readFile('lib/i18n/pricing-public-copy.ts', 'utf8'),
])

assert.match(homeCopy, /Protección de datos \+ guía experta para resolver/)
assert.match(homeCopy, /Protege tus datos\. Entiende qué hacer\. Avanza con una guía clara\./)
assert.match(homeCopy, /Centraliza información sensible/)
assert.match(homeCopy, /Recibe una guía experta/)
assert.match(homeCopy, /Cierra con evidencia/)
assert.match(home, /<ResolutionEntry locale=\{locale\} \/>/)
assert.match(homeCopy, /Nueva Ley 21\.719/)
assert.match(homeCopy, /Información y terceros/)
assert.match(homeCopy, /Casos concretos/)

for (const marker of ['Analiza', 'Resuelve', 'Revisa', 'Analyze', 'Resolve', 'Review']) assert.match(homeCopy, new RegExp(marker))
for (const specialist of ['Isidora', 'Verónica', 'Julieta']) assert.match(homeClarityCopy, new RegExp(specialist))
assert.doesNotMatch(home, /AGENT_CATALOG\.map/)
assert.match(homeCopy, /especialistas adicionales/)
assert.match(homeCopy, /additional specialists/)

assert.match(homeCopy, /Data protection \+ expert guidance to resolve real situations/)
assert.match(homeCopy, /Protect your data\. Understand what to do\. Move forward with a clear path\./)
assert.match(homeCopy, /Chilean Law 21\.719/)
assert.match(homeCopy, /human review/)

assert.match(entry, /GUIDED_ONBOARDING_DRAFT_KEY/)
assert.match(entry, /buildGuidedOnboardingSignUpPath\(\)/)
assert.match(entry, /¿Qué necesitas proteger o resolver\?/)
assert.match(entry, /Empezar con guía experta/)
assert.match(entry, /What do you need to protect or resolve\?/)
assert.match(entry, /Start with expert guidance/)
assert.match(caseEntry, /sessionStorage\.getItem\('kumplio:case-draft'\)/)
assert.match(caseEntry, /sessionStorage\.removeItem\('kumplio:case-draft'\)/)
assert.match(caseEntry, /Protección de datos con guía experta/)
assert.match(caseEntry, /Un inicio, un expediente\./)
assert.match(caseEntry, /\/api\/cases\/start-guided/)
assert.match(signUp, /Nombre de tu espacio de trabajo/)
assert.match(signUp, /Tu nombre, estudio o empresa/)
assert.match(signUp, /guided_resolution/)

assert.match(layout, /PUBLIC_SITE_METADATA/)
assert.match(metadataCopy, /Protección de datos y guía experta para resolver en Chile/)
assert.match(metadataCopy, /Plataforma de protección de datos, privacidad y resolución guiada de obligaciones en Chile/)
assert.match(metadataCopy, /Data protection and guided compliance for Chile/)
assert.match(publicSite, /proteger datos y resolver obligaciones de privacidad/)
assert.match(publicSite, /Preparar a organizaciones para la Ley 21\.719/)
assert.match(footer, /Resolución guiada de situaciones regulatorias/)
assert.match(footer, /Guided resolution for privacy, regulatory, contractual and compliance situations in Chile/)

assert.match(demo, /Isidora analiza obligaciones y contexto/)
assert.match(demo, /Verónica convierte brechas/)
assert.match(demo, /Julieta realiza una revisión independiente/)
assert.match(faqCopy, /casos, acciones, evidencia y decisiones revisables/)
assert.match(legalCopy, /Casos, resultados, revisiones y eventos/)
assert.match(legalCopy, /Cases, results, reviews and events/)
assert.match(pricingCopy, /Cambios relevantes organizados por prioridad/)
assert.match(pricingCopy, /Estado ejecutivo disponible cuando lo necesitas/)
assert.match(pricingCopy, /Relevant changes organized by priority/)
assert.match(pricingCopy, /Executive status available when you need it/)
assert.doesNotMatch(pricingCopy, /priorizados automáticamente/i)
assert.doesNotMatch(pricingCopy, /prioritized automatically/i)
assert.doesNotMatch(pricingCopy, /disponible en minutos/i)
assert.doesNotMatch(pricingCopy, /available in minutes/i)

const publicCopy = [home, homeCopy, demo, layout, metadataCopy, publicSite, footer, faqCopy, legalCopy, pricingCopy].join('\n')
const forbiddenClaims = [/diagnóstico gratis en 60 segundos/i, /brecha exacta/i, /exposición exacta/i, /34 obligaciones/i, /agentes analizando 24\/7/i, /de 21 documentos/i, /decisión clara en 4 minutos/i, /6 horas.*revisión manual/i]
for (const claim of forbiddenClaims) assert.doesNotMatch(publicCopy, claim)
assert.doesNotMatch([homeCopy, faqCopy, legalCopy].join('\n'), /\bmisiones\b/i)
assert.doesNotMatch([homeCopy, faqCopy, legalCopy].join('\n'), /\bmissions\b/i)

console.log('Guided resolution positioning contract: OK')
