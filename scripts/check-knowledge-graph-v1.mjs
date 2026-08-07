import fs from 'node:fs'

const requiredFiles = [
  'lib/compliance/knowledge-graph/types.ts',
  'lib/compliance/knowledge-graph/build.ts',
  'lib/compliance/reuse.ts',
  'components/compliance/knowledge-map.tsx',
  'app/map/page.tsx',
]

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing knowledge graph file: ${file}`)
}

const map = fs.readFileSync('app/map/page.tsx', 'utf8')
const controls = fs.readFileSync('app/api/controls/route.ts', 'utf8')
const builder = fs.readFileSync('lib/compliance/knowledge-graph/build.ts', 'utf8')

for (const token of ['control_obligations', 'control_evidence', 'compliance_cases', 'missions']) {
  if (!map.includes(token)) throw new Error(`Map does not load required relation: ${token}`)
}

for (const token of ['obligation', 'control', 'evidence', 'case', 'mission', 'member']) {
  if (!builder.includes(`'${token}'`)) throw new Error(`Graph builder missing node type: ${token}`)
}

if (!controls.includes('findReuseCandidates')) throw new Error('Control creation is not protected by reuse detection')
if (!controls.includes('reuse_candidate_found')) throw new Error('Reuse candidate contract is missing')

console.log('Knowledge graph v1: PASS')
