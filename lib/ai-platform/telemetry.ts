import 'server-only'

import { createHash } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AIPlatformGroundedResponse } from './types'

export type AIPlatformTelemetryInput = {
  actorUserId?: string | null
  organizationId?: string | null
  surface?: string
  userMessage: string
  response: AIPlatformGroundedResponse
  latencyMs: number
  success?: boolean
  errorCode?: string | null
  inputTokens?: number | null
  outputTokens?: number | null
  totalTokens?: number | null
  estimatedCostUsd?: number | null
  metadata?: Record<string, unknown>
}

function fingerprint(value: string) {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export async function recordAIPlatformTelemetry(input: AIPlatformTelemetryInput) {
  const admin = createAdminClient()
  const contextBytes = Buffer.byteLength(JSON.stringify({
    facts: input.response.facts,
    sources: input.response.sources,
    actions: input.response.actions,
    plan: input.response.plan,
  }), 'utf8')

  const { error } = await admin.from('ai_platform_runs').insert({
    actor_user_id: input.actorUserId || null,
    organization_id: input.organizationId || null,
    surface: input.surface || 'copilot',
    intent: input.response.intent,
    tool_names: input.response.plan.map((step) => step.tool),
    provider: input.response.generation?.mode === 'llm_grounded' ? 'openai' : null,
    model: input.response.generation?.model || null,
    generation_mode: input.response.generation?.mode || 'deterministic',
    fallback_reason: input.response.generation?.fallbackReason || null,
    latency_ms: Math.max(0, Math.round(input.latencyMs)),
    input_tokens: input.inputTokens ?? null,
    output_tokens: input.outputTokens ?? null,
    total_tokens: input.totalTokens ?? null,
    estimated_cost_usd: input.estimatedCostUsd ?? null,
    fact_count: input.response.facts.length,
    source_count: input.response.sources.length,
    action_count: input.response.actions.length,
    context_bytes: contextBytes,
    query_fingerprint: fingerprint(input.userMessage),
    success: input.success ?? true,
    error_code: input.errorCode || null,
    metadata: input.metadata || {},
  })

  if (error) {
    console.error('AI Platform telemetry write failed', {
      code: error.code,
      message: error.message,
    })
  }
}
