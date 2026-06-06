import { z } from 'zod'
import { getOpenAIClient } from '@/lib/openai-client'
import { AgentExecution, ComplianceObligation, RiskAssessment } from '@/lib/types/agent-system'

// Sofia's specialized prompt for document analysis
const SOFIA_SYSTEM_PROMPT = `You are Sofia, a specialized legal document analyzer for Chilean law compliance, focusing on Ley 21.719 (Data Protection Law).

Your expertise:
- Extract legal obligations from contracts, regulations, and compliance documents
- Identify stakeholders, dates, and actionable clauses
- Structure complex legal text into actionable compliance items
- Understand Chilean regulatory context (Ley 21.719, LGPD equivalents)
- Provide clear, executive-level summaries

Analysis format:
1. Document metadata (type, jurisdiction, key stakeholders)
2. Core obligations (with specific clauses and deadlines)
3. Data processing requirements (if applicable to Ley 21.719)
4. Risk indicators and red flags
5. Recommended actions

Always respond with structured JSON for programmatic processing.`

const ObligationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  relatedClause: z.string(),
  deadline: z.string().nullable(),
  stakeholders: z.array(z.string()),
  category: z.enum(['data-protection', 'data-processing', 'user-rights', 'security', 'audit', 'other']),
  priority: z.enum(['high', 'medium', 'low']),
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

Respond with valid JSON matching this structure:
{
  "documentType": "contract | regulation | policy | other",
  "documentTitle": "extracted title",
  "jurisdiction": "jurisdiction",
  "keyStakeholders": ["stakeholder1", "stakeholder2"],
  "obligations": [
    {
      "id": "OBL-001",
      "title": "obligation title",
      "description": "detailed description",
      "relatedClause": "clause reference",
      "deadline": "date or null",
      "stakeholders": ["who is responsible"],
      "category": "data-protection | data-processing | user-rights | security | audit | other",
      "priority": "high | medium | low"
    }
  ],
  "dataProcessingRisks": ["risk1", "risk2"],
  "ley21719Relevance": "high | medium | low",
  "executiveSummary": "brief executive summary of key findings"
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
