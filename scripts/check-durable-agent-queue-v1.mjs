import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const advance = await readFile('app/api/agents/workflows/[workflowId]/advance/route.ts', 'utf8')
const worker = await readFile('app/api/internal/agent-worker/route.ts', 'utf8')
const executor = await readFile('lib/agents/workflow-stage-executor.ts', 'utf8')
const operations = await readFile('app/operations/page.tsx', 'utf8')

assert.match(advance, /enqueue_agent_job/)
assert.match(advance, /status: 'queued'/)
assert.doesNotMatch(advance, /runAgent\(/, 'User request must not execute the model inline')

assert.match(worker, /claim_agent_jobs/)
assert.match(worker, /heartbeat_agent_job/)
assert.match(worker, /complete_agent_job/)
assert.match(worker, /fail_agent_job/)
assert.match(worker, /validate_agent_worker_token/)
assert.match(worker, /VISIBILITY_SECONDS = 420/)
assert.match(worker, /HEARTBEAT_MS = 45_000/)

assert.match(executor, /executeWorkflowStage/)
assert.match(executor, /runAgent\(/)
assert.match(executor, /isRetryableWorkflowFailure/)
assert.match(executor, /provider_5xx/)
assert.match(executor, /rate_limited/)

assert.match(operations, /Ejecución durable/)
assert.match(operations, /Dead-letter/)
assert.match(operations, /staleLeases/)

console.log('Durable agent queue source guardrail passed.')
