import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migration = await readFile('supabase/migrations/20260805204500_fix_agent_artifact_hash_schema.sql', 'utf8')
const advanceRoute = await readFile('app/api/agents/workflows/[workflowId]/advance/route.ts', 'utf8')
const reviewRoute = await readFile('app/api/agents/runs/[runId]/review/route.ts', 'utf8')
const betaPage = await readFile('app/cases/[caseId]/beta/page.tsx', 'utf8')
const livePage = await readFile('app/cases/[caseId]/live/page.tsx', 'utf8')
const agentsPage = await readFile('app/dashboard/agents/page.tsx', 'utf8')

// El trigger debe encontrar pgcrypto con un search_path restringido.
assert.match(migration, /extensions[.]digest/)
assert.doesNotMatch(migration, /\bnew[.]content_hash\s*:=\s*encode\(digest\(/)

// La bitácora append-only se escribe desde el backend privilegiado.
assert.match(advanceRoute, /createAdminClient/)
assert.match(reviewRoute, /createAdminClient/)
assert.match(advanceRoute, /admin[.]from\('compliance_case_events'\)/)
assert.match(reviewRoute, /admin[.]from\('compliance_case_events'\)/)
assert.doesNotMatch(advanceRoute, /supabase[.]from\('compliance_case_events'\)[.]insert/)
assert.doesNotMatch(reviewRoute, /supabase[.]from\('compliance_case_events'\)[.]insert/)

// Los fallos deben conservar una causa pública útil.
assert.match(advanceRoute, /artifact_creation_failed/)
assert.match(advanceRoute, /classifyStageFailure/)
assert.match(advanceRoute, /error_code: failure[.]code/)

// La etiqueta de etapa viene del contrato canónico, no de una columna inexistente.
for (const page of [betaPage, livePage, agentsPage]) {
  assert.doesNotMatch(page, /agent_workflow_stages'[\s\S]{0,180}label/)
  assert.match(page, /getWorkflowStage/)
}

// La revisión debe apuntar a la etapa pendiente, aunque current_stage ya avance.
assert.match(betaPage, /find\(\(stage\) => \['pending_review', 'changes_requested'\][.]includes\(stage[.]status\)\)/)
assert.match(livePage, /find\(\(stage\) => \['pending_review', 'changes_requested'\][.]includes\(stage[.]status\)\)/)
assert.match(betaPage, /runId=\{actionableStage[?][.]run_id/)
assert.match(livePage, /runId=\{actionableStage[?][.]run_id/)

console.log('Workflow artifact persistence v1 validation passed')
