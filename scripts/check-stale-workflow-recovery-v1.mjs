import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const route = await readFile('app/api/agents/workflows/[workflowId]/recover-stale/route.ts', 'utf8')
const actions = await readFile('components/cases/live-workflow-actions.tsx', 'utf8')
const betaPage = await readFile('app/cases/[caseId]/beta/page.tsx', 'utf8')
const livePage = await readFile('app/cases/[caseId]/live/page.tsx', 'utf8')
const migration = await readFile('supabase/migrations/20260806024000_stale_workflow_recovery.sql', 'utf8')

assert.match(route, /createAdminClient/)
assert.match(route, /recover_stale_workflow_stage/)
assert.match(route, /p_stale_after_seconds: 420/)

assert.match(actions, /canRecoverStale: boolean/)
assert.match(actions, /recover-stale/)
assert.match(actions, /Recuperar ejecución detenida/)
assert.match(actions, /busy === 'recover'/)

// Beta es una ruta legacy; la recuperación vive en la vista canónica.
assert.match(betaPage, /redirect\(`\/cases\/\$\{caseId\}`\)/)
assert.match(livePage, /STALE_EXECUTION_MS = 7 \* 60 \* 1000/)
assert.match(livePage, /actionableStage[.]started_at/)
assert.match(livePage, /canRecoverStale=\{canRecoverStale\}/)

assert.match(migration, /recover_stale_workflow_stage/)
assert.match(migration, /p_stale_after_seconds integer default 420/)
assert.match(migration, /status = 'failed'/)
assert.match(migration, /error_code = 'stale_execution'/)
assert.match(migration, /workflow_stage_recovered/)
assert.match(migration, /stage_not_running/)
assert.match(migration, /stage_not_stale/)
assert.match(migration, /grant execute[\s\S]*service_role/)
assert.match(migration, /revoke all[\s\S]*authenticated/)

console.log('Stale workflow recovery validation passed')
