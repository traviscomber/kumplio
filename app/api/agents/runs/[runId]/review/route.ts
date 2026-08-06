import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const reviewSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'changes_requested', 'commented']),
  comment: z.string().trim().max(5000).optional(),
  checklist: z.record(z.string(), z.boolean()).optional().default({}),
}).superRefine((value, context) => {
  if (['rejected', 'changes_requested'].includes(value.decision) && (!value.comment || value.comment.length < 3)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['comment'],
      message: 'A review comment is required for rejected results or requested changes.',
    })
  }
})

export async function POST(req: NextRequest, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params
  if (!z.string().uuid().safeParse(runId).success) {
    return NextResponse.json({ error: 'Invalid run id', code: 'invalid_run_id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request', code: 'invalid_json' }, { status: 400 })
  }

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid review', code: 'invalid_review', details: parsed.error.flatten() }, { status: 400 })
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

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('review_agent_workflow_run', {
    p_actor_id: user.id,
    p_organization_id: membership.organization_id,
    p_run_id: runId,
    p_decision: parsed.data.decision,
    p_comment: parsed.data.comment || null,
    p_checklist: parsed.data.checklist,
  })

  if (error) {
    const code = error.message.includes('not_found') ? 'run_not_found'
      : error.message.includes('not_reviewable') ? 'run_not_reviewable'
        : error.message.includes('comment_required') ? 'review_comment_required'
          : 'review_transaction_failed'
    const status = code === 'run_not_found' ? 404 : code === 'run_not_reviewable' ? 409 : code === 'review_comment_required' ? 400 : 500
    console.error('[agents/review]', error.code, code)
    return NextResponse.json({ error: 'Unable to save review atomically', code }, { status })
  }

  return NextResponse.json(data)
}
