import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const bodySchema = z.object({
  decision: z.enum(['verified', 'changes_requested']),
  comment: z.string().trim().min(3).max(2000),
})

export async function POST(request: NextRequest, context: { params: Promise<{ workflowId: string; taskId: string }> }) {
  const { workflowId, taskId } = await context.params
  if (!z.string().uuid().safeParse(workflowId).success || !z.string().uuid().safeParse(taskId).success) {
    return NextResponse.json({ error: 'Invalid closure task', code: 'invalid_closure_task' }, { status: 400 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON request', code: 'invalid_json' }, { status: 400 }) }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid closure review', code: 'invalid_closure_review', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) return NextResponse.json({ error: 'Organization required', code: 'organization_required' }, { status: 403 })
  if (!['owner', 'admin', 'compliance', 'reviewer'].includes(String(membership.role))) {
    return NextResponse.json({ error: 'Closure review permission required', code: 'closure_review_forbidden' }, { status: 403 })
  }

  const organizationId = membership.organization_id
  const admin = createAdminClient()
  const { data: planTask } = await admin
    .from('compliance_action_plan_tasks')
    .select('id, compliance_action_plans!inner(source_workflow_id, organization_id)')
    .eq('id', taskId)
    .eq('compliance_action_plans.organization_id', organizationId)
    .eq('compliance_action_plans.source_workflow_id', workflowId)
    .maybeSingle()

  if (!planTask) return NextResponse.json({ error: 'Closure task not found', code: 'closure_task_not_found' }, { status: 404 })

  const { data, error } = await admin.rpc('review_outcome_closure_task', {
    p_actor_id: user.id,
    p_organization_id: organizationId,
    p_task_id: taskId,
    p_decision: parsed.data.decision,
    p_comment: parsed.data.comment,
  })

  if (error) {
    const message = error.message || ''
    const code = message.includes('closure_task_not_reviewable') ? 'closure_task_not_reviewable'
      : message.includes('closure_criteria_required') ? 'closure_criteria_required'
        : message.includes('verified_closure_evidence_required') ? 'verified_closure_evidence_required'
          : message.includes('closure_review_forbidden') ? 'closure_review_forbidden'
            : message.includes('closure_task_not_found') ? 'closure_task_not_found'
              : 'closure_task_review_failed'
    const status = code === 'closure_review_forbidden' ? 403 : code === 'closure_task_not_found' ? 404 : code === 'closure_task_review_failed' ? 500 : 409
    if (status >= 500) console.error('[agents/closure-plan/task-review]', error.code)
    return NextResponse.json({ error: 'Unable to review this closure action', code }, { status })
  }

  return NextResponse.json({ closureTask: data })
}
