// OpenAI extraction service for analyzing documents
// Uses GPT-4o to extract obligations, risks, and requirements

import OpenAI from 'openai'

export interface Obligation {
  obligation_text: string
  type: 'deadline' | 'responsibility' | 'requirement' | 'risk'
  severity: 'critical' | 'high' | 'medium' | 'low'
  responsible_party: string | null
  priority: 'critical' | 'high' | 'medium' | 'low'
}

interface ExtractionResult {
  obligations: Obligation[]
  riskSummary: string
  keyPoints: string[]
}

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable')
  }
  return new OpenAI({ apiKey })
}

const EXTRACTION_PROMPT = `You are a legal compliance expert analyzing regulatory documents in Spanish (especially Ley 21.719 - Chilean data protection law).

Extract the following from the provided document text:
1. OBLIGATIONS: Identify all obligations, requirements, deadlines, and responsibilities
2. RISKS: Identify compliance risks and critical issues
3. KEY POINTS: Summarize the most important aspects

Format your response as valid JSON (no markdown) with this structure:
{
  "obligations": [
    {
      "obligation_text": "Obligation description",
      "type": "deadline|responsibility|requirement|risk",
      "severity": "critical|high|medium|low",
      "responsible_party": "Responsible person/role or null",
      "priority": "critical|high|medium|low"
    }
  ],
  "riskSummary": "Overall risk assessment",
  "keyPoints": ["Point 1", "Point 2", ...]
}

IMPORTANT:
- Extract ALL obligations, even implicit ones
- Set severity based on consequences of non-compliance
- responsible_party should be clear role/person if mentioned, null otherwise
- Be thorough but accurate
- Respond ONLY with valid JSON, no markdown or code blocks
`

/**
 * Extract obligations from document text using GPT-4o
 */
export async function extractObligations(
  documentText: string,
  documentType?: string
): Promise<ExtractionResult> {
  try {
    console.log('[openai-extraction] Calling GPT-4o for obligation extraction')

    const openai = getOpenAIClient()

    const systemPrompt = documentType
      ? `${EXTRACTION_PROMPT}\n\nDOCUMENT TYPE: ${documentType}`
      : EXTRACTION_PROMPT

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `DOCUMENT TEXT:\n\n${documentText.slice(0, 12000)}`, // Limit to 12K chars for token efficiency
        },
      ],
      temperature: 0.3, // Lower temp for more consistent extraction
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from GPT-4o')
    }

    console.log('[openai-extraction] GPT-4o response received, parsing...')

    const result = JSON.parse(content) as ExtractionResult

    // Normalize obligations to match schema: map severity → priority
    const normalizedObligations = result.obligations.map((o) => ({
      obligation_text: o.obligation_text,
      type: o.type,
      severity: o.severity,
      responsible_party: o.responsible_party || null,
      priority: o.priority || o.severity, // Use priority if present, else severity
    }))

    console.log('[openai-extraction] Extracted', normalizedObligations.length, 'obligations')

    return {
      obligations: normalizedObligations,
      riskSummary: result.riskSummary,
      keyPoints: result.keyPoints,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[openai-extraction] Error:', message)
    throw new Error(`Failed to extract obligations: ${message}`)
  }
}

/**
 * Calculate compliance score (0-100)
 * Based on obligation count and severity distribution
 */
export function calculateComplianceScore(obligations: Obligation[]): number {
  if (obligations.length === 0) return 100

  const critical = obligations.filter((o) => o.priority === 'critical').length
  const high = obligations.filter((o) => o.priority === 'high').length

  // Simple scoring: penalize based on critical/high obligations
  let score = 100
  score -= critical * 15 // Each critical obligation reduces by 15
  score -= high * 5 // Each high obligation reduces by 5

  return Math.max(0, score)
}

