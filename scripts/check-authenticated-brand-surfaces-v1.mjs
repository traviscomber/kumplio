import fs from 'node:fs'

const onboardingPage = fs.readFileSync('app/onboarding/page.tsx', 'utf8')
const onboardingForm = fs.readFileSync('components/onboarding/workspace-onboarding-form.tsx', 'utf8')
const home = fs.readFileSync('app/app/inicio/page.tsx', 'utf8')
const casesPage = fs.readFileSync('app/cases/page.tsx', 'utf8')
const casesWorkspace = fs.readFileSync('components/cases-workspace.tsx', 'utf8')
const documents = fs.readFileSync('app/app/documentos/page.tsx', 'utf8')
const evidence = fs.readFileSync('app/app/evidencia/page.tsx', 'utf8')
const canonicalCase = fs.readFileSync('components/cases/canonical-case-page.tsx', 'utf8')
const globals = fs.readFileSync('app/globals.css', 'utf8')

const required = [
  [onboardingPage, 'font-heading'],
  [onboardingPage, 'border-[rgba(194,168,135,0.14)]'],
  [onboardingForm, 'rounded-[4px]'],
  [onboardingForm, 'font-heading'],
  [home, 'font-heading'],
  [home, 'rounded-[4px]'],
  [casesPage, 'font-heading'],
  [casesWorkspace, 'font-heading'],
  [casesWorkspace, 'rounded-[4px]'],
  [documents, 'kumplio-work-surface'],
  [evidence, 'kumplio-work-surface'],
  [canonicalCase, 'kumplio-work-surface'],
  [globals, '.kumplio-work-surface'],
  [globals, 'border-radius: 4px'],
]

for (const [source, fragment] of required) {
  if (!source.includes(fragment)) {
    console.error(`Authenticated brand surface missing: ${fragment}`)
    process.exit(1)
  }
}

const forbidden = ['font-black', 'rounded-3xl', 'rounded-2xl', 'rounded-xl', 'rounded-full', 'shadow-xl', 'shadow-black']
for (const token of forbidden) {
  if ([onboardingPage, onboardingForm, home, casesPage, casesWorkspace].some((source) => source.includes(token))) {
    console.error(`Authenticated brand surface still uses legacy styling: ${token}`)
    process.exit(1)
  }
}

if (!onboardingForm.includes('bg-primary/5')) {
  console.error('Onboarding must retain restrained green signal for selected/verified states')
  process.exit(1)
}
if (!casesWorkspace.includes('border-primary bg-primary/5')) {
  console.error('Cases workspace must use Kumplio green only as a restrained active signal')
  process.exit(1)
}

console.log('Authenticated Kumplio brand surfaces: PASS')
