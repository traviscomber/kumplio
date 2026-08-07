import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const reviewRoute = await readFile('app/api/agents/runs/[runId]/review/route.ts', 'utf8')
const reviewMigration = await readFile('scripts/47-review-approval-contract.sql', 'utf8')
const workflowActions = await readFile('components/cases/live-workflow-actions.tsx', 'utf8')
const betaPage = await readFile('app/cases/[caseId]/beta/page.tsx', 'utf8')
const livePage = await readFile('app/cases/[caseId]/live/page.tsx', 'utf8')
const migration = await readFile('supabase/migrations/20260806014500_supersede_retried_agent_artifacts.sql', 'utf8')

// La ruta delega revisión y cambios a una transacción única.
assert.match(reviewRoute, /review_agent_workflow_run/)
assert.doesNotMatch(reviewRoute, /from\('agent_runs'\)[.]update/)
assert.match(reviewMigration, /v_run[.]status not in \('completed', 'pending_review'\)/)
assert.match(reviewMigration, /when p_decision = 'approved' then 'approved'/)
assert.match(reviewMigration, /when p_decision = 'rejected' then 'rejected'/)
assert.match(reviewMigration, /else 'pending_review'/)

// Solicitar cambios pausa el workflow y deja la etapa explícitamente reintentable.
assert.match(reviewMigration, /when p_decision = 'commented' then 'pending_review'/)
assert.match(reviewMigration, /else 'changes_requested'/)
assert.match(reviewMigration, /else 'paused'/)

// Una nueva versión reemplaza explícitamente la anterior, conservando trazabilidad.
assert.match(migration, /supersede_parent_agent_artifact/)
assert.match(migration, /status = 'superseded'/)
assert.match(migration, /superseded_by_artifact_id = new[.]id/)
assert.match(migration, /after insert on public[.]agent_artifacts/)

// La interfaz conoce el límite real y deja de ofrecer reintentos agotados.
assert.match(workflowActions, /attemptCount: number \| null/)
assert.match(workflowActions, /maxAttempts: number \| null/)
assert.match(workflowActions, /attemptCount >= maxAttempts/)
assert.match(workflowActions, /Límite alcanzado/)
assert.match(workflowActions, /retriesExhausted/)

// La ruta beta ya no es una superficie activa.
assert.match(betaPage, /redirect\(`\/cases\/\$\{caseId\}`\)/)

assert.match(livePage, /max_attempts/)
assert.match(livePage, /attemptCount=\{actionableStage[?][.]attempt_count \?\? null\}/)
assert.match(livePage, /maxAttempts=\{actionableStage[?][.]max_attempts \?\? null\}/)
assert.match(livePage, /superseded: 'Reemplazado'/)

console.log('Bounded and versioned agent retry validation passed')
