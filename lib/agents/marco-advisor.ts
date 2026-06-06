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

Recommendation Framework:
1. Priority ranking (critical/high/medium/low)
2. Implementation complexity (simple/moderate/complex)
3. Resource requirements (budget, timeline, team)
4. Expected outcome and compliance impact
5. Dependencies with other initiatives
6. Success metrics

Always provide specific, implementable advice tailored to Chilean context.`

const RecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.enum(['policy', 'process', 'technology', 'training', 'governance', 'audit']),
  complexity: z.enum(['simple', 'moderate', 'complex']),
  estimatedHours: z.number(),
  estimatedCost: z.string(),
  implementationSteps: z.array(z.string()),
  successMetrics: z.array(z.string()),
  dependencies: z.array(z.string()),
  owner: z.string(),
})

const MarcoAdviceSchema = z.object({
  organizationType: z.string(),
  complianceMaturity: z.enum(['beginner', 'intermediate', 'advanced']),
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

Generate a comprehensive compliance roadmap with:
1. Prioritized recommendations (critical first)
2. Implementation phases (3-phase approach)
3. Clear action steps for each recommendation
4. Resource and cost estimates
5. Success metrics

Respond with JSON:
{
  "organizationType": "${organizationType}",
  "complianceMaturity": "beginner | intermediate | advanced",
  "recommendations": [
    {
      "id": "REC-001",
      "title": "Recommendation title",
      "description": "Detailed description",
      "priority": "critical | high | medium | low",
      "category": "policy | process | technology | training | governance | audit",
      "complexity": "simple | moderate | complex",
      "estimatedHours": 40,
      "estimatedCost": "Cost estimate",
      "implementationSteps": ["step 1", "step 2"],
      "successMetrics": ["metric 1"],
      "dependencies": ["related recommendation"],
      "owner": "Who should own this"
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
