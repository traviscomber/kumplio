import fs from 'node:fs'

const globals = fs.readFileSync('app/globals.css', 'utf8')
const layout = fs.readFileSync('app/layout.tsx', 'utf8')
const page = fs.readFileSync('app/page.tsx', 'utf8')
const button = fs.readFileSync('components/ui/button.tsx', 'utf8')
const topNav = fs.readFileSync('components/layout/top-nav.tsx', 'utf8')
const appNav = fs.readFileSync('components/app-navigation.tsx', 'utf8')

const requiredGlobalTokens = [
  '--kumplio-charcoal: #171715',
  '--kumplio-surface: #20201D',
  '--kumplio-tertiary: #292925',
  '--kumplio-graphite: #393833',
  '--kumplio-deep: #10110F',
  '--kumplio-parchment: #C2A887',
  '--kumplio-text-secondary: #AAA08F',
  '--kumplio-text-muted: #746D62',
  '--kumplio-green: #A7C63A',
  '--kumplio-sepia: #A36C42',
  '--radius: 4px',
  '--font-heading: var(--font-manrope)',
  '--font-body: var(--font-montserrat)',
]

for (const token of requiredGlobalTokens) {
  if (!globals.includes(token)) throw new Error(`Final brand token missing: ${token}`)
}

if (!layout.includes("import { Manrope, Montserrat } from 'next/font/google'")) {
  throw new Error('Root layout must load Manrope and Montserrat')
}
if (!layout.includes("variable: '--font-manrope'")) throw new Error('Manrope CSS variable missing')
if (!layout.includes("variable: '--font-montserrat'")) throw new Error('Montserrat CSS variable missing')
if (!layout.includes('className={`${manrope.variable} ${montserrat.variable} bg-background`}')) {
  throw new Error('Root html must expose both canonical font variables')
}
if (!page.includes('/kumplio-logo.png')) throw new Error('Public landing must use the supplied canonical Kumplio logo')
if (!topNav.includes('/kumplio-logo.png')) throw new Error('Authenticated top navigation must use the supplied canonical Kumplio logo')
if (!fs.existsSync('public/kumplio-logo.png')) throw new Error('Canonical logo asset missing at public/kumplio-logo.png')

const forbiddenGlobals = [
  '--kumplio-lima: #b8f542',
  '--kumplio-navy: #111723',
  '--kumplio-white: #ffffff',
  '--radius-xl: 20px',
]
for (const value of forbiddenGlobals) {
  if (globals.includes(value)) throw new Error(`Legacy visual token still active: ${value}`)
}

for (const [name, source] of [['button', button], ['top-nav', topNav], ['app-navigation', appNav]]) {
  for (const forbidden of ['rounded-lg', 'rounded-xl', 'shadow-sm', 'shadow-md', 'backdrop-blur-xl']) {
    if (source.includes(forbidden)) throw new Error(`${name} still uses forbidden brand primitive: ${forbidden}`)
  }
}

if (!button.includes('rounded-[4px]')) throw new Error('Button primitive must use the canonical 4px radius')
if (!button.includes('transition-colors')) throw new Error('Button primitive must use restrained color transitions')
if (!appNav.includes('border-b-2 border-primary')) throw new Error('Product navigation active state must use restrained green signal')

console.log('Final Kumplio brand system contract: PASS')
