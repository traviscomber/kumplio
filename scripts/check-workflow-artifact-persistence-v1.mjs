import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migration = await readFile('supabase/migrations/20260805204500_fix_agent_artifact_hash_schema.sql', 'utf8')
const reviewMigration = await readFile('scripts/47-review-approval-contract.sql', 'utf8')
const advanceRoute = await readFile('app/api/agents/workflows/[workflowId]/advance/route.ts', 'utf8')
const reviewRoute = await readFile('app/api/agents/runs/[runId]/review/route.ts', 'utf8')
const betaPage = await readFile('app/cases/[caseId]/beta/page.tsx', 'utf8')
const livePage = await readFile('app/cases/[caseId]/live/page.tsx', 'utf8')
const agentsPage = await readFile('app/dashboard/agents/page.tsx', 'utf8')

// El trigger debe encontrar pgcrypto con un search_path restringido.
assert.match(migration, /extensions[.]digest/)
assert.doesNotMatch(migration, /\bnew[.]content_hash\s*:=\s*encode\(digest\(/)

// La bitácora append-only se escribe desde fronteras privilegiadas y atómicas.
assert.match(advanceRoute, /createAdminClient/)
assert.match(reviewRoute, /createAdminClient/)
assert.match(advanceRoute, /admin[.]from\('compliance_case_events'\)/)
assert.match(reviewRoute, /review_agent_workflow_run/)
assert.doesNotMatch(reviewRoute, /from\('compliance_case_events'\)[.]insert/)
assert.match(reviewMigration, /insert into public[.]compliance_case_events/)
assert.match(reviewMigration, /'workflow_stage_reviewed'/)
assert.match(reviewMigration, /insert into public[.]agent_reviews/)
assert.match(reviewMigration, /update public[.]agent_runs/)
assert.match(reviewMigration, /update public[.]agent_artifacts/)
assert.match(reviewMigration, /update public[.]agent_workflow_stages/)
assert.match(reviewMigration, /update public[.]agent_workflows/)
assert.doesNotMatch(advanceRoute, /supabase[.]from\('compliance_case_events'\)[.]insert/)

// Los fallos deben conservar una causa pública útil.
assert.match(advanceRoute, /artifact_creation_failed/)
assert.match(advanceRoute, /classifyStageFailure/)
assert.match(advanceRoute, /error_code: failure[.]code/)

// La ruta beta es legacy y debe redirigir al expediente canónico.
assert.match(betaPage, /redirect\(`\/cases\/\$\{caseId\}`\)/)
assert.doesNotMatch(betaPage, /agent_workflow_stages|getWorkflowStage/)

// Las superficies activas resuelven la etiqueta desde el contrato canónico.
for (const page of [livePage, agentsPage]) {
  assert.doesNotMatch(page, /agent_workflow_stages'[\s\S]{0,180}label/)
  assert.match(page, /getWorkflowStage/)
}

// La revisión debe apuntar a la etapa pendiente, aunque current_stage ya avance.
assert.match(livePage, /find\(\(stage\) => \['pending_review', 'changes_requested'\][.]includes\(stage[.]status\)\)/)
assert.match(livePage, /runId=\{actionableStage[?][.]run_id/)

console.log('Workflow artifact persistence v1 validation passed')
