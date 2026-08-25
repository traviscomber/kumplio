import assert from 'node:assert/strict'
import fs from 'node:fs'

const committee = fs.readFileSync('lib/agents/committee.ts', 'utf8')
const executor = fs.readFileSync('lib/agents/workflow-stage-executor.ts', 'utf8')

for (const marker of ['MAX_COMMITTEE_ARTIFACTS', 'MAX_COMMITTEE_CHARS', 'buildBoundedCommitteeContext', "workflowVersion === 'v2'", 'stageIndex === 0']) {
  assert.ok(committee.includes(marker), `committee context budget missing marker: ${marker}`)
}
assert.ok(executor.includes('buildBoundedCommitteeContext'), 'stage executor must use bounded committee context')
assert.ok(executor.includes('workflowVersion'), 'stage executor must resolve workflow version')

console.log('Three-agent context budget: PASS')
