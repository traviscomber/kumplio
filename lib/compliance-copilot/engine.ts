export type CopilotIntent =
  | 'impact_summary'
  | 'action_plan'
  | 'risk_analysis'
  | 'evidence_query'
  | 'version_compare'
  | 'general_navigation'

export type CopilotPlanStep = {
  tool: 'impact_runs' | 'impact_targets' | 'action_plans' | 'graph_nodes' | 'graph_edges' | 'evidence'
  purpose: string
}

export type CopilotResponse = {
  intent: CopilotIntent
  answer: string
  facts: Array<{ label: string; value: string }>
  sources: Array<{ type: string; id: string; label: string }>
  actions: Array<{ label: string; href: string }>
  plan: CopilotPlanStep[]
  generation?: {
    mode: 'deterministic' | 'llm_grounded'
    model?: string
    fallbackReason?: string
  }
  caveats?: string[]
}

export function classifyCopilotIntent(input: string): CopilotIntent {
  const text = input.toLowerCase()
  if (/qué cambió|que cambio|cambio regulatorio|impacto/.test(text)) return 'impact_summary'
  if (/qué debo hacer|que debo hacer|plan|tarea|acción|accion/.test(text)) return 'action_plan'
  if (/riesgo|crítico|critico|preocupa/.test(text)) return 'risk_analysis'
  if (/evidencia|documento|prueba|respaldo/.test(text)) return 'evidence_query'
  if (/comparar|comparación|comparacion|antes|después|despues|versión|version/.test(text)) return 'version_compare'
  return 'general_navigation'
}

export function buildCopilotPlan(intent: CopilotIntent): CopilotPlanStep[] {
  switch (intent) {
    case 'impact_summary':
      return [
        { tool: 'impact_runs', purpose: 'Ubicar el último impacto regulatorio procesado.' },
        { tool: 'impact_targets', purpose: 'Identificar nodos, severidad y alcance afectados.' },
      ]
    case 'action_plan':
      return [
        { tool: 'action_plans', purpose: 'Revisar planes existentes y tareas pendientes.' },
        { tool: 'impact_targets', purpose: 'Detectar impactos aún sin plan.' },
      ]
    case 'risk_analysis':
      return [
        { tool: 'impact_targets', purpose: 'Priorizar objetivos críticos y altos.' },
        { tool: 'graph_nodes', purpose: 'Explicar qué elementos del grafo concentran el riesgo.' },
      ]
    case 'evidence_query':
      return [
        { tool: 'evidence', purpose: 'Revisar evidencia vinculada, suficiencia y vencimiento.' },
        { tool: 'graph_edges', purpose: 'Explicar qué obligación o control respalda cada evidencia.' },
      ]
    case 'version_compare':
      return [
        { tool: 'graph_nodes', purpose: 'Localizar versiones regulatorias relacionadas.' },
        { tool: 'impact_targets', purpose: 'Explicar qué elementos cambiaron o quedaron afectados.' },
      ]
    default:
      return [
        { tool: 'impact_runs', purpose: 'Resumir actividad regulatoria reciente.' },
        { tool: 'action_plans', purpose: 'Mostrar trabajo pendiente y siguiente acción.' },
      ]
  }
}
