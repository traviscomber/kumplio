import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const page = await readFile('app/dashboard/agents/page.tsx', 'utf8')

assert.match(page, /from\('agent_workflows'\)/)
assert.match(page, /from\('agent_workflow_stages'\)/)
assert.match(page, /from\('agent_artifacts'\)/)
assert.match(page, /\/cases\/new/)
assert.match(page, /\/cases\/\$\{workflow[.]case_id\}\/beta/)
assert.match(page, /AGENT_CATALOG/)
assert.match(page, /Julieta/)
assert.doesNotMatch(page, /useState|setAnalyzing|Analizando[.][.][.]/)
assert.doesNotMatch(page, /95%|2[.]4s|\$0[.]12/)
assert.doesNotMatch(page, /Catalina/)

await assert.rejects(
  readFile('components/agents/agent-dashboard.tsx', 'utf8'),
  (error) => error && error.code === 'ENOENT',
)

console.log('Agent dashboard v1 validation passed')
