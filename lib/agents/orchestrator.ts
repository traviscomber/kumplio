import type { AgentId } from './catalog'
import type { WorkflowType } from './orchestration'

export type UserAudience = 'person' | 'company' | 'professional' | 'industry'

export type CaseIntent =
  | 'understand-change'
  | 'review-document'
  | 'build-plan'
  | 'assess-risk'
  | 'prepare-audit'
  | 'improve-system'
  | 'general-guidance'

export type AgentTask = {
  agentId: AgentId
  title: string
  description: string
  visibleOutcome: string
  order: number
}

export type SpecialistTask = AgentTask & {
  asyncPreferred?: boolean
}

export type OrchestrationPlan = {
  intent: CaseIntent
  audience: UserAudience
  goal: string
  missingContext: string[]
  tasks: AgentTask[]
  specialists: SpecialistTask[]
  finalReviewer: 'catalina'
}

const INTENT_PATTERNS: Array<{ intent: CaseIntent; terms: string[] }> = [
  { intent: 'understand-change', terms: ['cambio', 'ley', 'norma', 'reglamento', 'vigencia', 'diario oficial', 'dictamen', 'nueva norma', 'version'] },
  { intent: 'review-document', terms: ['contrato', 'política', 'procedimiento', 'documento', 'archivo', 'pdf', 'evidencia'] },
  { intent: 'build-plan', terms: ['implementar', 'plan', 'roadmap', 'proyecto', 'cumplir', 'pasos', 'qué hacer'] },
  { intent: 'assess-risk', terms: ['riesgo', 'multa', 'exposición', 'impacto', 'qué pasa si', 'prioridad', 'escenario'] },
  { intent: 'prepare-audit', terms: ['auditoría', 'fiscalización', 'inspección', 'demostrar', 'control', 'hallazgo'] },
  { intent: 'improve-system', terms: ['mejorar', 'desempeño', 'tendencia', 'recurrente', 'recurrencia', 'demora', 'cuello de botella', 'tiempo de ciclo'] },
]

export function inferCaseIntent(goal: string): CaseIntent {
  const normalized = normalize(goal)
  let best: { intent: CaseIntent; score: number } = { intent: 'general-guidance', score: 0 }

  for (const candidate of INTENT_PATTERNS) {
    const score = candidate.terms.reduce((total, term) => total + (normalized.includes(normalize(term)) ? 1 : 0), 0)
    if (score > best.score) best = { intent: candidate.intent, score }
  }

  return best.intent
}

export function workflowTypeForIntent(intent: CaseIntent): WorkflowType {
  if (intent === 'review-document') return 'contract_review'
  if (intent === 'prepare-audit' || intent === 'improve-system') return 'control_assessment'
  return 'compliance_assessment'
}

export function buildOrchestrationPlan(input: {
  goal: string
  audience?: UserAudience
  hasDocuments?: boolean
  hasOrganizationContext?: boolean
  hasDeadline?: boolean
}): OrchestrationPlan {
  const audience = input.audience ?? 'company'
  const intent = inferCaseIntent(input.goal)
  const missingContext = collectMissingContext({ ...input, audience })
  const tasks = buildCoreTasks(input.goal)
  const specialists = buildSpecialists(intent, input.goal)

  return {
    intent,
    audience,
    goal: input.goal.trim(),
    missingContext,
    tasks,
    specialists,
    finalReviewer: 'catalina',
  }
}

function buildCoreTasks(goal: string): AgentTask[] {
  return [
    {
      agentId: 'isidora',
      title: 'Analizar',
      description: `Identificar hechos, fuentes, obligaciones, aplicabilidad, información faltante y triage de riesgo acotado para: ${goal}`,
      visibleOutcome: 'Análisis trazable y priorizado',
      order: 1,
    },
    {
      agentId: 'veronica',
      title: 'Resolver',
      description: 'Contrastar obligaciones con controles y evidencia, identificar brechas y proponer acciones correctivas con criterios de cierre.',
      visibleOutcome: 'Resolución y siguientes acciones',
      order: 2,
    },
    {
      agentId: 'catalina',
      title: 'Revisar',
      description: 'Revisar independientemente sustento, contradicciones, reservas y decisiones que requieren aprobación humana.',
      visibleOutcome: 'Recomendación final revisada',
      order: 3,
    },
  ]
}

function buildSpecialists(intent: CaseIntent, goal: string): SpecialistTask[] {
  const specialists: SpecialistTask[] = []
  const add = (task: Omit<SpecialistTask, 'order'>) => {
    if (specialists.some((item) => item.agentId === task.agentId)) return
    specialists.push({ ...task, order: specialists.length + 1 })
  }

  for (const agentId of ['beatriz', 'rodrigo', 'javier', 'andres'] as const) {
    if (!requiresSpecialist(agentId, intent, goal)) continue
    if (agentId === 'beatriz') {
      add({ agentId, title: 'Cambio regulatorio', description: 'Comparar fuentes o versiones, vigencia y delta regulatorio cuando el caso depende de un cambio oficial.', visibleOutcome: 'Cambio y vigencia contextualizados' })
    } else if (agentId === 'rodrigo') {
      add({ agentId, title: 'Análisis cuantitativo de riesgo', description: 'Modelar escenarios, sensibilidad o exposición cuantitativa que excede el triage rutinario.', visibleOutcome: 'Escenarios y supuestos de riesgo' })
    } else if (agentId === 'javier') {
      add({ agentId, title: 'Plan de ejecución', description: 'Construir RACI, rollout o roadmap multi-fase cuando la remediación requiere planificación dedicada.', visibleOutcome: 'Plan de ejecución estructurado' })
    } else {
      add({ agentId, title: 'Aprendizaje organizacional', description: 'Analizar recurrencias, tendencias y tiempos de ciclo fuera del camino crítico del caso.', visibleOutcome: 'Patrones y oportunidades de mejora', asyncPreferred: true })
    }
  }

  return specialists
}

export function requiresSpecialist(agentId: Extract<AgentId, 'beatriz' | 'rodrigo' | 'javier' | 'andres'>, intent: CaseIntent, goal: string) {
  const normalized = normalize(goal)
  const includesAny = (terms: string[]) => terms.some((term) => normalized.includes(normalize(term)))

  if (agentId === 'beatriz') {
    return intent === 'understand-change' || includesAny(['qué cambió', 'que cambio', 'nueva norma', 'nueva ley', 'versión', 'version', 'vigencia', 'entra en vigencia', 'fecha efectiva', 'diario oficial'])
  }
  if (agentId === 'rodrigo') {
    return includesAny(['modelar', 'escenario', 'sensibilidad', 'impacto financiero', 'exposición financiera', 'exposicion financiera', 'cuantificar', 'monto de multa', 'probabilidad detallada'])
  }
  if (agentId === 'javier') {
    return includesAny(['raci', 'rollout', 'por fases', 'multi-fase', 'multifase', 'gestión del cambio', 'gestion del cambio', 'roadmap complejo', 'dependencias complejas'])
  }
  return intent === 'improve-system' || includesAny(['recurrencia', 'recurrente', 'tendencia', 'tiempo de ciclo', 'cuello de botella', 'aprendizaje organizacional'])
}

function collectMissingContext(input: {
  audience: UserAudience
  hasDocuments?: boolean
  hasOrganizationContext?: boolean
  hasDeadline?: boolean
}): string[] {
  const missing: string[] = []
  if (!input.hasDeadline) missing.push('plazo o fecha objetivo')
  if (!input.hasDocuments) missing.push('documentos o evidencia disponible')
  if ((input.audience === 'company' || input.audience === 'industry') && !input.hasOrganizationContext) {
    missing.push('áreas, procesos y responsables involucrados')
  }
  if (input.audience === 'person') missing.push('situación personal relevante y resultado esperado')
  return missing
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase('es-CL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
