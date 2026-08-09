import fs from 'node:fs'

const route = fs.readFileSync('app/api/internal/sst-bootstrap/route.ts', 'utf8')

for (const token of [
  "validate_agent_worker_token",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "/functions/v1/sst-ds44-bootstrap",
  "Authorization: `Bearer ${serviceKey}`",
  "AbortSignal.timeout(240_000)",
]) {
  if (!route.includes(token)) throw new Error(`SST internal runner missing guard: ${token}`)
}

if (route.includes('process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY')) {
  throw new Error('Service role must never be exposed as NEXT_PUBLIC')
}
if (route.includes('return NextResponse.json(payload)')) {
  throw new Error('Internal runner must return bounded bootstrap metadata only')
}

console.log('SST internal runner guard: PASS')
