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

  const [{ data: artifact }, { data: workflowStage }] = await Promise.all([
    supabase
      .from('agent_artifacts')
      .select('id')
      .eq('run_id', runId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('agent_workflow_stages')
      .select('id, workflow_id, stage_index')
      .eq('run_id', runId)
      .eq('organization_id', organizationId)
      .maybeSingle(),
  ])

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
  const artifactStatus = parsed.data.decision === 'approved'
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
    return NextResponse.json({ error: 'Review saved but run status could not be updated', code: 'run_review_sync_failed' }, { status: 500 })
  }

  if (artifact?.id) {
    await supabase.from('agent_artifacts').update({ status: artifactStatus }).eq('id', artifact.id)
  }

  if (workflowStage) {
    const stageStatus = parsed.data.decision === 'approved'
      ? 'approved'
      : parsed.data.decision === 'commented'
        ? 'pending_review'
        : 'changes_requested'

    const { error: stageUpdateError } = await supabase
      .from('agent_workflow_stages')
      .update({ status: stageStatus, updated_at: new Date().toISOString() })
      .eq('id', workflowStage.id)
      .eq('organization_id', organizationId)

    if (stageUpdateError) {
      return NextResponse.json({ error: 'Review saved but workflow stage could not be updated', code: 'workflow_review_sync_failed' }, { status: 500 })
    }

    const { data: workflow } = await supabase
      .from('agent_workflows')
      .select('id, current_stage, total_stages')
      .eq('id', workflowStage.workflow_id)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (workflow) {
      const isFinalStage = workflowStage.stage_index >= workflow.total_stages - 1
      const workflowStatus = parsed.data.decision === 'approved'
        ? isFinalStage ? 'completed' : 'running'
        : parsed.data.decision === 'commented' ? 'pending_review' : 'paused'

      await supabase
        .from('agent_workflows')
        .update({
          status: workflowStatus,
          completed_at: workflowStatus === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workflow.id)
        .eq('organization_id', organizationId)
    }
  }

  return NextResponse.json({ review, runId, status: runStatus, workflowStageId: workflowStage?.id || null })
}
