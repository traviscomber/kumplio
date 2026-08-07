import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migration = await readFile('supabase/migrations/20260805204500_fix_agent_artifact_hash_schema.sql', 'utf8')
const reviewMigration = await readFile('scripts/53-advance-workflow-after-approval.sql', 'utf8')
const advanceRoute = await readFile('app/api/agents/workflows/[workflowId]/advance/route.ts', 'utf8')
const executor = await readFile('lib/agents/workflow-stage-executor.ts', 'utf8')
const reviewRoute = await readFile('app/api/agents/runs/[runId]/review/route.ts', 'utf8')
const betaPage = await readFile('app/cases/[caseId]/beta/page.tsx', 'utf8')
const livePage = await readFile('app/cases/[caseId]/live/page.tsx', 'utf8')
const agentsPage = await readFile('app/dashboard/agents/page.tsx', 'utf8')

assert.match(migration, /extensions[.]digest/)
assert.doesNotMatch(migration, /\bnew[.]content_hash\s*:=\s*encode\(digest\(/)

// /advance persists queue intent; the durable executor persists model work and artifacts.
assert.match(advanceRoute, /createAdminClient/)
assert.match(advanceRoute, /enqueue_agent_job/)
assert.match(advanceRoute, /event_type: 'workflow_stage_queued'/)
assert.doesNotMatch(advanceRoute, /runAgent\(/)
assert.match(executor, /runAgent\(/)
assert.match(executor, /event_type: 'workflow_stage_started'/)
assert.match(executor, /event_type: 'workflow_stage_pending_review'/)

// Human review remains one atomic transaction, including its append-only event.
assert.match(reviewRoute, /createAdminClient/)
assert.match(reviewRoute, /review_agent_workflow_run/)
assert.doesNotMatch(reviewRoute, /from\('compliance_case_events'\)[.]insert/)
assert.match(reviewMigration, /insert into public[.]compliance_case_events/)
assert.match(reviewMigration, /'workflow_stage_reviewed'/)
assert.match(reviewMigration, /insert into public[.]agent_reviews/)
assert.match(reviewMigration, /update public[.]agent_runs/)
assert.match(reviewMigration, /update public[.]agent_artifacts/)
assert.match(reviewMigration, /update public[.]agent_workflow_stages/)
assert.match(reviewMigration, /update public[.]agent_workflows/)

// Durable execution must retain useful public failure causes at the execution boundary.
assert.match(executor, /artifact_creation_failed/)
assert.match(executor, /classifyWorkflowExecutionFailure/)
assert.match(executor, /WorkflowExecutionError/)
assert.match(executor, /run_persistence_failed/)
assert.match(executor, /workflow_persistence_failed/)

assert.match(betaPage, /redirect\(`\/cases\/\$\{caseId\}`\)/)
assert.doesNotMatch(betaPage, /agent_workflow_stages|getWorkflowStage/)

for (const page of [livePage, agentsPage]) {
  assert.doesNotMatch(page, /agent_workflow_stages'[\s\S]{0,180}label/)
  assert.match(page, /getWorkflowStage/)
}

assert.match(livePage, /find\(\(stage\) => \['pending_review', 'changes_requested'\][.]includes\(stage[.]status\)\)/)
assert.match(livePage, /runId=\{actionableStage[?][.]run_id/)

console.log('Workflow artifact persistence v1 validation passed')
