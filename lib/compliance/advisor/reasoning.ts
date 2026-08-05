export type ReasoningInput = {
  severity: string
  confidence?: number | null
  evidenceCount: number
  relatedCount: number
  precedentCount: number
  hasMission: boolean
  hasDecision: boolean
  recommendation?: string | null
}

export type AdvisorReasoning = {
  risk: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  evidenceState: 'insufficient' | 'partial' | 'supported'
  precedentState: 'none' | 'available'
  nextAction: string
  explanation: string[]
}

export function buildAdvisorReasoning(input: ReasoningInput): AdvisorReasoning {
  const risk = normalizeRisk(input.severity)
  const confidence = calculateConfidence(input)
  const evidenceState = input.evidenceCount >= 2 ? 'supported' : input.evidenceCount === 1 ? 'partial' : 'insufficient'
  const precedentState = input.precedentCount > 0 ? 'available' : 'none'
  const explanation = [
    riskExplanation(risk),
    evidenceExplanation(evidenceState, input.evidenceCount),
    contextExplanation(input.relatedCount),
    precedentExplanation(input.precedentCount),
  ]

  return {
    risk,
    confidence,
    evidenceState,
    precedentState,
    nextAction: determineNextAction(input, evidenceState),
    explanation,
  }
}

function calculateConfidence(input: ReasoningInput) {
  const stored = typeof input.confidence === 'number' ? Math.round(input.confidence * 100) : 35
  const evidenceBoost = Math.min(input.evidenceCount * 12, 30)
  const contextBoost = Math.min(input.relatedCount * 4, 16)
  const precedentBoost = input.precedentCount > 0 ? 12 : 0
  return Math.max(0, Math.min(100, stored + evidenceBoost + contextBoost + precedentBoost))
}

function determineNextAction(input: ReasoningInput, evidenceState: AdvisorReasoning['evidenceState']) {
  if (input.hasDecision) return 'Revisar la decisión preparada.'
  if (input.hasMission) return 'Continuar la acción asignada.'
  if (evidenceState === 'insufficient') return 'Agregar evidencia antes de decidir.'
  if (input.recommendation?.trim()) return input.recommendation.trim()
  return 'Preparar una decisión humana trazable.'
}

function normalizeRisk(value: string): AdvisorReasoning['risk'] {
  if (value === 'critical') return 'critical'
  if (value === 'high') return 'high'
  if (value === 'low') return 'low'
  return 'medium'
}

function riskExplanation(risk: AdvisorReasoning['risk']) {
  if (risk === 'critical') return 'El impacto exige atención inmediata.'
  if (risk === 'high') return 'El impacto es alto y debe priorizarse.'
  if (risk === 'low') return 'El impacto es acotado y puede monitorearse.'
  return 'El impacto requiere revisión planificada.'
}

function evidenceExplanation(state: AdvisorReasoning['evidenceState'], count: number) {
  if (state === 'supported') return `${count} evidencias sostienen el análisis.`
  if (state === 'partial') return 'Existe una evidencia, pero conviene confirmar el contexto.'
  return 'Todavía no existe evidencia suficiente para cerrar la situación.'
}

function contextExplanation(count: number) {
  if (count === 0) return 'La situación aún no tiene relaciones de contexto registradas.'
  return `${count} elementos del contexto organizacional están relacionados.`
}

function precedentExplanation(count: number) {
  if (count === 0) return 'No existe un precedente organizacional comparable.'
  return `${count} precedentes pueden apoyar la decisión.`
}
