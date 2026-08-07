import type { SupabaseClient } from '@supabase/supabase-js'
import { calculateComplianceConfidence } from '@/lib/compliance/confidence'
import { buildAdvisorReasoning, type AdvisorReasoning } from './reasoning'

export type AdvisorCategory = 'critical' | 'decision' | 'assigned' | 'waiting' | 'evidence' | 'agentic'
export type AdvisorSource = 'situation' | 'decision' | 'mission' | 'evidence_request' | 'review' | 'agent_job'

export type AdvisorItem = {
  id: string
  source: AdvisorSource
  category: AdvisorCategory
  title: string
  summary: string | null
  severity: string
  href: string
  dueAt: string | null
  ownerLabel: string | null
  statusLabel: string
  score: number
  reasoning: AdvisorReasoning
  facts: string[]
}

export type AdvisorChange = {
  id: string
  type: string
  title: string
  detail: string
  occurredAt: string
  href: string
}

export type AdvisorSummary = {
  status: 'stable' | 'attention' | 'critical'
  openSituations: number
  pendingDecisions: number
  assignedWork: number
  waitingOnOthers: number
  agentWorking: number
  pendingReviews: number
  overdue: number
  dueSoon: number
  criticalCount: number
  estimatedMinutes: number
  priorities: AdvisorItem[]
  recentMemories: Array<{ id: string; title: string; summary: string; occurredAt: string }>
  changes24h: AdvisorChange[]
  resolved24h: number
  delegated24h: number
  evidenceReceived24h: number
  confidence: { value: number | null; basis: string[] }
  tomorrowFocus: AdvisorItem | null
}

export async function getDailyAdvisorSummary(
  admin: SupabaseClient,
  organizationId: string,
  userId: string,
  now = new Date(),
): Promise<AdvisorSummary> {
  // Domain tables evolve faster than generated Supabase types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  const [
    projectsResult,
    situationsResult,
    decisionsResult,
    missionsResult,
    evidenceRequestsResult,
    jobsResult,
    stagesResult,
    memoriesResult,
    missionEventsResult,
    evidenceEventsResult,
    caseEventsResult,
  ] = await Promise.all([
    db.from('projects').select('id').eq('organization_id', organizationId).limit(200),
    db.from('compliance_situations')
      .select('id,title,summary,severity,status,confidence,evidence_ids,mission_id,decision_id,recommendation,owner_id,due_at,created_at')
      .eq('organization_id', organizationId)
      .not('status', 'in', '(resolved,dismissed)')
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('mission_decisions')
      .select('id,title,description,priority,status,assigned_to,requested_at,evidence_ids,recommendation')
      .eq('organization_id', organizationId)
      .neq('status', 'resolved')
      .order('requested_at', { ascending: true })
      .limit(100),
    db.from('missions')
      .select('id,title,objective,priority,status,owner_id,due_at,updated_at,created_at')
      .eq('organization_id', organizationId)
      .not('status', 'in', '(completed,cancelled)')
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(200),
    db.from('evidence_requests')
      .select('id,title,description,status,requested_from,requested_by,due_at,submitted_evidence_id,updated_at,created_at')
      .eq('organization_id', organizationId)
      .not('status', 'in', '(accepted,rejected,cancelled,closed)')
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(200),
    db.from('agent_jobs')
      .select('id,status,workflow_id,stage_index,attempt_count,max_attempts,next_attempt_at,last_error_code,created_at')
      .eq('organization_id', organizationId)
      .in('status', ['queued', 'working', 'retry_wait', 'dead_letter'])
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('agent_workflow_stages')
      .select('id,workflow_id,agent_id,status,updated_at')
      .eq('organization_id', organizationId)
      .eq('status', 'pending_review')
      .order('updated_at', { ascending: true })
      .limit(100),
    db.from('organization_memory')
      .select('id,title,summary,occurred_at')
      .eq('organization_id', organizationId)
      .order('occurred_at', { ascending: false })
      .limit(5),
    db.from('mission_events')
      .select('id,mission_id,event_type,actor_type,payload,created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('evidence_request_events')
      .select('id,request_id,event_type,from_status,to_status,created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('compliance_case_events')
      .select('id,case_id,event_type,summary,created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const projects = rows(projectsResult, 'ámbitos')
  const situations = rows(situationsResult, 'situaciones')
  const decisions = rows(decisionsResult, 'decisiones')
  const missions = rows(missionsResult, 'misiones')
  const evidenceRequests = rows(evidenceRequestsResult, 'solicitudes de evidencia')
  const jobs = rows(jobsResult, 'cola de especialistas')
  const pendingStages = rows(stagesResult, 'revisiones')
  const memories = optionalRows(memoriesResult)
  const missionEvents = optionalRows(missionEventsResult)
  const evidenceEvents = optionalRows(evidenceEventsResult)
  const caseEvents = optionalRows(caseEventsResult)

  const projectIds = projects.map((item: Record<string, unknown>) => String(item.id))
  const [obligationsResult, controlsResult, controlObligationsResult, controlEvidenceResult, evidenceResult] = await Promise.all([
    projectIds.length
      ? db.from('obligations').select('id,project_id').in('project_id', projectIds).limit(2000)
      : Promise.resolve({ data: [], error: null }),
    db.from('controls')
      .select('id,owner_id,design_effectiveness,operating_effectiveness')
      .eq('organization_id', organizationId)
      .limit(1000),
    db.from('control_obligations')
      .select('control_id,obligation_id')
      .eq('organization_id', organizationId)
      .limit(2000),
    db.from('control_evidence')
      .select('control_id,evidence_id,sufficiency_status')
      .eq('organization_id', organizationId)
      .limit(2000),
    db.from('evidence')
      .select('id,validation_status')
      .eq('organization_id', organizationId)
      .limit(1000),
  ])

  const obligations = optionalRows(obligationsResult)
  const controls = optionalRows(controlsResult)
  const controlObligations = optionalRows(controlObligationsResult)
  const controlEvidence = optionalRows(controlEvidenceResult)
  const evidence = optionalRows(evidenceResult)

  const ownerIds = [...new Set([
    ...situations.map((item: Record<string, unknown>) => item.owner_id),
    ...decisions.map((item: Record<string, unknown>) => item.assigned_to),
    ...missions.map((item: Record<string, unknown>) => item.owner_id),
    ...evidenceRequests.flatMap((item: Record<string, unknown>) => [item.requested_from, item.requested_by]),
  ].filter(Boolean).map(String))]

  const { data: profiles } = ownerIds.length
    ? await db.from('profiles').select('id,first_name,last_name,email').in('id', ownerIds)
    : { data: [] }
  const profileLabels: Map<string, string> = new Map(
    (profiles || []).map((profile: Record<string, unknown>): [string, string] => [
      String(profile.id),
      [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || String(profile.email || 'Miembro'),
    ]),
  )

  const precedentCount = memories.length
  const priorityCandidates: AdvisorItem[] = [
    ...situations.map((item: Record<string, unknown>) => makeItem({
      id: String(item.id),
      source: 'situation',
      category: normalizeRisk(String(item.severity || 'medium')) === 'critical' ? 'critical' : 'decision',
      title: String(item.title || 'Situación pendiente'),
      summary: text(item.summary),
      severity: String(item.severity || 'medium'),
      href: `/situations/${item.id}`,
      dueAt: text(item.due_at),
      ownerId: text(item.owner_id),
      ownerLabel: labelFor(item.owner_id, profileLabels),
      statusLabel: statusLabel(String(item.status || 'open')),
      evidenceCount: Array.isArray(item.evidence_ids) ? item.evidence_ids.length : 0,
      precedentCount,
      hasMission: Boolean(item.mission_id),
      hasDecision: Boolean(item.decision_id),
      recommendation: text(item.recommendation),
      storedConfidence: typeof item.confidence === 'number' ? item.confidence : null,
      now,
    })),
    ...decisions
      .filter((item: Record<string, unknown>) => !item.assigned_to || String(item.assigned_to) === userId)
      .map((item: Record<string, unknown>) => makeItem({
        id: String(item.id),
        source: 'decision',
        category: 'decision',
        title: String(item.title || 'Decisión pendiente'),
        summary: text(item.description),
        severity: String(item.priority || 'medium'),
        href: '/decisions',
        dueAt: null,
        ownerId: text(item.assigned_to),
        ownerLabel: labelFor(item.assigned_to, profileLabels) || 'Revisión humana pendiente',
        statusLabel: statusLabel(String(item.status || 'pending')),
        evidenceCount: Array.isArray(item.evidence_ids) ? item.evidence_ids.length : 0,
        precedentCount,
        hasMission: false,
        hasDecision: true,
        recommendation: text(item.recommendation),
        storedConfidence: null,
        now,
      })),
    ...missions.map((item: Record<string, unknown>) => makeItem({
      id: String(item.id),
      source: 'mission',
      category: String(item.owner_id || '') === userId ? 'assigned' : 'waiting',
      title: String(item.title || 'Trabajo de cumplimiento'),
      summary: text(item.objective),
      severity: String(item.priority || 'medium'),
      href: `/missions/${item.id}`,
      dueAt: text(item.due_at),
      ownerId: text(item.owner_id),
      ownerLabel: labelFor(item.owner_id, profileLabels) || 'Sin responsable',
      statusLabel: statusLabel(String(item.status || 'draft')),
      evidenceCount: 0,
      precedentCount,
      hasMission: true,
      hasDecision: false,
      recommendation: missionNextAction(item, userId),
      storedConfidence: null,
      now,
    })),
    ...evidenceRequests.map((item: Record<string, unknown>) => {
      const requestedFrom = text(item.requested_from)
      const requestedBy = text(item.requested_by)
      return makeItem({
        id: String(item.id),
        source: 'evidence_request',
        category: requestedFrom === userId ? 'assigned' : requestedBy === userId ? 'waiting' : 'evidence',
        title: String(item.title || 'Solicitud de evidencia'),
        summary: text(item.description),
        severity: dueSeverity(text(item.due_at), now),
        href: '/evidence',
        dueAt: text(item.due_at),
        ownerId: requestedFrom,
        ownerLabel: labelFor(requestedFrom, profileLabels) || 'Responsable de evidencia',
        statusLabel: statusLabel(String(item.status || 'open')),
        evidenceCount: item.submitted_evidence_id ? 1 : 0,
        precedentCount,
        hasMission: false,
        hasDecision: false,
        recommendation: requestedFrom === userId ? 'Entregar o actualizar la evidencia solicitada.' : 'Revisar si la persona responsable necesita apoyo.',
        storedConfidence: null,
        now,
      })
    }),
  ]

  if (pendingStages.length > 0) {
    priorityCandidates.push(makeItem({
      id: 'pending-reviews',
      source: 'review',
      category: 'decision',
      title: `${pendingStages.length} resultado${pendingStages.length === 1 ? '' : 's'} necesita${pendingStages.length === 1 ? '' : 'n'} revisión humana`,
      summary: 'Los especialistas ya terminaron; falta validar antes de que Kumplio presente el trabajo como aprobado.',
      severity: pendingStages.length >= 3 ? 'high' : 'medium',
      href: '/review-center',
      dueAt: null,
      ownerId: userId,
      ownerLabel: 'Revisión humana',
      statusLabel: 'Pendiente de revisión',
      evidenceCount: pendingStages.length,
      precedentCount,
      hasMission: false,
      hasDecision: true,
      recommendation: 'Abrir el centro de revisiones y validar el resultado más antiguo.',
      storedConfidence: null,
      now,
    }))
  }

  const deadLetters = jobs.filter((item: Record<string, unknown>) => item.status === 'dead_letter')
  if (deadLetters.length > 0) {
    priorityCandidates.push(makeItem({
      id: 'dead-letter',
      source: 'agent_job',
      category: 'critical',
      title: `${deadLetters.length} trabajo${deadLetters.length === 1 ? '' : 's'} de especialistas requiere${deadLetters.length === 1 ? '' : 'n'} intervención`,
      summary: 'La cola durable agotó sus reintentos y conservó el trabajo para recuperación manual.',
      severity: 'critical',
      href: '/operations',
      dueAt: null,
      ownerId: null,
      ownerLabel: 'Operación de Kumplio',
      statusLabel: 'Dead-letter',
      evidenceCount: 0,
      precedentCount,
      hasMission: false,
      hasDecision: false,
      recommendation: 'Abrir Operaciones, revisar el error y decidir si corresponde reintentar.',
      storedConfidence: null,
      now,
    }))
  }

  const priorities = priorityCandidates.sort((left, right) => right.score - left.score).slice(0, 5)
  const overdue = [...missions, ...evidenceRequests].filter((item: Record<string, unknown>) => isOverdue(text(item.due_at), now)).length
  const dueSoon = [...missions, ...evidenceRequests].filter((item: Record<string, unknown>) => isDueSoon(text(item.due_at), now)).length
  const assignedWork = missions.filter((item: Record<string, unknown>) => String(item.owner_id || '') === userId).length
  const waitingOnOthers = missions.filter((item: Record<string, unknown>) => item.owner_id && String(item.owner_id) !== userId).length
    + evidenceRequests.filter((item: Record<string, unknown>) => String(item.requested_by || '') === userId && String(item.requested_from || '') !== userId).length
  const agentWorking = jobs.filter((item: Record<string, unknown>) => ['queued', 'working', 'retry_wait'].includes(String(item.status))).length
  const criticalCount = priorities.filter((item) => item.reasoning.risk === 'critical' || (item.reasoning.risk === 'high' && isOverdue(item.dueAt, now))).length
  const status: AdvisorSummary['status'] = criticalCount > 0 ? 'critical' : priorities.length > 0 ? 'attention' : 'stable'

  const changes24h = buildChanges(missionEvents, evidenceEvents, caseEvents)
  const resolved24h = missionEvents.filter((item: Record<string, unknown>) => item.event_type === 'mission_completed').length
    + evidenceEvents.filter((item: Record<string, unknown>) => ['accepted', 'reviewed'].includes(String(item.event_type)) || item.to_status === 'accepted').length
    + caseEvents.filter((item: Record<string, unknown>) => ['case_closed', 'case_resolved'].includes(String(item.event_type))).length
  const delegated24h = missionEvents.filter((item: Record<string, unknown>) => item.event_type === 'ownership_updated').length
  const evidenceReceived24h = evidenceEvents.filter((item: Record<string, unknown>) => ['submitted', 'evidence_submitted'].includes(String(item.event_type)) || item.to_status === 'submitted').length
  const confidence = calculateWorkspaceConfidence({ obligations, controls, controlObligations, controlEvidence, evidence })

  return {
    status,
    openSituations: situations.length,
    pendingDecisions: decisions.length,
    assignedWork,
    waitingOnOthers,
    agentWorking,
    pendingReviews: pendingStages.length,
    overdue,
    dueSoon,
    criticalCount,
    estimatedMinutes: Math.min(60, Math.max(0, priorities.length * 4 + pendingStages.length * 3)),
    priorities,
    recentMemories: memories.map((item: Record<string, unknown>) => ({
      id: String(item.id),
      title: String(item.title || 'Precedente'),
      summary: String(item.summary || ''),
      occurredAt: String(item.occurred_at),
    })),
    changes24h,
    resolved24h,
    delegated24h,
    evidenceReceived24h,
    confidence,
    tomorrowFocus: priorities.find((item) => item.dueAt && new Date(item.dueAt).getTime() <= now.getTime() + 48 * 60 * 60 * 1000) || priorities[0] || null,
  }
}

function makeItem(input: {
  id: string
  source: AdvisorSource
  category: AdvisorCategory
  title: string
  summary: string | null
  severity: string
  href: string
  dueAt: string | null
  ownerId: string | null
  ownerLabel: string | null
  statusLabel: string
  evidenceCount: number
  precedentCount: number
  hasMission: boolean
  hasDecision: boolean
  recommendation: string | null
  storedConfidence: number | null
  now: Date
}): AdvisorItem {
  const reasoning = buildAdvisorReasoning({
    severity: input.severity,
    confidence: input.storedConfidence,
    evidenceCount: input.evidenceCount,
    relatedCount: input.hasMission || input.hasDecision ? 1 : 0,
    precedentCount: input.precedentCount,
    hasMission: input.hasMission,
    hasDecision: input.hasDecision,
    recommendation: input.recommendation,
  })

  const dueState = describeDue(input.dueAt, input.now)
  const facts = [
    `Origen: ${sourceLabel(input.source)}.`,
    `Estado: ${input.statusLabel}.`,
    input.ownerLabel ? `Responsable: ${input.ownerLabel}.` : '',
    dueState ? dueState : '',
    input.evidenceCount > 0 ? `${input.evidenceCount} respaldo${input.evidenceCount === 1 ? '' : 's'} asociado${input.evidenceCount === 1 ? '' : 's'}.` : '',
  ].filter(Boolean)

  return {
    id: input.id,
    source: input.source,
    category: input.category,
    title: input.title,
    summary: input.summary,
    severity: input.severity,
    href: input.href,
    dueAt: input.dueAt,
    ownerLabel: input.ownerLabel,
    statusLabel: input.statusLabel,
    reasoning,
    facts,
    score: priorityScore(input.severity, input.category, input.dueAt, input.now, input.ownerId),
  }
}

function buildChanges(
  missionEvents: Array<Record<string, unknown>>,
  evidenceEvents: Array<Record<string, unknown>>,
  caseEvents: Array<Record<string, unknown>>,
): AdvisorChange[] {
  const changes: AdvisorChange[] = []
  for (const item of missionEvents) changes.push({
    id: `mission:${item.id}`,
    type: 'mission',
    title: missionEventTitle(String(item.event_type || 'updated')),
    detail: 'Se actualizó trabajo asignado o su responsabilidad.',
    occurredAt: String(item.created_at),
    href: '/my-work',
  })
  for (const item of evidenceEvents) changes.push({
    id: `evidence:${item.id}`,
    type: 'evidence',
    title: evidenceEventTitle(String(item.event_type || item.to_status || 'updated')),
    detail: 'La solicitud de evidencia cambió de estado.',
    occurredAt: String(item.created_at),
    href: '/evidence',
  })
  for (const item of caseEvents) changes.push({
    id: `case:${item.id}`,
    type: 'case',
    title: String(item.summary || 'Avance en un expediente'),
    detail: String(item.event_type || 'case_updated').replaceAll('_', ' '),
    occurredAt: String(item.created_at),
    href: item.case_id ? `/cases/${item.case_id}` : '/cases',
  })
  return changes
    .filter((item) => item.occurredAt)
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, 8)
}

function calculateWorkspaceConfidence(input: {
  obligations: Array<Record<string, unknown>>
  controls: Array<Record<string, unknown>>
  controlObligations: Array<Record<string, unknown>>
  controlEvidence: Array<Record<string, unknown>>
  evidence: Array<Record<string, unknown>>
}) {
  const model = calculateComplianceConfidence(input)
  return { value: model.overall, basis: model.basis }
}

function rows(result: { data?: unknown[] | null; error?: { message?: string } | null }, label: string) {
  if (result.error) throw new Error(`No fue posible preparar ${label}: ${result.error.message || 'error desconocido'}`)
  return (result.data || []) as Array<Record<string, unknown>>
}

function optionalRows(result: { data?: unknown[] | null; error?: { code?: string; message?: string } | null }) {
  if (!result.error) return (result.data || []) as Array<Record<string, unknown>>
  if (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(String(result.error.code || ''))) return []
  throw new Error(result.error.message || 'No fue posible preparar el resumen diario.')
}

function priorityScore(severity: string, category: AdvisorCategory, dueAt: string | null, now: Date, ownerId: string | null) {
  const base = normalizeRisk(severity) === 'critical' ? 100 : normalizeRisk(severity) === 'high' ? 75 : normalizeRisk(severity) === 'medium' ? 50 : 25
  const categoryBoost = category === 'critical' ? 30 : category === 'decision' ? 20 : category === 'assigned' ? 15 : category === 'evidence' ? 12 : category === 'waiting' ? 8 : 5
  const dueBoost = isOverdue(dueAt, now) ? 40 : isDueWithin(dueAt, now, 24) ? 30 : isDueWithin(dueAt, now, 72) ? 20 : 0
  return base + categoryBoost + dueBoost + (ownerId ? 0 : 8)
}

function normalizeRisk(value: string): AdvisorReasoning['risk'] {
  if (value === 'critical') return 'critical'
  if (value === 'high') return 'high'
  if (value === 'low') return 'low'
  return 'medium'
}

function dueSeverity(dueAt: string | null, now: Date) {
  if (isOverdue(dueAt, now)) return 'high'
  if (isDueWithin(dueAt, now, 72)) return 'medium'
  return 'low'
}

function isOverdue(value: string | null, now: Date) {
  return Boolean(value && new Date(value).getTime() < now.getTime())
}

function isDueSoon(value: string | null, now: Date) {
  return Boolean(value && !isOverdue(value, now) && isDueWithin(value, now, 72))
}

function isDueWithin(value: string | null, now: Date, hours: number) {
  if (!value) return false
  const milliseconds = new Date(value).getTime() - now.getTime()
  return milliseconds >= 0 && milliseconds <= hours * 60 * 60 * 1000
}

function describeDue(value: string | null, now: Date) {
  if (!value) return 'Sin fecha definida.'
  const date = new Date(value)
  if (date.getTime() < now.getTime()) return `Venció el ${date.toLocaleDateString('es-CL')}.`
  if (isDueWithin(value, now, 24)) return `Vence dentro de 24 horas (${date.toLocaleDateString('es-CL')}).`
  if (isDueWithin(value, now, 72)) return `Vence dentro de 3 días (${date.toLocaleDateString('es-CL')}).`
  return `Vence el ${date.toLocaleDateString('es-CL')}.`
}

function labelFor(value: unknown, labels: Map<string, string>) {
  if (!value) return null
  return labels.get(String(value)) || 'Miembro asignado'
}

function sourceLabel(value: AdvisorSource) {
  if (value === 'situation') return 'Situación priorizada'
  if (value === 'decision') return 'Decisión humana'
  if (value === 'mission') return 'Misión de cumplimiento'
  if (value === 'evidence_request') return 'Solicitud de evidencia'
  if (value === 'review') return 'Resultado de especialista'
  return 'Operación de agentes'
}

function missionNextAction(item: Record<string, unknown>, userId: string) {
  if (!item.owner_id) return 'Asignar una persona responsable y una fecha.'
  if (String(item.owner_id) === userId) return item.status === 'blocked' ? 'Resolver o documentar el bloqueo.' : 'Continuar la acción asignada.'
  return 'Revisar el avance y apoyar si existe un bloqueo.'
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    ready: 'Lista para iniciar',
    active: 'En curso',
    working: 'Trabajando',
    queued: 'En cola',
    retry_wait: 'Esperando reintento',
    blocked: 'Bloqueada',
    in_review: 'En revisión',
    pending: 'Pendiente',
    pending_review: 'Pendiente de revisión',
    requested: 'Solicitada',
    submitted: 'Entregada',
    changes_requested: 'Requiere cambios',
  }
  return labels[value] || value.replaceAll('_', ' ')
}

function missionEventTitle(value: string) {
  if (value === 'mission_completed') return 'Misión completada'
  if (value === 'ownership_updated') return 'Responsabilidad actualizada'
  if (value === 'mission_started') return 'Misión iniciada'
  if (value === 'mission_rescheduled') return 'Misión reprogramada'
  return 'Trabajo actualizado'
}

function evidenceEventTitle(value: string) {
  if (value.includes('submit')) return 'Evidencia recibida'
  if (value.includes('accept')) return 'Evidencia aceptada'
  if (value.includes('reject')) return 'Evidencia rechazada'
  if (value.includes('change')) return 'Cambios solicitados en evidencia'
  return 'Solicitud de evidencia actualizada'
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}
