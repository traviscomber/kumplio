import type { AgentId } from './catalog'

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

export type OrchestrationPlan = {
  intent: CaseIntent
  audience: UserAudience
  goal: string
  missingContext: string[]
  tasks: AgentTask[]
  finalReviewer: AgentId
}

const INTENT_PATTERNS: Array<{ intent: CaseIntent; terms: string[] }> = [
  { intent: 'understand-change', terms: ['cambio', 'ley', 'norma', 'reglamento', 'vigencia', 'diario oficial', 'dictamen'] },
  { intent: 'review-document', terms: ['contrato', 'política', 'procedimiento', 'documento', 'archivo', 'pdf', 'evidencia'] },
  { intent: 'build-plan', terms: ['implementar', 'plan', 'roadmap', 'proyecto', 'cumplir', 'pasos', 'qué hacer'] },
  { intent: 'assess-risk', terms: ['riesgo', 'multa', 'exposición', 'impacto', 'qué pasa si', 'prioridad'] },
  { intent: 'prepare-audit', terms: ['auditoría', 'fiscalización', 'inspección', 'demostrar', 'control', 'hallazgo'] },
  { intent: 'improve-system', terms: ['mejorar', 'desempeño', 'tendencia', 'recurrente', 'demora', 'cuello de botella'] },
]

export function inferCaseIntent(goal: string): CaseIntent {
  const normalized = normalize(goal)
  let best: { intent: CaseIntent; score: number } = { intent: 'general-guidance', score: 0 }

  for (const candidate of INTENT_PATTERNS) {
    const score = candidate.terms.reduce((total, term) => total + (normalized.includes(term) ? 1 : 0), 0)
    if (score > best.score) best = { intent: candidate.intent, score }
  }

  return best.intent
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
  const tasks = buildTasks(intent, input.goal)

  return {
    intent,
    audience,
    goal: input.goal.trim(),
    missingContext,
    tasks,
    finalReviewer: 'catalina',
  }
}

function buildTasks(intent: CaseIntent, goal: string): AgentTask[] {
  const tasks: AgentTask[] = []
  const add = (agentId: AgentId, title: string, description: string, visibleOutcome: string) => {
    if (tasks.some((task) => task.agentId === agentId)) return
    tasks.push({ agentId, title, description, visibleOutcome, order: tasks.length + 1 })
  }

  if (intent === 'understand-change') {
    add('beatriz', 'Revisar el cambio oficial', `Identificar qué cambió, su fuente, publicación y vigencia para: ${goal}`, 'Cambio y vigencia identificados')
    add('isidora', 'Relacionar obligaciones y documentos', 'Mapear el cambio contra obligaciones, contratos, políticas y evidencia disponibles.', 'Documentos y obligaciones afectados')
    add('rodrigo', 'Evaluar impacto y urgencia', 'Estimar materialidad, urgencia y escenarios con supuestos explícitos.', 'Impacto y prioridad explicados')
    add('javier', 'Preparar el plan', 'Convertir el análisis en pasos simples, ordenados y con criterio de cierre.', 'Plan guiado listo')
  } else if (intent === 'review-document') {
    add('isidora', 'Analizar el documento', `Clasificar, comparar y extraer obligaciones del documento relacionado con: ${goal}`, 'Hallazgos y vacíos documentales')
    add('rodrigo', 'Medir el impacto', 'Determinar qué hallazgos requieren atención y cuáles pueden postergarse.', 'Riesgos priorizados')
    add('javier', 'Preparar acciones', 'Traducir los hallazgos en un plan breve y ejecutable.', 'Siguientes pasos claros')
  } else if (intent === 'build-plan') {
    add('isidora', 'Reunir requisitos y evidencia', 'Identificar obligaciones, documentos existentes y brechas que condicionan el objetivo.', 'Requisitos y brechas estructurados')
    add('rodrigo', 'Ordenar por riesgo y urgencia', 'Priorizar el trabajo por impacto, plazo y confianza de la información.', 'Prioridades justificadas')
    add('javier', 'Construir el plan guiado', `Diseñar fases, quick wins, dependencias y criterios de cierre para: ${goal}`, 'Plan ejecutable y tiempo estimado')
    add('veronica', 'Validar el cierre', 'Definir qué evidencia demostrará que cada etapa quedó realmente terminada.', 'Checklist de cierre y respaldo')
  } else if (intent === 'assess-risk') {
    add('isidora', 'Verificar hechos y fuentes', 'Separar obligaciones y evidencia verificable de supuestos no sustentados.', 'Base factual trazable')
    add('rodrigo', 'Modelar el riesgo', `Construir escenarios de impacto, probabilidad, urgencia y confianza para: ${goal}`, 'Riesgo cuantificado y explicado')
    add('javier', 'Proponer mitigación', 'Convertir los principales riesgos en acciones priorizadas y realistas.', 'Plan de mitigación')
  } else if (intent === 'prepare-audit') {
    add('isidora', 'Organizar obligaciones y evidencia', 'Relacionar controles, documentos, responsables y evidencias disponibles.', 'Expediente trazable')
    add('veronica', 'Probar controles y evidencia', `Evaluar suficiencia, vigencia y brechas para: ${goal}`, 'Estado de preparación para auditoría')
    add('javier', 'Cerrar brechas', 'Preparar acciones concretas para resolver hallazgos antes de la revisión.', 'Plan de remediación')
  } else if (intent === 'improve-system') {
    add('andres', 'Analizar desempeño y precedentes', `Detectar recurrencias, cuellos de botella y valor obtenido en: ${goal}`, 'Oportunidades de mejora medibles')
    add('rodrigo', 'Priorizar mejoras', 'Ordenar oportunidades por impacto, esfuerzo y urgencia.', 'Mejoras priorizadas')
    add('javier', 'Diseñar experimentos', 'Convertir oportunidades en cambios pequeños, medibles y reversibles.', 'Plan de mejora continua')
  } else {
    add('isidora', 'Entender el contexto disponible', `Identificar hechos, documentos, obligaciones y preguntas abiertas para: ${goal}`, 'Contexto estructurado')
    add('rodrigo', 'Determinar qué importa', 'Separar lo urgente de lo importante y explicitar incertidumbre.', 'Prioridad y seguridad para decidir')
    add('javier', 'Guiar el siguiente paso', 'Proponer la ruta mínima necesaria para avanzar sin sobrecargar al usuario.', 'Primera acción clara')
  }

  add('catalina', 'Revisar calidad y claridad', 'Verificar fuentes, separar hechos de inferencias y adaptar el resultado a la audiencia.', 'Recomendación final clara y respaldada')
  return tasks
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
