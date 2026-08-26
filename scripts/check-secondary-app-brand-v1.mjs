import fs from 'node:fs'

const personas = fs.readFileSync('app/app/personas/page.tsx', 'utf8')
const configuracion = fs.readFileSync('app/app/configuracion/page.tsx', 'utf8')
const globals = fs.readFileSync('app/globals.css', 'utf8')
const canonicalCase = fs.readFileSync('components/cases/canonical-case-page.tsx', 'utf8')

for (const [name, source] of [['personas', personas], ['configuracion', configuracion]]) {
  if (!source.includes('font-heading')) throw new Error(`${name} must use canonical heading typography`)
  if (!source.includes('rounded-[4px]')) throw new Error(`${name} must use 4px surfaces`)
  for (const forbidden of ['font-black', 'rounded-2xl', 'rounded-xl', 'rounded-full', 'shadow-']) {
    if (source.includes(forbidden)) throw new Error(`${name} still uses legacy styling: ${forbidden}`)
  }
}

for (const fragment of ['.kumplio-work-surface', 'border-radius: 4px', 'font-family: var(--font-heading)']) {
  if (!globals.includes(fragment)) throw new Error(`Case workspace normalization missing: ${fragment}`)
}
if (!canonicalCase.includes('kumplio-work-surface')) throw new Error('Canonical case page must use the scoped brand surface')

console.log('Secondary authenticated brand surfaces: PASS')
