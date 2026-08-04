export type AIPlatformIntent =
  | 'impact_summary'
  | 'action_plan'
  | 'risk_analysis'
  | 'evidence_query'
  | 'version_compare'
  | 'general_navigation'

export type AIPlatformAction = { label: string; href: string }
export type AIPlatformFact = { label: string; value: string }
export type AIPlatformSource = { type: string; id: string; label: string }

export type AIPlatformToolName =
  | 'impact_runs'
  | 'impact_targets'
  | 'action_plans'
  | 'graph_nodes'
  | 'graph_edges'
  | 'evidence'

export type AIPlatformPlanStep = {
  tool: AIPlatformToolName
  purpose: string
}

export type AIPlatformGroundedResponse = {
  intent: AIPlatformIntent
  answer: string
  facts: AIPlatformFact[]
  sources: AIPlatformSource[]
  actions: AIPlatformAction[]
  plan: AIPlatformPlanStep[]
  caveats?: string[]
  generation?: {
    mode: 'deterministic' | 'llm_grounded'
    model?: string
    fallbackReason?: string
  }
}

export type AIPlatformToolContext = {
  userId: string
  organizationId?: string | null
}

export type AIPlatformToolDefinition = {
  name: AIPlatformToolName
  description: string
  timeoutMs: number
  estimatedCost: 'low' | 'medium' | 'high'
  permissions: string[]
}
