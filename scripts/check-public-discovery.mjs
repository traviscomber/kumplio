import { access, readFile } from 'node:fs/promises'
import process from 'node:process'

const indexNowKey = '5f3a9c7d2e4b6810a9d5f4c2b7e8a163'

const requiredFiles = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/pricing/page.tsx',
  'app/faq/page.tsx',
  'app/contact/page.tsx',
  'app/robots.ts',
  'app/sitemap.ts',
  'app/software-cumplimiento-chile/page.tsx',
  'app/resources/ley-21719/page.tsx',
  'app/resources/ley-21719/[slug]/page.tsx',
  'app/como-pensamos/page.tsx',
  'app/powered-by-n3uralia/page.tsx',
  'app/llms.txt/route.ts',
  'app/llms-full.txt/route.ts',
  'app/kumplio.json/route.ts',
  'app/feed.xml/route.ts',
  'app/api/indexnow/route.ts',
  'app/indexnow-key.txt/route.ts',
  `app/${indexNowKey}.txt/route.ts`,
  'app/.well-known/security.txt/route.ts',
  'components/footer.tsx',
  'components/marketing/resolution-entry.tsx',
  'components/marketing/contact-page-content.tsx',
  'lib/indexnow.ts',
  'lib/public-site.ts',
  'lib/i18n/agent-public-copy.ts',
  'lib/i18n/home-public-copy.ts',
  'lib/i18n/pricing-public-copy.ts',
  'lib/i18n/faq-public-copy.ts',
  'lib/i18n/contact-public-copy.ts',
  'lib/i18n/public-routing.ts',
  'lib/i18n/request-context.ts',
  'lib/i18n/public-copy.ts',
  'proxy.ts',
  'next.config.mjs',
  '.github/workflows/indexnow.yml',
  '.github/workflows/public-discovery.yml',
]

const failures = []

for (const file of requiredFiles) {
  try {
    await access(file)
  } catch {
    failures.push(`Falta archivo requerido: ${file}`)
  }
}

async function expectIncludes(file, values) {
  const content = await readFile(file, 'utf8')
  for (const value of values) {
    if (!content.includes(value)) failures.push(`${file} no contiene: ${value}`)
  }
  return content
}

await expectIncludes('app/layout.tsx', [
  'SoftwareApplication',
  'n3uralia',
  'provider',
  '/llms.txt',
  '/kumplio.json',
  'generateMetadata',
  'withPublicLocale',
  'getPublicSiteHref',
  'getPublicRequestContext',
  'isEnglishPublicPathReady',
])

await expectIncludes('lib/i18n/public-routing.ts', [
  "PUBLIC_LOCALES = ['es', 'en']",
  "DEFAULT_PUBLIC_LOCALE: PublicLocale = 'es'",
  "PUBLIC_LOCALE_COOKIE = 'kumplio_public_locale'",
  "SPANISH_PUBLIC_PATHS_READY = new Set(['/', '/pricing', '/faq', '/contact'])",
  "ENGLISH_PUBLIC_PATHS_READY = new Set(['/', '/pricing', '/faq', '/contact'])",
  'splitPublicLocale',
  'isPublicSitePath',
  'isLocalizedPublicPathReady',
  'getPublicSiteHref',
  'withPublicLocale',
  "'/resources/ley-21719'",
])

await expectIncludes('lib/i18n/public-copy.ts', [
  "htmlLang: 'es-CL'",
  "htmlLang: 'en'",
  'Chile Law 21.719',
  'human review',
])

await expectIncludes('lib/i18n/home-public-copy.ts', [
  'HOME_PUBLIC_COPY',
  'Protege tus datos. Entiende qué hacer. Avanza con una guía clara.',
  'Protect your data. Understand what to do. Move forward with a clear path.',
  'Chilean Law 21.719',
  'human review',
])

await expectIncludes('lib/i18n/agent-public-copy.ts', [
  'ENGLISH_AGENT_PUBLIC_COPY',
  'Obligations and documentary evidence analyst',
  'Legal, quality and communication reviewer',
  'supported/unsupported claims',
])

await expectIncludes('lib/i18n/pricing-public-copy.ts', [
  'PRICING_PUBLIC_COPY',
  'Elige cuánto trabajo manual quieres recuperar',
  'Choose how much manual work you want to recover',
  "id: 'acompanado'",
  "price: '$249.990'",
  "price: '$249,990'",
  'Prices are in Chilean pesos and exclude VAT',
])

await expectIncludes('lib/i18n/faq-public-copy.ts', [
  'FAQ_PUBLIC_COPY',
  '¿Kumplio declara automáticamente que una empresa cumple?',
  'Does Kumplio automatically declare that a company is compliant?',
  'revisión humana',
  'human review',
  'December 1, 2026',
  'should not turn missing evidence into a positive conclusion of compliance',
])

await expectIncludes('lib/i18n/contact-public-copy.ts', [
  'CONTACT_PUBLIC_COPY',
  'Conversemos sobre el resultado que necesitas.',
  'Let’s discuss the outcome you need.',
  "acompanado: 'Plan Acompañado'",
  "acompanado: 'Guided plan'",
  'Prices',
])

await expectIncludes('app/page.tsx', [
  'HOME_PUBLIC_COPY',
  'ENGLISH_AGENT_PUBLIC_COPY',
  'getPublicRequestContext',
  'getPublicSiteHref',
  'alternateHomeHref',
  '<ResolutionEntry locale={locale} />',
  '<Footer locale={locale} />',
])

await expectIncludes('app/pricing/page.tsx', [
  'PRICING_PUBLIC_COPY',
  'generateMetadata',
  "withPublicLocale('/pricing', locale)",
  'alternatePricingHref',
  '<Footer locale={locale} />',
])

await expectIncludes('app/faq/page.tsx', [
  'FAQ_PUBLIC_COPY',
  'generateMetadata',
  "withPublicLocale('/faq', locale)",
  "'@type': 'FAQPage'",
  'alternateFaqHref',
  '<Footer locale={locale} />',
])

await expectIncludes('app/contact/page.tsx', [
  'ContactPageContent',
  'CONTACT_PUBLIC_COPY',
  'generateMetadata',
  "withPublicLocale('/contact', locale)",
  '<ContactPageContent locale={locale} />',
])

await expectIncludes('components/marketing/contact-page-content.tsx', [
  "fetch('/api/leads'",
  'canonicalServiceLabels',
  "acompanado: 'Plan Acompañado'",
  "source: service ? `contact-${service}` : 'contact-page'",
  'getPublicSiteHref',
  'alternateContactHref',
  '<Footer locale={locale} />',
])

await expectIncludes('components/marketing/resolution-entry.tsx', [
  "locale = 'es'",
  'What do you need to protect or resolve?',
  'Start with expert guidance',
  "router.push('/sign-up?next=/cases/new')",
])

await expectIncludes('proxy.ts', [
  'splitPublicLocale',
  'NextResponse.rewrite',
  'PUBLIC_LOCALE_COOKIE',
  'isLocalizedPublicPathReady',
  "response.headers.set('Content-Language'",
  'updateSession(request)',
])

await expectIncludes('lib/public-site.ts', [
  'PUBLIC_POSITIONING',
  'protección de datos y privacidad para Chile',
  'Ley 21.719',
  'N3URALIA_FACTORY_DESCRIPTION',
  'factoría chilena de inteligencia artificial aplicada y software',
  'Kumplio es un producto desarrollado por n3uralia',
])

await expectIncludes('app/software-cumplimiento-chile/page.tsx', [
  'Software de protección de datos y Ley 21.719 en Chile',
  'Protege tus datos y prepárate para la Ley 21.719 con una ruta clara.',
  '¿Qué debe resolver una plataforma de protección de datos?',
  'Construido para la realidad de protección de datos en Chile.',
  'cumplimiento normativo',
])

await expectIncludes('app/robots.ts', [
  'OAI-SearchBot',
  'GPTBot',
  'ClaudeBot',
  'PerplexityBot',
  "'/dashboard'",
])

await expectIncludes('app/sitemap.ts', [
  '/software-cumplimiento-chile',
  '/resources/ley-21719',
  '/resources/cumplimiento-normativo',
  '/como-pensamos',
  '/powered-by-n3uralia',
  'localizedUrl',
  "localizedPair('/', 'weekly'",
  "localizedPair('/pricing', 'monthly'",
  "localizedPair('/faq', 'monthly'",
  "localizedPair('/contact', 'monthly'",
  'currentPublicUrl',
  "2026-08-14T09:54:00-04:00",
])

await expectIncludes('app/como-pensamos/page.tsx', [
  "canonical: '/como-pensamos'",
  'IA, evidencia y revisión humana en Chile',
  "url: '/como-pensamos'",
])

await expectIncludes('app/llms.txt/route.ts', [
  'Developer and product factory',
  'Primary market: Chile',
  'Primary positioning:',
  'Primary scope: data protection, privacy and Law 21.719 in Chile.',
  'Secondary category: compliance management.',
  'Last reviewed: 2026-08-09',
  'N3URALIA_FACTORY_DESCRIPTION',
])

await expectIncludes('app/llms-full.txt/route.ts', [
  'Last reviewed: 2026-08-09',
  'Developer and product factory',
  'personal data protection, privacy and guided preparation for Chilean Law 21.719',
  'current public product positioning is data protection and privacy in Chile',
  'Geographic relevance',
  'N3URALIA_FACTORY_DESCRIPTION',
])

await expectIncludes('app/kumplio.json/route.ts', [
  "schema_version: '1.2'",
  "last_reviewed: '2026-08-09'",
  "primary_category: 'Data protection and privacy software'",
  "secondary_category: 'Compliance management software'",
  'primary_positioning: PUBLIC_POSITIONING',
  "role: 'developer_and_product_factory'",
  'geographic_relevance',
])

await expectIncludes('next.config.mjs', [
  "source: '/sales-kit'",
  "destination: '/software-cumplimiento-chile'",
  "source: '/demo/transporte'",
  "source: '/demo/mineria'",
  'permanent: true',
])

const footer = await expectIncludes('components/footer.tsx', [
  'Powered by n3uralia',
  'getPublicSiteHref',
  'All rights reserved.',
])
const poweredMentions = footer.match(/Powered by n3uralia/g)?.length || 0
if (poweredMentions !== 1) {
  failures.push(`El footer debe mostrar una sola mención discreta de Powered by n3uralia; encontradas: ${poweredMentions}`)
}

const publicClaims = [
  ['app/software-cumplimiento-chile/page.tsx', 'declara automáticamente'],
  ['app/resources/ley-21719/page.tsx', 'No reemplazan'],
  ['lib/i18n/faq-public-copy.ts', 'revisión humana'],
  ['lib/i18n/faq-public-copy.ts', 'human review'],
]

for (const [file, requiredGuardrail] of publicClaims) {
  const content = await readFile(file, 'utf8')
  if (!content.toLowerCase().includes(requiredGuardrail.toLowerCase())) {
    failures.push(`${file} no contiene el guardrail esperado: ${requiredGuardrail}`)
  }
}

const indexNowConfig = await expectIncludes('lib/indexnow.ts', [
  indexNowKey,
  'INDEXNOW_KEY_PATH',
  'DEPRECATED_PUBLIC_URLS',
  '/sales-kit',
  '/demo/transporte',
  '/demo/mineria',
])

if (!/INDEXNOW_KEY = '[A-Za-z0-9-]{8,128}'/.test(indexNowConfig)) {
  failures.push('La clave IndexNow no cumple el formato de 8 a 128 caracteres permitido')
}

await expectIncludes(`app/${indexNowKey}.txt/route.ts`, [
  'INDEXNOW_KEY',
  "'force-static'",
  "'text/plain; charset=utf-8'",
])

const indexNowApi = await expectIncludes('app/api/indexnow/route.ts', [
  'INDEXNOW_KEY',
  'INDEXNOW_KEY_URL',
  '10000',
  'api.indexnow.org/indexnow',
])
if (indexNowApi.includes('process.env.INDEXNOW_KEY')) {
  failures.push('El endpoint IndexNow no debe depender de INDEXNOW_KEY en Vercel')
}

await expectIncludes('.github/workflows/indexnow.yml', [
  'statuses: write',
  'STATUS_CONTEXT: IndexNow production',
  'Mark IndexNow notification pending',
  'Mark IndexNow notification successful',
  'Mark IndexNow notification failed',
  'Waiting for the Kumplio production deployment',
  'IndexNow accepted the Kumplio production URLs',
  'Wait for production deployment and key verification',
  `INDEXNOW_KEY: ${indexNowKey}`,
  '$INDEXNOW_KEY.txt',
  'sitemap.xml',
  'sales-kit',
  'demo/transporte',
  'demo/mineria',
  "status\" = '202'",
])

await expectIncludes('.github/workflows/public-discovery.yml', [
  'node-version: 24',
  "'.github/workflows/indexnow.yml'",
])

if (failures.length) {
  console.error('\nPublic discovery validation failed:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Public discovery validation passed.')
