import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const reviewRoute = await readFile('app/api/agents/runs/[runId]/review/route.ts', 'utf8')
const workflowActions = await readFile('components/cases/live-workflow-actions.tsx', 'utf8')
const betaPage = await readFile('app/cases/[caseId]/beta/page.tsx', 'utf8')
const livePage = await readFile('app/cases/[caseId]/live/page.tsx', 'utf8')
const migration = await readFile('supabase/migrations/20260806014500_supersede_retried_agent_artifacts.sql', 'utf8')

// Una ejecución aprobada o rechazada no vuelve a abrirse para una nueva revisión.
assert.match(reviewRoute, /!\['completed', 'pending_review'\][.]includes\(run[.]status\)/)
assert.doesNotMatch(reviewRoute, /'approved', 'rejected'\][.]includes\(run[.]status\)/)

// Solicitar cambios queda visible tanto en la etapa como en el artefacto.
assert.match(reviewRoute, /parsed[.]data[.]decision === 'changes_requested'/)
assert.match(reviewRoute, /artifactStatus[\s\S]*'changes_requested'/)

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

for (const page of [betaPage, livePage]) {
  assert.match(page, /max_attempts/)
  assert.match(page, /attemptCount=\{actionableStage[?][.]attempt_count \?\? null\}/)
  assert.match(page, /maxAttempts=\{actionableStage[?][.]max_attempts \?\? null\}/)
  assert.match(page, /superseded: 'Reemplazado'/)
}

console.log('Bounded and versioned agent retry validation passed')
