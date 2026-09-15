export type ComplianceOutcomeStatus = 'ready' | 'needs_attention' | 'blocked' | 'review_required'
export type ComplianceHumanReviewStatus = 'not_started' | 'in_progress' | 'approved' | 'changes_requested' | 'rejected'

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
  resolved: string[]
  nextAction: OutcomeAction | null
  actions: OutcomeAction[]
  missing: string[]
  blockers: string[]
  evidence: OutcomeEvidence[]
  evidenceCount: number
  humanReviewRequired: boolean
  humanReviewStatus: ComplianceHumanReviewStatus
  humanReviewReasons: string[]
  humanReviewComment: string | null
  specialistsUsed: string[]
}

type ArtifactInput = {
  artifact_type?: unknown
  content?: unknown
  status?: unknown
}

type WorkflowStageInput = {
  stage_index?: unknown
  run_id?: unknown
  status?: unknown
}

type ReviewInput = {
  run_id?: unknown
  decision?: unknown
  comment?: unknown
  created_at?: unknown
}

export function buildComplianceOutcome(input: {
  goal?: string | null
  workflowStatus?: string | null
  artifacts: ArtifactInput[]
  stages?: WorkflowStageInput[]
  reviews?: ReviewInput[]
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
  const finalAgentContent = findLatestAgentContent(contents, 'catalina')
  const decision = typeof finalAgentContent?.decisionRecommendation === 'string'
    ? finalAgentContent.decisionRecommendation
    : null
  const finalHumanReview = findFinalStageReview(input.stages || [], input.reviews || [])
  const humanReviewStatus = deriveHumanReviewStatus(finalHumanReview?.decision)
  const status = deriveStatus({
    decision,
    missing,
    blockers,
    artifactCount: contents.length,
    workflowStatus: input.workflowStatus || null,
    humanReviewStatus,
  })
  const resolved = collectResolved(contents, {
    workflowStatus: input.workflowStatus || null,
    humanReviewStatus,
  })
  const nextAction = actions[0] || null
  const summary = deriveSummary(contents, input.goal)

  return {
    status,
    headline: headlineForStatus(status),
    summary,
    decision,
    resolved,
    nextAction,
    actions,
    missing,
    blockers,
    evidence,
    evidenceCount: evidence.length,
    humanReviewRequired: review.required || contents.length > 0,
    humanReviewStatus,
    humanReviewReasons: review.reasons,
    humanReviewComment: stringValue(finalHumanReview?.comment),
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

function collectResolved(
  contents: Array<{ agentId: string; content: Record<string, unknown> }>,
  review: { workflowStatus: string | null; humanReviewStatus: ComplianceHumanReviewStatus },
) {
  const resolved: string[] = []

  if (review.workflowStatus === 'completed' && review.humanReviewStatus === 'approved') {
    resolved.push('La revisión humana final fue aprobada y el workflow quedó completado.')
  }

  for (const { content } of contents) {
    if (Array.isArray(content.controlAssessments)) {
      for (const item of content.controlAssessments) {
        const control = asRecord(item)
        if (
          control.designConclusion === 'effective'
          && control.implementationConclusion === 'implemented'
          && control.operatingConclusion === 'effective'
          && control.evidenceAssessment === 'sufficient'
        ) {
          const label = stringValue(control.control)
          if (label) resolved.push(`Control verificado con diseño, implementación, operación y evidencia suficientes: ${label}`)
        }
      }
    }

    if (Array.isArray(content.assertions)) {
      for (const item of content.assertions) {
        const assertion = asRecord(item)
        if (assertion.verdict !== 'supported') continue
        const statement = stringValue(assertion.statement)
        if (statement) resolved.push(`Afirmación respaldada por la evidencia revisada: ${statement}`)
      }
    }
  }

  return unique(resolved)
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

function findFinalStageReview(stages: WorkflowStageInput[], reviews: ReviewInput[]) {
  const finalStage = [...stages]
    .filter((stage) => Number.isFinite(Number(stage.stage_index)))
    .sort((left, right) => Number(right.stage_index) - Number(left.stage_index))[0]
  const finalRunId = stringValue(finalStage?.run_id)
  if (!finalRunId) return undefined

  return reviews
    .filter((review) => stringValue(review.run_id) === finalRunId)
    .sort((left, right) => timeValue(right.created_at) - timeValue(left.created_at))[0]
}

function deriveHumanReviewStatus(decision: unknown): ComplianceHumanReviewStatus {
  if (decision === 'approved') return 'approved'
  if (decision === 'rejected') return 'rejected'
  if (decision === 'changes_requested') return 'changes_requested'
  if (decision === 'commented') return 'in_progress'
  return 'not_started'
}

function deriveStatus(input: {
  decision: string | null
  missing: string[]
  blockers: string[]
  artifactCount: number
  workflowStatus: string | null
  humanReviewStatus: ComplianceHumanReviewStatus
}): ComplianceOutcomeStatus {
  if (!input.artifactCount) return 'blocked'
  if (
    input.humanReviewStatus === 'rejected'
    || input.decision === 'reject'
    || input.decision === 'insufficient_information'
    || input.blockers.length
  ) return 'blocked'
  if (
    input.humanReviewStatus === 'changes_requested'
    || input.decision === 'request_changes'
    || input.missing.length
  ) return 'needs_attention'
  if (input.workflowStatus === 'completed' && input.humanReviewStatus === 'approved') return 'ready'
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

function timeValue(value: unknown) {
  if (typeof value !== 'string') return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}
