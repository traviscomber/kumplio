import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildProcessingNoticeMappingSuggestion,
  type ProcessingNoticeMappingSuggestion,
} from '@/lib/privacy/processing-notice-mapping'

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
  mapping: {
    status: string
    evidenceId: string | null
    snapshotHash: string | null
    unknowns: string[]
    mappedAt: string | null
  }
  controlledDeletion: {
    status: string
    reviewStatus: string
    drillId: string | null
    evidenceId: string | null
    reviewedAt: string | null
  }
  deletion: {
    status: string
    evidenceId: string | null
    snapshotHash: string | null
    method: string | null
    executedAt: string | null
    validationStatus: string | null
    integrityStatus: string | null
  }
  mappingSuggestion: ProcessingNoticeMappingSuggestion
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
    submittedEvidenceId: string | null
  } | null
  deletionRequest: {
    id: string
    title: string
    status: string
    dueAt: string | null
    ownerLabel: string | null
    submittedEvidenceId: string | null
  } | null
  deletionEvidenceStatus: string
}

export type ProcessingPrivacyRemediationSummary = {
  activities: number
  noticesLinked: number
  plansReady: number
  noticeRequestsOpen: number
  noticeRequestsAccepted: number
  deletionRequestsOpen: number
  deletionRequestsAccepted: number
  controlledMechanismsValidated: number
  deletionsDemonstrated: number
}

export async function getProcessingPrivacyRemediation(
  admin: SupabaseClient,
  organizationId: string,
): Promise<{ actions: ProcessingPrivacyRemediation[]; summary: ProcessingPrivacyRemediationSummary }> {
  // Digital-twin and mission metadata evolve independently from generated types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  const { data: processRows, error: processError } = await db.from('organization_processes')
    .select('id,name,code,owner_user_id,attributes')
    .eq('organization_id', organizationId)
    .eq('process_type', 'processing_activity')
    .neq('lifecycle_status', 'retired')
    .order('name', { ascending: true })
    .limit(300)

  if (processError) throw new Error(`No fue posible cargar acciones de privacidad: ${processError.message}`)
  const processes = (processRows || []) as Array<Record<string, unknown>>

  const missionIds = unique(processes.map((row) => asObject(row.attributes).privacyRemediationMissionId))
  const evidenceIds = unique(processes.flatMap((row) => {
    const attributes = asObject(row.attributes)
    return [
      attributes.privacyNoticeEvidenceId,
      attributes.controlledDeletionEvidenceId,
      attributes.deletionEvidenceId,
    ]
  }))
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
        .select('id,title,status,requested_from,due_at,submitted_evidence_id,reviewed_at,review_comment')
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
    const controlledEvidence = attributes.controlledDeletionEvidenceId
      ? evidenceById.get(String(attributes.controlledDeletionEvidenceId))
      : undefined
    const deletionEvidence = attributes.deletionEvidenceId
      ? evidenceById.get(String(attributes.deletionEvidenceId))
      : undefined
    const noticeRequest = attributes.privacyNoticeRequestId
      ? requestsById.get(String(attributes.privacyNoticeRequestId))
      : undefined
    const deletionRequest = attributes.deletionEvidenceRequestId
      ? requestsById.get(String(attributes.deletionEvidenceRequestId))
      : undefined

    const mappingSuggestion = buildProcessingNoticeMappingSuggestion({
      processName: String(process.name || 'Actividad de tratamiento'),
      processCode: text(process.code),
      purpose: text(attributes.purpose),
      source: attributes.source,
      lifecycleUnknowns: attributes.lifecycleUnknowns,
      lifecycleReviewId: text(attributes.latestLifecycleReviewId),
      lifecycleSnapshotHash: text(attributes.latestSnapshotHash),
    })

    const deletionStatus = String(attributes.deletionEvidenceStatus || 'pending_evidence')
    const controlledReviewStatus = String(attributes.controlledDeletionReviewStatus || 'not_reviewed')

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
      mapping: {
        status: String(attributes.privacyNoticeMappingStatus || 'not_linked'),
        evidenceId: text(attributes.privacyNoticeMappingEvidenceId),
        snapshotHash: text(attributes.privacyNoticeMappingSnapshotHash),
        unknowns: textArray(attributes.privacyNoticeMappingUnknowns),
        mappedAt: text(attributes.privacyNoticeMappedAt),
      },
      controlledDeletion: {
        status: String(attributes.controlledDeletionDrillStatus || 'not_run'),
        reviewStatus: controlledReviewStatus,
        drillId: text(attributes.controlledDeletionDrillId),
        evidenceId: controlledEvidence ? String(controlledEvidence.id) : text(attributes.controlledDeletionEvidenceId),
        reviewedAt: text(attributes.controlledDeletionReviewedAt),
      },
      deletion: {
        status: deletionStatus,
        evidenceId: deletionEvidence ? String(deletionEvidence.id) : text(attributes.deletionEvidenceId),
        snapshotHash: text(attributes.deletionEvidenceSnapshotHash),
        method: text(attributes.deletionEvidenceMethod),
        executedAt: text(attributes.deletionExecutedAt),
        validationStatus: deletionEvidence ? text(deletionEvidence.validation_status) : null,
        integrityStatus: deletionEvidence ? text(deletionEvidence.integrity_status) : null,
      },
      mappingSuggestion,
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
      deletionEvidenceStatus: deletionStatus,
    }
  })

  const isOpenWork = (status: string | undefined) => [
    'open',
    'submitted',
    'under_review',
    'changes_requested',
  ].includes(status || '')

  const isControlledMechanismValidated = (item: ProcessingPrivacyRemediation) => (
    item.controlledDeletion.status === 'passed_controlled_test'
    && item.controlledDeletion.reviewStatus === 'validated_controlled'
    && Boolean(item.controlledDeletion.drillId)
    && Boolean(item.controlledDeletion.evidenceId)
  )

  const isDeletionDemonstrated = (item: ProcessingPrivacyRemediation) => (
    item.deletion.status === 'demonstrated'
    && Boolean(item.deletion.evidenceId)
    && Boolean(item.deletion.snapshotHash?.match(/^[0-9a-f]{64}$/))
    && ['deletion', 'anonymization'].includes(item.deletion.method || '')
    && Boolean(item.deletion.executedAt)
    && item.deletion.validationStatus === 'accepted'
    && item.deletion.integrityStatus === 'verified'
    && item.deletionRequest?.status === 'accepted'
    && item.deletionRequest.submittedEvidenceId === item.deletion.evidenceId
  )

  return {
    actions,
    summary: {
      activities: actions.length,
      noticesLinked: actions.filter((item) => item.notice.evidenceId).length,
      plansReady: actions.filter((item) => item.mission).length,
      noticeRequestsOpen: actions.filter((item) => isOpenWork(item.noticeRequest?.status)).length,
      noticeRequestsAccepted: actions.filter((item) => (
        item.noticeRequest?.status === 'accepted' && item.noticeRequest.submittedEvidenceId
      )).length,
      deletionRequestsOpen: actions.filter((item) => isOpenWork(item.deletionRequest?.status)).length,
      deletionRequestsAccepted: actions.filter((item) => (
        item.deletionRequest?.status === 'accepted' && item.deletionRequest.submittedEvidenceId
      )).length,
      controlledMechanismsValidated: actions.filter(isControlledMechanismValidated).length,
      deletionsDemonstrated: actions.filter(isDeletionDemonstrated).length,
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
    submittedEvidenceId: text(request.submitted_evidence_id),
  }
}

function optionalRows(result: { data?: unknown[] | null; error?: { code?: string; message?: string } | null }) {
  if (!result.error) return (result.data || []) as Array<Record<string, unknown>>
  if (['42P01', 'PGRST204', 'PGRST205'].includes(String(result.error.code || ''))) return []
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

function textArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim())
    : []
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}
