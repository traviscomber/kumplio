import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const route = await readFile('app/api/agents/runs/[runId]/review/route.ts', 'utf8')
const migration = await readFile('supabase/migrations/20260806022000_atomic_agent_run_review.sql', 'utf8')

assert.match(route, /createAdminClient/)
assert.match(route, /review_agent_run_record/)
assert.doesNotMatch(route, /from\('agent_reviews'\)[.]insert/)
assert.doesNotMatch(route, /from\('agent_runs'\)[.]update/)
assert.doesNotMatch(route, /from\('agent_artifacts'\)[.]update/)
assert.doesNotMatch(route, /from\('agent_workflow_stages'\)[.]update/)
assert.doesNotMatch(route, /from\('agent_workflows'\)[.]update/)

assert.match(migration, /review_agent_run_record/)
assert.match(migration, /from public[.]agent_runs[\s\S]*for update/)
assert.match(migration, /from public[.]agent_artifacts[\s\S]*for update/)
assert.match(migration, /from public[.]agent_workflow_stages[\s\S]*for update/)
assert.match(migration, /from public[.]agent_workflows[\s\S]*for update/)
assert.match(migration, /approved_by = p_actor_id/)
assert.match(migration, /approved_at = reviewed_at/)
assert.match(migration, /locked_at = reviewed_at/)
assert.match(migration, /event_type[\s\S]*workflow_stage_reviewed/)
assert.match(migration, /grant execute[\s\S]*service_role/)
assert.match(migration, /revoke all[\s\S]*authenticated/)

console.log('Atomic agent review validation passed')
