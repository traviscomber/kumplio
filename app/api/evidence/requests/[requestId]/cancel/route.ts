import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const cancelSchema = z.object({
  comment: z.string().trim().max(2000).nullable().optional(),
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

  const parsed = cancelSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid cancellation request', code: 'invalid_request', details: parsed.error.flatten() },
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
    .select('id, status')
    .eq('id', requestIdResult.data)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!evidenceRequest) {
    return NextResponse.json({ error: 'Evidence request not found', code: 'request_not_found' }, { status: 404 })
  }

  if (!['open', 'changes_requested'].includes(evidenceRequest.status)) {
    return NextResponse.json({ error: 'Evidence request cannot be cancelled', code: 'invalid_request_state' }, { status: 409 })
  }

  try {
    const admin = createAdminClient()
    const { error } = await admin.rpc('cancel_evidence_request_record', {
      p_actor_id: user.id,
      p_organization_id: organizationId,
      p_request_id: requestIdResult.data,
      p_comment: parsed.data.comment || null,
    })

    if (error) {
      console.error('[evidence/requests/cancel]', error.code)
      return NextResponse.json({ error: 'Unable to cancel evidence request', code: 'request_cancel_failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[evidence/requests/cancel/configuration]', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Evidence request service is not configured', code: 'request_service_unavailable' }, { status: 503 })
  }
}
