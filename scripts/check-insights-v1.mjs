import fs from 'node:fs'

const requiredFiles = [
  'app/insights/page.tsx',
  'lib/compliance/insights.ts',
  'app/map/page.tsx',
]

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing insights file: ${file}`)
}

const page = fs.readFileSync('app/insights/page.tsx', 'utf8')
const engine = fs.readFileSync('lib/compliance/insights.ts', 'utf8')
const map = fs.readFileSync('app/map/page.tsx', 'utf8')

for (const token of ['Mapa de confianza', 'Impacto prioritario', 'Timeline organizacional']) {
  if (!page.includes(token)) throw new Error(`Insights page missing: ${token}`)
}

for (const fn of ['buildTimeline', 'buildConfidence', 'buildImpact']) {
  if (!engine.includes(`function ${fn}`)) throw new Error(`Insights engine missing ${fn}`)
}

if (!map.includes('initialSelected={node || null}')) throw new Error('Map deep-link contract missing')
if (!page.includes("robots: { index: false, follow: false }")) throw new Error('Insights workspace must stay noindex')

console.log('Insights v1 guardrail: PASS')
