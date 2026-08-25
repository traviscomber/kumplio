import fs from 'node:fs'

function read(path) {
  if (!fs.existsSync(path)) throw new Error(`Missing ${path}`)
  return fs.readFileSync(path, 'utf8')
}

const alerts = read('lib/product/operations/alerts.ts')

for (const marker of [
  'buildOperationalAlerts',
  "'Decisión requerida'",
  "'Revisión pendiente'",
  "'Evidencia requerida'",
  "'Acción pendiente'",
  "'Cambio relevante'",
  '/app/casos/',
]) {
  if (!alerts.includes(marker)) throw new Error(`Alert model missing: ${marker}`)
}

if (/Math\.random|Date\.now\(\).*severity|riskScore|complianceScore/.test(alerts)) {
  throw new Error('Alert ordering/category must remain deterministic and must not add scoring')
}

console.log('Alerts + Activity contract: PASS')
