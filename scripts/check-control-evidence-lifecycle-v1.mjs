import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const page = await readFile('app/evidence/page.tsx', 'utf8')
const panel = await readFile('components/evidence/evidence-requests-panel.tsx', 'utf8')
const createRoute = await readFile('app/api/evidence/requests/route.ts', 'utf8')
const submitRoute = await readFile('app/api/evidence/requests/[requestId]/submit/route.ts', 'utf8')
const reviewRoute = await readFile('app/api/evidence/requests/[requestId]/review/route.ts', 'utf8')
const evaluationRoute = await readFile('app/api/controls/[controlId]/evaluations/route.ts', 'utf8')

assert.match(page, /EvidenceRequestsPanel/)
assert.match(page, /evidence_requests/)
assert.match(panel, /Nueva solicitud/)
assert.match(panel, /Entregar/)
assert.match(panel, /Aceptar/)
assert.match(panel, /changes_requested/)
assert.match(createRoute, /create_evidence_request_record/)
assert.match(submitRoute, /submit_evidence_request_record/)
assert.match(reviewRoute, /review_evidence_request_record/)
assert.match(evaluationRoute, /create_control_evaluation_record/)
assert.match(evaluationRoute, /evidence_not_linked/)

console.log('Control and evidence lifecycle validation passed.')
