import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migration = await readFile('supabase/migrations/20260806020500_workflow_concurrency_guards.sql', 'utf8')
const reviewRoute = await readFile('app/api/agents/runs/[runId]/review/route.ts', 'utf8')

assert.match(migration, /agent_reviews_one_terminal_per_run_uidx/)
assert.match(migration, /decision in \('approved', 'rejected', 'changes_requested'\)/)
assert.match(migration, /prevent_duplicate_stage_claim/)
assert.match(migration, /old[.]status = 'running'/)
assert.match(migration, /new[.]started_at is distinct from old[.]started_at/)
assert.match(migration, /errcode = '40001'/)

assert.match(reviewRoute, /reviewError[?][.]code === '23505'/)
assert.match(reviewRoute, /code: 'already_reviewed'/)
assert.match(reviewRoute, /status: 409/)

console.log('Workflow concurrency guard validation passed')
