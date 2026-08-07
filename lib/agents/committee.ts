import 'server-only'

import type { AgentId } from './catalog'

type ArtifactRecord = {
  artifact_type?: string | null
  title?: string | null
  content?: unknown
  status?: string | null
}

export type QualityGateReport = {
  status: 'pass' | 'warn' | 'block'
  blockers: string[]
  warnings: string[]
}

const SPECIALIST_FOCUS: Record<AgentId, string> = {
  isidora: 'obligaciones, fuentes, aplicabilidad y vacíos documentales',
  rodrigo: 'riesgo, materialidad, urgencia, escenarios y supuestos',
  javier: 'plan ejecutable, responsables, dependencias y criterios de cierre',
  beatriz: 'cambio regulatorio, vigencia, fuentes oficiales e impacto',
  veronica: 'diseño y operación de controles, evidencia, excepciones y hallazgos',
  andres: 'desempeño, recurrencias, calidad de datos y aprendizaje',
  catalina: 'contradicciones, sustento, reservas, decisión y escalamiento',
}

function compact(value: unknown, max = 5000) {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export function buildCommitteeContrast(agentId: AgentId, artifacts: ArtifactRecord[]) {
  const prior = artifacts.filter((artifact) => artifact.status !== 'superseded')
  if (!prior.length) return ''

  const summaries = prior.slice(-6).map((artifact, index) => {
    const author = artifact.artifact_type || 'especialista'
    return `APORTE ${index + 1} — ${author}\nTítulo: ${artifact.title || 'Resultado previo'}\nContenido: ${compact(artifact.content)}`
  })

  return [
    'CONTRASTE DEL COMITÉ (CONTEXTO OPERATIVO, NO AUTORIDAD NORMATIVA):',
    `Tu foco exclusivo es: ${SPECIALIST_FOCUS[agentId]}.`,
    'Contrasta los aportes anteriores. Señala explícitamente coincidencias, contradicciones, supuestos incompatibles y evidencia faltante que afecten tu conclusión.',
    'No adoptes una conclusión previa solo porque otro agente la emitió. Si excede tu especialidad, déjala como punto abierto para el agente o revisor correspondiente.',
    ...summaries,
  ].join('\n\n')
}

function collectSources(value: unknown): number {
  if (!value || typeof value !== 'object') return 0
  if (Array.isArray(value)) return value.reduce((total, item) => total + collectSources(item), 0)
  const record = value as Record<string, unknown>
  let total = Array.isArray(record.sources) ? record.sources.length : 0
  for (const [key, nested] of Object.entries(record)) {
    if (key === 'sources') continue
    total += collectSources(nested)
  }
  return total
}

export function evaluateAgentQuality(agentId: AgentId, output: unknown): QualityGateReport {
  const blockers: string[] = []
  const warnings: string[] = []
  const value = (output || {}) as Record<string, unknown>

  if (typeof value.summary !== 'string' || value.summary.trim().length < 20) blockers.push('Resumen ejecutivo ausente o insuficiente.')

  const humanReview = value.humanReview as Record<string, unknown> | undefined
  if (!humanReview || humanReview.required !== true) blockers.push('El resultado no exige revisión humana según el contrato de Kumplio.')
  if (!Array.isArray(humanReview?.reasons) || humanReview.reasons.length === 0) warnings.push('La revisión humana no explica por qué es necesaria.')

  if (collectSources(output) === 0 && ['isidora', 'rodrigo', 'beatriz', 'veronica', 'catalina'].includes(agentId)) {
    warnings.push('El resultado no contiene fuentes estructuradas; debe revisarse el sustento antes de aprobar.')
  }

  if (agentId === 'catalina') {
    const contradictions = Array.isArray(value.contradictions) ? value.contradictions : []
    const reservations = Array.isArray(value.reservations) ? value.reservations : []
    const recommendation = value.decisionRecommendation
    if (recommendation === 'approve' && (contradictions.length > 0 || reservations.length > 0)) {
      blockers.push('Julieta no puede recomendar aprobación limpia mientras existan contradicciones o reservas declaradas.')
    }
    if (!Array.isArray(value.assertions) || value.assertions.length === 0) blockers.push('Julieta debe revisar al menos una afirmación del comité.')
  }

  return {
    status: blockers.length ? 'block' : warnings.length ? 'warn' : 'pass',
    blockers,
    warnings,
  }
}
