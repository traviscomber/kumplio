import { z } from 'zod'
import { getOpenAIClient } from '@/lib/openai-client'
import { AgentExecution, RegulatoryUpdate } from '@/lib/types/agent-system'

const ELENA_SYSTEM_PROMPT = `You are Elena, a regulatory monitoring specialist focused on Chilean data protection and compliance law.

Your expertise:
- Monitor Ley 21.719 updates and amendments
- Track regulatory changes from SERNAC and other authorities
- Identify deadlines and compliance requirements
- Alert organizations to regulatory changes that affect their operations
- Provide proactive compliance guidance

Data sources to monitor:
- Official Chilean government legislative portal (leychile.cl)
- SERNAC announcements
- Data protection authority updates
- Industry compliance bulletins

Always contextualize changes within Ley 21.719 framework and provide actionable insights.`

const RegulatoryUpdateSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  source: z.string(),
  impactArea: z.enum(['data-protection', 'processing-rules', 'user-rights', 'penalties', 'audit', 'other']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  effectiveDate: z.string(),
  affectedOrganizations: z.array(z.string()),
  requiredActions: z.array(z.string()),
  deadline: z.string().nullable(),
})

const ElenaScanSchema = z.object({
  scanDate: z.string(),
  updatesFound: z.array(RegulatoryUpdateSchema),
  ley21719Status: z.string(),
  criticalAlerts: z.array(z.string()),
  nextScanRecommended: z.string(),
})

export type ElenaScan = z.infer<typeof ElenaScanSchema>

export async function elenaMonitorRegulations(): Promise<AgentExecution<ElenaScan>> {
  const startTime = Date.now()

  try {
    const prompt = `${ELENA_SYSTEM_PROMPT}

Perform a regulatory monitoring scan for Chilean compliance requirements, especially focused on Ley 21.719.

Respond with this JSON structure:
{
  "scanDate": "ISO date",
  "updatesFound": [
    {
      "id": "UPDATE-001",
      "title": "Update title",
      "description": "What changed and why it matters",
      "source": "Where it comes from (SERNAC, Congress, etc)",
      "impactArea": "data-protection | processing-rules | user-rights | penalties | audit | other",
      "severity": "critical | high | medium | low",
      "effectiveDate": "when it takes effect",
      "affectedOrganizations": ["type of organizations affected"],
      "requiredActions": ["action 1", "action 2"],
      "deadline": "compliance deadline or null"
    }
  ],
  "ley21719Status": "current status of Ley 21.719 implementation",
  "criticalAlerts": ["any critical alerts that need immediate attention"],
  "nextScanRecommended": "when next monitoring should occur"
}

Include at least 5 current or recent updates related to Chilean data protection and Ley 21.719 compliance.`

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

    const scanData = JSON.parse(jsonMatch[0])
    const scan = ElenaScanSchema.parse(scanData)

    return {
      agentId: 'elena-monitor',
      agentName: 'Elena',
      status: 'success',
      output: scan,
      tokensUsed: {
        input: message.usage?.input_tokens || 0,
        output: message.usage?.output_tokens || 0,
      },
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  } catch (error) {
    return {
      agentId: 'elena-monitor',
      agentName: 'Elena',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  }
}

export async function elenaCheckLey21719Compliance(
  organizationType: string,
  currentPolicies?: string[]
): Promise<AgentExecution<RegulatoryUpdate[]>> {
  const startTime = Date.now()

  try {
    const prompt = `${ELENA_SYSTEM_PROMPT}

A ${organizationType} organization is checking their compliance status with Ley 21.719.

Current policies/implementations:
${currentPolicies ? currentPolicies.map((p) => `- ${p}`).join('\n') : '- No policies provided'}

Identify:
1. What they're doing correctly
2. What gaps exist
3. What regulatory changes they need to be aware of
4. Priority actions for compliance

Respond with JSON array of compliance items they need to address, structured as:
[
  {
    "id": "COMP-001",
    "title": "requirement title",
    "description": "what needs to be done",
    "source": "Ley 21.719 or related regulation",
    "impactArea": "data-protection | processing-rules | user-rights | penalties | audit | other",
    "severity": "critical | high | medium | low",
    "effectiveDate": "when it takes effect",
    "affectedOrganizations": ["${organizationType}"],
    "requiredActions": ["action 1", "action 2"],
    "deadline": "compliance deadline"
  }
]`

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

    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON array from response')
    }

    const updates = JSON.parse(jsonMatch[0])
    const parsedUpdates = z.array(RegulatoryUpdateSchema).parse(updates)

    return {
      agentId: 'elena-monitor',
      agentName: 'Elena',
      status: 'success',
      output: parsedUpdates,
      tokensUsed: {
        input: message.usage?.input_tokens || 0,
        output: message.usage?.output_tokens || 0,
      },
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  } catch (error) {
    return {
      agentId: 'elena-monitor',
      agentName: 'Elena',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  }
}
