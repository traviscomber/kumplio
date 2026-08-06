import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getWorkflowDefinition, getWorkflowTemplates, type WorkflowType } from '@/lib/agents/orchestration'

export const runtime = 'nodejs'

const workflowTypeSchema = z.enum(['compliance_assessment', 'contract_review', 'control_assessment'])
const createSchema = z.object({
  caseId: z.string().uuid(),
  workflowType: workflowTypeSchema.default('compliance_assessment'),
  instructions: z.string().trim().max(2000).nullable().optional(),
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

export async function GET(request: NextRequest) {
  const { supabase, user, organizationId } = await getIdentity()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!organizationId) return NextResponse.json({ error: 'Organization required' }, { status: 403 })
  const caseId = request.nextUrl.searchParams.get('caseId')
  if (caseId && !z.string().uuid().safeParse(caseId).success) {
    return NextResponse.json({ error: 'Invalid case id', code: 'invalid_case_id' }, { status: 400 })
  }
  let query = supabase
    .from('agent_workflows')
    .select('id, case_id, workflow_type, status, current_stage, total_stages, created_at, updated_at, compliance_cases(title)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (caseId) query = query.eq('case_id', caseId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Unable to list workflows' }, { status: 500 })
  return NextResponse.json({ workflows: data || [], templates: getWorkflowTemplates() })
}

export async function POST(req: NextRequest) {
  const { supabase, user, organizationId } = await getIdentity()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!organizationId) return NextResponse.json({ error: 'Organization required' }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON request' }, { status: 400 }) }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid workflow request', details: parsed.error.flatten() }, { status: 400 })

  const definition = getWorkflowDefinition(parsed.data.workflowType)
  if (!definition) return NextResponse.json({ error: 'Workflow template not found', code: 'workflow_template_not_found' }, { status: 404 })

  const { data: complianceCase } = await supabase
    .from('compliance_cases')
    .select('id, title, project_id')
    .eq('id', parsed.data.caseId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (!complianceCase) return NextResponse.json({ error: 'Compliance case not found' }, { status: 404 })

  const { data: existingWorkflow } = await supabase
    .from('agent_workflows')
    .select('id, case_id, workflow_type, status, current_stage, total_stages, created_at')
    .eq('organization_id', organizationId)
    .eq('case_id', parsed.data.caseId)
    .eq('workflow_type', parsed.data.workflowType)
    .in('status', ['draft', 'running', 'paused', 'pending_review', 'failed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingWorkflow) {
    return NextResponse.json({ workflow: existingWorkflow, resumed: true, code: 'existing_workflow_resumed' }, { status: 200 })
  }

  const { data: links, error: linksError } = await supabase
    .from('compliance_case_resource_links')
    .select('id, resource_type, resource_id, created_at')
    .eq('organization_id', organizationId)
    .eq('case_id', parsed.data.caseId)
    .order('created_at', { ascending: true })
    .limit(1000)
  if (linksError) return NextResponse.json({ error: 'Unable to read case resources', code: 'case_context_unavailable' }, { status: 500 })

  const resourceCounts = (links || []).reduce<Record<string, number>>((counts, link) => {
    counts[link.resource_type] = (counts[link.resource_type] || 0) + 1
    return counts
  }, {})
  const inputPayload = {
    createdFrom: 'case',
    userInstructions: parsed.data.instructions || null,
    caseTitle: complianceCase.title,
    projectId: complianceCase.project_id,
    resourceManifest: {
      total: links?.length || 0,
      counts: resourceCounts,
      links: (links || []).map((link) => ({ linkId: link.id, resourceType: link.resource_type, resourceId: link.resource_id })),
    },
  }
  const stages = definition.stages.map((stage) => ({ index: stage.index, agentId: stage.agentId, label: stage.label, task: stage.task, dependsOn: stage.dependsOn }))

  try {
    const admin = createAdminClient()
    const { data: workflowId, error } = await admin.rpc('create_case_workflow_record', {
      p_actor_id: user.id,
      p_organization_id: organizationId,
      p_case_id: parsed.data.caseId,
      p_workflow_type: parsed.data.workflowType as WorkflowType,
      p_input_payload: inputPayload,
      p_stages: stages,
    })
    if (error || !workflowId) {
      if (error?.code === '23505') return NextResponse.json({ error: 'An active workflow already exists', code: 'active_workflow_exists' }, { status: 409 })
      console.error('[agents/workflows/create]', error?.code)
      return NextResponse.json({ error: 'Unable to create workflow' }, { status: 500 })
    }
    return NextResponse.json({
      workflow: { id: workflowId, case_id: parsed.data.caseId, workflow_type: definition.type, status: 'draft', current_stage: 0, total_stages: definition.stages.length },
      template: { type: definition.type, label: definition.label, description: definition.description, stages },
      resourceManifest: inputPayload.resourceManifest,
      resumed: false,
    }, { status: 201 })
  } catch (error) {
    console.error('[agents/workflows/configuration]', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Workflow service is not configured', code: 'workflow_service_unavailable' }, { status: 503 })
  }
}
