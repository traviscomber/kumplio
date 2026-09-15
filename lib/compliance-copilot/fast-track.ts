import { chileComplianceGuides, officialLey21719Reference, type ChileComplianceGuide } from '@/lib/chile-compliance-content'
import type { CopilotResponse, CopilotRouting } from './engine'

const INTERNAL_CONTEXT_TERMS = [
  'mi empresa', 'nuestra empresa', 'mi organización', 'mi organizacion', 'nuestra organización', 'nuestra organizacion',
  'mi equipo', 'nuestro equipo', 'mis evidencias', 'nuestras evidencias', 'mis documentos', 'nuestros documentos',
  'mi caso', 'nuestro caso', 'este caso', 'este contrato', 'este documento', 'esta evidencia', 'este proveedor',
  'vencida', 'vencidas', 'vencido', 'vencidos', 'pendiente', 'pendientes', 'abierto', 'abiertos', 'prioridad actual',
]

const TOPIC_TERMS: Record<string, string[]> = {
  'principios-proteccion-datos': [
    'principios de proteccion de datos', 'licitud', 'finalidad', 'proporcionalidad', 'calidad de datos',
    'transparencia', 'confidencialidad', 'responsabilidad en datos',
  ],
  'derechos-titulares': [
    'derechos de los titulares', 'derecho de acceso', 'rectificacion', 'supresion', 'oposicion', 'portabilidad',
    'bloqueo de datos', 'solicitud de titular',
  ],
  'encargados-proveedores': [
    'encargado de datos', 'encargados de datos', 'proveedor que trata datos', 'proveedores que tratan datos',
    'subencargado', 'subencargados', 'articulo 15 bis',
  ],
  'evaluacion-impacto': [
    'evaluacion de impacto', 'evaluacion impacto', 'eipd', 'alto riesgo', 'decisiones automatizadas',
    'monitoreo sistematico', 'tratamiento masivo', 'gran escala', 'articulo 15 ter',
  ],
  'modelo-prevencion': [
    'modelo de prevencion', 'programa de cumplimiento', 'prevencion de infracciones', 'delegado de proteccion de datos',
    'delegado de datos', 'dpo', 'articulos 48 a 52',
  ],
}

export type FastTrackMatch = {
  response: CopilotResponse
  routing: CopilotRouting
  guide: ChileComplianceGuide
}

export function buildOfficialFastTrackResponse(message: string): FastTrackMatch | null {
  const normalized = normalize(message)
  if (!normalized || includesAny(normalized, INTERNAL_CONTEXT_TERMS)) return null

  const ranked = chileComplianceGuides
    .map((guide) => ({ guide, score: scoreGuide(normalized, guide) }))
    .sort((a, b) => b.score - a.score)

  const best = ranked[0]
  const second = ranked[1]
  if (!best || best.score < 4) return null
  if (second && best.score - second.score < 2) return null

  const confidence = Math.min(0.98, 0.78 + best.score * 0.025)
  const routing: CopilotRouting = {
    track: 'fast_track',
    complexity: 'simple',
    confidence: Math.round(confidence * 100) / 100,
    reason: 'La consulta es conceptual, tiene una coincidencia clara en contenido oficial curado y no requiere datos internos de la organización.',
    signals: [`guide:${best.guide.slug}`, 'official_curated_source', 'no_internal_context'],
    escalated: false,
    retrievalHitCount: 1,
  }

  const response: CopilotResponse = {
    intent: 'general_navigation',
    answer: best.guide.directAnswer,
    facts: [
      { label: 'Base legal', value: best.guide.legalBasis },
      ...best.guide.keyPoints.slice(0, 4).map((point, index) => ({ label: `Punto ${index + 1}`, value: point })),
    ],
    sources: [{
      type: 'official_law',
      id: best.guide.slug,
      label: `${officialLey21719Reference.name} · ${best.guide.legalBasis}`,
    }],
    actions: [],
    plan: [],
    caveats: ['Esta orientación es general y no evalúa la situación particular de tu organización.'],
    routing,
    generation: { mode: 'deterministic' },
  }

  return { response, routing, guide: best.guide }
}

function scoreGuide(message: string, guide: ChileComplianceGuide) {
  let score = 0
  const topicTerms = TOPIC_TERMS[guide.slug] || []
  for (const term of topicTerms) {
    const normalizedTerm = normalize(term)
    if (message.includes(normalizedTerm)) score += normalizedTerm.includes(' ') ? 6 : 3
  }

  const guideText = normalize([
    guide.shortTitle,
    guide.title,
    guide.description,
    guide.legalBasis,
    ...guide.keyPoints,
  ].join(' '))
  for (const token of meaningfulTokens(message)) {
    if (guideText.includes(token)) score += 1
  }
  return score
}

function meaningfulTokens(value: string) {
  const stop = new Set(['como', 'cuando', 'donde', 'para', 'porque', 'sobre', 'esto', 'esta', 'este', 'cual', 'cuales', 'que', 'una', 'uno', 'unos', 'unas', 'los', 'las', 'del', 'por', 'con'])
  return unique(value.split(/[^a-z0-9]+/).filter((token) => token.length >= 4 && !stop.has(token)))
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalize(term)))
}

function unique<T>(values: T[]) {
  return [...new Set(values)]
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase('es-CL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
