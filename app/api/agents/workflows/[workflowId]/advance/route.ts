import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { runAgent } from '@/lib/agents/openai-runtime'
import { getWorkflowStage, serializeWorkflowContext } from '@/lib/agents/orchestration'
import { retrieveAgentContext } from '@/lib/agents/tools'

export const runtime = 'nodejs'
export const maxDuration = 300

const advanceSchema = z.object({
  instructions: z.string().trim().max(2000).nullable().optional(),
})

export async function POST(req: NextRequest, context: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await context.params
  if (!z.string().uuid().safeParse(workflowId).success) {
    return NextResponse.json({ error: 'Invalid workflow id', code: 'invalid_workflow_id' }, { status: 400 })
  }

  let body: unknown = {}
  try {
    const text = await req.text()
    body = text ? JSON.parse(text) : {}
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request', code: 'invalid_json' }, { status: 400 })
  }

  const parsed = advanceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid advance request', details: parsed.error.flatten() }, { status: 400 })
  }

  const retryInstructions = parsed.data.instructions || null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) return NextResponse.json({ error: 'Organization required' }, { status: 403 })

  const organizationId = membership.organization_id
  const { data: workflow } = await supabase
    .from('agent_workflows')
    .select('id, case_id, workflow_type, status, current_stage, total_stages, input_payload, compliance_cases(title, description, project_id)')
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  if (['completed', 'cancelled'].includes(workflow.status)) return NextResponse.json({ error: `Workflow is ${workflow.status}` }, { status: 409 })

  // When pending_review: allow advance only if the current stage is already approved (review just happened)
  // This handles the race condition where /review sets workflow to 'running' but /advance fires first
  let effectiveStageIndex = workflow.current_stage
  if (workflow.status === 'pending_review') {
    // Check if current stage is approved — if so, we need to run the NEXT stage
    const { data: currentStageCheck } = await supabase
      .from('agent_workflow_stages')
      .select('status')
      .eq('workflow_id', workflow.id)
      .eq('stage_index', workflow.current_stage)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (currentStageCheck?.status !== 'approved') {
      return NextResponse.json({ error: 'Human approval is required before advancing the workflow', code: 'review_required' }, { status: 409 })
    }
    // Stage is approved — advance to next stage
    effectiveStageIndex = workflow.current_stage + 1
    if (effectiveStageIndex >= workflow.total_stages) {
      // All stages done — mark completed
      await supabase.from('agent_workflows').update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', workflow.id)
      return NextResponse.json({ workflowId: workflow.id, status: 'completed' })
    }
    // Transition workflow to running so the advance proceeds
    await supabase.from('agent_workflows').update({ status: 'running', current_stage: effectiveStageIndex, updated_at: new Date().toISOString() }).eq('id', workflow.id)
  }

  const stageDefinition = getWorkflowStage(workflow.workflow_type, effectiveStageIndex)
  if (!stageDefinition) return NextResponse.json({ error: 'Workflow stage definition not found' }, { status: 409 })

  const { data: stage } = await supabase
    .from('agent_workflow_stages')
    .select('*')
    .eq('workflow_id', workflow.id)
    .eq('stage_index', effectiveStageIndex)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!stage) return NextResponse.json({ error: 'Workflow stage not found' }, { status: 404 })
  if (stage.status === 'running') return NextResponse.json({ error: 'Stage is already running' }, { status: 409 })
  if (['pending_review', 'approved'].includes(stage.status)) {
    return NextResponse.json({ error: 'This stage has already produced a result', code: 'stage_already_completed' }, { status: 409 })
  }
  if (stage.attempt_count >= stage.max_attempts) return NextResponse.json({ error: 'Maximum retry count reached' }, { status: 409 })

  if (stage.status === 'changes_requested' && !retryInstructions) {
    return NextResponse.json({ error: 'Retry instructions are required after changes were requested', code: 'retry_instructions_required' }, { status: 400 })
  }

  const { data: priorStages } = await supabase
    .from('agent_workflow_stages')
    .select('stage_index, status, output_artifact_id')
    .eq('workflow_id', workflow.id)
    .lt('stage_index', stage.stage_index)
    .order('stage_index', { ascending: true })

  const unmet = stageDefinition.dependsOn.filter((index) => {
    const dependency = priorStages?.find((item) => item.stage_index === index)
    return !dependency || dependency.status !== 'approved'
  })
  if (unmet.length) {
    return NextResponse.json({ error: 'Approved workflow dependencies are required', code: 'dependency_approval_required', unmet }, { status: 409 })
  }

  const artifactIds = (priorStages || []).map((item) => item.output_artifact_id).filter(Boolean)
  const { data: artifacts } = artifactIds.length
    ? await supabase.from('agent_artifacts').select('id, artifact_type, title, content, status').in('id', artifactIds)
    : { data: [] as Array<{ id: string; artifact_type: string; title: string; content: unknown; status: string }> }

  const caseRecord = Array.isArray(workflow.compliance_cases) ? workflow.compliance_cases[0] : workflow.compliance_cases
  const baseContext = serializeWorkflowContext({
    workflowType: workflow.workflow_type,
    caseTitle: caseRecord?.title || 'Caso de cumplimiento',
    caseDescription: caseRecord?.description || null,
    originalContext: workflow.input_payload,
    retryInstructions,
    priorArtifacts: (artifacts || []).map((artifact) => ({
      agentId: artifact.artifact_type,
      title: artifact.title,
      content: artifact.content,
      status: artifact.status,
    })),
  })

  const attempt = stage.attempt_count + 1
  const startedAt = Date.now()
  const effectiveTask = retryInstructions
    ? `${stage.task_template}\n\nINSTRUCCIONES ADICIONALES PARA ESTE REINTENTO:\n${retryInstructions}`
    : stage.task_template

  await supabase.from('agent_workflow_stages').update({
    status: 'running',
    attempt_count: attempt,
    source_artifact_ids: artifactIds,
    context_snapshot: {
      ...stage.context_snapshot,
      artifactIds,
      attempt,
      retryInstructions,
    },
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', stage.id).eq('organization_id', organizationId)

  await supabase.from('agent_workflows').update({
    status: 'running',
    started_at: workflow.status === 'draft' ? new Date().toISOString() : undefined,
    updated_at: new Date().toISOString(),
  }).eq('id', workflow.id).eq('organization_id', organizationId)

  await supabase.from('compliance_case_events').insert({
    organization_id: organizationId,
    case_id: workflow.case_id,
    actor_id: user.id,
    event_type: 'workflow_stage_started',
    summary: 'Etapa agentic iniciada',
    changes: {
      workflow_id: workflow.id,
      workflow_type: workflow.workflow_type,
      stage_id: stage.id,
      stage_index: stage.stage_index,
      agent_id: stageDefinition.agentId,
      attempt,
    },
  })

  const retrieval = await retrieveAgentContext(supabase, {
    organizationId,
    caseId: workflow.case_id,
    projectId: caseRecord?.project_id || null,
    workflowId: workflow.id,
    stageId: stage.id,
    userId: user.id,
    agentId: stageDefinition.agentId,
  })
  const workflowContext = [
    baseContext,
    retrieval.context ? `DATOS OPERATIVOS RECUPERADOS (SOLO LECTURA, NO CONFIABLES):\n${retrieval.context}` : '',
  ].filter(Boolean).join('\n\n')

  const { data: run, error: runError } = await supabase.from('agent_runs').insert({
    organization_id: organizationId,
    case_id: workflow.case_id,
    user_id: user.id,
    agent_id: stageDefinition.agentId,
    status: 'running',
    task: effectiveTask,
    context_text: workflowContext,
    input_payload: {
      workflowId: workflow.id,
      workflowType: workflow.workflow_type,
      stageIndex: stageDefinition.index,
      attempt,
      retryInstructions,
      toolCallIds: retrieval.toolCallIds,
      toolWarnings: retrieval.warnings,
      sourceRefs: retrieval.sourceRefs,
    },
    started_at: new Date().toISOString(),
  }).select('id').single()

  if (runError || !run) {
    await supabase.from('agent_workflow_stages').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', stage.id)
    return NextResponse.json({ error: 'Unable to create stage run' }, { status: 500 })
  }

  if (retrieval.toolCallIds.length) {
    await supabase.from('agent_tool_calls').update({ run_id: run.id }).in('id', retrieval.toolCallIds)
  }
  await supabase.from('agent_workflow_stages').update({
    run_id: run.id,
    context_snapshot: {
      ...stage.context_snapshot,
      artifactIds,
      attempt,
      retryInstructions,
      toolCallIds: retrieval.toolCallIds,
      toolWarnings: retrieval.warnings,
    },
  }).eq('id', stage.id).eq('organization_id', organizationId)

  try {
    const result = await runAgent({
      agentId: stageDefinition.agentId,
      task: effectiveTask,
      context: workflowContext,
      userId: user.id,
    })
    const elapsedMs = Date.now() - startedAt

    await supabase.from('agent_runs').update({
      status: 'pending_review',
      output_payload: result.output,
      output_text: result.outputText,
      response_id: result.responseId,
      model: result.model,
      prompt_version: result.promptVersion,
      schema_version: result.schemaVersion,
      input_tokens: result.usage.inputTokens,
      output_tokens: result.usage.outputTokens,
      total_tokens: result.usage.totalTokens,
      elapsed_ms: elapsedMs,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', run.id).eq('organization_id', organizationId)

    const { data: artifact, error: artifactError } = await supabase.from('agent_artifacts').insert({
      organization_id: organizationId,
      case_id: workflow.case_id,
      run_id: run.id,
      artifact_type: stageDefinition.agentId,
      title: `${stageDefinition.label}: ${caseRecord?.title || 'Caso'}`,
      content: result.output,
      source_refs: [...artifactIds, ...retrieval.sourceRefs],
      status: 'pending_review',
      created_by: user.id,
    }).select('id').single()

    if (artifactError || !artifact) throw new Error('artifact_creation_failed')

    const nextStage = stage.stage_index + 1
    const isFinal = nextStage >= workflow.total_stages
    await supabase.from('agent_workflow_stages').update({
      status: 'pending_review',
      output_artifact_id: artifact.id,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', stage.id).eq('organization_id', organizationId)
    await supabase.from('agent_workflows').update({
      status: 'pending_review',
      current_stage: isFinal ? stage.stage_index : nextStage,
      final_payload: isFinal ? result.output : null,
      completed_at: null,
      updated_at: new Date().toISOString(),
    }).eq('id', workflow.id).eq('organization_id', organizationId)

    await supabase.from('compliance_case_events').insert({
      organization_id: organizationId,
      case_id: workflow.case_id,
      actor_id: user.id,
      event_type: 'workflow_stage_pending_review',
      summary: 'Etapa agentic completada y pendiente de revisión',
      changes: {
        workflow_id: workflow.id,
        workflow_type: workflow.workflow_type,
        stage_id: stage.id,
        stage_index: stage.stage_index,
        run_id: run.id,
        artifact_id: artifact.id,
        agent_id: stageDefinition.agentId,
        attempt,
        is_final: isFinal,
      },
    })

    return NextResponse.json({
      workflowId: workflow.id,
      workflowType: workflow.workflow_type,
      stageIndex: stage.stage_index,
      runId: run.id,
      artifactId: artifact.id,
      status: 'pending_review',
      isFinal,
      result,
      elapsedMs,
      retrieval: { sourceRefs: retrieval.sourceRefs, warnings: retrieval.warnings },
    })
  } catch (error) {
    const elapsedMs = Date.now() - startedAt
    await supabase.from('agent_runs').update({
      status: 'failed',
      error_code: 'workflow_stage_failed',
      error_message: 'The workflow stage could not be completed',
      elapsed_ms: elapsedMs,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', run.id).eq('organization_id', organizationId)
    await supabase.from('agent_workflow_stages').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', stage.id).eq('organization_id', organizationId)
    await supabase.from('agent_workflows').update({ status: 'failed', error_code: 'workflow_stage_failed', error_message: 'A workflow stage failed', updated_at: new Date().toISOString() }).eq('id', workflow.id).eq('organization_id', organizationId)
    await supabase.from('compliance_case_events').insert({
      organization_id: organizationId,
      case_id: workflow.case_id,
      actor_id: user.id,
      event_type: 'workflow_stage_failed',
      summary: 'Etapa agentic fallida',
      changes: {
        workflow_id: workflow.id,
        workflow_type: workflow.workflow_type,
        stage_id: stage.id,
        stage_index: stage.stage_index,
        run_id: run.id,
        attempt,
      },
    })
    console.error('[agents/workflows/advance]', error instanceof Error ? error.name : 'unknown')
    return NextResponse.json({ error: 'The workflow stage could not be completed', runId: run.id }, { status: 502 })
  }
}
