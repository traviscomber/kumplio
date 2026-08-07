import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const route = await readFile('app/api/agents/runs/[runId]/review/route.ts', 'utf8')
const migration = await readFile('scripts/47-review-approval-contract.sql', 'utf8')

assert.match(route, /createAdminClient/)
assert.match(route, /review_agent_workflow_run/)
assert.doesNotMatch(route, /from\('agent_reviews'\)[.]insert/)
assert.doesNotMatch(route, /from\('agent_runs'\)[.]update/)
assert.doesNotMatch(route, /from\('agent_artifacts'\)[.]update/)
assert.doesNotMatch(route, /from\('agent_workflow_stages'\)[.]update/)
assert.doesNotMatch(route, /from\('agent_workflows'\)[.]update/)

assert.match(migration, /review_agent_workflow_run/)
assert.match(migration, /from public[.]agent_runs[\s\S]*for update/)
assert.match(migration, /from public[.]agent_artifacts[\s\S]*for update/)
assert.match(migration, /from public[.]agent_workflow_stages[\s\S]*for update/)
assert.match(migration, /from public[.]agent_workflows[\s\S]*for update/)
assert.match(migration, /approval_checklist_required/)
assert.match(migration, /review_comment_required/)
assert.match(migration, /insert into public[.]agent_reviews/)
assert.match(migration, /update public[.]agent_runs/)
assert.match(migration, /update public[.]agent_artifacts/)
assert.match(migration, /update public[.]agent_workflow_stages/)
assert.match(migration, /update public[.]agent_workflows/)
assert.match(migration, /'workflow_stage_reviewed'/)
assert.match(migration, /grant execute[\s\S]*service_role/)
assert.match(migration, /revoke all[\s\S]*authenticated/)

console.log('Atomic agent review validation passed')
