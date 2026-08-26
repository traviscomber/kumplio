import fs from 'node:fs'

const alerts = fs.readFileSync('app/app/alertas/page.tsx', 'utf8')
const activity = fs.readFileSync('app/app/actividad/page.tsx', 'utf8')

for (const [name, source] of [['alerts', alerts], ['activity', activity]]) {
  if (!source.includes('font-heading')) {
    console.error(`${name} missing canonical heading font`)
    process.exit(1)
  }
  if (!source.includes('rounded-[4px]')) {
    console.error(`${name} missing canonical 4px radius`)
    process.exit(1)
  }
  for (const token of ['font-black', 'rounded-2xl', 'rounded-xl', 'rounded-full', 'shadow-xl', 'shadow-lg']) {
    if (source.includes(token)) {
      console.error(`${name} still uses legacy styling: ${token}`)
      process.exit(1)
    }
  }
}

console.log('Operational Kumplio brand surfaces: PASS')
