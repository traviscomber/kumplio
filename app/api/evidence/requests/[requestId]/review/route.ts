import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const reviewSchema = z.object({
  decision: z.enum(['accepted', 'rejected', 'changes_requested']),
  comment: z.string().trim().min(3).max(2000),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params
  const requestIdResult = z.string().uuid().safeParse(requestId)
  if (!requestIdResult.success) {
    return NextResponse.json({ error: 'Invalid request identifier', code: 'invalid_request_id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request', code: 'invalid_json' }, { status: 400 })
  }

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid evidence review', code: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'Organization required', code: 'organization_required' }, { status: 403 })
  }

  const organizationId = membership.organization_id
  const { data: evidenceRequest } = await supabase
    .from('evidence_requests')
    .select('id, status, submitted_evidence_id')
    .eq('id', requestIdResult.data)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!evidenceRequest) {
    return NextResponse.json({ error: 'Evidence request not found', code: 'request_not_found' }, { status: 404 })
  }

  if (!['submitted', 'under_review'].includes(evidenceRequest.status) || !evidenceRequest.submitted_evidence_id) {
    return NextResponse.json({ error: 'Evidence request has no reviewable submission', code: 'invalid_request_state' }, { status: 409 })
  }

  try {
    const admin = createAdminClient()
    const { error } = await admin.rpc('review_evidence_request_record', {
      p_actor_id: user.id,
      p_organization_id: organizationId,
      p_request_id: requestIdResult.data,
      p_decision: parsed.data.decision,
      p_comment: parsed.data.comment,
    })

    if (error) {
      console.error('[evidence/requests/review]', error.code)
      return NextResponse.json({ error: 'Unable to review evidence', code: 'evidence_review_failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[evidence/requests/review/configuration]', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Evidence request service is not configured', code: 'request_service_unavailable' }, { status: 503 })
  }
}
