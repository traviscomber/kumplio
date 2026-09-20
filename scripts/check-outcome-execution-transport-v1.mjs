import assert from 'node:assert/strict'
import fs from 'node:fs'
const adapter=fs.readFileSync('lib/outcomes/execution-transport.ts','utf8')
const worker=fs.readFileSync('workers/outcome-preparations/src/index.ts','utf8')
const wrangler=fs.readFileSync('workers/outcome-preparations/wrangler.toml','utf8')
for(const x of ['ExecutionTransport','HttpExecutionTransport','DurableOnlyTransport','OUTCOME_EXECUTION_TRANSPORT']) assert.ok(adapter.includes(x))
for(const x of ['message.retry','message.ack','KUMPLIO_RUNNER_SECRET','x-kumplio-queue-id']) assert.ok(worker.includes(x))
for(const x of ['max_retries = 5','dead_letter_queue','max_batch_size = 10']) assert.ok(wrangler.includes(x))
console.log('Outcome execution transport + Cloudflare adapter: PASS')
