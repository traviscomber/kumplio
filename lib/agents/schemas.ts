import { z } from 'zod'
import type { AgentId } from './catalog'

const confidence = z.number().min(0).max(1)
const sourceRef = z.object({
  label: z.string(),
  quote: z.string().nullable(),
  location: z.string().nullable(),
})

const common = {
  summary: z.string(),
  limitations: z.array(z.string()),
  humanReview: z.object({
    required: z.literal(true),
    reasons: z.array(z.string()),
    escalation: z.array(z.string()),
  }),
}

const schemas = {
  isidora: z.object({
    ...common,
    obligations: z.array(z.object({
      statement: z.string(),
      classification: z.enum(['obligation', 'deadline', 'responsibility', 'requirement', 'risk']),
      subject: z.string().nullable(),
      action: z.string(),
      condition: z.string().nullable(),
      deadline: z.string().nullable(),
      expectedEvidence: z.array(z.string()),
      inference: z.boolean(),
      confidence,
      sources: z.array(sourceRef),
    })),
    missingInformation: z.array(z.string()),
  }),
  rodrigo: z.object({
    ...common,
    risks: z.array(z.object({
      name: z.string(),
      cause: z.string(),
      event: z.string(),
      consequences: z.array(z.string()),
      impact: z.enum(['low', 'medium', 'high', 'critical', 'unknown']),
      likelihood: z.enum(['rare', 'unlikely', 'possible', 'likely', 'almost_certain', 'unknown']),
      inherentRisk: z.enum(['low', 'medium', 'high', 'critical', 'unknown']),
      residualRisk: z.enum(['low', 'medium', 'high', 'critical', 'unknown']),
      assumptions: z.array(z.string()),
      quantitativeScenario: z.object({
        supported: z.boolean(),
        low: z.number().nullable(),
        base: z.number().nullable(),
        high: z.number().nullable(),
        currency: z.string().nullable(),
        formula: z.string().nullable(),
      }),
      confidence,
      sources: z.array(sourceRef),
    })),
    priorities: z.array(z.string()),
  }),
  javier: z.object({
    ...common,
    phases: z.array(z.object({
      name: z.string(),
      objective: z.string(),
      sequence: z.number().int().positive(),
      actions: z.array(z.object({
        title: z.string(),
        description: z.string(),
        ownerRole: z.string().nullable(),
        dependencies: z.array(z.string()),
        effort: z.enum(['small', 'medium', 'large', 'unknown']),
        target: z.string().nullable(),
        acceptanceCriteria: z.array(z.string()),
        closureEvidence: z.array(z.string()),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
      })),
    })),
    executionRisks: z.array(z.string()),
  }),
  beatriz: z.object({
    ...common,
    sourceStatus: z.enum(['official_in_force', 'official_not_in_force', 'draft', 'unverified', 'hypothetical']),
    changes: z.array(z.object({
      topic: z.string(),
      previousRule: z.string().nullable(),
      newRule: z.string(),
      effectiveDate: z.string().nullable(),
      affectedObligations: z.array(z.string()),
      affectedControls: z.array(z.string()),
      recommendedActions: z.array(z.string()),
      confidence,
      sources: z.array(sourceRef),
    })),
    verificationRequired: z.array(z.string()),
  }),
  veronica: z.object({
    ...common,
    controlAssessments: z.array(z.object({
      control: z.string(),
      designConclusion: z.enum(['effective', 'partially_effective', 'ineffective', 'not_tested']),
      implementationConclusion: z.enum(['implemented', 'partially_implemented', 'not_implemented', 'not_tested']),
      operatingConclusion: z.enum(['effective', 'partially_effective', 'ineffective', 'not_tested']),
      evidenceAssessment: z.enum(['sufficient', 'partially_sufficient', 'insufficient', 'absent']),
      exceptions: z.array(z.string()),
      missingEvidence: z.array(z.string()),
      confidence,
      sources: z.array(sourceRef),
    })),
    findings: z.array(z.object({
      title: z.string(),
      criterion: z.string(),
      condition: z.string(),
      cause: z.string().nullable(),
      effect: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      recommendation: z.string(),
      nonComplianceConfirmed: z.boolean(),
    })),
  }),
  andres: z.object({
    ...common,
    indicators: z.array(z.object({
      name: z.string(),
      type: z.enum(['KPI', 'KRI', 'quality', 'capacity']),
      definition: z.string(),
      formula: z.string(),
      dataSource: z.array(z.string()),
      frequency: z.string(),
      ownerRole: z.string().nullable(),
      baseline: z.string().nullable(),
      proposedTarget: z.string().nullable(),
      targetIsSuggestion: z.boolean(),
      dataQuality: z.enum(['high', 'medium', 'low', 'unknown']),
    })),
    trends: z.array(z.object({
      observation: z.string(),
      evidence: z.array(sourceRef),
      causalityClaimed: z.boolean(),
      confidence,
    })),
    improvementExperiments: z.array(z.object({
      hypothesis: z.string(),
      intervention: z.string(),
      successMeasure: z.string(),
      duration: z.string().nullable(),
    })),
  }),
  catalina: z.object({
    ...common,
    assertions: z.array(z.object({
      statement: z.string(),
      verdict: z.enum(['supported', 'partially_supported', 'unsupported', 'contradicted']),
      rationale: z.string(),
      requiredEvidence: z.array(z.string()),
      sources: z.array(sourceRef),
    })),
    contradictions: z.array(z.string()),
    reservations: z.array(z.string()),
    decisionRecommendation: z.enum(['approve', 'approve_with_reservations', 'request_changes', 'reject', 'insufficient_information']),
    requiredApprovers: z.array(z.string()),
  }),
} satisfies Record<AgentId, z.ZodTypeAny>

const jsonSchemas: Record<AgentId, Record<string, unknown>> = Object.fromEntries(
  Object.entries(schemas).map(([agentId, schema]) => [agentId, z.toJSONSchema(schema)]),
) as Record<AgentId, Record<string, unknown>>

export type AgentOutput = z.infer<(typeof schemas)[AgentId]>

export function getAgentOutputSchema(agentId: AgentId) {
  return {
    name: `kumplio_${agentId}_output`,
    schema: jsonSchemas[agentId],
    version: '1.0.0',
  }
}

export function parseAgentOutput(agentId: AgentId, value: unknown): AgentOutput {
  return schemas[agentId].parse(value) as AgentOutput
}
