import 'server-only'

import type { AIPlatformGroundedResponse } from './types'
import { validateAIPlatformPlan } from './tool-registry'
import { compactAIPlatformContext } from './context-engine'
import { runAIPlatformGateway } from './gateway'
import { recordAIPlatformTelemetry } from './telemetry'

export async function orchestrateGroundedResponse(input: {
  userMessage: string
  deterministic: AIPlatformGroundedResponse
  actorUserId?: string | null
  organizationId?: string | null
  surface?: string
}) {
  const startedAt = performance.now()

  validateAIPlatformPlan(input.deterministic.plan)

  const compacted = compactAIPlatformContext(input.deterministic)
  const normalized: AIPlatformGroundedResponse = {
    ...input.deterministic,
    answer: compacted.deterministic_answer,
    facts: compacted.facts,
    sources: compacted.sources,
    actions: compacted.allowed_actions,
    caveats: compacted.caveats,
  }

  try {
    const response = await runAIPlatformGateway({
      userMessage: input.userMessage,
      deterministic: normalized,
    })

    await recordAIPlatformTelemetry({
      actorUserId: input.actorUserId,
      organizationId: input.organizationId,
      surface: input.surface,
      userMessage: input.userMessage,
      response,
      latencyMs: performance.now() - startedAt,
      success: true,
    })

    return response
  } catch (error) {
    const fallback: AIPlatformGroundedResponse = {
      ...normalized,
      generation: {
        mode: 'deterministic',
        fallbackReason: error instanceof Error ? error.message : 'Fallo de orquestación',
      },
      caveats: ['La orquestación avanzada no estuvo disponible; se muestra la respuesta determinística verificada.'],
    }

    await recordAIPlatformTelemetry({
      actorUserId: input.actorUserId,
      organizationId: input.organizationId,
      surface: input.surface,
      userMessage: input.userMessage,
      response: fallback,
      latencyMs: performance.now() - startedAt,
      success: false,
      errorCode: 'orchestration_failure',
    })

    return fallback
  }
}
