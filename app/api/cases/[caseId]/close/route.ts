import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

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
    .select('id, status')
    .eq('id', caseId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!complianceCase) {
    return NextResponse.json({ error: 'Compliance case not found', code: 'case_not_found' }, { status: 404 })
  }

  if (complianceCase.status === 'approved') {
    return NextResponse.json({ caseId, status: 'approved', alreadyClosed: true })
  }

  const { data: workflow } = await supabase
    .from('agent_workflows')
    .select('id, status, total_stages')
    .eq('case_id', caseId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!workflow || workflow.status !== 'completed') {
    return NextResponse.json({ error: 'The workflow is not completed', code: 'workflow_not_completed' }, { status: 409 })
  }

  const { data: finalStage } = await supabase
    .from('agent_workflow_stages')
    .select('id, run_id, status, stage_index')
    .eq('workflow_id', workflow.id)
    .eq('organization_id', organizationId)
    .order('stage_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!finalStage || finalStage.status !== 'approved' || !finalStage.run_id) {
    return NextResponse.json({ error: 'The final stage has not been approved', code: 'final_stage_not_approved' }, { status: 409 })
  }

  const { data: finalReview } = await supabase
    .from('agent_reviews')
    .select('id, decision')
    .eq('case_id', caseId)
    .eq('run_id', finalStage.run_id)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!finalReview || finalReview.decision !== 'approved') {
    return NextResponse.json({ error: 'The final review has not been approved', code: 'final_review_not_approved' }, { status: 409 })
  }

  const closedAt = new Date().toISOString()
  const { data: updatedCase, error: updateError } = await supabase
    .from('compliance_cases')
    .update({ status: 'approved', updated_at: closedAt })
    .eq('id', caseId)
    .eq('organization_id', organizationId)
    .select('id, status, updated_at')
    .single()

  if (updateError || !updatedCase) {
    return NextResponse.json({ error: 'Unable to close the case', code: 'case_close_failed' }, { status: 500 })
  }

  await supabase.from('compliance_case_events').insert({
    organization_id: organizationId,
    case_id: caseId,
    actor_id: user.id,
    event_type: 'case_closed',
    summary: 'Caso marcado como resuelto',
    changes: {
      workflow_id: workflow.id,
      final_stage_id: finalStage.id,
      final_review_id: finalReview.id,
      status: 'approved',
      closed_at: closedAt,
    },
  })

  return NextResponse.json({ case: updatedCase })
}
