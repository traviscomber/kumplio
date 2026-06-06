import { z } from 'zod'
import { getOpenAIClient } from '@/lib/openai-client'
import { AgentExecution } from '@/lib/types/agent-system'

const LAURA_SYSTEM_PROMPT = `You are Laura, a compliance auditor for Chilean organizations.

Your expertise:
- Verify compliance status against Ley 21.719 requirements
- Track implementation of recommended actions
- Identify gaps between planned and actual compliance
- Generate audit reports with findings and evidence
- Validate that implemented controls are effective
- Maintain compliance evidence trails

Audit Methodology:
1. Review documented policies and procedures
2. Verify implementation through evidence
3. Test control effectiveness
4. Identify deviations and gaps
5. Rate compliance level for each requirement
6. Provide audit trail documentation

Focus on Chilean regulatory context and practicality of compliance.`

const AuditFindingSchema = z.object({
  id: z.string(),
  requirement: z.string(),
  status: z.enum(['compliant', 'partial', 'non-compliant', 'not-applicable']),
  evidence: z.string(),
  gaps: z.array(z.string()),
  recommendations: z.array(z.string()),
  dueDate: z.string().nullable(),
})

const LauraAuditSchema = z.object({
  auditDate: z.string(),
  auditScope: z.string(),
  overallComplianceScore: z.number().min(0).max(100),
  complianceLevel: z.enum(['fully-compliant', 'substantially-compliant', 'partially-compliant', 'non-compliant']),
  findings: z.array(AuditFindingSchema),
  criticalGaps: z.array(z.string()),
  positiveFindings: z.array(z.string()),
  nextAuditDate: z.string(),
})

export type LauraAudit = z.infer<typeof LauraAuditSchema>

export async function lauraAuditCompliance(
  implementedActions: Array<{ action: string; evidence?: string }>,
  requirements: string[]
): Promise<AgentExecution<LauraAudit>> {
  const startTime = Date.now()

  try {
    const actionsList = implementedActions
      .map((a) => `- ${a.action}${a.evidence ? ` (Evidence: ${a.evidence})` : ''}`)
      .join('\n')
    const requirementsList = requirements.map((r) => `- ${r}`).join('\n')

    const prompt = `${LAURA_SYSTEM_PROMPT}

Perform a compliance audit for a Chilean organization under Ley 21.719.

Requirements to audit:
${requirementsList}

Implemented Actions and Evidence:
${actionsList}

For each requirement, verify:
1. Whether it's been addressed
2. Quality of implementation
3. Evidence of compliance
4. Any remaining gaps

Respond with JSON:
{
  "auditDate": "ISO date",
  "auditScope": "Ley 21.719 compliance audit",
  "overallComplianceScore": 75,
  "complianceLevel": "partially-compliant",
  "findings": [
    {
      "id": "FINDING-001",
      "requirement": "requirement being audited",
      "status": "compliant | partial | non-compliant | not-applicable",
      "evidence": "evidence found or lack thereof",
      "gaps": ["gap 1", "gap 2"],
      "recommendations": ["recommendation 1"],
      "dueDate": "deadline or null"
    }
  ],
  "criticalGaps": ["critical gap 1"],
  "positiveFindings": ["area doing well"],
  "nextAuditDate": "when next audit should occur"
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

    const auditData = JSON.parse(jsonMatch[0])
    const audit = LauraAuditSchema.parse(auditData)

    return {
      agentId: 'laura-auditor',
      agentName: 'Laura',
      status: 'success',
      output: audit,
      tokensUsed: {
        input: message.usage?.input_tokens || 0,
        output: message.usage?.output_tokens || 0,
      },
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  } catch (error) {
    return {
      agentId: 'laura-auditor',
      agentName: 'Laura',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  }
}

export async function lauraTrackProgress(
  originalRequirements: string[],
  completedActions: string[],
  inProgressActions: string[]
): Promise<AgentExecution<{ completionRate: number; progressSummary: string; nextSteps: string[] }>> {
  const startTime = Date.now()

  try {
    const prompt = `You are Laura, a compliance auditor. Calculate and summarize compliance progress.

Original Requirements (${originalRequirements.length}):
${originalRequirements.map((r) => `- ${r}`).join('\n')}

Completed Actions (${completedActions.length}):
${completedActions.map((a) => `- ${a}`).join('\n')}

In Progress (${inProgressActions.length}):
${inProgressActions.map((a) => `- ${a}`).join('\n')}

Calculate:
1. Completion rate (%)
2. Summary of progress made
3. Next steps

Respond with JSON:
{
  "completionRate": 60,
  "progressSummary": "Summary of what's been done",
  "nextSteps": ["step 1", "step 2"]
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

    const progressData = JSON.parse(jsonMatch[0])

    return {
      agentId: 'laura-auditor',
      agentName: 'Laura',
      status: 'success',
      output: {
        completionRate: progressData.completionRate,
        progressSummary: progressData.progressSummary,
        nextSteps: progressData.nextSteps,
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
      agentId: 'laura-auditor',
      agentName: 'Laura',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    }
  }
}
