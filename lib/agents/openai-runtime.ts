import 'server-only'

import { createHash } from 'node:crypto'
import OpenAI from 'openai'
import type { AgentId } from './catalog'
import { buildAgentInstructions } from './prompts'

const MODEL = process.env.OPENAI_REASONING_MODEL || 'gpt-5.6'

let client: OpenAI | null = null

function getOpenAI() {
  if (client) return client
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
  client = new OpenAI({ apiKey })
  return client
}

export type RunAgentInput = {
  agentId: AgentId
  task: string
  context?: string
  userId: string
}

export type RunAgentResult = {
  responseId: string
  model: string
  output: string
  usage?: unknown
}

export async function runAgent(input: RunAgentInput): Promise<RunAgentResult> {
  const openai = getOpenAI()
  const instructions = buildAgentInstructions(input.agentId)
  const safetyIdentifier = createHash('sha256').update(input.userId).digest('hex').slice(0, 64)
  const userInput = [
    `TAREA:\n${input.task.trim()}`,
    input.context?.trim() ? `CONTEXTO Y EVIDENCIA PROPORCIONADA:\n${input.context.trim()}` : '',
    'Entrega únicamente el resultado profesional verificable. No expongas razonamiento interno privado.',
  ].filter(Boolean).join('\n\n')

  const response = await openai.responses.create({
    model: MODEL,
    instructions,
    input: userInput,
    reasoning: {
      effort: 'max',
      mode: 'pro',
      context: 'auto',
    },
    text: {
      verbosity: 'high',
    },
    max_output_tokens: 16000,
    safety_identifier: safetyIdentifier,
    store: false,
  } as any)

  if (!response.output_text?.trim()) {
    throw new Error('The reasoning model returned an empty response')
  }

  return {
    responseId: response.id,
    model: response.model || MODEL,
    output: response.output_text,
    usage: response.usage,
  }
}
