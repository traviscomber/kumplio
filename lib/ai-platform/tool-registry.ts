import type { AIPlatformPlanStep, AIPlatformToolDefinition, AIPlatformToolName } from './types'

const tools: Record<AIPlatformToolName, AIPlatformToolDefinition> = {
  impact_runs: {
    name: 'impact_runs',
    description: 'Consulta ejecuciones de propagación regulatoria.',
    timeoutMs: 4_000,
    estimatedCost: 'low',
    permissions: ['compliance:read'],
  },
  impact_targets: {
    name: 'impact_targets',
    description: 'Consulta objetivos afectados y severidad.',
    timeoutMs: 4_000,
    estimatedCost: 'low',
    permissions: ['compliance:read'],
  },
  action_plans: {
    name: 'action_plans',
    description: 'Consulta planes de acción y su estado.',
    timeoutMs: 4_000,
    estimatedCost: 'low',
    permissions: ['plans:read'],
  },
  graph_nodes: {
    name: 'graph_nodes',
    description: 'Consulta nodos del Compliance Graph.',
    timeoutMs: 5_000,
    estimatedCost: 'medium',
    permissions: ['graph:read'],
  },
  graph_edges: {
    name: 'graph_edges',
    description: 'Consulta relaciones del Compliance Graph.',
    timeoutMs: 5_000,
    estimatedCost: 'medium',
    permissions: ['graph:read'],
  },
  evidence: {
    name: 'evidence',
    description: 'Consulta evidencia, integridad y vencimiento.',
    timeoutMs: 4_000,
    estimatedCost: 'low',
    permissions: ['evidence:read'],
  },
}

export function getAIPlatformTool(name: AIPlatformToolName) {
  return tools[name]
}

export function validateAIPlatformPlan(plan: AIPlatformPlanStep[]) {
  for (const step of plan) {
    if (!tools[step.tool]) throw new Error(`Herramienta no registrada: ${step.tool}`)
  }
  return plan
}

export function listAIPlatformTools() {
  return Object.values(tools)
}
