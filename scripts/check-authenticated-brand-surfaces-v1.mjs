import fs from 'node:fs'

const onboardingPage = fs.readFileSync('app/onboarding/page.tsx', 'utf8')
const onboardingForm = fs.readFileSync('components/onboarding/workspace-onboarding-form.tsx', 'utf8')
const home = fs.readFileSync('app/app/inicio/page.tsx', 'utf8')

const required = [
  [onboardingPage, 'font-heading'],
  [onboardingPage, 'border-[rgba(194,168,135,0.14)]'],
  [onboardingForm, 'rounded-[4px]'],
  [onboardingForm, 'font-heading'],
  [home, 'font-heading'],
  [home, 'rounded-[4px]'],
]

for (const [source, fragment] of required) {
  if (!source.includes(fragment)) {
    console.error(`Authenticated brand surface missing: ${fragment}`)
    process.exit(1)
  }
}

const forbidden = ['font-black', 'rounded-3xl', 'rounded-2xl', 'rounded-xl', 'rounded-full', 'shadow-xl', 'shadow-black']
for (const token of forbidden) {
  if (onboardingPage.includes(token) || onboardingForm.includes(token) || home.includes(token)) {
    console.error(`Authenticated brand surface still uses legacy styling: ${token}`)
    process.exit(1)
  }
}

if (!onboardingForm.includes('bg-primary/5')) {
  console.error('Onboarding must retain restrained green signal for selected/verified states')
  process.exit(1)
}

console.log('Authenticated Kumplio brand surfaces: PASS')
