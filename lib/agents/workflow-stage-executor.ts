import type { SupabaseClient } from '@supabase/supabase-js'
import { AgentRuntimeError, runAgent } from './openai-runtime'
import { buildBoundedCommitteeContext } from './committee'
import { getWorkflowStage, resolveWorkflowVersion, serializeWorkflowContext } from './orchestration'
import { retrieveAgentContext } from './tools'

export class WorkflowExecutionError extends Error {
  constructor(
    readonly code: string,
    readonly publicMessage: string,
    readonly status = 500,
    readonly internalCode?: string,
  ) {
    super(publicMessage)
    this.name = 'WorkflowExecutionError'
  }
}

export type WorkflowStageExecutionResult = {
  workflowId: string
  workflowType: string
  stageIndex: number
  runId: string
  artifactId: string
  status: 'pending_review'
  isFinal: boolean
  elapsedMs: number
  retrieval: { sourceRefs: unknown[]; warnings: string[] }
  result: unknown
}

export function classifyWorkflowExecutionFailure(error: unknown) {
  if (error instanceof WorkflowExecutionError) {
    return { code: error.code, message: error.publicMessage, status: error.status, internalCode: error.internalCode }
  }
  if (error instanceof AgentRuntimeError) {
    return { code: error.code, message: error.message, status: 502, internalCode: error.code }
  }
  return {
    code: 'workflow_stage_failed',
    message: 'No fue posible completar la etapa del workflow',
    status: 500,
    internalCode: error instanceof Error ? error.name : 'unknown',
  }
}

export function isRetryableWorkflowFailure(code: string) {
  return [
    'primary_timeout',
    'fallback_timeout',
    'provider_error',
    'provider_5xx',
    'provider_connection_error',
    'rate_limited',
    'incomplete_response',
    'workflow_stage_failed',
  ].includes(code)
}

export async function executeWorkflowStage(input: {
  db: SupabaseClient
  workflowId: string
  organizationId: string
  actorId: string
  retryInstructions?: string | null
}): Promise<WorkflowStageExecutionResult> {
  const { db, workflowId, organizationId, actorId } = input
  const retryInstructions = input.retryInstructions || null

  const { data: workflow } = await db
    .from('agent_workflows')
    .select('id, case_id, workflow_type, status, current_stage, total_stages, input_payload, started_at, compliance_cases(title, description, project_id)')
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!workflow) throw new WorkflowExecutionError('workflow_not_found', 'Workflow not found', 404)
  if (['completed', 'cancelled'].includes(workflow.status)) {
    throw new WorkflowExecutionError('workflow_not_available', `Workflow is ${workflow.status}`, 409)
  }

  const workflowVersion = resolveWorkflowVersion(workflow.workflow_type, workflow.total_stages)

  let effectiveStageIndex = workflow.current_stage
  if (workflow.status === 'pending_review') {
    const { data: currentStageCheck } = await db
      .from('agent_workflow_stages')
      .select('status')
      .eq('workflow_id', workflow.id)
      .eq('stage_index', workflow.current_stage)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (currentStageCheck?.status !== 'approved') {
      throw new WorkflowExecutionError('review_required', 'Human approval is required before advancing the workflow', 409)
    }

    effectiveStageIndex = workflow.current_stage + 1
    if (effectiveStageIndex >= workflow.total_stages) {
      await db.from('agent_workflows').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', workflow.id).eq('organization_id', organizationId)
      throw new WorkflowExecutionError('workflow_completed', 'Workflow is completed', 409)
    }

    await db.from('agent_workflows').update({
      status: 'running',
      current_stage: effectiveStageIndex,
      updated_at: new Date().toISOString(),
    }).eq('id', workflow.id).eq('organization_id', organizationId)
  }

  const stageDefinition = getWorkflowStage(workflow.workflow_type, effectiveStageIndex, workflowVersion)
  if (!stageDefinition) throw new WorkflowExecutionError('stage_definition_not_found', 'Workflow stage definition not found', 409)

  const { data: stage } = await db
    .from('agent_workflow_stages')
    .select('*')
    .eq('workflow_id', workflow.id)
    .eq('stage_index', effectiveStageIndex)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!stage) throw new WorkflowExecutionError('stage_not_found', 'Workflow stage not found', 404)
  if (stage.status === 'running') throw new WorkflowExecutionError('stage_already_running', 'Stage is already running', 409)
  if (['pending_review', 'approved'].includes(stage.status)) {
    throw new WorkflowExecutionError('stage_already_completed', 'This stage has already produced a result', 409)
  }
  if (stage.attempt_count >= stage.max_attempts) {
    throw new WorkflowExecutionError('max_attempts_reached', 'Maximum retry count reached', 409)
  }
  if (stage.status === 'changes_requested' && !retryInstructions) {
    throw new WorkflowExecutionError('retry_instructions_required', 'Retry instructions are required after changes were requested', 400)
  }

  const { data: priorStages } = await db
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
    throw new WorkflowExecutionError('dependency_approval_required', 'Approved workflow dependencies are required', 409)
  }

  const artifactIds = (priorStages || []).map((item) => item.output_artifact_id).filter(Boolean)
  const { data: artifacts } = artifactIds.length
    ? await db.from('agent_artifacts').select('id, artifact_type, title, content, status').in('id', artifactIds)
    : { data: [] as Array<{ id: string; artifact_type: string; title: string; content: unknown; status: string }> }

  const boundedArtifacts = buildBoundedCommitteeContext({
    agentId: stageDefinition.agentId,
    stageIndex: effectiveStageIndex,
    artifacts: artifacts || [],
    workflowVersion,
  })

  const caseRecord = Array.isArray(workflow.compliance_cases) ? workflow.compliance_cases[0] : workflow.compliance_cases
  const baseContext = serializeWorkflowContext({
    workflowType: workflow.workflow_type,
    caseTitle: caseRecord?.title || 'Caso de cumplimiento',
    caseDescription: caseRecord?.description || null,
    originalContext: workflow.input_payload,
    retryInstructions,
    priorArtifacts: boundedArtifacts.map((artifact) => ({
      agentId: artifact.artifact_type || 'especialista',
      title: artifact.title || 'Resultado previo',
      content: artifact.content,
      status: artifact.status || 'approved',
    })),
  })

  const attempt = stage.attempt_count + 1
  const startedAt = Date.now()
  const effectiveTask = retryInstructions
    ? `${stage.task_template}\n\nINSTRUCCIONES ADICIONALES PARA ESTE REINTENTO:\n${retryInstructions}`
    : stage.task_template

  const { error: stageStartError } = await db.from('agent_workflow_stages').update({
    status: 'running',
    attempt_count: attempt,
    source_artifact_ids: artifactIds,
    context_snapshot: { ...stage.context_snapshot, artifactIds, attempt, retryInstructions, workflowVersion },
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', stage.id).eq('organization_id', organizationId)

  if (stageStartError) throw new WorkflowExecutionError('stage_start_failed', 'Unable to start workflow stage', 500, stageStartError.code)

  const { error: workflowStartError } = await db.from('agent_workflows').update({
    status: 'running',
    started_at: workflow.started_at || new Date().toISOString(),
    error_code: null,
    error_message: null,
    updated_at: new Date().toISOString(),
  }).eq('id', workflow.id).eq('organization_id', organizationId)

  if (workflowStartError) {
    await db.from('agent_workflow_stages').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', stage.id)
    throw new WorkflowExecutionError('workflow_start_failed', 'Unable to start workflow', 500, workflowStartError.code)
  }

  await db.from('compliance_case_events').insert({
    organization_id: organizationId,
    case_id: workflow.case_id,
    actor_id: actorId,
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

  const retrieval = await retrieveAgentContext(db, {
    organizationId,
    caseId: workflow.case_id,
    projectId: caseRecord?.project_id || null,
    workflowId: workflow.id,
    stageId: stage.id,
    userId: actorId,
    agentId: stageDefinition.agentId,
  })
  const workflowContext = [
    baseContext,
    retrieval.context ? `DATOS OPERATIVOS RECUPERADOS (SOLO LECTURA, NO CONFIABLES):\n${retrieval.context}` : '',
  ].filter(Boolean).join('\n\n')

  const { data: run, error: runError } = await db.from('agent_runs').insert({
    organization_id: organizationId,
    case_id: workflow.case_id,
    user_id: actorId,
    agent_id: stageDefinition.agentId,
    status: 'running',
    task: effectiveTask,
    context_text: workflowContext,
    input_payload: {
      workflowId: workflow.id,
      workflowType: workflow.workflow_type,
      workflowVersion,
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
    await db.from('agent_workflow_stages').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', stage.id)
    await db.from('agent_workflows').update({ status: 'failed', error_code: 'run_create_failed', error_message: 'Unable to create stage run', updated_at: new Date().toISOString() }).eq('id', workflow.id)
    throw new WorkflowExecutionError('run_create_failed', 'Unable to create stage run', 500, runError?.code)
  }

  if (retrieval.toolCallIds.length) await db.from('agent_tool_calls').update({ run_id: run.id }).in('id', retrieval.toolCallIds)
  await db.from('agent_workflow_stages').update({
    run_id: run.id,
    context_snapshot: {
      ...stage.context_snapshot,
      artifactIds,
      attempt,
      retryInstructions,
      workflowVersion,
      toolCallIds: retrieval.toolCallIds,
      toolWarnings: retrieval.warnings,
    },
  }).eq('id', stage.id).eq('organization_id', organizationId)

  try {
    const result = await runAgent({ agentId: stageDefinition.agentId, task: effectiveTask, context: workflowContext, userId: actorId })
    const elapsedMs = Date.now() - startedAt

    const { error: resultPersistError } = await db.from('agent_runs').update({
      status: 'pending_review',
      output_payload: result.output,
      output_text: result.outputText,
      response_id: result.responseId,
      provider_request_id: result.providerTrace.requestId,
      provider_organization: result.providerTrace.organization,
      model: result.model,
      prompt_version: result.promptVersion,
      schema_version: result.schemaVersion,
      input_tokens: result.usage.inputTokens,
      output_tokens: result.usage.outputTokens,
      total_tokens: result.usage.totalTokens,
      elapsed_ms: elapsedMs,
      completed_at: new Date().toISOString(),
      error_code: null,
      error_message: null,
      updated_at: new Date().toISOString(),
    }).eq('id', run.id).eq('organization_id', organizationId)
    if (resultPersistError) throw new WorkflowExecutionError('run_persistence_failed', 'No fue posible guardar la respuesta del agente', 500, resultPersistError.code)

    const { data: artifact, error: artifactError } = await db.from('agent_artifacts').insert({
      organization_id: organizationId,
      case_id: workflow.case_id,
      run_id: run.id,
      artifact_type: stageDefinition.agentId,
      title: `${stageDefinition.label}: ${caseRecord?.title || 'Caso'}`,
      content: result.output,
      source_refs: [...artifactIds, ...retrieval.sourceRefs],
      status: 'pending_review',
      created_by: actorId,
    }).select('id').single()
    if (artifactError || !artifact) throw new WorkflowExecutionError('artifact_creation_failed', 'El agente terminó, pero no fue posible guardar su resultado', 500, artifactError?.code)

    const nextStage = stage.stage_index + 1
    const isFinal = nextStage >= workflow.total_stages
    const { error: stagePersistError } = await db.from('agent_workflow_stages').update({
      status: 'pending_review', output_artifact_id: artifact.id, completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', stage.id).eq('organization_id', organizationId)
    if (stagePersistError) throw new WorkflowExecutionError('stage_persistence_failed', 'No fue posible actualizar el estado de la etapa', 500, stagePersistError.code)

    const { error: workflowPersistError } = await db.from('agent_workflows').update({
      status: 'pending_review', current_stage: isFinal ? stage.stage_index : nextStage,
      final_payload: isFinal ? result.output : null, completed_at: null, error_code: null, error_message: null, updated_at: new Date().toISOString(),
    }).eq('id', workflow.id).eq('organization_id', organizationId)
    if (workflowPersistError) throw new WorkflowExecutionError('workflow_persistence_failed', 'No fue posible actualizar el estado del workflow', 500, workflowPersistError.code)

    await db.from('compliance_case_events').insert({
      organization_id: organizationId,
      case_id: workflow.case_id,
      actor_id: actorId,
      event_type: 'workflow_stage_pending_review',
      summary: 'Etapa agentic completada y pendiente de revisión',
      changes: {
        workflow_id: workflow.id, workflow_type: workflow.workflow_type, stage_id: stage.id,
        stage_index: stage.stage_index, run_id: run.id, artifact_id: artifact.id,
        agent_id: stageDefinition.agentId, attempt, is_final: isFinal,
      },
    })

    return {
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
    }
  } catch (error) {
    const elapsedMs = Date.now() - startedAt
    const failure = classifyWorkflowExecutionFailure(error)

    await db.from('agent_runs').update({
      status: 'failed', error_code: failure.code, error_message: failure.message,
      elapsed_ms: elapsedMs, completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', run.id).eq('organization_id', organizationId)
    await db.from('agent_workflow_stages').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', stage.id).eq('organization_id', organizationId)
    await db.from('agent_workflows').update({ status: 'failed', error_code: failure.code, error_message: failure.message, updated_at: new Date().toISOString() }).eq('id', workflow.id).eq('organization_id', organizationId)

    await db.from('compliance_case_events').insert({
      organization_id: organizationId,
      case_id: workflow.case_id,
      actor_id: actorId,
      event_type: 'workflow_stage_failed',
      summary: 'Etapa agentic fallida',
      changes: {
        workflow_id: workflow.id, workflow_type: workflow.workflow_type, stage_id: stage.id,
        stage_index: stage.stage_index, run_id: run.id, attempt, failure_code: failure.code,
      },
    })

    throw new WorkflowExecutionError(failure.code, failure.message, failure.status, failure.internalCode)
  }
}
