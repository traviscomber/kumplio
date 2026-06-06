import { z } from 'zod'
import { getOpenAIClient } from '@/lib/openai-client'
import { AgentExecution } from '@/lib/types/agent-system'

const MARCO_SYSTEM_PROMPT = `You are Marco, a compliance advisor for Chilean organizations implementing Ley 21.719.

Your expertise:
- Generate actionable, prioritized compliance recommendations
- Translate legal requirements into business processes
- Identify quick wins vs long-term strategic changes
- Provide implementation roadmaps
- Balance compliance with operational efficiency
- Consider resource constraints of organizations
- Learn from past recommendation success rates

REASONING APPROACH - Chain-of-Thought Advisory:
1. SITUATION ANALYSIS: Understand the current compliance state
2. CONSTRAINT MAPPING: Identify resource, timeline, and budget constraints
3. PRIORITIZATION: Rank by risk, feasibility, and business impact
4. ROADMAPPING: Create phased implementation plan
5. RESOURCE ESTIMATION: Calculate effort and costs
6. SUCCESS FACTORS: Identify what's needed for implementation
7. CONFIDENCE: Rate likelihood of successful implementation

Recommendation Framework:
1. Priority ranking (critical/high/medium/low) based on risk and feasibility
2. Implementation complexity (simple/moderate/complex)
3. Resource requirements (budget, timeline, team)
4. Expected outcome and compliance impact
5. Dependencies with other initiatives
6. Success metrics with confidence levels
7. Historical success rate comparison

Always provide specific, implementable advice tailored to Chilean context.
Show your reasoning for each recommendation priority.`

const RecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  priorityReasoning: z.string().optional(), // New: Why this priority
  category: z.enum(['policy', 'process', 'technology', 'training', 'governance', 'audit']),
  complexity: z.enum(['simple', 'moderate', 'complex']),
  estimatedHours: z.number(),
  estimatedCost: z.string(),
  implementationSteps: z.array(z.string()),
  successMetrics: z.array(z.string()),
  dependencies: z.array(z.string()),
  owner: z.string(),
  successProbability: z.number().min(0).max(100).optional(), // New: Based on similar cases
  feasibilityScore: z.number().min(0).max(100).optional(), // New: Given constraints
})

const MarcoAdviceSchema = z.object({
  organizationType: z.string(),
  complianceMaturity: z.enum(['beginner', 'intermediate', 'advanced']),
  advisoryReasoning: z.string().optional(), // New: Overall advisory logic
  recommendations: z.array(RecommendationSchema),
  implementationRoadmap: z.object({
    phase1: z.object({
      name: z.string(),
      duration: z.string(),
      recommendations: z.array(z.string()),
    }),
    phase2: z.object({
      name: z.string(),
      duration: z.string(),
      recommendations: z.array(z.string()),
    }),
    phase3: z.object({
      name: z.string(),
      duration: z.string(),
      recommendations: z.array(z.string()),
    }),
  }),
  estimatedTotalEffort: z.string(),
  expectedComplianceLevel: z.string(),
  successRateEstimate: z.number().min(0).max(100).optional(), // New: Predicted success
  confidenceScore: z.number().min(0).max(100).optional(), // New: Overall confidence
})

export type MarcoAdvice = z.infer<typeof MarcoAdviceSchema>

export async function marcoGenerateRecommendations(
  riskAssessment: string,
  organizationType: string,
  constraints?: {
    budget?: string
    timeline?: string
    resources?: string
  }
): Promise<AgentExecution<MarcoAdvice>> {
  const startTime = Date.now()

  try {
    const constraintText = constraints
      ? `
Organizational Constraints:
- Budget: ${constraints.budget || 'Not specified'}
- Timeline: ${constraints.timeline || 'Not specified'}
- Resources: ${constraints.resources || 'Not specified'}
`
      : ''

    const prompt = `${MARCO_SYSTEM_PROMPT}

Based on this risk assessment for a ${organizationType}:

${riskAssessment}

${constraintText}

MULTI-PASS ADVISORY APPROACH:
Pass 1 - ANALYZE: Understand risks, constraints, and organizational context
Pass 2 - PRIORITIZE: Rank recommendations by impact, feasibility, and precedent
Pass 3 - ROADMAP: Create phased implementation plan
Pass 4 - VALIDATE: Ensure feasibility and resource alignment
Pass 5 - CONFIDENCE: Rate success probability based on similar organizations

Generate a comprehensive compliance roadmap with:
1. Prioritized recommendations (critical first) with reasoning
2. Implementation phases (3-phase approach) with clear sequencing
3. Clear action steps for each recommendation
4. Resource and cost estimates with confidence intervals
5. Success metrics and indicators
6. Success probability based on organizational context

Respond with JSON:
{
  "organizationType": "${organizationType}",
  "complianceMaturity": "beginner | intermediate | advanced",
  "advisoryReasoning": "Explain your multi-pass advisory approach and key insights",
  "successRateEstimate": 82,
  "confidenceScore": 85,
  "recommendations": [
    {
      "id": "REC-001",
      "title": "Recommendation title",
      "description": "Detailed description",
      "priority": "critical | high | medium | low",
      "priorityReasoning": "Why this priority given risks and constraints",
      "category": "policy | process | technology | training | governance | audit",
      "complexity": "simple | moderate | complex",
      "estimatedHours": 40,
      "estimatedCost": "Cost estimate",
      "implementationSteps": ["step 1", "step 2"],
      "successMetrics": ["metric 1"],
      "dependencies": ["related recommendation"],
      "owner": "Who should own this",
      "successProbability": 92,
      "feasibilityScore": 85
    }
  ],
  "implementationRoadmap": {
    "phase1": {
      "name": "Foundation Phase",
      "duration": "Timeline",
      "recommendations": ["REC-001", "REC-002"]
    },
    "phase2": {
      "name": "Enhancement Phase",
      "duration": "Timeline",
      "recommendations": ["REC-003"]
    },
    "phase3": {
      "name": "Optimization Phase",
      "duration": "Timeline",
      "recommendations": ["REC-004"]
    }
  },
  "estimatedTotalEffort": "Total hours and timeline",
  "expectedComplianceLevel": "Expected final compliance status"
}`

    const message = await getOpenAIClient().messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('')

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response')
    }

    const adviceData = JSON.parse(jsonMatch[0])
    const advice = MarcoAdviceSchema.parse(adviceData)

    return {
      agentId: 'marco-advisor',
      agentName: 'Marco',
      status: 'success',
      output: advice,
      tokensUsed: {
        input: message.usage?.input_tokens || 0,
        output: message.usage?.output_tokens || 0,
      },
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  } catch (error) {
    return {
      agentId: 'marco-advisor',
      agentName: 'Marco',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  }
}

export async function marcoPrioritizeActions(actions: string[]): Promise<AgentExecution<string[]>> {
  const startTime = Date.now()

  try {
    const actionsList = actions.map((a, i) => `${i + 1}. ${a}`).join('\n')

    const prompt = `${MARCO_SYSTEM_PROMPT}

Prioritize these compliance actions for a Chilean organization under Ley 21.719:

${actionsList}

Respond with a JSON array of actions in priority order (most critical first):
["action 1", "action 2", "action 3"]`

    const message = await getOpenAIClient().messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('')

    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON array from response')
    }

    const prioritized = JSON.parse(jsonMatch[0])

    return {
      agentId: 'marco-advisor',
      agentName: 'Marco',
      status: 'success',
      output: prioritized,
      tokensUsed: {
        input: message.usage?.input_tokens || 0,
        output: message.usage?.output_tokens || 0,
      },
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  } catch (error) {
    return {
      agentId: 'marco-advisor',
      agentName: 'Marco',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  }
}
