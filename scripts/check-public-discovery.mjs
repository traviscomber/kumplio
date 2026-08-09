import { access, readFile } from 'node:fs/promises'
import process from 'node:process'

const indexNowKey = '5f3a9c7d2e4b6810a9d5f4c2b7e8a163'

const requiredFiles = [
  'app/layout.tsx',
  'app/robots.ts',
  'app/sitemap.ts',
  'app/software-cumplimiento-chile/page.tsx',
  'app/resources/ley-21719/page.tsx',
  'app/resources/ley-21719/[slug]/page.tsx',
  'app/faq/page.tsx',
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
  'lib/indexnow.ts',
  'lib/public-site.ts',
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
])

await expectIncludes('lib/public-site.ts', [
  'N3URALIA_FACTORY_DESCRIPTION',
  'factoría chilena de inteligencia artificial aplicada y software',
  'Kumplio es un producto desarrollado por n3uralia',
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
  '/faq',
  '/powered-by-n3uralia',
  "2026-08-09T11:15:00-04:00",
])

await expectIncludes('app/como-pensamos/page.tsx', [
  "canonical: '/como-pensamos'",
  'IA, evidencia y revisión humana en Chile',
  "url: '/como-pensamos'",
])

await expectIncludes('app/llms.txt/route.ts', [
  'Developer and product factory',
  'Primary market: Chile',
  'Last reviewed: 2026-08-09',
  'N3URALIA_FACTORY_DESCRIPTION',
])

await expectIncludes('app/llms-full.txt/route.ts', [
  'Last reviewed: 2026-08-09',
  'Developer and product factory',
  'Geographic relevance',
  'N3URALIA_FACTORY_DESCRIPTION',
])

await expectIncludes('app/kumplio.json/route.ts', [
  "schema_version: '1.1'",
  "last_reviewed: '2026-08-09'",
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

const footer = await expectIncludes('components/footer.tsx', ['Powered by n3uralia'])
const poweredMentions = footer.match(/Powered by n3uralia/g)?.length || 0
if (poweredMentions !== 1) {
  failures.push(`El footer debe mostrar una sola mención discreta de Powered by n3uralia; encontradas: ${poweredMentions}`)
}

const publicClaims = [
  ['app/software-cumplimiento-chile/page.tsx', 'declara automáticamente'],
  ['app/resources/ley-21719/page.tsx', 'No reemplazan'],
  ['app/faq/page.tsx', 'revisión humana'],
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
