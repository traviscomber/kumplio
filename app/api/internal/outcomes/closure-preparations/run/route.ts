import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: NextRequest) {
  const expected = process.env.INTERNAL_RUNNER_SECRET
  if (!expected) return false
  return request.headers.get('authorization') === `Bearer ${expected}`
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const workerId = `closure-preparation:${crypto.randomUUID()}`
  const { data: item, error: claimError } = await admin.rpc('claim_outcome_closure_preparation', { p_worker_id: workerId })
  if (claimError) return NextResponse.json({ error: 'Unable to claim preparation' }, { status: 503 })
  if (!item) return NextResponse.json({ processed: false, reason: 'queue_empty' })

  try {
    if (item.preparationType !== 'prepare_evidence_context') throw new Error('unsupported_preparation_type')

    const [{ data: task }, { data: links }] = await Promise.all([
      admin.from('compliance_action_plan_tasks')
        .select('id,title,closure_criteria,evidence_requirements,verification_status,compliance_action_plans!inner(organization_id)')
        .eq('id', item.taskId)
        .eq('compliance_action_plans.organization_id', item.organizationId)
        .maybeSingle(),
      admin.from('compliance_action_task_evidence')
        .select('evidence_id,evidence!inner(id,name,evidence_type,validation_status,integrity_status)')
        .eq('organization_id', item.organizationId)
        .eq('task_id', item.taskId),
    ])

    if (!task) throw new Error('closure_task_not_found')
    if (task.verification_status !== 'pending_evidence') throw new Error('closure_task_not_preparable')

    const trusted = (links || []).filter((link) => {
      const evidence = Array.isArray(link.evidence) ? link.evidence[0] : link.evidence
      return evidence?.validation_status === 'accepted' && evidence?.integrity_status === 'verified'
    }).map((link) => {
      const evidence = Array.isArray(link.evidence) ? link.evidence[0] : link.evidence
      return { id: evidence?.id, name: evidence?.name, type: evidence?.evidence_type }
    }).filter((item) => item.id)

    if (!trusted.length) throw new Error('trusted_evidence_not_available')

    const result = {
      taskId: task.id,
      taskTitle: task.title,
      trustedEvidence: trusted,
      closureCriteria: task.closure_criteria || [],
      evidenceRequirements: task.evidence_requirements || [],
      preparedAt: new Date().toISOString(),
      requiresHumanVerification: true,
    }

    await admin.rpc('complete_outcome_closure_preparation', { p_queue_id: item.id, p_result: result })
    return NextResponse.json({ processed: true, preparation: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    await admin.rpc('fail_outcome_closure_preparation', { p_queue_id: item.id, p_error: message })
    return NextResponse.json({ processed: false, retryable: true, reason: message }, { status: 409 })
  }
}
