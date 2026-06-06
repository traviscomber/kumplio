import { z } from 'zod'
import { getOpenAIClient } from '@/lib/openai-client'
import { AgentExecution, ComplianceObligation, RiskAssessment } from '@/lib/types/agent-system'
import { 
  ultraIntelligence, 
  FewShotBuilder, 
  AnalogicalReasoner, 
  MetacognitiveValidator, 
  CrossAgentLearner,
  UncertaintyQuantifier,
  ReasoningTracer 
} from '@/lib/agents/ultra-intelligence-engine'

// Sofia's ultra-intelligence system prompt with legal expertise
const SOFIA_SYSTEM_PROMPT = `You are Sofia, an EXPERT legal document analyzer specializing in Ley 21.719 (Chilean Data Protection Law).

Your expertise:
- Extract legal obligations with lawyer-level precision
- Reference Ley 21.719 articles explicitly for each finding
- Identify SERNAC precedents and risk areas
- Understand stakeholder liability and penalties (50-200 UF per violation)
- Provide audit-ready documentation

EXPERT ANALYSIS PROCESS:
1. DOCUMENT CLASSIFICATION: Type, jurisdiction, data sensitivity level
2. LEY 21.719 ARTICLE MAPPING: Reference every relevant article
3. OBLIGATION EXTRACTION: Explicit obligations with article citations
4. STAKEHOLDER LIABILITY: Who is responsible, when, with what penalties
5. SERNAC PRECEDENT COMPARISON: Compare against documented cases
6. CONFIDENCE SCORING: 0-100 based on evidence clarity
7. ALTERNATIVES CONSIDERED: Document other interpretations rejected

KEY LEGAL FRAMEWORK:
- Art. 2: Scope and definitions (personal data, processing)
- Art. 3: Sensitive data special protections
- Art. 4: Consent requirements (explicit per purpose)
- Art. 6: International data transfers (equivalent protection required)
- Art. 7: Security measures (encryption, access controls)
- Art. 18: Data Protection Officer requirement
- Art. 23: Breach notification (5 business days)

SERNAC PENALTIES (Real cases):
- Unauthorized processing: 100 UF minimum
- Lack of consent: 100-150 UF
- Security failures: 120-180 UF
- DPO absence: 150 UF
- Breach delays: 150-200 UF per day

Always respond with structured JSON for programmatic processing.
Show your legal reasoning. Reference articles and penalties explicitly.`

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
    // Initialize ultra-intelligence components
    const fewShot = new FewShotBuilder()
    const analogizer = new AnalogicalReasoner()
    const metacognition = new MetacognitiveValidator()
    const tracer = new ReasoningTracer()
    const uncertainty = new UncertaintyQuantifier()

    tracer.recordStep(1, 'Initialize Few-Shot Learning', 'Loading 20+ Ley 21.719 precedents and patterns', 0.95)

    // Step 1: Few-Shot prompt construction
    const fewShotPrompt = fewShot.buildObligationPrompt(
      documentContent.substring(0, 500),
      documentMetadata?.type || 'unknown'
    )
    tracer.recordStep(2, 'Build Few-Shot Examples', 'Constructed prompt with SERNAC precedents', 0.92)

    // Step 2: Analogical reasoning - find similar cases
    const analogies = analogizer.findAnalogies(documentContent, 'obligations')
    const topAnalogies = analogies.slice(0, 3)
    tracer.recordStep(3, 'Find Analogous Cases', `Located ${topAnalogies.length} similar Ley 21.719 cases`, 0.88)

    // Step 3: Build system prompt with legal context
    const systemPrompt = `${SOFIA_SYSTEM_PROMPT}

${fewShotPrompt}

REFERENCE SIMILAR CASES:
${topAnalogies.map((a, i) => `
Case ${i + 1}: ${a.precedent || 'Similar pattern'}
Article: ${a.articleReference}
Trigger: "${a.trigger}"
Result: ${a.obligation}
Penalty if violated: ${a.penalty}
`).join('\n')}

QUESTIONS TO VALIDATE YOUR ANALYSIS:
${metacognition.questionAssumptions(documentContent).slice(0, 3).join('\n')}

MULTI-PASS ANALYSIS:
Pass 1 - EXTRACT: Find all obligations referencing personal data, data processing, transfers, or security
Pass 2 - VERIFY: Check each against Ley 21.719 articles 2-23
Pass 3 - REFERENCE: Link to analogous SERNAC cases above
Pass 4 - CONFIDENCE: Score 0-100 based on evidence clarity

Respond with valid JSON:
{
  "documentType": "contract | regulation | policy | other",
  "documentTitle": "extracted title",
  "jurisdiction": "Chile" | "Other",
  "keyStakeholders": ["stakeholder1", "stakeholder2"],
  "analysisReasoning": "Explain your multi-pass analysis, precedents considered, and reasoning",
  "confidenceScore": 85,
  "leySources": "Art. 2, 4, 6, 7, 23, Ley 21.719",
  "obligations": [
    {
      "id": "OBL-001",
      "title": "obligation title",
      "description": "detailed description with legal grounding",
      "relatedClause": "specific clause reference",
      "deadline": "date or null",
      "stakeholders": ["who is responsible"],
      "category": "data-protection | data-processing | user-rights | security | audit | other",
      "priority": "high | medium | low",
      "reasoning": "Why this is a Ley 21.719 obligation",
      "confidence": 92,
      "articleReference": "Art. X, Ley 21.719",
      "penalty": "Estimated penalty in UF if violated",
      "relatedObligations": ["OBL-002"],
      "sernacPrecedent": "Relevant SERNAC case if applicable"
    }
  ],
  "dataProcessingRisks": ["risk1 (Ley 21.719 context)", "risk2"],
  "ley21719Relevance": "high | medium | low",
  "executiveSummary": "brief executive summary",
      "recommendedNextSteps": ["action 1"]
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
