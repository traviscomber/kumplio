import assert from 'node:assert/strict'
import fs from 'node:fs'

const actions = fs.readFileSync('components/cases/live-workflow-actions.tsx', 'utf8')
const closeRoute = fs.readFileSync('app/api/agents/workflows/[workflowId]/close-case/route.ts', 'utf8')

assert.match(actions, /Cierre del caso/, 'Case surface must expose a legible closure state')
assert.match(actions, /cierre permanece bloqueado/i, 'Case surface must explain review/evidence closure blocking')
assert.match(actions, /\/api\/agents\/workflows\/\$\{workflowId\}\/close-case/, 'Case closure must use the existing workflow close action')
assert.match(closeRoute, /close_compliance_case_record/, 'Close route must keep the atomic case close primitive')
assert.match(actions, /router\.push\('\/app\/inicio'\)/, 'Successful case close must continue to canonical Inicio')

const persistedClose = actions.indexOf('await request(`/api/agents/workflows/${workflowId}/close-case`)')
const continueHome = actions.indexOf("router.push('/app/inicio')")
assert.ok(persistedClose >= 0 && continueHome > persistedClose, 'Inicio continuation must occur only after persisted close succeeds')

console.log('Case close experience: PASS')
