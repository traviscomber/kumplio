import fs from 'node:fs'

const memory = fs.readFileSync('lib/compliance/context/organizational-memory.ts', 'utf8')
const tools = fs.readFileSync('lib/agents/tools.ts', 'utf8')
const casePage = fs.readFileSync('components/cases/canonical-case-page.tsx', 'utf8')
const contextPage = fs.readFileSync('app/context/page.tsx', 'utf8')

const checks = [
  ['memory table', memory.includes("from('organization_memory')")],
  ['decision fallback', memory.includes("from('mission_decisions')")],
  ['tenant scope', memory.includes(".eq('organization_id', organizationId)")],
  ['exclude current case', memory.includes(".neq('id', seed.id)")],
  ['agent memory context', tools.includes('getOrganizationalMemoryContext')],
  ['similar case context', tools.includes('CASOS SIMILARES DE ESTA ORGANIZACIÓN')],
  ['case UI', casePage.includes('SimilarCasesPanel')],
  ['context UI', contextPage.includes('getMemoryPrecedents')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failed.length) process.exit(1)
console.log('Organizational memory guardrail: PASS')
