import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync('lib/agents/orchestrator.ts', 'utf8')

for (const marker of ['specialists:', 'Analizar', 'Resolver', 'Revisar', "finalReviewer: 'catalina'", 'asyncPreferred']) {
  assert.ok(source.includes(marker), `three-agent routing missing marker: ${marker}`)
}

for (const agent of ['beatriz', 'rodrigo', 'javier', 'andres']) {
  assert.ok(source.includes(`agentId: '${agent}'`) || source.includes(`'${agent}'`), `specialist routing must preserve ${agent}`)
}

assert.ok(source.includes('requiresSpecialist'), 'routing must be deterministic and bounded')
assert.ok(!source.includes("add('rodrigo', 'Determinar qué importa'"), 'Rodrigo must not be mandatory for general guidance')
assert.ok(!source.includes("add('javier', 'Guiar el siguiente paso'"), 'Javier must not be mandatory for general guidance')

console.log('Three-agent specialist routing: PASS')
