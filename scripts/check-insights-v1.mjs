import fs from 'node:fs'

const requiredFiles = [
  'app/insights/page.tsx',
  'lib/compliance/insights.ts',
  'lib/compliance/confidence.ts',
  'app/map/page.tsx',
]

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing insights file: ${file}`)
}

const page = fs.readFileSync('app/insights/page.tsx', 'utf8')
const engine = fs.readFileSync('lib/compliance/insights.ts', 'utf8')
const confidence = fs.readFileSync('lib/compliance/confidence.ts', 'utf8')
const map = fs.readFileSync('app/map/page.tsx', 'utf8')

for (const token of ['Confianza del alcance registrado', 'Impacto prioritario', 'Timeline organizacional']) {
  if (!page.includes(token)) throw new Error(`Insights page missing: ${token}`)
}

for (const fn of ['buildTimeline', 'buildConfidence', 'buildImpact']) {
  if (!engine.includes(`function ${fn}`)) throw new Error(`Insights engine missing ${fn}`)
}

if (!confidence.includes('No equivale a cumplimiento global')) throw new Error('Canonical confidence scope disclaimer missing')
if (!page.includes('confidence.scope')) throw new Error('Insights must render the canonical confidence scope')
if (!page.includes('confidence.caps')) throw new Error('Confidence caps must be visible')
if (!map.includes('initialSelected={node || null}')) throw new Error('Map deep-link contract missing')
if (!page.includes("robots: { index: false, follow: false }")) throw new Error('Insights workspace must stay noindex')

console.log('Insights v1 guardrail: PASS')
