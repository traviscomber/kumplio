import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const groundingPath = 'lib/agents/sst-regulatory-grounding.ts'
const toolsPath = 'lib/agents/tools.ts'
const grounding = readFileSync(groundingPath, 'utf8')
const tools = readFileSync(toolsPath, 'utf8')

for (const token of [
  'read_sst_regulatory_grounding',
  'sst-ds44-suseso-v4',
  'https://www.dt.gob.cl/portal/1626/w3-article-127643.html',
  'https://www.suseso.cl/612/w3-propertyvalue-69181.html',
  'regulatory_document_sections',
  "['isidora', 'rodrigo', 'javier', 'beatriz', 'veronica', 'catalina']",
]) {
  assert.ok(grounding.includes(token), `SST grounding missing required token: ${token}`)
}

for (const phrase of [
  'NO se transforma automáticamente en obligación aplicable al cliente',
  'No declares aplicabilidad legal',
  'revisión humana',
  'inferencia del agente',
]) {
  assert.ok(grounding.includes(phrase), `SST grounding missing policy guard: ${phrase}`)
}

assert.ok(!grounding.includes("select('raw_content"), 'SST grounding must not retrieve raw_content')
assert.ok(!grounding.includes('SUPABASE_SERVICE_ROLE_KEY'), 'SST grounding must not read service-role credentials')
assert.ok(!grounding.includes('decrypted_secret'), 'SST grounding must not access Vault secrets')

assert.ok(tools.includes("import { retrieveSstRegulatoryGrounding } from './sst-regulatory-grounding'"))
assert.ok(tools.includes('const grounding = await retrieveSstRegulatoryGrounding(supabase, scope)'))
assert.ok(tools.includes('sourceRefs.push(...grounding.sourceRefs)'))
assert.ok(tools.includes('toolCallIds.push(grounding.toolCallId)'))
assert.ok(tools.includes("warnings.push('sst_regulatory_grounding: unavailable')"))

console.log('SST official agent grounding contract: PASS')
