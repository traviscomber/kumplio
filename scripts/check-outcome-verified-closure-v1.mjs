import fs from 'node:fs'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const createRoute = read('app/api/agents/workflows/[workflowId]/closure-plan/route.ts')
const submitRoute = read('app/api/agents/workflows/[workflowId]/closure-plan/tasks/[taskId]/submit/route.ts')
const reviewRoute = read('app/api/agents/workflows/[workflowId]/closure-plan/tasks/[taskId]/review/route.ts')
const migration = read('supabase/migrations/20260916235900_outcome_verified_closure_v1.sql')
const indexMigration = read('supabase/migrations/20260920134000_outcome_verified_closure_fk_indexes.sql')
const ui = read('components/agent-workflow-console.tsx')
const roadmap = read('ROADMAP.md')

const assertions = [
  ['closure plan is sourced from approved frozen outcome', migration.includes('source_snapshot_id') && migration.includes("humanReviewStatus") && migration.includes("approved_human_review_required")],
  ['closure plan materialization is idempotent', migration.includes('compliance_action_plans_source_snapshot_uidx') && migration.includes("'created', false")],
  ['closure submit requires accepted verified evidence', migration.includes("validation_status = 'accepted'") && migration.includes("integrity_status = 'verified'") && migration.includes('closure_evidence_not_verified')],
  ['verified closure requires explicit criteria', migration.includes('closure_criteria_required') && migration.includes('cardinality(v_task.closure_criteria) < 1')],
  ['verified closure remains human reviewed', migration.includes("v_actor_role not in ('owner', 'admin', 'compliance', 'reviewer')") && migration.includes('verified_by = p_actor_id')],
  ['plan completes only after every task verifies', migration.includes("verification_status <> 'verified'") && migration.includes("when v_remaining = 0 then 'completed'")],
  ['closure RPCs are backend only', migration.includes('revoke all on function public.materialize_outcome_closure_plan') && migration.includes('grant execute on function public.materialize_outcome_closure_plan(uuid, uuid, uuid) to service_role')],
  ['closure read stays tenant scoped', createRoute.includes(".eq('organization_id', organizationId)") && createRoute.includes(".eq('source_workflow_id', workflowId)")],
  ['task submit is workflow and tenant bounded', submitRoute.includes(".eq('compliance_action_plans.organization_id', organizationId)") && submitRoute.includes(".eq('compliance_action_plans.source_workflow_id', workflowId)")],
  ['task review is permission gated', reviewRoute.includes("['owner', 'admin', 'compliance', 'reviewer']") && reviewRoute.includes('closure_review_forbidden')],
  ['UI extends outcome into verified closure', ui.includes('Plan de cierre verificable') && ui.includes('Preparar cierre') && ui.includes('Verificar cierre') && ui.includes('Cierre verificado')],
  ['new closure foreign keys have covering indexes', [
    'compliance_action_plans_case_id_idx',
    'compliance_action_plans_project_id_idx',
    'compliance_action_plan_tasks_completed_by_idx',
    'compliance_action_plan_tasks_verified_by_idx',
    'compliance_action_task_evidence_linked_by_idx',
  ].every((name) => indexMigration.includes(name))],
  ['roadmap records closure without compliance overclaim', roadmap.includes('Outcome → Action → Verified Closure') && roadmap.includes('no equivale a una declaración de cumplimiento')],
]

const failed = assertions.filter(([, passed]) => !passed)
for (const [label, passed] of assertions) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`)

if (failed.length) {
  console.error(`Outcome verified-closure contract failed: ${failed.map(([label]) => label).join(', ')}`)
  process.exit(1)
}

console.log('Outcome -> Action -> Verified Closure contract: PASS')
