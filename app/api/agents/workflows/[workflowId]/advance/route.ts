import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runAgent } from '@/lib/agents/openai-runtime'
import { getWorkflowStage, serializeWorkflowContext } from '@/lib/agents/orchestration'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(_req: NextRequest, context: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await context.params
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
    .select('id, case_id, status, current_stage, total_stages, input_payload, compliance_cases(title, description)')
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  if (['completed', 'cancelled'].includes(workflow.status)) return NextResponse.json({ error: `Workflow is ${workflow.status}` }, { status: 409 })

  const stageDefinition = getWorkflowStage(workflow.current_stage)
  if (!stageDefinition) return NextResponse.json({ error: 'Workflow stage definition not found' }, { status: 409 })

  const { data: stage } = await supabase
    .from('agent_workflow_stages')
    .select('*')
    .eq('workflow_id', workflow.id)
    .eq('stage_index', workflow.current_stage)
    .maybeSingle()

  if (!stage) return NextResponse.json({ error: 'Workflow stage not found' }, { status: 404 })
  if (stage.status === 'running') return NextResponse.json({ error: 'Stage is already running' }, { status: 409 })
  if (stage.attempt_count >= stage.max_attempts) return NextResponse.json({ error: 'Maximum retry count reached' }, { status: 409 })

  const { data: priorStages } = await supabase
    .from('agent_workflow_stages')
    .select('stage_index, status, output_artifact_id')
    .eq('workflow_id', workflow.id)
    .lt('stage_index', stage.stage_index)
    .order('stage_index', { ascending: true })

  const unmet = stageDefinition.dependsOn.filter((index) => {
    const dependency = priorStages?.find((item) => item.stage_index === index)
    return !dependency || !['pending_review', 'approved'].includes(dependency.status)
  })
  if (unmet.length) return NextResponse.json({ error: 'Workflow dependencies are not satisfied', unmet }, { status: 409 })

  const artifactIds = (priorStages || []).map((item) => item.output_artifact_id).filter(Boolean)
  const { data: artifacts } = artifactIds.length
    ? await supabase.from('agent_artifacts').select('id, artifact_type, title, content, status').in('id', artifactIds)
    : { data: [] as any[] }

  const caseRecord = Array.isArray(workflow.compliance_cases) ? workflow.compliance_cases[0] : workflow.compliance_cases
  const workflowContext = serializeWorkflowContext({
    caseTitle: caseRecord?.title || 'Caso de cumplimiento',
    caseDescription: caseRecord?.description || null,
    originalContext: workflow.input_payload,
    priorArtifacts: (artifacts || []).map((artifact) => ({
      agentId: artifact.artifact_type,
      title: artifact.title,
      content: artifact.content,
      status: artifact.status,
    })),
  })

  const attempt = stage.attempt_count + 1
  const startedAt = Date.now()
  await supabase.from('agent_workflow_stages').update({
    status: 'running',
    attempt_count: attempt,
    source_artifact_ids: artifactIds,
    context_snapshot: { ...stage.context_snapshot, artifactIds, attempt },
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', stage.id)
  await supabase.from('agent_workflows').update({
    status: 'running',
    started_at: workflow.status === 'draft' ? new Date().toISOString() : undefined,
    updated_at: new Date().toISOString(),
  }).eq('id', workflow.id)

  const { data: run, error: runError } = await supabase.from('agent_runs').insert({
    organization_id: organizationId,
    case_id: workflow.case_id,
    user_id: user.id,
    agent_id: stageDefinition.agentId,
    status: 'running',
    task: stageDefinition.task,
    context_text: workflowContext,
    input_payload: { workflowId: workflow.id, stageIndex: stageDefinition.index, attempt },
    started_at: new Date().toISOString(),
  }).select('id').single()

  if (runError || !run) {
    await supabase.from('agent_workflow_stages').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', stage.id)
    return NextResponse.json({ error: 'Unable to create stage run' }, { status: 500 })
  }

  await supabase.from('agent_workflow_stages').update({ run_id: run.id }).eq('id', stage.id)

  try {
    const result = await runAgent({
      agentId: stageDefinition.agentId,
      task: stageDefinition.task,
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
    }).eq('id', run.id)

    const { data: artifact, error: artifactError } = await supabase.from('agent_artifacts').insert({
      organization_id: organizationId,
      case_id: workflow.case_id,
      run_id: run.id,
      artifact_type: stageDefinition.agentId,
      title: `${stageDefinition.label}: ${caseRecord?.title || 'Caso'}`,
      content: result.output,
      source_refs: artifactIds,
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
    }).eq('id', stage.id)
    await supabase.from('agent_workflows').update({
      status: isFinal ? 'pending_review' : 'running',
      current_stage: isFinal ? stage.stage_index : nextStage,
      final_payload: isFinal ? result.output : null,
      completed_at: isFinal ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', workflow.id)

    return NextResponse.json({ workflowId: workflow.id, stageIndex: stage.stage_index, runId: run.id, artifactId: artifact.id, status: 'pending_review', isFinal, result, elapsedMs })
  } catch (error) {
    const elapsedMs = Date.now() - startedAt
    await supabase.from('agent_runs').update({
      status: 'failed',
      error_code: 'workflow_stage_failed',
      error_message: 'The workflow stage could not be completed',
      elapsed_ms: elapsedMs,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', run.id)
    await supabase.from('agent_workflow_stages').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', stage.id)
    await supabase.from('agent_workflows').update({ status: 'failed', error_code: 'workflow_stage_failed', error_message: 'A workflow stage failed', updated_at: new Date().toISOString() }).eq('id', workflow.id)
    console.error('[agents/workflows/advance]', error instanceof Error ? error.name : 'unknown')
    return NextResponse.json({ error: 'The workflow stage could not be completed', runId: run.id }, { status: 502 })
  }
}
