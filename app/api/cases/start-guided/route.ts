import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { buildOrchestrationPlan, workflowTypeForIntent } from '@/lib/agents/orchestrator'
import { getWorkflowDefinition } from '@/lib/agents/orchestration'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const startGuidedSchema = z.object({
  goal: z.string().trim().min(8).max(2000),
  audience: z.enum(['person', 'company', 'professional', 'industry']).default('company'),
  idempotencyKey: z.string().uuid(),
  projectId: z.string().uuid().nullable().optional(),
})

type GuidedStartResult = {
  caseId?: string
  workflowId?: string
  caseCreated?: boolean
  workflowCreated?: boolean
  resumed?: boolean
}

export async function POST(req: NextRequest) {
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

  const parsed = startGuidedSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid guided case request', code: 'invalid_request', details: parsed.error.flatten() },
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

  const organizationId = String(membership.organization_id)
  const plan = buildOrchestrationPlan({
    goal: parsed.data.goal,
    audience: parsed.data.audience,
  })
  const workflowType = workflowTypeForIntent(plan.intent)
  const definition = getWorkflowDefinition(workflowType)

  if (!definition) {
    return NextResponse.json({ error: 'Workflow template not found', code: 'workflow_template_not_found' }, { status: 404 })
  }

  const projectId = parsed.data.projectId || null
  if (projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (!project) {
      return NextResponse.json({ error: 'Project not found', code: 'project_not_found' }, { status: 404 })
    }
  }

  const stages = definition.stages.map((stage) => ({
    index: stage.index,
    agentId: stage.agentId,
    label: stage.label,
    task: stage.task,
    dependsOn: stage.dependsOn,
  }))

  const description = [
    `Objetivo declarado: ${plan.goal}`,
    `Audiencia: ${plan.audience}`,
    `Intención interpretada: ${plan.intent}`,
    'Ruta guiada: protección de datos → obligaciones → riesgos → brechas → plan → revisión humana.',
  ].join('\n')

  const inputPayload = {
    createdFrom: 'guided_resolution',
    userInstructions: plan.goal,
    audience: plan.audience,
    intent: plan.intent,
    missingContext: plan.missingContext,
    caseTitle: plan.goal.slice(0, 160),
    projectId,
    privacyFocus: true,
    resourceManifest: { total: 0, counts: {}, links: [] },
  }

  const { data, error } = await supabase.rpc('start_guided_case_record', {
    p_actor_id: user.id,
    p_organization_id: organizationId,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_title: plan.goal.slice(0, 160),
    p_description: description,
    p_priority: 'medium',
    p_project_id: projectId,
    p_workflow_type: workflowType,
    p_input_payload: inputPayload,
    p_stages: stages,
  })

  if (error) {
    console.error('[cases/start-guided]', error.code)
    const status = error.code === '42501' ? 403 : error.code === '23503' ? 404 : error.code === '22023' ? 400 : 500
    const code = error.code === '42501'
      ? 'workspace_forbidden'
      : error.code === '23503'
        ? 'project_not_found'
        : error.code === '22023'
          ? 'invalid_guided_start'
          : 'guided_start_failed'
    return NextResponse.json({ error: 'No fue posible preparar el caso guiado', code }, { status })
  }

  const result = (data || {}) as GuidedStartResult
  if (!result.caseId || !result.workflowId) {
    return NextResponse.json({ error: 'Guided case bootstrap returned an incomplete result', code: 'guided_start_incomplete' }, { status: 500 })
  }

  return NextResponse.json({
    caseId: result.caseId,
    workflowId: result.workflowId,
    resumed: Boolean(result.resumed),
    plan: {
      intent: plan.intent,
      audience: plan.audience,
      workflowType,
      totalStages: definition.stages.length,
    },
  }, { status: result.resumed ? 200 : 201 })
}
