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
  context: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await context.params
  if (!z.string().uuid().safeParse(caseId).success) {
    return NextResponse.json({ error: 'Invalid case id', code: 'invalid_case_id' }, { status: 400 })
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
  const { data: complianceCase } = await supabase
    .from('compliance_cases')
    .select('id')
    .eq('id', caseId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!complianceCase) {
    return NextResponse.json({ error: 'Compliance case not found', code: 'case_not_found' }, { status: 404 })
  }

  const { data: workflow } = await supabase
    .from('agent_workflows')
    .select('id')
    .eq('case_id', caseId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!workflow) {
    return NextResponse.json({ error: 'The workflow is not completed', code: 'workflow_not_completed' }, { status: 409 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('close_compliance_case_record', {
    p_actor_id: user.id,
    p_organization_id: organizationId,
    p_case_id: caseId,
    p_workflow_id: workflow.id,
  })

  if (error || !data) {
    const mapped = closeError(error)
    console.error('[cases/close]', error?.code || mapped.code)
    return NextResponse.json({ error: mapped.error, code: mapped.code }, { status: mapped.status })
  }

  return NextResponse.json(data)
}
