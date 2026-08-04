import type { ComplianceStatus, DailyPriority, FindingSeverity } from '@/lib/compliance/continuous/daily-summary'

export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical'

export type ScoredPriority = DailyPriority & {
  score: number
  impact: ImpactLevel
  impactReason: string
}

export type OrganizationHealth = {
  status: ComplianceStatus
  label: 'Estable' | 'Requiere atención' | 'Crítico'
  explanation: string
  highestScore: number
}

const severityWeight: Record<FindingSeverity, number> = {
  low: 20,
  medium: 45,
  high: 72,
  critical: 95,
}

export function scorePriority(priority: DailyPriority): ScoredPriority {
  const urgency = Math.max(0, 12 - Math.min(priority.estimatedMinutes, 12))
  const evidenceGap = priority.why ? 0 : 7
  const actionWeight = /venc|atras|bloque|crític|fiscaliz/i.test(`${priority.title} ${priority.summary}`) ? 10 : 0
  const score = Math.min(100, severityWeight[priority.severity] + urgency + evidenceGap + actionWeight)
  const impact = impactFromScore(score)

  return {
    ...priority,
    score,
    impact,
    impactReason: buildImpactReason(priority, impact),
  }
}

export function rankPriorities(priorities: DailyPriority[]): ScoredPriority[] {
  return priorities
    .map(scorePriority)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

export function calculateOrganizationHealth(priorities: DailyPriority[]): OrganizationHealth {
  const ranked = rankPriorities(priorities)
  const highestScore = ranked[0]?.score ?? 0

  if (highestScore >= 85) {
    return {
      status: 'critical',
      label: 'Crítico',
      explanation: 'Existe al menos una situación que requiere decisión inmediata y evidencia suficiente para su cierre.',
      highestScore,
    }
  }

  if (highestScore >= 45) {
    return {
      status: 'attention',
      label: 'Requiere atención',
      explanation: 'Hay asuntos abiertos que conviene resolver antes de que aumente la exposición de cumplimiento.',
      highestScore,
    }
  }

  return {
    status: 'healthy',
    label: 'Estable',
    explanation: 'No se identificaron asuntos de impacto alto con la información revisada.',
    highestScore,
  }
}

function impactFromScore(score: number): ImpactLevel {
  if (score >= 85) return 'critical'
  if (score >= 65) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

function buildImpactReason(priority: DailyPriority, impact: ImpactLevel) {
  const label = impact === 'critical' ? 'crítico' : impact === 'high' ? 'alto' : impact === 'medium' ? 'medio' : 'bajo'
  const source = priority.why || priority.summary
  return `Impacto ${label}: ${source}`
}
