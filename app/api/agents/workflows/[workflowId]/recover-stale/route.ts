import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function recoveryError(error: { message?: string } | null) {
  const message = error?.message || ''
  if (message.includes('Workflow not found')) {
    return { status: 404, code: 'workflow_not_found', error: 'Workflow not found' }
  }
  if (message.includes('Organization membership required')) {
    return { status: 403, code: 'organization_required', error: 'Organization membership required' }
  }
  if (message.includes('Invalid stale threshold')) {
    return { status: 400, code: 'invalid_stale_threshold', error: 'Invalid stale threshold' }
  }
  return { status: 500, code: 'stale_recovery_failed', error: 'Unable to recover the stale execution' }
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ workflowId: string }> },
) {
  const { workflowId } = await context.params
  if (!z.string().uuid().safeParse(workflowId).success) {
    return NextResponse.json({ error: 'Invalid workflow id', code: 'invalid_workflow_id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'Organization membership required', code: 'organization_required' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('recover_stale_workflow_stage', {
    p_actor_id: user.id,
    p_organization_id: membership.organization_id,
    p_workflow_id: workflowId,
    p_stale_after_seconds: 420,
  })

  if (error || !data) {
    const mapped = recoveryError(error)
    console.error('[agents/workflows/recover-stale]', error?.code || mapped.code)
    return NextResponse.json({ error: mapped.error, code: mapped.code }, { status: mapped.status })
  }

  return NextResponse.json(data)
}
