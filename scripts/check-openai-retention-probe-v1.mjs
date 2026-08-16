import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [probe, worker, dispatcher] = await Promise.all([
  readFile('lib/agents/openai-retention-probe.ts', 'utf8'),
  readFile('app/api/internal/agent-worker/route.ts', 'utf8'),
  readFile('supabase/migrations/20260816162336_provider_retention_probe_dispatch_v1.sql', 'utf8'),
])

for (const marker of [
  "import 'server-only'",
  "const SYNTHETIC_INPUT = 'Synthetic Kumplio retention probe. Return exactly: OK'",
  'store: true',
  "kumplio_probe: 'provider_retention_v1'",
  'max_output_tokens: 64',
  '/responses/${encodeURIComponent(responseId)}',
  "method: 'GET'",
  "method: 'DELETE'",
  'finally {',
  "'zdr_contradicted_by_persisted_application_state'",
  "'consistent_with_forced_non_storage_but_unverified'",
  "standardVsModifiedAbuseMonitoring: 'not_distinguishable_by_this_probe'",
]) {
  assert.ok(probe.includes(marker), `Retention probe missing guardrail: ${marker}`)
}

assert.ok(worker.includes("body.mode === 'provider_retention_probe'"))
assert.ok(worker.includes('runOpenAIRetentionProbe()'))
assert.ok(worker.indexOf('validate_agent_worker_token') < worker.indexOf("body.mode === 'provider_retention_probe'"))

for (const marker of [
  'create or replace function private.dispatch_provider_retention_probe_v1()',
  'security definer',
  "set search_path = ''",
  "where name = 'kumplio_agent_worker_token'",
  "body := jsonb_build_object('mode','provider_retention_probe')",
  'revoke all on function private.dispatch_provider_retention_probe_v1() from public',
  'revoke all on function private.dispatch_provider_retention_probe_v1() from anon',
  'revoke all on function private.dispatch_provider_retention_probe_v1() from authenticated',
  'grant execute on function private.dispatch_provider_retention_probe_v1() to service_role',
]) {
  assert.ok(dispatcher.toLowerCase().includes(marker.toLowerCase()), `Retention dispatcher missing guardrail: ${marker}`)
}

// The probe is intentionally metadata-only. Never expose or log synthetic/customer content.
for (const forbidden of [
  'output_text',
  'console.log(SYNTHETIC_INPUT',
  'console.info(SYNTHETIC_INPUT',
  'console.error(SYNTHETIC_INPUT',
  'prompt:',
  'customerData',
]) {
  assert.ok(!probe.includes(forbidden), `Retention probe exposes forbidden content marker: ${forbidden}`)
}

assert.ok(!probe.includes('store: false'), 'Retention probe must exercise store:true behavior')
assert.ok(probe.includes('deleted = deleteResponse.ok'), 'Retention probe must report cleanup outcome')
assert.ok(probe.includes('applicationStateObserved = retrievable'))

console.log('OpenAI retention probe v1 guardrail: PASS')
