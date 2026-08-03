import { readFile } from 'node:fs/promises'

// Evita que servicios importados por componentes cliente vuelvan a depender de credenciales privilegiadas.
const failures = []

const analyticsService = await readFile('lib/services/analytics.ts', 'utf8')
for (const forbidden of ['SUPABASE_SERVICE_ROLE_KEY', "createClient(supabaseUrl", "from '@supabase/supabase-js';"]) {
  if (analyticsService.includes(forbidden)) {
    failures.push(`lib/services/analytics.ts contiene un patrón privilegiado o cliente servidor: ${forbidden}`)
  }
}

if (!analyticsService.includes('SupabaseClient')) {
  failures.push('lib/services/analytics.ts debe recibir un SupabaseClient autenticado')
}

const analyticsClient = await readFile('app/analytics/client.tsx', 'utf8')
for (const expected of [
  'getAnalyticsData(supabase, user.id)',
  'getDashboardStats(supabase, user.id)',
]) {
  if (!analyticsClient.includes(expected)) failures.push(`app/analytics/client.tsx no contiene: ${expected}`)
}

for (const forbidden of ['SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key']) {
  if (analyticsClient.includes(forbidden)) failures.push(`app/analytics/client.tsx contiene: ${forbidden}`)
}

if (failures.length) {
  console.error('\nClient boundary validation failed:\n')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Client boundary validation passed.')
