import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const home = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8')
const detail = await readFile(new URL('../app/verticales/[slug]/page.tsx', import.meta.url), 'utf8')
const verticalCopy = await readFile(new URL('../lib/i18n/vertical-public-copy.ts', import.meta.url), 'utf8')

for (const slug of ['proteccion-de-datos', 'mineria', 'transporte', 'construccion', 'salud', 'agroindustria']) {
  assert.match(verticalCopy, new RegExp(`['"]?${slug.replaceAll('-', '\\-')}['"]?[^\n]+/brand/`), `Missing sector image mapping: ${slug}`)
}

assert.match(home, /\/verticales\/\$\{slug\}/, 'Area links must target their detail page')
assert.match(home, /VERTICAL_SLUGS\.slice\(0, 3\)/, 'Homepage must initially show no more than three areas')
assert.match(home, /VERTICAL_SLUGS\.slice\(3\).*AreaCard/s, 'Remaining areas must reveal as complete visual area cards')
assert.match(home, /function AreaCard/, 'All public areas must share one visual card implementation')
assert.match(home, /VERTICAL_SLUGS\.map\(\(slug\).*Ver sección de áreas/s, 'Desktop navigation must expose all six areas')
assert.match(home, /VERTICAL_IMAGES\[slug\]/, 'Area links must render their sector image')
assert.match(home, /VERTICAL_IMAGE_POSITIONS\[slug\]/, 'Area links must apply a sector-specific crop')
assert.match(home, /locale === 'en'.*kumplio-operating-model\.webp/s, 'English how-it-works section must retain branded photography')
assert.match(home, /locale === 'en'.*kumplio-specialists\.webp/s, 'English worker/company section must retain branded photography')
assert.notEqual(
  verticalCopy.match(/mineria: '([^']+)'/)?.[1],
  verticalCopy.match(/transporte: '([^']+)'/)?.[1],
  'Mining and transport must not share the same image',
)
assert.match(detail, /generateStaticParams/, 'Vertical detail routes must be statically enumerated')
assert.match(detail, /notFound\(\)/, 'Unknown vertical routes must return not found')
assert.match(verticalCopy, /heroQuestion/, 'Verticals must expose a concrete operational question')
assert.match(verticalCopy, /exampleInput/, 'Verticals must expose a concrete input')
assert.match(verticalCopy, /exampleResult/, 'Verticals must expose a concrete result')
assert.match(verticalCopy, /workflow/, 'Verticals must expose the shared operating chain')

console.log('Public verticals contract passed (3 initial areas + 6 detail routes).')
