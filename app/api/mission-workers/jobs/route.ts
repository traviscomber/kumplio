import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type WorkerAction =
  | { action: 'claim'; workerId: string; leaseSeconds?: number }
  | { action: 'heartbeat'; jobId: string; leaseToken: string; extendSeconds?: number }
  | { action: 'model'; jobId: string; leaseToken: string; provider: string; model: string; operation: string; inputTokens?: number; outputTokens?: number; cachedInputTokens?: number; reasoningTokens?: number; latencyMs: number; costMicrousd?: number; requestId?: string; finishReason?: string; metadata?: Record<string, unknown> }
  | { action: 'tool'; jobId: string; leaseToken: string; toolKey: string; sourceKey?: string; status: 'succeeded' | 'failed' | 'blocked'; latencyMs?: number; inputSummary?: Record<string, unknown>; outputSummary?: Record<string, unknown>; citationRefs?: unknown[]; errorCode?: string }
  | { action: 'quality'; jobId: string; leaseToken: string; evaluatorAgentId: string; rubricVersion: string; score: number; dimensions?: Record<string, unknown>; findings?: unknown[] }
  | { action: 'complete'; jobId: string; leaseToken: string; artifact: { type: string; title: string; content: Record<string, unknown>; sourceRefs?: unknown[]; confidence?: number | null }; result: { type: string; title: string; summary?: string | null; payload?: Record<string, unknown>; evidenceIds?: string[] } }
  | { action: 'fail'; jobId: string; leaseToken: string; errorCode: string; errorMessage: string; retryDelaySeconds?: number }

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized_worker' }, { status: 401 })
}

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.MISSION_WORKER_SECRET
  const suppliedSecret = request.headers.get('x-mission-worker-secret')
  if (!configuredSecret || suppliedSecret !== configuredSecret) return unauthorized()

  let body: WorkerAction
  try {
    body = await request.json() as WorkerAction
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const admin = createAdminClient()
  let response

  switch (body.action) {
    case 'claim':
      response = await admin.rpc('claim_mission_execution_job', { p_worker_id: body.workerId, p_lease_seconds: body.leaseSeconds ?? null })
      break
    case 'heartbeat':
      response = await admin.rpc('heartbeat_mission_execution_job', { p_job_id: body.jobId, p_lease_token: body.leaseToken, p_extend_seconds: body.extendSeconds ?? 300 })
      break
    case 'model':
      response = await admin.rpc('record_mission_model_run', {
        p_job_id: body.jobId, p_lease_token: body.leaseToken, p_provider: body.provider, p_model: body.model,
        p_operation: body.operation, p_input_tokens: body.inputTokens ?? 0, p_output_tokens: body.outputTokens ?? 0,
        p_cached_input_tokens: body.cachedInputTokens ?? 0, p_reasoning_tokens: body.reasoningTokens ?? 0,
        p_latency_ms: body.latencyMs, p_cost_microusd: body.costMicrousd ?? 0, p_request_id: body.requestId ?? null,
        p_finish_reason: body.finishReason ?? null, p_metadata: body.metadata ?? {},
      })
      break
    case 'tool':
      response = await admin.rpc('record_mission_tool_call', {
        p_job_id: body.jobId, p_lease_token: body.leaseToken, p_tool_key: body.toolKey, p_source_key: body.sourceKey ?? null,
        p_status: body.status, p_latency_ms: body.latencyMs ?? 0, p_input_summary: body.inputSummary ?? {},
        p_output_summary: body.outputSummary ?? {}, p_citation_refs: body.citationRefs ?? [], p_error_code: body.errorCode ?? null,
      })
      break
    case 'quality':
      if (body.score < 0 || body.score > 1) return NextResponse.json({ error: 'invalid_quality_score' }, { status: 400 })
      response = await admin.rpc('record_mission_quality_evaluation', {
        p_job_id: body.jobId, p_lease_token: body.leaseToken, p_evaluator_agent_id: body.evaluatorAgentId,
        p_rubric_version: body.rubricVersion, p_score: body.score, p_dimensions: body.dimensions ?? {}, p_findings: body.findings ?? [],
      })
      break
    case 'complete':
      response = await admin.rpc('finalize_mission_execution_job', {
        p_job_id: body.jobId, p_lease_token: body.leaseToken, p_artifact_type: body.artifact.type,
        p_artifact_title: body.artifact.title, p_artifact_content: body.artifact.content, p_source_refs: body.artifact.sourceRefs ?? [],
        p_confidence: body.artifact.confidence ?? null, p_result_type: body.result.type, p_result_title: body.result.title,
        p_result_summary: body.result.summary ?? null, p_result_payload: body.result.payload ?? {}, p_evidence_ids: body.result.evidenceIds ?? [],
      })
      break
    case 'fail':
      response = await admin.rpc('fail_mission_execution_job', {
        p_job_id: body.jobId, p_lease_token: body.leaseToken, p_error_code: body.errorCode,
        p_error_message: body.errorMessage, p_retry_delay_seconds: body.retryDelaySeconds ?? 60,
      })
      break
    default:
      return NextResponse.json({ error: 'unsupported_action' }, { status: 400 })
  }

  if (response.error) return NextResponse.json({ error: response.error.message }, { status: 409 })
  if (body.action === 'claim' && response.data == null) return NextResponse.json({ job: null }, { status: 200 })
  return NextResponse.json({ data: response.data }, { status: body.action === 'complete' ? 201 : 200 })
}
