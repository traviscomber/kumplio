import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { COMPLIANCE_ASSESSMENT_WORKFLOW } from '@/lib/agents/orchestration'

export const runtime = 'nodejs'

const createSchema = z.object({
  caseId: z.string().uuid(),
  context: z.unknown().optional(),
})

async function getIdentity() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, organizationId: null }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  return { supabase, user, organizationId: membership?.organization_id || null }
}

export async function GET() {
  const { supabase, user, organizationId } = await getIdentity()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!organizationId) return NextResponse.json({ error: 'Organization required' }, { status: 403 })

  const { data, error } = await supabase
    .from('agent_workflows')
    .select('id, case_id, workflow_type, status, current_stage, total_stages, created_at, updated_at, compliance_cases(title)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: 'Unable to list workflows' }, { status: 500 })
  return NextResponse.json({ workflows: data || [] })
}

export async function POST(req: NextRequest) {
  const { supabase, user, organizationId } = await getIdentity()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!organizationId) return NextResponse.json({ error: 'Organization required' }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON request' }, { status: 400 }) }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid workflow request', details: parsed.error.flatten() }, { status: 400 })

  const { data: complianceCase } = await supabase
    .from('compliance_cases')
    .select('id, title')
    .eq('id', parsed.data.caseId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!complianceCase) return NextResponse.json({ error: 'Compliance case not found' }, { status: 404 })

  const { data: workflow, error: workflowError } = await supabase
    .from('agent_workflows')
    .insert({
      organization_id: organizationId,
      case_id: parsed.data.caseId,
      created_by: user.id,
      workflow_type: 'compliance_assessment',
      status: 'draft',
      current_stage: 0,
      total_stages: COMPLIANCE_ASSESSMENT_WORKFLOW.length,
      input_payload: { context: parsed.data.context ?? null },
    })
    .select('id, case_id, status, current_stage, total_stages')
    .single()

  if (workflowError || !workflow) return NextResponse.json({ error: 'Unable to create workflow' }, { status: 500 })

  const stages = COMPLIANCE_ASSESSMENT_WORKFLOW.map((stage) => ({
    workflow_id: workflow.id,
    organization_id: organizationId,
    stage_index: stage.index,
    agent_id: stage.agentId,
    status: 'queued',
    task_template: stage.task,
    context_snapshot: { dependsOn: stage.dependsOn, label: stage.label },
  }))

  const { error: stagesError } = await supabase.from('agent_workflow_stages').insert(stages)
  if (stagesError) {
    await supabase.from('agent_workflows').update({ status: 'failed', error_code: 'stage_creation_failed' }).eq('id', workflow.id)
    return NextResponse.json({ error: 'Unable to initialize workflow stages' }, { status: 500 })
  }

  return NextResponse.json({ workflow, stages: COMPLIANCE_ASSESSMENT_WORKFLOW }, { status: 201 })
}
