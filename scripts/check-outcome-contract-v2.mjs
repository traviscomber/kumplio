import assert from 'node:assert/strict'
import fs from 'node:fs'

const outcome = fs.readFileSync('lib/agents/outcome-contract.ts', 'utf8')
const evaluator = fs.readFileSync('lib/agents/evaluator.ts', 'utf8')
const workflowRoute = fs.readFileSync('app/api/agents/workflows/[workflowId]/route.ts', 'utf8')
const consoleUi = fs.readFileSync('components/agent-workflow-console.tsx', 'utf8')

assert.match(outcome, /resolved: string\[\]/, 'Outcome contract must expose explicitly resolved items')
assert.match(outcome, /humanReviewStatus: ComplianceHumanReviewStatus/, 'Outcome contract must expose review state')
assert.match(outcome, /humanReviewComment: string \| null/, 'Outcome contract must preserve the final human review comment')
assert.match(outcome, /function findFinalStageReview/, 'Human review state must be derived from the final workflow stage')
assert.match(outcome, /sort\(\(left, right\) => Number\(right\.stage_index\) - Number\(left\.stage_index\)\)/, 'Final stage selection must be deterministic')
assert.match(outcome, /review\.workflowStatus === 'completed' && review\.humanReviewStatus === 'approved'/, 'Resolved closure must require completed workflow and approved final review')
assert.match(outcome, /input\.workflowStatus === 'completed' && input\.humanReviewStatus === 'approved'\) return 'ready'/, 'Ready state must require actual final human approval')
assert.match(outcome, /input\.humanReviewStatus === 'rejected'/, 'Rejected final review must block the outcome')
assert.match(outcome, /input\.humanReviewStatus === 'changes_requested'/, 'Requested human changes must keep the outcome open')
assert.match(outcome, /control\.evidenceAssessment === 'sufficient'/, 'Control resolution must require sufficient evidence')
assert.match(outcome, /assertion\.verdict !== 'supported'/, 'Only supported assertions may appear as resolved')

assert.match(workflowRoute, /workflowStatus: workflow\.status/, 'Workflow state must feed the outcome contract')
assert.match(workflowRoute, /stages: stages \|\| \[\]/, 'Stage state must feed the outcome contract')
assert.match(workflowRoute, /reviews,/, 'Human reviews must feed the outcome contract')
assert.match(workflowRoute, /\.eq\('organization_id', organizationId\)/, 'Workflow detail must remain tenant scoped')

assert.match(evaluator, /outcome\.humanReviewStatus !== 'approved'/, 'Evaluator must reject false ready states without approved review')
assert.match(evaluator, /outcome\.resolved\.length === 0/, 'Evaluator must reject a ready state with no explicit resolution')
assert.match(evaluator, /action_or_resolved_state_explicit/, 'Outcome quality must evaluate resolved state as part of actionability')

assert.match(consoleUi, /Qué quedó resuelto/, 'Outcome-first UI must expose what was resolved')
assert.match(consoleUi, /Evidencia usada/, 'Outcome-first UI must expose evidence details, not only a count')
assert.match(consoleUi, /Revisión humana/, 'Outcome-first UI must expose human review state')
assert.match(consoleUi, /Un resultado sólo pasa a “Resultado listo” después de aprobación humana final/, 'UI must explain the conservative ready-state rule')
assert.doesNotMatch(consoleUi, /outcomeQuality\.score/, 'End-user workflow UI must not present an internal outcome quality score')

console.log('Outcome contract v2 review/closure contract: PASS')
