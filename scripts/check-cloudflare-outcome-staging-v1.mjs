import assert from 'node:assert/strict'
import fs from 'node:fs'

const config = fs.readFileSync('workers/outcome-preparations/wrangler.toml', 'utf8')
const worker = fs.readFileSync('workers/outcome-preparations/src/index.ts', 'utf8')
const transport = fs.readFileSync('lib/outcomes/execution-transport.ts', 'utf8')
const runner = fs.readFileSync('app/api/internal/outcomes/closure-preparations/run/route.ts', 'utf8')
const migration = fs.readFileSync('supabase/migrations/20260920153000_outcome_closure_preparation_queue_v1.sql', 'utf8')
const runbook = fs.readFileSync('workers/outcome-preparations/README.md', 'utf8')

for (const marker of [
  'name = "kumplio-outcome-worker-staging"',
  'DEPLOYMENT_ENV = "staging"',
  'binding = "OUTCOME_PREPARATIONS_QUEUE"',
  'queue = "kumplio-outcome-preparations-staging"',
  'dead_letter_queue = "kumplio-outcome-preparations-staging-dlq"',
  'max_retries = 5',
]) assert.ok(config.includes(marker), `Missing staging-only Wrangler marker: ${marker}`)

assert.ok(!config.includes('[env.production]'), 'Production Wrangler environment is forbidden in this phase')
assert.ok(!config.includes('queue = "kumplio-outcome-preparations"\n'), 'Unsuffixed queue is forbidden')

for (const marker of [
  "url.pathname !== '/enqueue'",
  "env.DEPLOYMENT_ENV !== 'staging'",
  'KUMPLIO_INGRESS_SECRET',
  'VERCEL_AUTOMATION_BYPASS_SECRET',
  'x-vercel-protection-bypass',
  'MAX_MESSAGE_BYTES',
  'OUTCOME_PREPARATIONS_QUEUE.send',
  "url.hostname.endsWith('.vercel.app')",
  'message.retry',
  'message.ack',
]) assert.ok(worker.includes(marker), `Missing Worker safety marker: ${marker}`)

for (const marker of [
  "environment !== 'staging'",
  "target.hostname.endsWith('.workers.dev')",
  "target.pathname !== '/enqueue'",
  'cloudflare-queue-staging',
]) assert.ok(transport.includes(marker), `Missing transport safety marker: ${marker}`)

for (const marker of [
  'preparationMessageSchema',
  'timingSafeEqual',
  'p_queue_id: message.queueId',
  'Queue identity mismatch',
]) assert.ok(runner.includes(marker), `Missing runner boundary marker: ${marker}`)

assert.ok(migration.includes('where q.id = p_queue_id'), 'Worker claim must target the exact durable queue item')
assert.ok(runbook.includes('Producción sigue en `NO_GO`'), 'Runbook must preserve the production gate')

console.log('Cloudflare Outcome UX v4 staging boundary: PASS')
