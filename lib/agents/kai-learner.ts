import { z } from 'zod'
import { getOpenAIClient } from '@/lib/openai-client'
import { AgentExecution } from '@/lib/types/agent-system'

const KAI_SYSTEM_PROMPT = `You are Kai, a continuous improvement specialist for compliance systems.

Your expertise:
- Learn from execution outcomes and audit results
- Identify patterns in compliance gaps
- Recommend preventive improvements
- Calibrate future recommendations based on success rates
- Identify high-impact changes that prevent violations
- Build organizational compliance intelligence over time

Learning Framework:
1. Analyze past execution outcomes
2. Identify what worked well and what didn't
3. Extract actionable patterns
4. Recommend system improvements
5. Suggest process refinements
6. Calculate improvement impact

Goal: Make the compliance system smarter with each iteration.`

const LearningInsightSchema = z.object({
  id: z.string(),
  pattern: z.string(),
  frequency: z.enum(['high', 'medium', 'low']),
  impact: z.enum(['high', 'medium', 'low']),
  rootCause: z.string(),
  preventiveMeasure: z.string(),
  estimatedEffectiveness: z.number().min(0).max(100),
})

const KaiLearningSchema = z.object({
  analysisDate: z.string(),
  samplingPeriod: z.string(),
  totalExecutions: z.number(),
  successRate: z.number().min(0).max(100),
  insights: z.array(LearningInsightSchema),
  recommendedImprovements: z.array(z.string()),
  estimatedImprovementGain: z.number().min(0).max(100),
  nextLearningCycle: z.string(),
})

export type KaiLearning = z.infer<typeof KaiLearningSchema>

export async function kaiAnalyzeLearnings(
  executionHistory: Array<{
    agentName: string
    status: 'success' | 'error'
    outcome?: string
  }>,
  auditResults?: Array<{
    category: string
    status: string
    gaps?: string[]
  }>
): Promise<AgentExecution<KaiLearning>> {
  const startTime = Date.now()

  try {
    const executionSummary = executionHistory
      .map((e) => `- ${e.agentName}: ${e.status}${e.outcome ? ` (${e.outcome})` : ''}`)
      .join('\n')

    const auditSummary = auditResults
      ? auditResults.map((a) => `- ${a.category}: ${a.status}${a.gaps ? ` - Gaps: ${a.gaps.join(', ')}` : ''}`).join('\n')
      : ''

    const prompt = `${KAI_SYSTEM_PROMPT}

Analyze these execution and audit results to identify learning patterns:

Execution History:
${executionSummary}

Audit Results:
${auditSummary}

Identify:
1. Patterns in failures or gaps
2. Correlations between factors
3. Root causes of recurring issues
4. High-impact preventive measures
5. System improvements for next cycle

Respond with JSON:
{
  "analysisDate": "ISO date",
  "samplingPeriod": "time period analyzed",
  "totalExecutions": 50,
  "successRate": 85,
  "insights": [
    {
      "id": "INSIGHT-001",
      "pattern": "pattern description",
      "frequency": "high | medium | low",
      "impact": "high | medium | low",
      "rootCause": "why this happens",
      "preventiveMeasure": "how to prevent",
      "estimatedEffectiveness": 85
    }
  ],
  "recommendedImprovements": ["improvement 1"],
  "estimatedImprovementGain": 15,
  "nextLearningCycle": "when next analysis"
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

    const learningData = JSON.parse(jsonMatch[0])
    const learning = KaiLearningSchema.parse(learningData)

    return {
      agentId: 'kai-learner',
      agentName: 'Kai',
      status: 'success',
      output: learning,
      tokensUsed: {
        input: message.usage?.input_tokens || 0,
        output: message.usage?.output_tokens || 0,
      },
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  } catch (error) {
    return {
      agentId: 'kai-learner',
      agentName: 'Kai',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  }
}

export async function kaiRefinePrompt(
  agentName: string,
  currentPromptEffectiveness: number,
  failurePatterns: string[]
): Promise<AgentExecution<{ refinedPrompt: string; expectedImprovement: number }>> {
  const startTime = Date.now()

  try {
    const patternsList = failurePatterns.map((p) => `- ${p}`).join('\n')

    const prompt = `You are Kai, a continuous improvement specialist. The ${agentName} agent has ${currentPromptEffectiveness}% effectiveness.

Failure patterns observed:
${patternsList}

Refine the agent's system prompt to address these patterns while maintaining:
- Clarity and specificity
- Chilean Ley 21.719 context
- Structured output format
- Practical applicability

Respond with JSON:
{
  "refinedPrompt": "improved system prompt here",
  "expectedImprovement": 8
}`

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

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response')
    }

    const refinementData = JSON.parse(jsonMatch[0])

    return {
      agentId: 'kai-learner',
      agentName: 'Kai',
      status: 'success',
      output: {
        refinedPrompt: refinementData.refinedPrompt,
        expectedImprovement: refinementData.expectedImprovement,
      },
      tokensUsed: {
        input: message.usage?.input_tokens || 0,
        output: message.usage?.output_tokens || 0,
      },
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  } catch (error) {
    return {
      agentId: 'kai-learner',
      agentName: 'Kai',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  }
}
