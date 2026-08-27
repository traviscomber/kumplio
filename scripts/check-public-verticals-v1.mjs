import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const homeCopy = await readFile(new URL('../lib/i18n/home-clarity-copy.ts', import.meta.url), 'utf8')
const home = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8')
const detail = await readFile(new URL('../app/verticales/[slug]/page.tsx', import.meta.url), 'utf8')
const verticalCopy = await readFile(new URL('../lib/i18n/vertical-public-copy.ts', import.meta.url), 'utf8')

for (const slug of ['proteccion-de-datos', 'mineria', 'transporte', 'construccion', 'salud', 'agroindustria']) {
  assert.match(homeCopy, new RegExp(`slug: '${slug}'`), `Missing public vertical: ${slug}`)
  assert.match(verticalCopy, new RegExp(`${slug.replaceAll('-', '\\-')}[^\n]+/brand/`), `Missing sector image mapping: ${slug}`)
}

assert.match(home, /\/verticales\/\$\{item\.slug\}/, 'Vertical cards must link to their detail page')
assert.match(home, /focus-visible:ring/, 'Vertical cards must expose a keyboard focus state')
assert.match(home, /VERTICAL_IMAGES\[item\.slug/, 'Vertical cards must render their sector image')
assert.notEqual(
  verticalCopy.match(/mineria: '([^']+)'/)?.[1],
  verticalCopy.match(/transporte: '([^']+)'/)?.[1],
  'Mining and transport must not share the same card image',
)
assert.match(detail, /generateStaticParams/, 'Vertical detail routes must be statically enumerated')
assert.match(detail, /notFound\(\)/, 'Unknown vertical routes must return not found')

console.log('Public verticals contract passed (6 cards + detail routes).')
