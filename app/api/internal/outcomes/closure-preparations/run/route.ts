import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const preparationMessageSchema = z.object({
  queueId: z.string().uuid(),
  organizationId: z.string().uuid(),
  taskId: z.string().uuid(),
  preparationType: z.literal('prepare_evidence_context'),
}).strict()

function authorized(request: NextRequest) {
  const expected = process.env.INTERNAL_RUNNER_SECRET
  if (!expected) return false
  const actual = request.headers.get('authorization') || ''
  const expectedValue = `Bearer ${expected}`
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expectedValue)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = preparationMessageSchema.safeParse(await request.json().catch(() => null))
  if (!decoded.success) return NextResponse.json({ error: 'Invalid preparation message' }, { status: 400 })
  const message = decoded.data
  if (request.headers.get('x-kumplio-queue-id') !== message.queueId) {
    return NextResponse.json({ error: 'Queue identity mismatch' }, { status: 400 })
  }

  const admin = createAdminClient()
  const workerId = `closure-preparation:${crypto.randomUUID()}`
  const { data: item, error: claimError } = await admin.rpc('claim_outcome_closure_preparation', {
    p_worker_id: workerId,
    p_queue_id: message.queueId,
  })
  if (claimError) return NextResponse.json({ error: 'Unable to claim preparation' }, { status: 503 })
  if (!item) {
    const { data: current, error: lookupError } = await admin
      .from('outcome_closure_preparation_queue')
      .select('status,attempts,available_at')
      .eq('id', message.queueId)
      .maybeSingle()

    if (lookupError) {
      return NextResponse.json({ error: 'Unable to inspect preparation' }, { status: 503 })
    }
    if (!current) {
      return NextResponse.json({ processed: false, deadLetter: true, reason: 'queue_item_not_found' }, { status: 404 })
    }
    if (current.status === 'completed') {
      return NextResponse.json({ processed: false, reason: 'already_completed' })
    }
    if (current.status === 'failed' && current.attempts >= 5) {
      return NextResponse.json(
        { processed: false, deadLetter: true, reason: 'attempts_exhausted' },
        { status: 503 },
      )
    }
    return NextResponse.json(
      {
        processed: false,
        retryable: true,
        reason: current.status === 'running' ? 'already_running' : 'not_ready',
        availableAt: current.available_at,
      },
      { status: 409 },
    )
  }

  try {
    if (item.preparationType !== message.preparationType) throw new Error('preparation_type_mismatch')
    if (item.organizationId !== message.organizationId) throw new Error('preparation_organization_mismatch')
    if (item.taskId !== message.taskId) throw new Error('preparation_task_mismatch')

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
