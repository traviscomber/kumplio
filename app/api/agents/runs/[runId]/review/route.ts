import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const reviewSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'changes_requested', 'commented']),
  comment: z.string().trim().max(5000).optional(),
  checklist: z.record(z.string(), z.boolean()).optional().default({}),
})

export async function POST(req: NextRequest, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params
  if (!z.string().uuid().safeParse(runId).success) {
    return NextResponse.json({ error: 'Invalid run id', code: 'invalid_run_id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request', code: 'invalid_json' }, { status: 400 })
  }

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid review', code: 'invalid_review' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'An organization membership is required', code: 'organization_required' }, { status: 403 })
  }

  const organizationId = membership.organization_id
  const { data: run } = await supabase
    .from('agent_runs')
    .select('id, case_id, status')
    .eq('id', runId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!run) {
    return NextResponse.json({ error: 'Agent run not found', code: 'run_not_found' }, { status: 404 })
  }

  if (!['completed', 'pending_review', 'approved', 'rejected'].includes(run.status)) {
    return NextResponse.json({ error: 'This run cannot be reviewed yet', code: 'run_not_reviewable' }, { status: 409 })
  }

  const { data: artifact } = await supabase
    .from('agent_artifacts')
    .select('id')
    .eq('run_id', runId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: review, error: reviewError } = await supabase
    .from('agent_reviews')
    .insert({
      organization_id: organizationId,
      case_id: run.case_id,
      run_id: runId,
      artifact_id: artifact?.id || null,
      reviewer_id: user.id,
      decision: parsed.data.decision,
      comment: parsed.data.comment || null,
      checklist: parsed.data.checklist,
    })
    .select('id, decision, comment, created_at')
    .single()

  if (reviewError || !review) {
    console.error('[agents/review] unable to create review', reviewError?.code)
    return NextResponse.json({ error: 'Unable to save review', code: 'review_create_failed' }, { status: 500 })
  }

  const runStatus = parsed.data.decision === 'approved'
    ? 'approved'
    : parsed.data.decision === 'rejected'
      ? 'rejected'
      : 'pending_review'

  const { error: runUpdateError } = await supabase
    .from('agent_runs')
    .update({ status: runStatus, updated_at: new Date().toISOString() })
    .eq('id', runId)
    .eq('organization_id', organizationId)

  if (runUpdateError) {
    console.error('[agents/review] unable to update run', runUpdateError.code)
    return NextResponse.json({ error: 'Unable to update reviewed run', code: 'run_update_failed' }, { status: 500 })
  }

  if (artifact?.id) {
    const artifactStatus = parsed.data.decision === 'approved'
      ? 'approved'
      : parsed.data.decision === 'rejected'
        ? 'rejected'
        : 'pending_review'
    await supabase
      .from('agent_artifacts')
      .update({ status: artifactStatus })
      .eq('id', artifact.id)
      .eq('organization_id', organizationId)
  }

  const { data: workflowStage } = await supabase
    .from('agent_workflow_stages')
    .select('id, workflow_id, stage_index')
    .eq('run_id', runId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  let workflowStatus: string | null = null
  if (workflowStage) {
    const stageStatus = parsed.data.decision === 'approved'
      ? 'approved'
      : parsed.data.decision === 'rejected'
        ? 'failed'
        : parsed.data.decision === 'changes_requested'
          ? 'changes_requested'
          : 'pending_review'

    await supabase
      .from('agent_workflow_stages')
      .update({ status: stageStatus, updated_at: new Date().toISOString() })
      .eq('id', workflowStage.id)
      .eq('organization_id', organizationId)

    const { data: workflow } = await supabase
      .from('agent_workflows')
      .select('id, current_stage, total_stages')
      .eq('id', workflowStage.workflow_id)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (workflow) {
      const isCurrentStage = workflow.current_stage === workflowStage.stage_index
      const isFinalStage = workflowStage.stage_index + 1 >= workflow.total_stages

      if (parsed.data.decision === 'approved' && isCurrentStage) {
        workflowStatus = isFinalStage ? 'completed' : 'running'
        await supabase
          .from('agent_workflows')
          .update({
            status: workflowStatus,
            current_stage: isFinalStage ? workflowStage.stage_index : workflowStage.stage_index + 1,
            completed_at: isFinalStage ? new Date().toISOString() : null,
            error_code: null,
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workflow.id)
          .eq('organization_id', organizationId)
      } else if (parsed.data.decision === 'changes_requested' || parsed.data.decision === 'rejected') {
        workflowStatus = 'paused'
        await supabase
          .from('agent_workflows')
          .update({
            status: 'paused',
            error_code: parsed.data.decision === 'rejected' ? 'human_rejected' : 'changes_requested',
            error_message: parsed.data.comment || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workflow.id)
          .eq('organization_id', organizationId)
      } else {
        workflowStatus = 'pending_review'
      }
    }
  }

  return NextResponse.json({ review, runId, status: runStatus, workflowStatus })
}
