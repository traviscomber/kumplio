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

function reviewError(error: { code?: string; message?: string } | null) {
  const message = error?.message || ''
  if (error?.code === '23505') {
    return { status: 409, code: 'already_reviewed', error: 'This run already has a final review decision' }
  }
  if (message.includes('Agent run not found')) {
    return { status: 404, code: 'run_not_found', error: 'Agent run not found' }
  }
  if (message.includes('Organization membership required')) {
    return { status: 403, code: 'organization_required', error: 'An organization membership is required' }
  }
  if (message.includes('Run is not reviewable')) {
    return { status: 409, code: 'run_not_reviewable', error: 'This run cannot be reviewed yet' }
  }
  if (message.includes('Review comment required') || message.includes('Invalid review decision')) {
    return { status: 400, code: 'invalid_review', error: 'Invalid review' }
  }
  return { status: 500, code: 'review_transition_failed', error: 'Unable to save review' }
}

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
  const { data, error } = await admin.rpc('review_agent_run_record', {
    p_actor_id: user.id,
    p_organization_id: membership.organization_id,
    p_run_id: runId,
    p_decision: parsed.data.decision,
    p_comment: parsed.data.comment || null,
    p_checklist: parsed.data.checklist,
  })

  if (error || !data) {
    const mapped = reviewError(error)
    console.error('[agents/review]', error?.code || mapped.code)
    return NextResponse.json({ error: mapped.error, code: mapped.code }, { status: mapped.status })
  }

  return NextResponse.json(data)
}
