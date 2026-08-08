import type { SupabaseClient } from '@supabase/supabase-js'

export type ProcessingPrivacyRemediation = {
  processId: string
  processName: string
  ownerId: string | null
  ownerLabel: string | null
  notice: {
    version: string | null
    evidenceId: string | null
    evidenceName: string | null
    validationStatus: string | null
    integrityStatus: string | null
    integrityHash: string | null
    mappingStatus: string
  }
  mission: {
    id: string
    title: string
    status: string
    priority: string
    dueAt: string | null
    ownerLabel: string | null
  } | null
  noticeRequest: {
    id: string
    title: string
    status: string
    dueAt: string | null
    ownerLabel: string | null
  } | null
  deletionRequest: {
    id: string
    title: string
    status: string
    dueAt: string | null
    ownerLabel: string | null
  } | null
  deletionEvidenceStatus: string
}

export type ProcessingPrivacyRemediationSummary = {
  activities: number
  noticesLinked: number
  plansReady: number
  noticeRequestsOpen: number
  deletionRequestsOpen: number
  deletionRequestsAccepted: number
}

export async function getProcessingPrivacyRemediation(
  admin: SupabaseClient,
  organizationId: string,
): Promise<{ actions: ProcessingPrivacyRemediation[]; summary: ProcessingPrivacyRemediationSummary }> {
  // Digital-twin and mission metadata evolve independently from generated types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  const { data: processRows, error: processError } = await db.from('organization_processes')
    .select('id,name,owner_user_id,attributes')
    .eq('organization_id', organizationId)
    .eq('process_type', 'processing_activity')
    .neq('lifecycle_status', 'retired')
    .order('name', { ascending: true })
    .limit(300)

  if (processError) throw new Error(`No fue posible cargar acciones de privacidad: ${processError.message}`)
  const processes = (processRows || []) as Array<Record<string, unknown>>

  const missionIds = unique(processes.map((row) => asObject(row.attributes).privacyRemediationMissionId))
  const evidenceIds = unique(processes.map((row) => asObject(row.attributes).privacyNoticeEvidenceId))
  const requestIds = unique(processes.flatMap((row) => {
    const attributes = asObject(row.attributes)
    return [attributes.privacyNoticeRequestId, attributes.deletionEvidenceRequestId]
  }))

  const [missionsResult, evidenceResult, requestsResult] = await Promise.all([
    missionIds.length
      ? db.from('missions')
        .select('id,title,status,priority,owner_id,due_at')
        .eq('organization_id', organizationId)
        .in('id', missionIds)
      : Promise.resolve({ data: [], error: null }),
    evidenceIds.length
      ? db.from('evidence')
        .select('id,name,validation_status,integrity_status,integrity_hash,metadata')
        .eq('organization_id', organizationId)
        .in('id', evidenceIds)
      : Promise.resolve({ data: [], error: null }),
    requestIds.length
      ? db.from('evidence_requests')
        .select('id,title,status,requested_from,due_at,reviewed_at,review_note')
        .eq('organization_id', organizationId)
        .in('id', requestIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const missions = optionalRows(missionsResult)
  const evidence = optionalRows(evidenceResult)
  const requests = optionalRows(requestsResult)
  const userIds = unique([
    ...processes.map((row) => row.owner_user_id),
    ...missions.map((row) => row.owner_id),
    ...requests.map((row) => row.requested_from),
  ])

  const profilesResult = userIds.length
    ? await db.from('profiles').select('id,first_name,last_name,email').in('id', userIds)
    : { data: [], error: null }
  const profiles = optionalRows(profilesResult)
  const profileLabels = new Map(profiles.map((row): [string, string] => [
    String(row.id),
    [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || String(row.email || 'Miembro'),
  ]))

  const missionsById = indexBy(missions)
  const evidenceById = indexBy(evidence)
  const requestsById = indexBy(requests)

  const actions = processes.map((process): ProcessingPrivacyRemediation => {
    const attributes = asObject(process.attributes)
    const mission = attributes.privacyRemediationMissionId
      ? missionsById.get(String(attributes.privacyRemediationMissionId))
      : undefined
    const noticeEvidence = attributes.privacyNoticeEvidenceId
      ? evidenceById.get(String(attributes.privacyNoticeEvidenceId))
      : undefined
    const noticeRequest = attributes.privacyNoticeRequestId
      ? requestsById.get(String(attributes.privacyNoticeRequestId))
      : undefined
    const deletionRequest = attributes.deletionEvidenceRequestId
      ? requestsById.get(String(attributes.deletionEvidenceRequestId))
      : undefined

    return {
      processId: String(process.id),
      processName: String(process.name || 'Actividad de tratamiento'),
      ownerId: text(process.owner_user_id),
      ownerLabel: process.owner_user_id ? profileLabels.get(String(process.owner_user_id)) || 'Miembro asignado' : null,
      notice: {
        version: text(attributes.privacyNoticeVersion),
        evidenceId: noticeEvidence ? String(noticeEvidence.id) : text(attributes.privacyNoticeEvidenceId),
        evidenceName: noticeEvidence ? String(noticeEvidence.name || 'Aviso de privacidad') : null,
        validationStatus: noticeEvidence ? String(noticeEvidence.validation_status || 'pending') : null,
        integrityStatus: noticeEvidence ? String(noticeEvidence.integrity_status || 'pending') : null,
        integrityHash: noticeEvidence ? text(noticeEvidence.integrity_hash) : null,
        mappingStatus: String(attributes.privacyNoticeMappingStatus || 'not_linked'),
      },
      mission: mission ? {
        id: String(mission.id),
        title: String(mission.title || 'Cerrar aviso y eliminación'),
        status: String(mission.status || 'ready'),
        priority: String(mission.priority || 'high'),
        dueAt: text(mission.due_at),
        ownerLabel: mission.owner_id ? profileLabels.get(String(mission.owner_id)) || 'Miembro asignado' : null,
      } : null,
      noticeRequest: requestView(noticeRequest, profileLabels),
      deletionRequest: requestView(deletionRequest, profileLabels),
      deletionEvidenceStatus: deletionRequest?.status === 'accepted'
        ? 'accepted'
        : String(attributes.deletionEvidenceStatus || 'pending_evidence'),
    }
  })

  const open = (status: string | undefined) => status === 'open' || status === 'submitted'

  return {
    actions,
    summary: {
      activities: actions.length,
      noticesLinked: actions.filter((item) => item.notice.evidenceId).length,
      plansReady: actions.filter((item) => item.mission).length,
      noticeRequestsOpen: actions.filter((item) => open(item.noticeRequest?.status)).length,
      deletionRequestsOpen: actions.filter((item) => open(item.deletionRequest?.status)).length,
      deletionRequestsAccepted: actions.filter((item) => item.deletionRequest?.status === 'accepted').length,
    },
  }
}

function requestView(
  request: Record<string, unknown> | undefined,
  labels: Map<string, string>,
): ProcessingPrivacyRemediation['noticeRequest'] {
  if (!request) return null
  return {
    id: String(request.id),
    title: String(request.title || 'Solicitud de evidencia'),
    status: String(request.status || 'open'),
    dueAt: text(request.due_at),
    ownerLabel: request.requested_from ? labels.get(String(request.requested_from)) || 'Miembro asignado' : null,
  }
}

function optionalRows(result: { data?: unknown[] | null; error?: { code?: string; message?: string } | null }) {
  if (!result.error) return (result.data || []) as Array<Record<string, unknown>>
  if (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(String(result.error.code || ''))) return []
  throw new Error(result.error.message || 'No fue posible cargar las acciones de privacidad.')
}

function unique(values: unknown[]) {
  return [...new Set(values.filter(Boolean).map(String))]
}

function indexBy(rows: Array<Record<string, unknown>>) {
  return new Map(rows.map((row): [string, Record<string, unknown>] => [String(row.id), row]))
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}
