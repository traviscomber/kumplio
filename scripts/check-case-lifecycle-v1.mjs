import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const closeRoute = await readFile('app/api/cases/[caseId]/close/route.ts', 'utf8')
const archiveRoute = await readFile('app/api/cases/[caseId]/archive/route.ts', 'utf8')
const closeMigration = await readFile('supabase/migrations/20260806013000_atomic_case_close_archive.sql', 'utf8')
const livePage = await readFile('app/cases/[caseId]/live/page.tsx', 'utf8')
const newCasePage = await readFile('app/cases/new/page.tsx', 'utf8')
const caseCenter = await readFile('components/cases-workspace.tsx', 'utf8')
const workflowActions = await readFile('components/cases/live-workflow-actions.tsx', 'utf8')

// El endpoint delega el cierre a una frontera transaccional privilegiada.
assert.match(closeRoute, /close_compliance_case_record/)
assert.match(closeRoute, /workflow_not_completed/)
assert.match(closeRoute, /final_stage_not_approved/)
assert.match(closeRoute, /final_review_not_approved/)

// Un caso solo puede cerrarse con workflow, etapa final y revisión aprobados.
assert.match(closeMigration, /workflow[.]status = 'completed'/)
assert.match(closeMigration, /final_stage_status <> 'approved'/)
assert.match(closeMigration, /final_review_decision <> 'approved'/)
assert.match(closeMigration, /'case_closed'/)
assert.match(closeMigration, /'status', 'approved'/)
assert.match(closeMigration, /for update/)

// Archivar conserva trazabilidad y exige un caso previamente resuelto.
assert.match(archiveRoute, /archive_compliance_case_record/)
assert.match(closeMigration, /current_status <> 'approved'/)
assert.match(closeMigration, /'status', 'archived'/)
assert.match(closeMigration, /'case_archived'/)

// La mesa en vivo se alimenta de estado persistido y expone la revisión final real.
assert.match(livePage, /from\('agent_workflows'\)/)
assert.match(livePage, /from\('agent_workflow_stages'\)/)
assert.match(livePage, /from\('agent_artifacts'\)/)
assert.match(livePage, /from\('agent_reviews'\)/)
assert.match(livePage, /from\('compliance_case_events'\)/)
assert.match(livePage, /FinalCaseSummary/)
assert.doesNotMatch(livePage, /Math[.]random|progress\s*=|setTimeout/)

// Una cuenta sin workspace debe completar onboarding antes de crear casos.
assert.match(newCasePage, /from\('organization_members'\)/)
assert.match(newCasePage, /eq\('user_id', user[.]id\)/)
assert.match(newCasePage, /if \(!membership[?][.]organization_id\) redirect\('\/onboarding'\)/)

// El usuario puede continuar desde el centro de casos sin confundir expediente y ejecución.
assert.match(caseCenter, /\/cases\/\$\{item[.]id\}\/live/)
assert.match(caseCenter, /\/cases\/new/)
assert.match(caseCenter, /Requiere revisión|En ejecución|Resuelto/)

// Una etapa en revisión debe aprobarse o pedir cambios antes de avanzar.
assert.match(workflowActions, /stageStatus === 'pending_review'/)
assert.match(workflowActions, /decision: 'approved'/)
assert.match(workflowActions, /decision: 'changes_requested'/)
assert.match(workflowActions, /Aprobar y continuar/)
assert.match(workflowActions, /Solicitar cambios/)

console.log('Case lifecycle v1 validation passed')
