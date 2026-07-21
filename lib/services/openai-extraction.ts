import OpenAI from 'openai'

export interface Obligation {
  obligation_text: string
  type: 'deadline' | 'responsibility' | 'requirement' | 'risk'
  severity: 'critical' | 'high' | 'medium' | 'low'
  responsible_party: string | null
  priority: 'critical' | 'high' | 'medium' | 'low'
  source_quote?: string | null
  confidence?: number
}

interface ExtractionResult {
  obligations: Obligation[]
  riskSummary: string
  keyPoints: string[]
  limitations?: string[]
}

let client: OpenAI | null = null

function getOpenAIClient() {
  if (client) return client
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY environment variable')
  client = new OpenAI({ apiKey })
  return client
}

const EXTRACTION_PROMPT = `Eres Isidora, analista de obligaciones y evidencia documental de KUMPLIO.

Analiza el documento en español y extrae solo obligaciones sustentadas por el texto. Distingue obligaciones, responsabilidades, plazos, requisitos y riesgos. No inventes artículos, sanciones, responsables ni fechas. No conviertas buenas prácticas en obligaciones legales. Cuando una obligación sea inferida, baja la confianza y explica la limitación.

Para cada obligación entrega:
- obligation_text: formulación normalizada
- type: deadline, responsibility, requirement o risk
- severity y priority: critical, high, medium o low, justificadas por el texto disponible
- responsible_party: sujeto indicado o null
- source_quote: cita breve exacta que sustenta la extracción o null
- confidence: número entre 0 y 1

Además entrega riskSummary, keyPoints y limitations. La salida debe respetar estrictamente el esquema JSON solicitado.`

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['obligations', 'riskSummary', 'keyPoints', 'limitations'],
  properties: {
    obligations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['obligation_text', 'type', 'severity', 'responsible_party', 'priority', 'source_quote', 'confidence'],
        properties: {
          obligation_text: { type: 'string' },
          type: { type: 'string', enum: ['deadline', 'responsibility', 'requirement', 'risk'] },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          responsible_party: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          source_quote: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
    riskSummary: { type: 'string' },
    keyPoints: { type: 'array', items: { type: 'string' } },
    limitations: { type: 'array', items: { type: 'string' } },
  },
}

export async function extractObligations(documentText: string, documentType?: string): Promise<ExtractionResult> {
  try {
    const openai = getOpenAIClient()
    const response = await openai.responses.create({
      model: process.env.OPENAI_REASONING_MODEL || 'gpt-5.6',
      instructions: EXTRACTION_PROMPT,
      input: `TIPO DE DOCUMENTO: ${documentType || 'no especificado'}\n\nTEXTO DEL DOCUMENTO:\n${documentText.slice(0, 120000)}`,
      reasoning: { effort: 'max', mode: 'pro' },
      text: {
        verbosity: 'medium',
        format: {
          type: 'json_schema',
          name: 'kumplio_obligation_extraction',
          strict: true,
          schema,
        },
      },
      max_output_tokens: 12000,
      store: false,
    } as any)

    if (!response.output_text?.trim()) throw new Error('Empty response from reasoning model')
    const result = JSON.parse(response.output_text) as ExtractionResult

    return {
      obligations: result.obligations.map((item) => ({
        ...item,
        responsible_party: item.responsible_party || null,
        priority: item.priority || item.severity,
      })),
      riskSummary: result.riskSummary,
      keyPoints: result.keyPoints,
      limitations: result.limitations || [],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[openai-extraction] Error:', message)
    throw new Error(`Failed to extract obligations: ${message}`)
  }
}

export function calculateComplianceScore(obligations: Obligation[]): number {
  if (obligations.length === 0) return 100
  const critical = obligations.filter((item) => item.priority === 'critical').length
  const high = obligations.filter((item) => item.priority === 'high').length
  return Math.max(0, 100 - critical * 15 - high * 5)
}
