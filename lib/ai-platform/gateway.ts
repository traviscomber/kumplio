import 'server-only'

import type { AIPlatformGroundedResponse } from './types'
import { validateGroundedResponse } from './response-validator'
import { writeGroundedCopilotAnswer } from '@/lib/compliance-copilot/grounded-writer'

export async function runAIPlatformGateway(input: {
  userMessage: string
  deterministic: AIPlatformGroundedResponse
}) {
  const candidate = await writeGroundedCopilotAnswer({
    userMessage: input.userMessage,
    deterministic: input.deterministic,
  })

  try {
    return validateGroundedResponse(input.deterministic, candidate)
  } catch (error) {
    return {
      ...input.deterministic,
      caveats: ['La salida del modelo no superó la validación; se muestra la respuesta determinística verificada.'],
      generation: {
        mode: 'deterministic' as const,
        fallbackReason: error instanceof Error ? error.message : 'Validación de salida fallida',
      },
    }
  }
}
