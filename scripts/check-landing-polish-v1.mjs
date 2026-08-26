import fs from 'node:fs'

const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')

const requiredFragments = [
  'data-mobile-primary-cta',
  'id="como-funciona" className="scroll-mt-20',
  'id="producto" className="scroll-mt-20',
  'id="para-quien" className="scroll-mt-20',
  'focus-visible:outline',
]

for (const fragment of requiredFragments) {
  if (!page.includes(fragment)) {
    console.error(`Landing polish contract missing: ${fragment}`)
    process.exit(1)
  }
}

const intakeLinks = page.match(/href="#resolver-form"/g) ?? []
if (intakeLinks.length < 3) {
  console.error(`Landing polish contract expected at least 3 direct intake links, found ${intakeLinks.length}`)
  process.exit(1)
}

if (!page.includes('sm:hidden')) {
  console.error('Landing polish contract requires a compact mobile primary CTA')
  process.exit(1)
}

console.log('Landing polish contract: PASS')
