import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const advanceSchema = z.object({
  instructions: z.string().trim().max(2000).nullable().optional(),
})

type EnqueueResult = {
  jobId?: string
  messageId?: number
  resumed?: boolean
  status?: string
}

export async function POST(req: NextRequest, context: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await context.params
  if (!z.string().uuid().safeParse(workflowId).success) {
    return NextResponse.json({ error: 'Invalid workflow id', code: 'invalid_workflow_id' }, { status: 400 })
  }

  let body: unknown = {}
  try {
    const text = await req.text()
    body = text ? JSON.parse(text) : {}
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request', code: 'invalid_json' }, { status: 400 })
  }

  const parsed = advanceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid advance request', code: 'invalid_advance_request', details: parsed.error.flatten() }, { status: 400 })
  }

  const retryInstructions = parsed.data.instructions || null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) return NextResponse.json({ error: 'Organization required', code: 'organization_required' }, { status: 403 })

  const organizationId = String(membership.organization_id)
  const admin = createAdminClient()
  const { data: workflow } = await supabase
    .from('agent_workflows')
    .select('id, status, current_stage, total_stages')
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!workflow) return NextResponse.json({ error: 'Workflow not found', code: 'workflow_not_found' }, { status: 404 })
  if (['completed', 'cancelled'].includes(workflow.status)) {
    return NextResponse.json({ error: `Workflow is ${workflow.status}`, code: 'workflow_not_available' }, { status: 409 })
  }

  let stageIndex = workflow.current_stage
  if (workflow.status === 'pending_review') {
    const { data: currentStage } = await supabase
      .from('agent_workflow_stages')
      .select('status')
      .eq('workflow_id', workflowId)
      .eq('organization_id', organizationId)
      .eq('stage_index', workflow.current_stage)
      .maybeSingle()

    if (currentStage?.status !== 'approved') {
      return NextResponse.json({ error: 'Human approval is required before advancing the workflow', code: 'review_required' }, { status: 409 })
    }

    stageIndex = workflow.current_stage + 1
    if (stageIndex >= workflow.total_stages) {
      return NextResponse.json({ workflowId, status: 'completed', queued: false })
    }
  }

  const { data: stage } = await supabase
    .from('agent_workflow_stages')
    .select('status, attempt_count, max_attempts')
    .eq('workflow_id', workflowId)
    .eq('organization_id', organizationId)
    .eq('stage_index', stageIndex)
    .maybeSingle()

  if (!stage) return NextResponse.json({ error: 'Workflow stage not found', code: 'stage_not_found' }, { status: 404 })
  if (['pending_review', 'approved'].includes(stage.status)) {
    return NextResponse.json({ error: 'This stage has already produced a result', code: 'stage_already_completed' }, { status: 409 })
  }
  if (stage.status === 'changes_requested' && !retryInstructions) {
    return NextResponse.json({ error: 'Retry instructions are required after changes were requested', code: 'retry_instructions_required' }, { status: 400 })
  }
  if (stage.attempt_count >= stage.max_attempts) {
    return NextResponse.json({ error: 'Maximum retry count reached', code: 'max_attempts_reached' }, { status: 409 })
  }

  const { data, error } = await admin.rpc('enqueue_agent_job', {
    p_actor_id: user.id,
    p_organization_id: organizationId,
    p_workflow_id: workflowId,
    p_stage_index: stageIndex,
    p_retry_instructions: retryInstructions,
  })

  if (error) {
    console.error('[agents/workflows/enqueue]', error.code)
    return NextResponse.json({ error: 'No fue posible poner la etapa en cola', code: 'agent_job_enqueue_failed' }, { status: 500 })
  }

  const job = (data || {}) as EnqueueResult
  return NextResponse.json({
    workflowId,
    stageIndex,
    queued: true,
    jobId: job.jobId || null,
    queueStatus: job.status || 'queued',
    resumed: Boolean(job.resumed),
  }, { status: job.resumed ? 200 : 202 })
}
