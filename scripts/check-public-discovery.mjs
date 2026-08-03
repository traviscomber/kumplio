import { access, readFile } from 'node:fs/promises'
import process from 'node:process'

const requiredFiles = [
  'app/layout.tsx',
  'app/robots.ts',
  'app/sitemap.ts',
  'app/software-cumplimiento-chile/page.tsx',
  'app/resources/ley-21719/page.tsx',
  'app/resources/ley-21719/[slug]/page.tsx',
  'app/faq/page.tsx',
  'app/powered-by-n3uralia/page.tsx',
  'app/llms.txt/route.ts',
  'app/llms-full.txt/route.ts',
  'app/kumplio.json/route.ts',
  'app/feed.xml/route.ts',
  'app/api/indexnow/route.ts',
  'app/indexnow-key.txt/route.ts',
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

await expectIncludes('app/robots.ts', [
  'OAI-SearchBot',
  'GPTBot',
  'ClaudeBot',
  'PerplexityBot',
  "'/dashboard/'",
])

await expectIncludes('app/sitemap.ts', [
  '/software-cumplimiento-chile',
  '/resources/ley-21719',
  '/faq',
  '/powered-by-n3uralia',
])

const footer = await expectIncludes('components/footer.tsx', ['Powered by n3uralia'])
const poweredMentions = footer.match(/Powered by n3uralia/g)?.length || 0
if (poweredMentions !== 1) {
  failures.push(`El footer debe mostrar una sola mención discreta de Powered by n3uralia; encontradas: ${poweredMentions}`)
}

const publicClaims = [
  ['app/software-cumplimiento-chile/page.tsx', 'cumplimiento automático'],
  ['app/resources/ley-21719/page.tsx', 'asesoría jurídica'],
  ['app/faq/page.tsx', 'declara automáticamente'],
]

for (const [file, requiredGuardrail] of publicClaims) {
  const content = await readFile(file, 'utf8')
  if (!content.toLowerCase().includes(requiredGuardrail.toLowerCase())) {
    failures.push(`${file} no contiene el guardrail esperado: ${requiredGuardrail}`)
  }
}

if (failures.length) {
  console.error('\nPublic discovery validation failed:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Public discovery validation passed.')
