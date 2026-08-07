export type TimelineEvent = {
  id: string
  type: string
  title: string
  detail: string
  occurredAt: string
  href?: string
}

export type ConfidenceDimension = {
  key: string
  label: string
  score: number
  covered: number
  total: number
  detail: string
  href: string
}

export type ImpactItem = {
  obligationId: string
  title: string
  priority: string | null
  controls: number
  evidence: number
  owners: number
  openCases: number
  riskScore: number
}

export function buildTimeline(input: {
  cases: Array<Record<string, any>>
  missions: Array<Record<string, any>>
  evidenceRequests: Array<Record<string, any>>
  evidenceEvents: Array<Record<string, any>>
  evaluations: Array<Record<string, any>>
  decisions: Array<Record<string, any>>
}) {
  const events: TimelineEvent[] = []

  for (const row of input.cases) events.push({
    id: `case:${row.id}`,
    type: 'case',
    title: row.title || 'Expediente',
    detail: `Caso ${row.status || 'sin estado'}`,
    occurredAt: row.updated_at || row.created_at,
    href: `/cases/${row.id}`,
  })

  for (const row of input.missions) events.push({
    id: `mission:${row.id}`,
    type: 'mission',
    title: row.title || 'Misión',
    detail: `Misión ${row.status || 'sin estado'}`,
    occurredAt: row.updated_at || row.created_at,
    href: '/missions',
  })

  for (const row of input.evidenceRequests) events.push({
    id: `request:${row.id}`,
    type: 'evidence_request',
    title: row.title || 'Solicitud de evidencia',
    detail: `Solicitud ${row.status || 'sin estado'}`,
    occurredAt: row.updated_at || row.created_at,
    href: '/evidence',
  })

  for (const row of input.evidenceEvents) events.push({
    id: `evidence-event:${row.id}`,
    type: 'evidence_event',
    title: 'Movimiento de evidencia',
    detail: String(row.event_type || 'evento').replaceAll('_', ' '),
    occurredAt: row.created_at,
    href: '/evidence',
  })

  for (const row of input.evaluations) events.push({
    id: `evaluation:${row.id}`,
    type: 'control_evaluation',
    title: `Evaluación ${row.evaluation_type === 'operating' ? 'operacional' : 'de diseño'}`,
    detail: `Resultado: ${row.result || 'sin resultado'}`,
    occurredAt: row.evaluated_at || row.created_at,
    href: row.control_id ? `/controls/${row.control_id}` : '/controls',
  })

  for (const row of input.decisions) events.push({
    id: `decision:${row.id}`,
    type: 'decision',
    title: row.title || 'Decisión',
    detail: row.status === 'resolved' ? 'Decisión resuelta' : 'Decisión pendiente',
    occurredAt: row.resolved_at || row.requested_at || row.created_at,
    href: '/decisions',
  })

  return events
    .filter((event) => Boolean(event.occurredAt))
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 150)
}

function pct(covered: number, total: number) {
  if (total <= 0) return 100
  return Math.max(0, Math.min(100, Math.round((covered / total) * 100)))
}

export function buildConfidence(input: {
  obligations: Array<Record<string, any>>
  controls: Array<Record<string, any>>
  controlObligations: Array<Record<string, any>>
  controlEvidence: Array<Record<string, any>>
  evidence: Array<Record<string, any>>
}) {
  const obligationIdsWithControl = new Set(input.controlObligations.map((row) => row.obligation_id))
  const controlsWithOwner = input.controls.filter((row) => Boolean(row.owner_id)).length
  const controlsEvaluated = input.controls.filter((row) => row.design_effectiveness !== 'not_evaluated' || row.operating_effectiveness !== 'not_evaluated').length
  const controlsWithSufficientEvidence = new Set(
    input.controlEvidence.filter((row) => row.sufficiency_status === 'sufficient').map((row) => row.control_id),
  ).size
  const validEvidence = input.evidence.filter((row) => row.validation_status === 'validated' || row.validation_status === 'accepted').length

  const dimensions: ConfidenceDimension[] = [
    {
      key: 'obligations', label: 'Obligaciones con control',
      score: pct(obligationIdsWithControl.size, input.obligations.length),
      covered: obligationIdsWithControl.size, total: input.obligations.length,
      detail: 'Obligaciones aplicables vinculadas al menos a un control.', href: '/obligations',
    },
    {
      key: 'owners', label: 'Responsables definidos',
      score: pct(controlsWithOwner, input.controls.length),
      covered: controlsWithOwner, total: input.controls.length,
      detail: 'Controles con una persona responsable asignada.', href: '/accountability',
    },
    {
      key: 'evidence', label: 'Controles con evidencia suficiente',
      score: pct(controlsWithSufficientEvidence, input.controls.length),
      covered: controlsWithSufficientEvidence, total: input.controls.length,
      detail: 'Controles respaldados por evidencia aceptada como suficiente.', href: '/evidence',
    },
    {
      key: 'evaluations', label: 'Controles evaluados',
      score: pct(controlsEvaluated, input.controls.length),
      covered: controlsEvaluated, total: input.controls.length,
      detail: 'Controles con evaluación de diseño u operación.', href: '/controls',
    },
    {
      key: 'evidence_quality', label: 'Evidencia validada',
      score: pct(validEvidence, input.evidence.length),
      covered: validEvidence, total: input.evidence.length,
      detail: 'Evidencias validadas o aceptadas sobre el total registrado.', href: '/evidence',
    },
  ]

  const overall = dimensions.length ? Math.round(dimensions.reduce((sum, item) => sum + item.score, 0) / dimensions.length) : 100
  return { overall, dimensions }
}

export function buildImpact(input: {
  obligations: Array<Record<string, any>>
  controls: Array<Record<string, any>>
  controlObligations: Array<Record<string, any>>
  controlEvidence: Array<Record<string, any>>
  cases: Array<Record<string, any>>
}) {
  const controlsById = new Map(input.controls.map((row) => [row.id, row]))
  const evidenceByControl = new Map<string, Set<string>>()
  for (const row of input.controlEvidence) {
    const set = evidenceByControl.get(row.control_id) || new Set<string>()
    set.add(row.evidence_id)
    evidenceByControl.set(row.control_id, set)
  }

  const openCasesByProject = new Map<string, number>()
  for (const row of input.cases.filter((row) => !['closed', 'resolved', 'cancelled'].includes(row.status))) {
    openCasesByProject.set(row.project_id, (openCasesByProject.get(row.project_id) || 0) + 1)
  }

  const linksByObligation = new Map<string, string[]>()
  for (const row of input.controlObligations) {
    const current = linksByObligation.get(row.obligation_id) || []
    current.push(row.control_id)
    linksByObligation.set(row.obligation_id, current)
  }

  const items: ImpactItem[] = input.obligations.map((obligation) => {
    const controlIds = linksByObligation.get(obligation.id) || []
    const linkedControls = controlIds.map((id) => controlsById.get(id)).filter(Boolean) as Array<Record<string, any>>
    const evidenceIds = new Set(controlIds.flatMap((id) => [...(evidenceByControl.get(id) || new Set<string>())]))
    const owners = new Set(linkedControls.map((row) => row.owner_id).filter(Boolean)).size
    const weakControls = linkedControls.filter((row) => row.design_effectiveness === 'ineffective' || row.operating_effectiveness === 'ineffective').length
    const openCases = openCasesByProject.get(obligation.project_id) || 0
    const base = obligation.priority === 'critical' ? 40 : obligation.priority === 'high' ? 30 : obligation.priority === 'medium' ? 20 : 10
    const riskScore = Math.min(100, base + (controlIds.length === 0 ? 35 : 0) + weakControls * 15 + (evidenceIds.size === 0 ? 15 : 0) + Math.min(10, openCases * 2))
    return {
      obligationId: obligation.id,
      title: obligation.obligation_text,
      priority: obligation.priority,
      controls: controlIds.length,
      evidence: evidenceIds.size,
      owners,
      openCases,
      riskScore,
    }
  })

  return items.sort((a, b) => b.riskScore - a.riskScore).slice(0, 50)
}
