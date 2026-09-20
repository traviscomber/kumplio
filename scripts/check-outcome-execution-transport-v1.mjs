import assert from 'node:assert/strict'
import fs from 'node:fs'
const adapter=fs.readFileSync('lib/outcomes/execution-transport.ts','utf8')
const worker=fs.readFileSync('workers/outcome-preparations/src/index.ts','utf8')
const wrangler=fs.readFileSync('workers/outcome-preparations/wrangler.toml','utf8')
for(const x of ['ExecutionTransport','HttpExecutionTransport','DurableOnlyTransport','OUTCOME_EXECUTION_TRANSPORT','OUTCOME_EXECUTION_ENV',"hostname.endsWith('.workers.dev')",'cloudflare-queue-staging']) assert.ok(adapter.includes(x))
for(const x of ['async fetch','OUTCOME_PREPARATIONS_QUEUE.send','message.retry','message.ack','KUMPLIO_INGRESS_SECRET','KUMPLIO_RUNNER_SECRET','VERCEL_AUTOMATION_BYPASS_SECRET','x-kumplio-queue-id','x-vercel-protection-bypass',"hostname.endsWith('.vercel.app')"]) assert.ok(worker.includes(x))
for(const x of ['name = "kumplio-outcome-worker-staging"','[[queues.producers]]','queue = "kumplio-outcome-preparations-staging"','max_retries = 5','dead_letter_queue = "kumplio-outcome-preparations-staging-dlq"','max_batch_size = 10']) assert.ok(wrangler.includes(x))
assert.ok(!wrangler.includes('production'))
console.log('Outcome execution transport + Cloudflare adapter: PASS')
