import fs from 'node:fs'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const router = read('lib/agents/query-router.ts')
const orchestrator = read('lib/agents/orchestrator.ts')
const outcome = read('lib/agents/outcome-contract.ts')
const evaluator = read('lib/agents/evaluator.ts')
const workflowCreate = read('app/api/agents/workflows/route.ts')
const workflowRoute = read('app/api/agents/workflows/[workflowId]/route.ts')
const consoleUi = read('components/agent-workflow-console.tsx')
const roadmap = read('ROADMAP.md')

const assertions = [
  ['router exposes both paths', router.includes("'fast_track'") && router.includes("'full_agentic'")],
  ['router considers internal artifacts', router.includes('requiresInternalArtifacts') && router.includes('hasCaseResources')],
  ['orchestration plans carry route decision', orchestrator.includes('route: ComplianceRouteDecision') && orchestrator.includes('routeComplianceRequest')],
  ['fast path avoids specialist activation', orchestrator.includes("route.track === 'full_agentic'")],
  ['workflow creation is router-governed', workflowCreate.includes('buildOrchestrationPlan') && workflowCreate.includes('workflowTypeForIntent') && workflowCreate.includes('routing: orchestration.route')],
  ['workflow UI does not force one workflow type', !consoleUi.includes("workflowType: 'compliance_assessment'")],
  ['outcome contract exposes user-visible state', outcome.includes('ComplianceOutcomeStatus') && outcome.includes('nextAction') && outcome.includes('evidenceCount')],
  ['outcome distinguishes missing evidence from blockers', outcome.includes('collectMissing') && outcome.includes('collectBlockers')],
  ['outcome quality has product dimensions', evaluator.includes('evaluateComplianceOutcome') && evaluator.includes('actionability') && evaluator.includes('closureClarity')],
  ['workflow API consolidates artifacts into outcome', workflowRoute.includes('buildComplianceOutcome') && workflowRoute.includes('outcome,')],
  ['workflow API evaluates outcome quality', workflowRoute.includes('evaluateComplianceOutcome') && workflowRoute.includes('outcomeQuality')],
  ['workflow UI leads with outcome', consoleUi.includes('Outcome del caso') && consoleUi.includes('Próxima acción') && consoleUi.includes('Qué falta')],
  ['technical pipeline is secondary', consoleUi.includes('Ver cómo llegó Kumplio a este resultado')],
  ['public reviewer name is Julieta', consoleUi.includes("catalina: 'Julieta · Revisión legal y calidad'")],
  ['roadmap records owner routing decision', roadmap.includes('Router → FastTrack / FullAgentic → evidencia → outcome verificable') && roadmap.includes('Subbloque A — Orquestación orientada a outcomes')],
]

const failed = assertions.filter(([, passed]) => !passed)
for (const [label, passed] of assertions) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`)

if (failed.length) {
  console.error(`Outcome/agent routing contract failed: ${failed.map(([label]) => label).join(', ')}`)
  process.exit(1)
}

console.log('Outcome/agent routing contract: PASS')
