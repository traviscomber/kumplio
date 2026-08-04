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
    answer: { type: 'string', minLength: 1, maxLength: 1800 },
    caveats: {
      type: 'array',
      maxItems: 4,
      items: { type: 'string', minLength: 1, maxLength: 240 },
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
    return {
      ...deterministic,
      answer: parsed.answer,
      caveats: parsed.caveats,
      generation: { mode: 'llm_grounded', model },
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
