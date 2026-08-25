import assert from 'node:assert/strict'
import fs from 'node:fs'

const chain = fs.readFileSync('components/cases/case-grounding-chain.tsx', 'utf8')
const preview = fs.readFileSync('components/cases/artifact-result-preview.tsx', 'utf8')

for (const marker of ['Fuente', 'Fragmento', 'Obligación', 'Requisito', 'Aplicabilidad']) {
  assert.ok(chain.includes(marker), `Grounding chain missing marker: ${marker}`)
}

for (const marker of ['Sin fuente vinculada todavía', 'Pendiente de revisión']) {
  assert.ok(chain.includes(marker), `Grounding chain missing bounded empty state: ${marker}`)
}

for (const forbidden of ['Requisito satisfecho', 'Cumplimiento confirmado', 'certificado']) {
  assert.ok(!chain.toLowerCase().includes(forbidden.toLowerCase()), `Grounding chain exposes unsupported claim: ${forbidden}`)
}

assert.ok(preview.includes('CaseGroundingChain'), 'Artifact preview must expose the grounding chain')
assert.ok(preview.includes('<CaseGroundingChain content={content} />'), 'Artifact preview must pass persisted artifact content into grounding chain')

console.log('Case grounding chain: PASS')
