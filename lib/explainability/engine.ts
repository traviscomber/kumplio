export type ConfidenceLevel = 'low' | 'medium' | 'high'

export type EvidenceReference = {
  id: string
  label: string
  source: string
  date: string | null
  version: string | null
}

export type LegalReference = {
  label: string
  article: string | null
  effectiveDate: string | null
  source: string | null
}

export type Explanation = {
  finding: {
    title: string
    summary: string
  }
  why: string
  evidence: EvidenceReference[]
  legalBasis: LegalReference[]
  confidence: {
    level: ConfidenceLevel
    reason: string
  }
  prepared: string[]
  recommendation: string
  nextAction: {
    label: string
    href: string
  }
}

export type ExplainMissionInput = {
  mission: {
    id: string
    title: string
    objective: string
    status: string
    dueAt: string | null
  }
  runs: Array<{
    id: string
    status: string
    capabilityId: string
  }>
  results: Array<{
    id: string
    title: string
    status: string
    resultType: string
    createdAt: string
    summary: string | null
    evidenceIds: string[]
  }>
  evidence: Array<{
    id: string
    name: string
    source: string | null
    issuedAt: string | null
    expiresAt: string | null
    validationStatus: string | null
    metadata: Record<string, unknown> | null
  }>
  legalBasis?: LegalReference[]
}

export function buildMissionExplanation(input: ExplainMissionInput): Explanation {
  const reviewRuns = input.runs.filter((run) => run.status === 'review_required')
  const pendingResults = input.results.filter((result) => ['proposed', 'in_review'].includes(result.status))
  const validatedEvidence = input.evidence.filter((item) => item.validationStatus === 'validated')
  const evidenceReferences = input.evidence.slice(0, 8).map((item) => ({
    id: item.id,
    label: item.name,
    source: item.source || 'Repositorio interno',
    date: item.issuedAt,
    version: readMetadataString(item.metadata, 'version'),
  }))

  const finding = buildFinding(input.mission.status, reviewRuns.length, pendingResults.length)
  const confidence = calculateConfidence({
    totalEvidence: input.evidence.length,
    validatedEvidence: validatedEvidence.length,
    pendingResults: pendingResults.length,
    reviewRuns: reviewRuns.length,
  })

  const prepared = [
    'El contexto y el objetivo de cumplimiento',
    'La trazabilidad del trabajo realizado',
  ]
  if (reviewRuns.length > 0) prepared.push(`${reviewRuns.length} decisiones listas para revisión`)
  if (pendingResults.length > 0) prepared.push(`${pendingResults.length} propuestas pendientes de aprobación`)
  if (evidenceReferences.length > 0) prepared.push(`${evidenceReferences.length} referencias de evidencia disponibles`)
  prepared.push('El acceso directo a la propuesta completa')

  return {
    finding,
    why: 'Esta situación puede modificar el estado oficial de cumplimiento. Debe revisarse con evidencia suficiente y una decisión humana trazable antes de cerrarse.',
    evidence: evidenceReferences,
    legalBasis: input.legalBasis || [],
    confidence,
    prepared,
    recommendation: buildRecommendation(input.mission.status, reviewRuns.length, pendingResults.length, confidence.level),
    nextAction: {
      label: pendingResults.length > 0 || reviewRuns.length > 0 ? 'Revisar propuesta' : 'Revisar situación',
      href: `/missions/${input.mission.id}`,
    },
  }
}

function buildFinding(status: string, reviewRuns: number, pendingResults: number) {
  if (status === 'blocked') {
    return {
      title: 'El trabajo no puede continuar todavía.',
      summary: 'La misión está bloqueada. Conviene revisar la causa y registrar la decisión necesaria para reanudarla.',
    }
  }

  if (reviewRuns > 0) {
    return {
      title: 'El análisis terminó y requiere una decisión.',
      summary: `${reviewRuns} ${reviewRuns === 1 ? 'resultado intermedio necesita' : 'resultados intermedios necesitan'} revisión humana antes de continuar.`,
    }
  }

  if (pendingResults > 0) {
    return {
      title: 'Existe una propuesta pendiente de aprobación.',
      summary: `${pendingResults} ${pendingResults === 1 ? 'resultado todavía no forma' : 'resultados todavía no forman'} parte del estado oficial de cumplimiento.`,
    }
  }

  return {
    title: 'La fecha o el avance requieren revisión.',
    summary: 'Conviene confirmar qué falta, quién debe intervenir y qué evidencia permitirá cerrar este trabajo.',
  }
}

function calculateConfidence(input: {
  totalEvidence: number
  validatedEvidence: number
  pendingResults: number
  reviewRuns: number
}) {
  if (input.totalEvidence === 0) {
    return {
      level: 'low' as const,
      reason: 'No encontré evidencia vinculada suficiente para respaldar una conclusión definitiva.',
    }
  }

  const validationRatio = input.validatedEvidence / input.totalEvidence
  if (validationRatio >= 0.7 && (input.pendingResults > 0 || input.reviewRuns > 0)) {
    return {
      level: 'high' as const,
      reason: 'La mayoría de la evidencia disponible está validada y existe trabajo preparado para revisión.',
    }
  }

  return {
    level: 'medium' as const,
    reason: 'Existe evidencia disponible, pero todavía falta validación o una decisión humana para cerrar la situación.',
  }
}

function buildRecommendation(
  status: string,
  reviewRuns: number,
  pendingResults: number,
  confidence: ConfidenceLevel,
) {
  if (status === 'blocked') return 'Yo empezaría por identificar la causa del bloqueo y dejar una decisión registrada.'
  if (pendingResults > 0) return 'Yo revisaría la propuesta preparada antes de incorporarla al estado oficial.'
  if (reviewRuns > 0) return 'Yo revisaría primero los resultados intermedios que requieren una decisión humana.'
  if (confidence === 'low') return 'Yo reuniría evidencia adicional antes de cerrar esta situación.'
  return 'Yo confirmaría el responsable, la fecha comprometida y la evidencia necesaria para cerrar el trabajo.'
}

function readMetadataString(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}
