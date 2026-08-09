import fs from 'node:fs'

const runtime = fs.readFileSync('lib/agents/openai-runtime.ts', 'utf8')
const worker = fs.readFileSync('app/api/internal/agent-worker/route.ts', 'utf8')
const migration = fs.readFileSync('supabase/migrations/20260809141500_agent_run_provider_trace_v1.sql', 'utf8')

const checks = [
  ['runtime uses withResponse', runtime.includes('.withResponse()')],
  ['runtime captures request id', runtime.includes("headers.get('x-request-id')") && runtime.includes('providerRequestId')],
  ['runtime captures organization', runtime.includes("headers.get('openai-organization')") && runtime.includes('providerOrganization')],
  ['runtime preserves store false', runtime.includes('store: false')],
  ['runtime does not enable debug body logging', !runtime.includes("logLevel: 'debug'") && !runtime.includes('OPENAI_LOG')],
  ['worker keeps token authentication', worker.includes("replace(/^Bearer\\s+/i, '').trim()") && worker.includes("rpc('validate_agent_worker_token'")],
  ['worker returns bounded provider trace', worker.includes('providerTrace,') && worker.includes('readProviderTrace(result.result)')],
  ['worker trace contains only request and organization fields', worker.includes('requestId: typeof record.requestId') && worker.includes('organization: typeof record.organization') && !worker.includes('providerTrace: result.result')],
  ['migration adds request trace', migration.includes('provider_request_id text')],
  ['migration adds organization trace', migration.includes('provider_organization text')],
  ['migration explicitly does not claim ZDR/MAM', migration.includes('not evidence of ZDR/MAM configuration')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failed.length) {
  console.error(`OpenAI provider trace contract failed: ${failed.length} check(s).`)
  process.exit(1)
}
console.log('OpenAI provider trace contract: PASS')
