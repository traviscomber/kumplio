export type ComplianceOutcomeStatus = 'ready' | 'needs_attention' | 'blocked' | 'review_required'

export type OutcomeEvidence = {
  label: string
  location: string | null
  supports: string | null
}

export type OutcomeAction = {
  title: string
  ownerRole: string | null
  target: string | null
  priority: 'low' | 'medium' | 'high' | 'critical' | 'unknown'
  dependencies: string[]
  closureCriteria: string[]
}

export type ComplianceOutcome = {
  status: ComplianceOutcomeStatus
  headline: string
  summary: string
  decision: string | null
  nextAction: OutcomeAction | null
  actions: OutcomeAction[]
  missing: string[]
  blockers: string[]
  evidence: OutcomeEvidence[]
  evidenceCount: number
  humanReviewRequired: boolean
  humanReviewReasons: string[]
  specialistsUsed: string[]
}

type ArtifactInput = {
  artifact_type?: unknown
  content?: unknown
  status?: unknown
}

export function buildComplianceOutcome(input: {
  goal?: string | null
  artifacts: ArtifactInput[]
}): ComplianceOutcome {
  const artifacts = input.artifacts || []
  const contents = artifacts
    .map((artifact) => ({
      agentId: typeof artifact.artifact_type === 'string' ? artifact.artifact_type : 'unknown',
      content: asRecord(artifact.content),
    }))
    .filter((artifact) => Object.keys(artifact.content).length > 0)

  const specialistsUsed = unique(contents.map((item) => publicAgentName(item.agentId)))
  const evidence = collectEvidence(contents.map((item) => item.content))
  const actions = collectActions(contents)
  const missing = collectMissing(contents)
  const blockers = collectBlockers(contents)
  const review = collectHumanReview(contents)
  const finalReview = findLatestAgentContent(contents, 'catalina')
  const decision = typeof finalReview?.decisionRecommendation === 'string'
    ? finalReview.decisionRecommendation
    : null

  const status = deriveStatus({ decision, missing, blockers, artifactCount: contents.length })
  const nextAction = actions[0] || null
  const summary = deriveSummary(contents, input.goal)

  return {
    status,
    headline: headlineForStatus(status),
    summary,
    decision,
    nextAction,
    actions,
    missing,
    blockers,
    evidence,
    evidenceCount: evidence.length,
    humanReviewRequired: review.required || contents.length > 0,
    humanReviewReasons: review.reasons,
    specialistsUsed,
  }
}

function collectActions(contents: Array<{ agentId: string; content: Record<string, unknown> }>): OutcomeAction[] {
  const actions: OutcomeAction[] = []

  for (const { content } of contents) {
    if (Array.isArray(content.phases)) {
      for (const phase of content.phases) {
        const phaseRecord = asRecord(phase)
        if (!Array.isArray(phaseRecord.actions)) continue
        for (const item of phaseRecord.actions) actions.push(normalizeAction(asRecord(item)))
      }
    }
    if (Array.isArray(content.remediationActions)) {
      for (const item of content.remediationActions) actions.push(normalizeAction(asRecord(item)))
    }
  }

  return dedupeBy(actions, (action) => action.title)
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority))
}

function normalizeAction(value: Record<string, unknown>): OutcomeAction {
  return {
    title: stringValue(value.title) || stringValue(value.description) || 'Acción pendiente',
    ownerRole: stringValue(value.ownerRole),
    target: stringValue(value.target),
    priority: normalizePriority(value.priority),
    dependencies: stringArray(value.dependencies),
    closureCriteria: unique([
      ...stringArray(value.closureCriteria),
      ...stringArray(value.acceptanceCriteria),
      ...stringArray(value.closureEvidence),
    ]),
  }
}

function collectMissing(contents: Array<{ agentId: string; content: Record<string, unknown> }>) {
  const missing: string[] = []
  for (const { content } of contents) {
    missing.push(...stringArray(content.missingInformation))
    if (Array.isArray(content.controlAssessments)) {
      for (const control of content.controlAssessments) {
        missing.push(...stringArray(asRecord(control).missingEvidence))
      }
    }
    missing.push(...stringArray(content.reservations))
  }
  return unique(missing)
}

function collectBlockers(contents: Array<{ agentId: string; content: Record<string, unknown> }>) {
  const blockers: string[] = []
  for (const { content } of contents) {
    blockers.push(...stringArray(content.contradictions))
    if (content.sourceStatus === 'unverified' || content.sourceStatus === 'hypothetical') {
      blockers.push('La fuente regulatoria principal aún no está verificada como oficial y vigente.')
    }
  }
  return unique(blockers)
}

function collectHumanReview(contents: Array<{ agentId: string; content: Record<string, unknown> }>) {
  const reasons: string[] = []
  let required = false
  for (const { content } of contents) {
    const review = asRecord(content.humanReview)
    if (review.required === true) required = true
    reasons.push(...stringArray(review.reasons))
  }
  return { required, reasons: unique(reasons) }
}

function collectEvidence(contents: Record<string, unknown>[]) {
  const collected: OutcomeEvidence[] = []
  const visit = (value: unknown, supports: string | null = null) => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      for (const item of value) visit(item, supports)
      return
    }

    const record = value as Record<string, unknown>
    const localSupports = stringValue(record.statement)
      || stringValue(record.topic)
      || stringValue(record.control)
      || supports

    if (Array.isArray(record.sources)) {
      for (const source of record.sources) {
        const sourceRecord = asRecord(source)
        const label = stringValue(sourceRecord.label)
        if (!label) continue
        collected.push({
          label,
          location: stringValue(sourceRecord.location),
          supports: localSupports,
        })
      }
    }

    for (const nested of Object.values(record)) visit(nested, localSupports)
  }

  for (const content of contents) visit(content)
  return dedupeBy(collected, (item) => `${item.label}|${item.location || ''}|${item.supports || ''}`)
}

function deriveStatus(input: {
  decision: string | null
  missing: string[]
  blockers: string[]
  artifactCount: number
}): ComplianceOutcomeStatus {
  if (!input.artifactCount) return 'blocked'
  if (input.decision === 'reject' || input.decision === 'insufficient_information' || input.blockers.length) return 'blocked'
  if (input.decision === 'request_changes' || input.missing.length) return 'needs_attention'
  if (input.decision === 'approve' || input.decision === 'approve_with_reservations') return 'review_required'
  return 'review_required'
}

function deriveSummary(contents: Array<{ content: Record<string, unknown> }>, goal?: string | null) {
  for (let index = contents.length - 1; index >= 0; index -= 1) {
    const summary = stringValue(contents[index].content.summary)
    if (summary) return summary
  }
  return goal?.trim() ? `Kumplio está procesando el resultado para: ${goal.trim()}` : 'Kumplio aún no tiene un resultado consolidado.'
}

function findLatestAgentContent(
  contents: Array<{ agentId: string; content: Record<string, unknown> }>,
  agentId: string,
) {
  for (let index = contents.length - 1; index >= 0; index -= 1) {
    if (contents[index].agentId === agentId) return contents[index].content
  }
  return undefined
}

function headlineForStatus(status: ComplianceOutcomeStatus) {
  if (status === 'ready') return 'Resultado listo'
  if (status === 'needs_attention') return 'Necesita atención'
  if (status === 'blocked') return 'Bloqueado por información o evidencia'
  return 'Listo para revisión humana'
}

function publicAgentName(agentId: string) {
  const names: Record<string, string> = {
    isidora: 'Isidora',
    rodrigo: 'Rodrigo',
    javier: 'Javier',
    beatriz: 'Beatriz',
    veronica: 'Verónica',
    andres: 'Andrés',
    catalina: 'Julieta',
  }
  return names[agentId] || agentId
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim())
    : []
}

function unique<T>(values: T[]) {
  return [...new Set(values)]
}

function dedupeBy<T>(values: T[], key: (value: T) => string) {
  const seen = new Set<string>()
  return values.filter((value) => {
    const valueKey = key(value)
    if (seen.has(valueKey)) return false
    seen.add(valueKey)
    return true
  })
}

function normalizePriority(value: unknown): OutcomeAction['priority'] {
  return ['low', 'medium', 'high', 'critical'].includes(String(value))
    ? String(value) as OutcomeAction['priority']
    : 'unknown'
}

function priorityRank(priority: OutcomeAction['priority']) {
  return { unknown: 0, low: 1, medium: 2, high: 3, critical: 4 }[priority]
}
