import assert from 'node:assert/strict'
import fs from 'node:fs'

const server = fs.readFileSync('components/cases/case-baseline-assurance.tsx', 'utf8')
const client = fs.readFileSync('components/cases/case-baseline-assurance-client.tsx', 'utf8')
const guided = fs.readFileSync('components/cases/guided-case-workspace.tsx', 'utf8')

for (const marker of ['Pendiente de revisión', 'Evidencia insuficiente']) {
  assert.ok(client.includes(marker) || guided.includes(marker), `Case evidence surface missing bounded state: ${marker}`)
}

assert.match(client, /integrityStatus === 'verified'/, 'Verified integrity copy must stay conditionally gated')
assert.match(server, /validation_status,integrity_status/, 'Evidence surface must consume persisted validation/integrity state')
assert.match(server, /review_comment,reviewed_at/, 'Evidence surface must consume persisted human review state')

for (const forbidden of ['Cumplimiento confirmado', 'Todo en regla']) {
  assert.ok(!client.includes(forbidden), `Case evidence surface makes unsupported claim: ${forbidden}`)
  assert.ok(!guided.includes(forbidden), `Guided case makes unsupported claim: ${forbidden}`)
}

console.log('Case evidence and review surface: PASS')
