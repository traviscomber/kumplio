import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function closeError(error: { message?: string } | null) {
  const message = error?.message || ''
  if (message.includes('Compliance case not found')) return { status: 404, code: 'case_not_found', error: 'Compliance case not found' }
  if (message.includes('Workflow is not completed')) return { status: 409, code: 'workflow_not_completed', error: 'The workflow is not completed' }
  if (message.includes('Final stage is not approved')) return { status: 409, code: 'final_stage_not_approved', error: 'The final stage has not been approved' }
  if (message.includes('Final review is not approved')) return { status: 409, code: 'final_review_not_approved', error: 'The final review has not been approved' }
  return { status: 500, code: 'case_close_failed', error: 'Unable to close the case' }
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
    return NextResponse.json({ error: 'Organization required', code: 'organization_required' }, { status: 403 })
  }

  const organizationId = membership.organization_id
  const { data: workflow } = await supabase
    .from('agent_workflows')
    .select('id, case_id')
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!workflow?.case_id) {
    return NextResponse.json({ error: 'Workflow or linked case not found', code: 'workflow_not_found' }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('close_compliance_case_record', {
    p_actor_id: user.id,
    p_organization_id: organizationId,
    p_case_id: workflow.case_id,
    p_workflow_id: workflow.id,
  })

  if (error || !data) {
    const mapped = closeError(error)
    console.error('[cases/close-workflow]', error?.code || mapped.code)
    return NextResponse.json({ error: mapped.error, code: mapped.code }, { status: mapped.status })
  }

  return NextResponse.json(data)
}
