import { z } from 'zod'
import { getOpenAIClient } from '@/lib/openai-client'
import { AgentExecution, ComplianceObligation, RiskAssessment } from '@/lib/types/agent-system'

// Sofia's enhanced system prompt with Chain-of-Thought reasoning
const SOFIA_SYSTEM_PROMPT = `You are Sofia, a specialized legal document analyzer for Chilean law compliance, focusing on Ley 21.719 (Data Protection Law).

Your expertise:
- Extract legal obligations from contracts, regulations, and compliance documents
- Identify stakeholders, dates, and actionable clauses
- Structure complex legal text into actionable compliance items
- Understand Chilean regulatory context (Ley 21.719, LGPD equivalents)
- Provide clear, executive-level summaries

REASONING APPROACH - Use Chain-of-Thought analysis:
1. DOCUMENT STRUCTURE: Identify document type, sections, key areas of focus
2. OBLIGATION IDENTIFICATION: Find all clauses that create duties or requirements
3. STAKEHOLDER MAPPING: Identify who must do what by when
4. RISK CONTEXT: Highlight data protection implications under Ley 21.719
5. VALIDATION: Cross-check findings against known legal patterns
6. CONFIDENCE SCORING: Rate certainty of each finding

Analysis format:
1. Document metadata (type, jurisdiction, key stakeholders)
2. Core obligations (with specific clauses and deadlines)
3. Data processing requirements (if applicable to Ley 21.719)
4. Risk indicators and red flags
5. Recommended actions

Always respond with structured JSON for programmatic processing.
Always show your reasoning for each obligation identified.`

const ObligationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  relatedClause: z.string(),
  deadline: z.string().nullable(),
  stakeholders: z.array(z.string()),
  category: z.enum(['data-protection', 'data-processing', 'user-rights', 'security', 'audit', 'other']),
  priority: z.enum(['high', 'medium', 'low']),
  reasoning: z.string().optional(), // New: Shows why this is an obligation
  confidence: z.number().min(0).max(100).optional(), // New: Confidence 0-100
  relatedObligations: z.array(z.string()).optional(), // New: Cross-references
})

const SofiaAnalysisSchema = z.object({
  documentType: z.string(),
  documentTitle: z.string(),
  jurisdiction: z.string(),
  keyStakeholders: z.array(z.string()),
  obligations: z.array(ObligationSchema),
  dataProcessingRisks: z.array(z.string()),
  ley21719Relevance: z.enum(['high', 'medium', 'low']),
  executiveSummary: z.string(),
  analysisReasoning: z.string().optional(), // New: Overall analysis chain-of-thought
  confidenceScore: z.number().min(0).max(100).optional(), // New: Overall confidence
  recommendedNextSteps: z.array(z.string()).optional(), // New: Action items
})

export type SofiaAnalysis = z.infer<typeof SofiaAnalysisSchema>

export async function sofiaAnalyzeDocument(
  documentContent: string,
  documentMetadata?: {
    name?: string
    type?: string
  }
): Promise<AgentExecution<SofiaAnalysis>> {
  const startTime = Date.now()

  try {
    const systemPrompt = `${SOFIA_SYSTEM_PROMPT}

For the document provided, extract and structure all compliance obligations, particularly those related to Ley 21.719 (Chilean Data Protection Law).

MULTI-PASS ANALYSIS APPROACH:
Pass 1 - EXTRACT: Identify all potential obligations and requirements
Pass 2 - VERIFY: Check each obligation against Ley 21.719 requirements
Pass 3 - CROSS-REFERENCE: Identify relationships between obligations
Pass 4 - VALIDATE: Confirm findings match legal patterns and mark confidence levels

For each obligation, provide:
- Explicit reasoning for why this is an obligation
- Confidence score (0-100) based on clarity of language
- References to related obligations

Respond with valid JSON matching this structure:
{
  "documentType": "contract | regulation | policy | other",
  "documentTitle": "extracted title",
  "jurisdiction": "jurisdiction",
  "keyStakeholders": ["stakeholder1", "stakeholder2"],
  "analysisReasoning": "Explain your multi-pass analysis approach and key findings",
  "confidenceScore": 85,
  "obligations": [
    {
      "id": "OBL-001",
      "title": "obligation title",
      "description": "detailed description",
      "relatedClause": "clause reference with line numbers if possible",
      "deadline": "date or null",
      "stakeholders": ["who is responsible"],
      "category": "data-protection | data-processing | user-rights | security | audit | other",
      "priority": "high | medium | low",
      "reasoning": "Why this is classified as an obligation under Ley 21.719",
      "confidence": 92,
      "relatedObligations": ["OBL-002", "OBL-003"]
    }
  ],
  "dataProcessingRisks": ["risk1 (Ley 21.719 context)", "risk2"],
  "ley21719Relevance": "high | medium | low",
  "executiveSummary": "brief executive summary of key findings",
  "recommendedNextSteps": ["action 1 based on findings"]
}`

    const message = await getOpenAIClient().messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\nDocument to analyze:\n\n${documentContent}`,
        },
      ],
    })

    // Extract text content from response
    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('')

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response')
    }

    const analysisData = JSON.parse(jsonMatch[0])
    const analysis = SofiaAnalysisSchema.parse(analysisData)

    return {
      agentId: 'sofia-analyzer',
      agentName: 'Sofia',
      status: 'success',
      output: analysis,
      tokensUsed: {
        input: message.usage?.input_tokens || 0,
        output: message.usage?.output_tokens || 0,
      },
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  } catch (error) {
    return {
      agentId: 'sofia-analyzer',
      agentName: 'Sofia',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  }
}

export async function sofiaExtractObligations(
  documentContent: string
): Promise<AgentExecution<ComplianceObligation[]>> {
  const execution = await sofiaAnalyzeDocument(documentContent)

  if (execution.status === 'error') {
    return {
      agentId: 'sofia-analyzer',
      agentName: 'Sofia',
      status: 'error',
      error: execution.error,
      executionTimeMs: execution.executionTimeMs,
      timestamp: execution.timestamp,
    }
  }

  const analysis = execution.output as SofiaAnalysis
  const obligations: ComplianceObligation[] = analysis.obligations.map((obs) => ({
    id: obs.id,
    title: obs.title,
    description: obs.description,
    dueDate: obs.deadline ? new Date(obs.deadline) : undefined,
    category: obs.category,
    priority: obs.priority,
    status: 'pending',
    assignedTo: obs.stakeholders[0] || 'unassigned',
    documentSource: analysis.documentTitle,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))

  return {
    agentId: 'sofia-analyzer',
    agentName: 'Sofia',
    status: 'success',
    output: obligations,
    tokensUsed: execution.tokensUsed,
    executionTimeMs: execution.executionTimeMs,
    timestamp: execution.timestamp,
  }
}
