import { PRIVACY_NOTICE } from '@/lib/privacy/notice'

export type NoticeMappingCoverage = 'covered' | 'partial' | 'not_covered' | 'not_applicable'

export type NoticeMappingDimension = {
  status: NoticeMappingCoverage
  note: string
}

export type ProcessingNoticeMappingSuggestion = {
  ready: boolean
  noticeVersion: string
  primaryScope: string | null
  mappedScopes: Array<{
    scope: string
    status: NoticeMappingCoverage
    note: string
  }>
  dimensions: {
    purpose: NoticeMappingDimension
    dataSubjects: NoticeMappingDimension
    dataCategories: NoticeMappingDimension
    recipients: NoticeMappingDimension
    rights: NoticeMappingDimension
    transfers: NoticeMappingDimension
    retention: NoticeMappingDimension
  }
  unknowns: string[]
  sourceRefs: Array<{
    type: 'public_notice' | 'process_source' | 'lifecycle_review'
    label: string
    reference: string
  }>
  reviewNote: string
  limitation: string
}

type BuildInput = {
  processName: string
  processCode?: string | null
  purpose?: string | null
  source?: unknown
  lifecycleUnknowns?: unknown
  lifecycleReviewId?: string | null
  lifecycleSnapshotHash?: string | null
}

const PRIMARY_SCOPE_RULES: Array<{ pattern: RegExp; scope: string }> = [
  {
    pattern: /(contact|demostraci[oó]n|lead|comercial)/i,
    scope: 'Solicitudes de contacto y demostración',
  },
  {
    pattern: /(cuenta|autenticaci[oó]n|workspace|acceso|sesi[oó]n)/i,
    scope: 'Creación de cuenta, autenticación y workspace',
  },
  {
    pattern: /(expediente|documento|evidencia|especialista|inteligencia artificial|\bia\b)/i,
    scope: 'Expedientes, documentos, evidencia y resultados asistidos por IA',
  },
]

export function buildProcessingNoticeMappingSuggestion(input: BuildInput): ProcessingNoticeMappingSuggestion {
  const normalizedName = input.processName.trim()
  const primaryScope = PRIMARY_SCOPE_RULES.find((rule) => rule.pattern.test(normalizedName))?.scope || null
  const processSource = normalizeSource(input.source)
  const lifecycleUnknowns = normalizeStrings(input.lifecycleUnknowns)
  const relevantLifecycleUnknowns = lifecycleUnknowns.filter((item) => (
    /(aviso|retenci[oó]n|destinatari|subencargad|transferencia|eliminaci[oó]n|derecho)/i.test(item)
  ))

  const generatedUnknowns = [
    'El aviso público no enumera de forma específica todas las categorías de datos y titulares de esta actividad.',
    'Los destinatarios y subencargados aplicables deben validarse con contratos, accesos y configuración vigente.',
    'La sección general de conservación no acredita un plazo aprobado ni el disparador de eliminación de esta actividad.',
    'Las transferencias internacionales y sus salvaguardas requieren evidencia contractual y técnica separada.',
  ]

  const unknowns = uniqueStrings([...relevantLifecycleUnknowns, ...generatedUnknowns]).slice(0, 10)
  const ready = Boolean(primaryScope && processSource.reference && input.lifecycleReviewId)

  const mappedScopes = primaryScope
    ? [
        {
          scope: primaryScope,
          status: 'covered' as const,
          note: `El aviso identifica el ámbito general que corresponde a “${normalizedName}”; la correspondencia se acepta como mapeo, no como validación jurídica integral.`,
        },
        {
          scope: 'Proveedores tecnológicos y transferencias internacionales',
          status: 'partial' as const,
          note: 'El aviso reconoce proveedores y transferencias, pero no acredita por sí solo el proveedor, rol, país, subencargados ni salvaguardas de esta actividad.',
        },
        {
          scope: 'Derechos del titular y solicitudes de privacidad',
          status: 'partial' as const,
          note: 'El aviso informa un canal general de derechos; falta demostrar el procedimiento y su propagación para esta actividad.',
        },
      ]
    : []

  return {
    ready,
    noticeVersion: PRIVACY_NOTICE.version,
    primaryScope,
    mappedScopes,
    dimensions: {
      purpose: {
        status: primaryScope ? 'covered' : 'not_covered',
        note: input.purpose?.trim()
          ? `Finalidad registrada: ${input.purpose.trim()}`
          : 'La actividad no conserva una finalidad suficientemente descrita.',
      },
      dataSubjects: {
        status: 'partial',
        note: 'El aviso describe grupos generales, pero el inventario debe mantener los titulares específicos de la actividad.',
      },
      dataCategories: {
        status: 'partial',
        note: 'El aviso no reemplaza el inventario detallado de categorías y datos sensibles.',
      },
      recipients: {
        status: 'partial',
        note: 'La cobertura general no valida destinatarios internos, proveedores ni roles contractuales concretos.',
      },
      rights: {
        status: 'partial',
        note: `Existe un canal general mediante ${PRIVACY_NOTICE.contact}; falta evidencia operacional por actividad.`,
      },
      transfers: {
        status: 'partial',
        note: 'El aviso reconoce posibles transferencias, pero no demuestra países, mecanismos ni salvaguardas vigentes.',
      },
      retention: {
        status: 'not_covered',
        note: 'No existe en el aviso un plazo específico, disparador y prueba de eliminación para esta actividad.',
      },
    },
    unknowns,
    sourceRefs: [
      {
        type: 'public_notice',
        label: `${PRIVACY_NOTICE.title} · versión ${PRIVACY_NOTICE.version}`,
        reference: PRIVACY_NOTICE.publicUrl,
      },
      {
        type: 'process_source',
        label: processSource.label || `Fuente observada de ${normalizedName}`,
        reference: processSource.reference || 'Fuente no disponible',
      },
      {
        type: 'lifecycle_review',
        label: `Revisión lifecycle vigente${input.processCode ? ` · ${input.processCode}` : ''}`,
        reference: [input.lifecycleReviewId, input.lifecycleSnapshotHash].filter(Boolean).join(' · '),
      },
    ],
    reviewNote: `Se acepta el ejercicio de mapeo del aviso ${PRIVACY_NOTICE.version} para “${normalizedName}” con brechas explícitas. La aceptación acredita la matriz y sus fuentes; no valida base jurídica, retención, destinatarios, subencargados, transferencias ni eliminación.`,
    limitation: 'Aceptar este mapeo no significa que el aviso sea suficiente ni que la actividad cumpla integralmente.',
  }
}

function normalizeSource(value: unknown): { label: string | null; reference: string | null } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { label: null, reference: null }
  const source = value as Record<string, unknown>
  return {
    label: text(source.label),
    reference: text(source.reference),
  }
}

function normalizeStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim())
    : []
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))]
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}
