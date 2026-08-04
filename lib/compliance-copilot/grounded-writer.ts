import 'server-only'

import OpenAI from 'openai'
import type { CopilotResponse } from './engine'

type GroundedWriterInput = {
  userMessage: string
  deterministic: CopilotResponse
}

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['answer', 'caveats'],
  properties: {
    answer: { type: 'string' },
    caveats: {
      type: 'array',
      items: { type: 'string' },
    },
  },
} as const

function safeContext(response: CopilotResponse) {
  return {
    intent: response.intent,
    deterministic_answer: response.answer,
    facts: response.facts.slice(0, 12),
    sources: response.sources.slice(0, 12),
    allowed_actions: response.actions.slice(0, 8),
    execution_plan: response.plan,
  }
}

function optionalPositiveNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function estimateCostUsd(inputTokens: number | null, outputTokens: number | null) {
  const inputRate = optionalPositiveNumber(process.env.OPENAI_INPUT_COST_PER_MILLION_USD)
  const outputRate = optionalPositiveNumber(process.env.OPENAI_OUTPUT_COST_PER_MILLION_USD)
  if (inputTokens === null || outputTokens === null || inputRate === null || outputRate === null) return null
  return ((inputTokens * inputRate) + (outputTokens * outputRate)) / 1_000_000
}

export async function writeGroundedCopilotAnswer({
  userMessage,
  deterministic,
}: GroundedWriterInput): Promise<CopilotResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      ...deterministic,
      generation: { mode: 'deterministic', fallbackReason: 'OPENAI_API_KEY no configurada' },
    }
  }

  const model = process.env.OPENAI_COPILOT_MODEL || 'gpt-5'
  const client = new OpenAI({ apiKey })

  try {
    const response = await client.responses.create({
      model,
      store: false,
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text: [
                'Eres la capa de redacción del Compliance Copilot de Kumplio.',
                'Usa exclusivamente el contexto estructurado entregado.',
                'No inventes leyes, artículos, estados, cifras, organizaciones, evidencias ni acciones.',
                'No cambies la intención, los hechos, las fuentes ni las acciones permitidas.',
                'No presentes una inferencia como hecho. Señala límites en caveats.',
                'Redacta en español de Chile, claro, ejecutivo y accionable.',
                'La respuesta no constituye asesoría jurídica y debe conservar revisión humana.',
              ].join('\n'),
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify({
                question: userMessage,
                grounded_context: safeContext(deterministic),
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'kumplio_copilot_grounded_answer',
          strict: true,
          schema: responseSchema,
        },
      },
    })

    const parsed = JSON.parse(response.output_text) as { answer: string; caveats: string[] }
    const usage = response.usage as { input_tokens?: number; output_tokens?: number; total_tokens?: number } | undefined
    const inputTokens = optionalPositiveNumber(usage?.input_tokens)
    const outputTokens = optionalPositiveNumber(usage?.output_tokens)
    const totalTokens = optionalPositiveNumber(usage?.total_tokens)

    return {
      ...deterministic,
      answer: parsed.answer,
      caveats: parsed.caveats.slice(0, 4),
      generation: {
        mode: 'llm_grounded',
        model,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
          estimatedCostUsd: estimateCostUsd(inputTokens, outputTokens),
        },
      },
    }
  } catch (error) {
    const fallbackReason = error instanceof Error ? error.message.slice(0, 240) : 'Fallo desconocido del modelo'
    return {
      ...deterministic,
      generation: { mode: 'deterministic', model, fallbackReason },
      caveats: ['La redacción con modelo no estuvo disponible; se muestra la respuesta determinística verificada.'],
    }
  }
}
