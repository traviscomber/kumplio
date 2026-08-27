import fs from 'node:fs'

const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')

for (const fragment of [
  'backdrop-blur-xl',
  'focus-visible:outline',
]) {
  if (!page.includes(fragment)) {
    console.error(`Landing polish contract missing: ${fragment}`)
    process.exit(1)
  }
}

for (const id of ['como-funciona', 'producto', 'verticales']) {
  const marker = `id="${id}"`
  const markerIndex = page.indexOf(marker)
  if (markerIndex < 0) {
    console.error(`Landing polish contract missing section anchor: ${marker}`)
    process.exit(1)
  }

  const tagStart = page.lastIndexOf('<section', markerIndex)
  const tagEnd = page.indexOf('>', markerIndex)
  const openingTag = tagStart >= 0 && tagEnd >= 0 ? page.slice(tagStart, tagEnd + 1) : ''
  if (!openingTag.includes('scroll-mt-20')) {
    console.error(`Landing polish contract requires scroll offset on #${id}`)
    process.exit(1)
  }
}

const intakeLinks = page.match(/href="#resolver-form"/g) ?? []
if (intakeLinks.length < 2) {
  console.error(`Landing polish contract expected at least 2 direct intake links, found ${intakeLinks.length}`)
  process.exit(1)
}

if (!page.includes('sm:text-sm')) {
  console.error('Landing polish contract requires a compact mobile primary CTA')
  process.exit(1)
}

console.log('Landing polish contract: PASS')
