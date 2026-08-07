import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const runtime = await readFile(new URL('../lib/agents/openai-runtime.ts', import.meta.url), 'utf8')

assert.match(runtime, /new OpenAI\(\{ apiKey, maxRetries: 0 \}\)/, 'OpenAI SDK retries must stay disabled at client level')
assert.match(runtime, /maxRetries: 0/, 'Per-request retries must stay disabled')
assert.match(runtime, /timeout,\s*maxRetries: 0,\s*signal: AbortSignal\.timeout\(timeout\)/s, 'Requests need an explicit bounded execution budget')
assert.match(runtime, /isidora: 'medium'/)
assert.match(runtime, /rodrigo: 'medium'/)
assert.match(runtime, /veronica: 'medium'/)
assert.match(runtime, /javier: 'medium'/)
assert.match(runtime, /catalina: 'high'/)
assert.match(runtime, /APIConnectionTimeoutError/, 'SDK timeout errors need an explicit classification')
assert.match(runtime, /provider_connection_error/, 'Connection errors need a distinct operational code')
assert.match(runtime, /incomplete_response/, 'Incomplete structured outputs need a distinct operational code')

console.log('Agent runtime reliability validation passed.')
