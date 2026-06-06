import { z } from 'zod'
import { getOpenAIClient } from '@/lib/openai-client'
import { AgentExecution, RiskAssessment } from '@/lib/types/agent-system'

const BRUNO_SYSTEM_PROMPT = `You are Bruno, a compliance risk assessment specialist for Chilean organizations.

Your expertise:
- Quantify compliance risks with penalty calculations under Ley 21.719
- Assess probability and impact of non-compliance
- Calculate financial exposure (fines range from 50 to 200 UF per violation)
- Identify critical risk areas that need immediate attention
- Provide risk prioritization for remediation efforts

Ley 21.719 Penalties (Chilean context):
- Minor infractions: 50-100 UF (Unidad de Fomento)
- Major infractions: 100-200 UF
- Multiple violations can accumulate
- Each violation counts separately for each affected person
- Consider reputational damage beyond fines

Risk Assessment Framework:
1. Identify all compliance gaps
2. Calculate probability (high/medium/low)
3. Estimate financial impact in UF
4. Consider reputational risk
5. Prioritize by total exposure

Always base assessments on Ley 21.719 framework.`

const RiskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  riskArea: z.string(),
  probability: z.enum(['high', 'medium', 'low']),
  impact: z.enum(['critical', 'high', 'medium', 'low']),
  estimatedPenalty: z.object({
    minUF: z.number(),
    maxUF: z.number(),
    currency: z.literal('UF'),
  }),
  affectedParties: z.array(z.string()),
  mitigationSteps: z.array(z.string()),
  timelineToResolve: z.string(),
})

const BrunoAssessmentSchema = z.object({
  assessmentDate: z.string(),
  organizationType: z.string(),
  overallRiskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['critical', 'high', 'medium', 'low']),
  totalExposureUF: z.object({
    minimum: z.number(),
    maximum: z.number(),
  }),
  risks: z.array(RiskSchema),
  criticalGaps: z.array(z.string()),
  immediateActions: z.array(z.string()),
  recommendedTimeline: z.string(),
})

export type BrunoAssessment = z.infer<typeof BrunoAssessmentSchema>

export async function brunoAssessRisks(
  complianceGaps: string[],
  organizationType: string,
  currentControls?: string[]
): Promise<AgentExecution<BrunoAssessment>> {
  const startTime = Date.now()

  try {
    const prompt = `${BRUNO_SYSTEM_PROMPT}

Assess compliance risks for a ${organizationType} organization with the following gaps:

Identified Gaps:
${complianceGaps.map((gap) => `- ${gap}`).join('\n')}

Current Controls:
${currentControls ? currentControls.map((c) => `- ${c}`).join('\n') : '- No controls in place'}

Provide a detailed risk assessment with:
1. Overall risk score (0-100)
2. Risk level classification
3. Estimated financial exposure in UF (Chilean Unidad de Fomento)
4. Individual risk items with penalty ranges
5. Critical gaps that need immediate attention
6. Specific mitigation steps

Respond with this JSON structure:
{
  "assessmentDate": "ISO date",
  "organizationType": "${organizationType}",
  "overallRiskScore": 75,
  "riskLevel": "high",
  "totalExposureUF": {
    "minimum": 500,
    "maximum": 2000
  },
  "risks": [
    {
      "id": "RISK-001",
      "title": "Risk title",
      "description": "detailed description",
      "riskArea": "data-protection | processing | user-rights | security | audit | other",
      "probability": "high | medium | low",
      "impact": "critical | high | medium | low",
      "estimatedPenalty": {
        "minUF": 50,
        "maxUF": 200,
        "currency": "UF"
      },
      "affectedParties": ["who is affected"],
      "mitigationSteps": ["step 1", "step 2"],
      "timelineToResolve": "estimated timeline"
    }
  ],
  "criticalGaps": ["gap 1", "gap 2"],
  "immediateActions": ["action 1", "action 2"],
  "recommendedTimeline": "Recommended compliance timeline"
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

    const assessmentData = JSON.parse(jsonMatch[0])
    const assessment = BrunoAssessmentSchema.parse(assessmentData)

    return {
      agentId: 'bruno-risk',
      agentName: 'Bruno',
      status: 'success',
      output: assessment,
      tokensUsed: {
        input: message.usage?.input_tokens || 0,
        output: message.usage?.output_tokens || 0,
      },
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  } catch (error) {
    return {
      agentId: 'bruno-risk',
      agentName: 'Bruno',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  }
}

export async function brunoCalculatePenalties(
  violations: Array<{ type: string; count: number }>
): Promise<AgentExecution<{ minPenalty: number; maxPenalty: number; perViolation: number; total: number }>> {
  const startTime = Date.now()

  try {
    const violationsList = violations.map((v) => `- ${v.type} (${v.count} occurrences)`).join('\n')

    const prompt = `You are Bruno, a compliance risk assessor. Calculate penalties under Ley 21.719 for these violations:

${violationsList}

Under Ley 21.719:
- Each violation can result in 50-200 UF in fines
- Each affected person/record counts as separate violation
- Multiple violations can accumulate

Calculate:
1. Minimum penalty in UF
2. Maximum penalty in UF
3. Per-violation average
4. Total exposure

Respond with JSON:
{
  "minPenalty": 500,
  "maxPenalty": 2000,
  "perViolation": 150,
  "total": 1500
}`

    const message = await getOpenAIClient().messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
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

    const penaltyData = JSON.parse(jsonMatch[0])

    return {
      agentId: 'bruno-risk',
      agentName: 'Bruno',
      status: 'success',
      output: {
        minPenalty: penaltyData.minPenalty,
        maxPenalty: penaltyData.maxPenalty,
        perViolation: penaltyData.perViolation,
        total: penaltyData.total,
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
      agentId: 'bruno-risk',
      agentName: 'Bruno',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  }
}
