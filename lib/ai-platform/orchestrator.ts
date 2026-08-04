import 'server-only'

import type { AIPlatformGroundedResponse } from './types'
import { validateAIPlatformPlan } from './tool-registry'
import { compactAIPlatformContext } from './context-engine'
import { runAIPlatformGateway } from './gateway'

export async function orchestrateGroundedResponse(input: {
  userMessage: string
  deterministic: AIPlatformGroundedResponse
}) {
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

  return runAIPlatformGateway({
    userMessage: input.userMessage,
    deterministic: normalized,
  })
}
