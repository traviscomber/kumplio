import fs from 'node:fs'

const required = [
  ['lib/compliance/advisor/daily-advisor.ts', ['waitingOnOthers', 'changes24h', 'calculateWorkspaceConfidence', 'tomorrowFocus']],
  ['app/advisor/page.tsx', ['Escritorio', 'Briefing de las últimas 24 horas', 'WhyDetails', 'Cierre y continuidad']],
  ['components/explainability/why-details.tsx', ['¿Por qué aparece esto?', 'Hechos considerados', 'Sin base suficiente']],
  ['lib/compliance/accountability/ownership-sla.ts', ['suggestMissionOwner', 'escalationLevel', 'shouldFollowUp', 'tokenSimilarity']],
  ['app/accountability/page.tsx', ['Delegación sugerida', 'Usar sugerencia', 'Seguimiento automático', 'Capacidad del equipo']],
  ['components/workspace-nav.tsx', ["label: 'Escritorio'"]],
]

for (const [file, markers] of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`)
  const text = fs.readFileSync(file, 'utf8')
  for (const marker of markers) {
    if (!text.includes(marker)) throw new Error(`${file} missing marker: ${marker}`)
  }
}

const accountability = fs.readFileSync('app/accountability/page.tsx', 'utf8')
if (!accountability.includes('<form action={assign}>')) {
  throw new Error('Delegation suggestions must require an explicit human action')
}

console.log('Operating desk guardrail: PASS')
