import fs from 'node:fs'

function read(path) {
  if (!fs.existsSync(path)) throw new Error(`Missing ${path}`)
  return fs.readFileSync(path, 'utf8')
}

const alerts = read('lib/product/operations/alerts.ts')
for (const marker of ['buildOperationalAlerts', "'Decisión requerida'", "'Revisión pendiente'", "'Evidencia requerida'", "'Acción pendiente'", "'Cambio relevante'", '/app/casos/']) {
  if (!alerts.includes(marker)) throw new Error(`Alert model missing: ${marker}`)
}
if (/Math\.random|Date\.now\(\).*severity|riskScore|complianceScore/.test(alerts)) throw new Error('Alert ordering/category must remain deterministic and must not add scoring')

const alertPage = read('app/app/alertas/page.tsx')
for (const marker of ['buildOperationalAlerts', "redirect('/sign-in?next=/app/alertas')", "from('organization_members')", "eq('organization_id', organizationId)", 'Qué requiere tu atención', 'no significa que todas tus obligaciones estén cumplidas']) {
  if (!alertPage.includes(marker)) throw new Error(`Alertas surface missing: ${marker}`)
}

const activity = read('lib/product/operations/activity.ts')
for (const marker of ['buildOperationalActivity', 'Caso creado', 'Análisis actualizado', 'Evidencia agregada', 'Revisión solicitada', 'Revisión completada', 'Acción actualizada', 'Caso cerrado', '/app/casos/', '/app/inicio', '.slice(0, limit)']) {
  if (!activity.includes(marker)) throw new Error(`Activity model missing: ${marker}`)
}

const activityPage = read('app/app/actividad/page.tsx')
for (const marker of ['buildOperationalActivity', "redirect('/sign-in?next=/app/actividad')", "from('organization_members')", "from('compliance_case_events')", "eq('organization_id', organizationId)", "from('compliance_cases')", 'Actividad reciente']) {
  if (!activityPage.includes(marker)) throw new Error(`Actividad surface missing: ${marker}`)
}

const canonicalSurfaces = [alertPage, activityPage]
const forbiddenPlumbing = ['attempt_count', 'max_attempts', 'retry', 'prompt', 'token_usage', 'agent_id', 'provider_response', 'queue_name', 'chain-of-thought', 'createAdminClient', 'service_role']
for (const source of canonicalSurfaces) {
  for (const marker of forbiddenPlumbing) {
    if (source.includes(marker)) throw new Error(`Canonical operations UI exposes plumbing: ${marker}`)
  }
  if (/href=["'`]\/cases\//.test(source)) throw new Error('Canonical operations UI links to legacy /cases route')
}
if (!alertPage.includes('no significa que todas tus obligaciones estén cumplidas')) throw new Error('Alertas empty state must remain claim-safe')

const nav = read('components/app-navigation.tsx')
for (const marker of ["{ href: '/app/alertas', label: 'Alertas'", "{ href: '/app/actividad', label: 'Actividad'"]) {
  if (!nav.includes(marker)) throw new Error(`Navigation missing: ${marker}`)
}
if (/href: '\/app\/alertas'.*available: false/.test(nav)) throw new Error('Alertas must be enabled after the route exists')

const pkg = JSON.parse(read('package.json'))
if (pkg.scripts?.['check:alerts-activity'] !== 'node scripts/check-alerts-activity.mjs') throw new Error('package.json must expose check:alerts-activity')

const appClose = read('scripts/check-app-close-v1.mjs')
if (!appClose.includes('scripts/check-alerts-activity.mjs')) throw new Error('App Close aggregate must include check-alerts-activity')

console.log('Alerts + Activity contract: PASS')
