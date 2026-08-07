import { redirect } from 'next/navigation'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { CaseBaselineAssuranceClient } from './case-baseline-assurance-client'

export async function CaseBaselineAssurance({ caseId }: { caseId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/cases/${caseId}`)

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  // New RPCs and event payloads may not yet be present in generated database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data: events } = await db.from('compliance_case_events')
    .select('event_type,changes,created_at')
    .eq('organization_id', access.organizationId)
    .eq('case_id', caseId)
    .in('event_type', ['operational_plan_ready', 'baseline_assurance_closed'])
    .order('created_at', { ascending: false })
    .limit(20)

  const baselineEvent = (events || []).find((event: Record<string, unknown>) => event.event_type === 'baseline_assurance_closed')
  const planEvent = (events || []).find((event: Record<string, unknown>) => event.event_type === 'operational_plan_ready')
  const baselineChanges = asRecord(baselineEvent?.changes)
  const planChanges = asRecord(planEvent?.changes)
  const missionId = text(baselineChanges.mission_id) || text(planChanges.mission_id)
  const requestId = text(baselineChanges.request_id) || text(planChanges.evidence_request_id)

  if (!missionId || !requestId) return null

  const [{ data: complianceCase }, { data: mission }, { data: evidenceRequest }] = await Promise.all([
    db.from('compliance_cases')
      .select('id,title,description,project_id,owner_id,status')
      .eq('id', caseId)
      .eq('organization_id', access.organizationId)
      .maybeSingle(),
    db.from('missions')
      .select('id,title,status,owner_id,due_at,completed_at')
      .eq('id', missionId)
      .eq('organization_id', access.organizationId)
      .eq('case_id', caseId)
      .maybeSingle(),
    db.from('evidence_requests')
      .select('id,title,status,control_id,submitted_evidence_id,due_at,review_comment,reviewed_at')
      .eq('id', requestId)
      .eq('organization_id', access.organizationId)
      .eq('case_id', caseId)
      .maybeSingle(),
  ])

  if (!complianceCase || !mission || !evidenceRequest) return null

  const controlId = text(evidenceRequest.control_id) || text(baselineChanges.control_id)
  const evidenceId = text(evidenceRequest.submitted_evidence_id) || text(baselineChanges.evidence_id)
  const [controlResult, evidenceResult, evaluationsResult, resultResult, ownerResult] = await Promise.all([
    controlId
      ? db.from('controls')
          .select('id,name,design_effectiveness,operating_effectiveness,last_evaluated_at')
          .eq('id', controlId)
          .eq('organization_id', access.organizationId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    evidenceId
      ? db.from('evidence')
          .select('id,name,validation_status,integrity_status,integrity_hash,expires_at,metadata')
          .eq('id', evidenceId)
          .eq('organization_id', access.organizationId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    controlId
      ? db.from('control_evaluations')
          .select('id,evaluation_type,result,summary,evaluated_at')
          .eq('organization_id', access.organizationId)
          .eq('case_id', caseId)
          .eq('control_id', controlId)
          .order('evaluated_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
    db.from('mission_results')
      .select('id,status,result_type,summary,payload,reviewed_at')
      .eq('organization_id', access.organizationId)
      .eq('mission_id', missionId)
      .eq('result_type', 'baseline_assurance')
      .eq('version', 1)
      .maybeSingle(),
    mission.owner_id
      ? db.from('profiles')
          .select('id,first_name,last_name,email')
          .eq('id', mission.owner_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const owner = ownerResult.data
  const ownerName = owner
    ? [owner.first_name, owner.last_name].filter(Boolean).join(' ').trim() || owner.email || 'Responsable'
    : 'Responsable'
  const evaluations = (evaluationsResult.data || []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    type: String(row.evaluation_type),
    result: String(row.result),
    summary: String(row.summary || ''),
    evaluatedAt: String(row.evaluated_at),
  }))
  const evidence = evidenceResult.data
  const evidenceMetadata = asRecord(evidence?.metadata)
  const unknowns = Array.isArray(evidenceMetadata.unknowns)
    ? evidenceMetadata.unknowns.map(String)
    : []

  return (
    <CaseBaselineAssuranceClient
      caseId={caseId}
      caseTitle={String(complianceCase.title)}
      mission={{
        id: String(mission.id),
        title: String(mission.title),
        status: String(mission.status),
        dueAt: mission.due_at ? String(mission.due_at) : null,
        completedAt: mission.completed_at ? String(mission.completed_at) : null,
        ownerId: mission.owner_id ? String(mission.owner_id) : null,
        ownerName,
      }}
      request={{
        id: String(evidenceRequest.id),
        title: String(evidenceRequest.title),
        status: String(evidenceRequest.status),
        dueAt: evidenceRequest.due_at ? String(evidenceRequest.due_at) : null,
        reviewComment: evidenceRequest.review_comment ? String(evidenceRequest.review_comment) : null,
        reviewedAt: evidenceRequest.reviewed_at ? String(evidenceRequest.reviewed_at) : null,
      }}
      control={controlResult.data ? {
        id: String(controlResult.data.id),
        name: String(controlResult.data.name),
        designEffectiveness: String(controlResult.data.design_effectiveness),
        operatingEffectiveness: String(controlResult.data.operating_effectiveness),
        lastEvaluatedAt: controlResult.data.last_evaluated_at ? String(controlResult.data.last_evaluated_at) : null,
      } : null}
      evidence={evidence ? {
        id: String(evidence.id),
        name: String(evidence.name),
        validationStatus: String(evidence.validation_status),
        integrityStatus: String(evidence.integrity_status),
        integrityHash: evidence.integrity_hash ? String(evidence.integrity_hash) : null,
        expiresAt: evidence.expires_at ? String(evidence.expires_at) : null,
        unknowns,
      } : null}
      evaluations={evaluations}
      missionResult={resultResult.data ? {
        id: String(resultResult.data.id),
        status: String(resultResult.data.status),
        summary: String(resultResult.data.summary || ''),
        reviewedAt: resultResult.data.reviewed_at ? String(resultResult.data.reviewed_at) : null,
      } : null}
      canClose={Boolean(
        access.canAssignWork
        && String(mission.owner_id || '') === user.id
        && complianceCase.project_id
      )}
      currentUserIsOwner={String(mission.owner_id || '') === user.id}
    />
  )
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function text(value: unknown) {
  return typeof value === 'string' && value ? value : null
}
