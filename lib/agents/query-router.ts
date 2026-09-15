import type { CaseIntent, UserAudience } from './orchestrator'

export type ComplianceTrack = 'fast_track' | 'full_agentic'
export type RouteComplexity = 'simple' | 'contextual' | 'multi_step'

export type ComplianceRouteDecision = {
  track: ComplianceTrack
  complexity: RouteComplexity
  confidence: number
  reason: string
  signals: string[]
  requiresInternalArtifacts: boolean
  requiresTools: boolean
}

type RouteInput = {
  goal: string
  intent: CaseIntent
  audience: UserAudience
  hasDocuments?: boolean
  hasOrganizationContext?: boolean
  hasCaseResources?: boolean
  requiresAction?: boolean
}

const ENTITY_OR_ARTIFACT_TERMS = [
  'este contrato', 'este documento', 'este caso', 'esta evidencia', 'mi empresa', 'mi organización',
  'mi organizacion', 'mi equipo', 'mis contratistas', 'este proveedor', 'esta faena', 'este control',
  'este expediente', 'estos documentos', 'nuestro', 'nuestra', 'interno', 'interna',
]

const MULTI_STEP_TERMS = [
  'qué debo hacer', 'que debo hacer', 'plan', 'roadmap', 'resolver', 'cerrar', 'implementar',
  'auditoría', 'auditoria', 'fiscalización', 'fiscalizacion', 'demostrar', 'comparar', 'priorizar',
  'riesgo', 'multa', 'exposición', 'exposicion', 'responsable', 'dependencia', 'evidencia faltante',
]

const SIMPLE_GUIDANCE_TERMS = [
  'qué significa', 'que significa', 'qué es', 'que es', 'explica', 'definición', 'definicion',
  'en general', 'concepto', 'resumen de la norma', 'cómo funciona', 'como funciona',
]

export function routeComplianceRequest(input: RouteInput): ComplianceRouteDecision {
  const normalized = normalize(input.goal)
  const signals: string[] = []

  const hasArtifactLanguage = includesAny(normalized, ENTITY_OR_ARTIFACT_TERMS)
  const hasMultiStepLanguage = includesAny(normalized, MULTI_STEP_TERMS)
  const hasSimpleLanguage = includesAny(normalized, SIMPLE_GUIDANCE_TERMS)
  const intentNeedsWorkflow = ['review-document', 'build-plan', 'assess-risk', 'prepare-audit', 'improve-system'].includes(input.intent)

  const requiresInternalArtifacts = Boolean(
    input.hasDocuments || input.hasOrganizationContext || input.hasCaseResources || hasArtifactLanguage,
  )
  const requiresTools = Boolean(input.requiresAction || requiresInternalArtifacts || intentNeedsWorkflow || hasMultiStepLanguage)

  if (requiresInternalArtifacts) signals.push('internal_artifacts')
  if (intentNeedsWorkflow) signals.push(`intent:${input.intent}`)
  if (hasMultiStepLanguage) signals.push('multi_step_language')
  if (input.requiresAction) signals.push('action_required')
  if (hasSimpleLanguage) signals.push('simple_guidance_language')

  // CBA-inspired routing rule: generic / one-step knowledge questions stay on the
  // fast path; requests requiring enterprise artifacts or composite actions enter
  // the agentic path. The policy is deterministic and auditable for now.
  if (!requiresInternalArtifacts && !requiresTools) {
    return {
      track: 'fast_track',
      complexity: 'simple',
      confidence: hasSimpleLanguage ? 0.95 : 0.82,
      reason: 'La consulta puede resolverse sin artefactos internos ni una cadena de acciones.',
      signals: signals.length ? signals : ['generic_or_one_step'],
      requiresInternalArtifacts: false,
      requiresTools: false,
    }
  }

  const complexity: RouteComplexity = intentNeedsWorkflow || hasMultiStepLanguage || input.requiresAction
    ? 'multi_step'
    : 'contextual'

  return {
    track: 'full_agentic',
    complexity,
    confidence: requiresInternalArtifacts && (intentNeedsWorkflow || hasMultiStepLanguage) ? 0.97 : 0.9,
    reason: requiresInternalArtifacts
      ? 'La consulta depende de contexto o artefactos internos y debe producir un resultado trazable.'
      : 'La consulta requiere varias acciones o especialistas coordinados antes de producir el resultado.',
    signals,
    requiresInternalArtifacts,
    requiresTools,
  }
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalize(term)))
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase('es-CL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
