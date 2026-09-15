import fs from 'node:fs'

const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const mobileNav = fs.readFileSync(new URL('../components/marketing/mobile-public-nav.tsx', import.meta.url), 'utf8')

for (const fragment of [
  'backdrop-blur-md',
  'focus-visible:outline',
]) {
  if (!page.includes(fragment)) {
    console.error(`Landing polish contract missing: ${fragment}`)
    process.exit(1)
  }
}

for (const id of ['como-funciona', 'resolver-form', 'areas']) {
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

for (const id of ['empresa', 'trabajador']) {
  if (!page.includes(`id="${id}"`)) {
    console.error(`Landing polish contract missing audience anchor: #${id}`)
    process.exit(1)
  }
}

const desktopIntakeLinks = page.match(/href="#resolver-form"/g) ?? []
if (desktopIntakeLinks.length < 2) {
  console.error(`Landing polish contract expected at least 2 direct intake links, found ${desktopIntakeLinks.length}`)
  process.exit(1)
}

for (const fragment of ['backdrop-blur-xl', 'href="#resolver-form"', 'text-sm']) {
  if (!mobileNav.includes(fragment)) {
    console.error(`Landing polish contract missing mobile navigation polish: ${fragment}`)
    process.exit(1)
  }
}

console.log('Landing polish contract: PASS')
