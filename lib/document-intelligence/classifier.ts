export type DocumentClassification =
  | 'contract'
  | 'policy'
  | 'procedure'
  | 'evidence'
  | 'minutes'
  | 'other'

export type ClassifiedDocument = {
  classification: DocumentClassification
  confidence: number
  reason: string
  metadata: Record<string, string | number | boolean | null>
}

const RULES: Array<{
  classification: DocumentClassification
  patterns: RegExp[]
  reason: string
}> = [
  {
    classification: 'contract',
    patterns: [/contrato/i, /acuerdo/i, /dpa/i, /anexo/i, /proveedor/i],
    reason: 'El nombre contiene términos habituales de contratos o acuerdos con terceros.',
  },
  {
    classification: 'policy',
    patterns: [/pol[ií]tica/i, /privacidad/i, /seguridad/i, /retenci[oó]n/i, /protecci[oó]n de datos/i],
    reason: 'El nombre contiene términos habituales de políticas corporativas.',
  },
  {
    classification: 'procedure',
    patterns: [/procedimiento/i, /protocolo/i, /instructivo/i, /manual/i, /flujo/i],
    reason: 'El nombre contiene términos habituales de procedimientos o instrucciones.',
  },
  {
    classification: 'minutes',
    patterns: [/acta/i, /comit[eé]/i, /directorio/i, /reuni[oó]n/i, /minuta/i],
    reason: 'El nombre contiene términos habituales de actas o registros de reuniones.',
  },
  {
    classification: 'evidence',
    patterns: [/evidencia/i, /certificado/i, /registro/i, /respaldo/i, /comprobante/i, /informe/i],
    reason: 'El nombre contiene términos habituales de evidencia o respaldo.',
  },
]

export function classifyDocument(input: {
  name: string
  currentType?: string | null
  fileUrl?: string | null
}): ClassifiedDocument {
  const source = `${input.name} ${input.currentType || ''}`.trim()
  const matched = RULES.find((rule) => rule.patterns.some((pattern) => pattern.test(source)))
  const extension = extensionFrom(input.name || input.fileUrl || '')

  if (!matched) {
    return {
      classification: 'other',
      confidence: 0.45,
      reason: 'No se encontraron señales suficientes para asignar una categoría específica.',
      metadata: { extension, originalType: input.currentType || null },
    }
  }

  const matches = matched.patterns.filter((pattern) => pattern.test(source)).length
  return {
    classification: matched.classification,
    confidence: Math.min(0.98, 0.72 + matches * 0.08),
    reason: matched.reason,
    metadata: { extension, originalType: input.currentType || null, matchedSignals: matches },
  }
}

function extensionFrom(value: string) {
  const clean = value.split('?')[0]
  const match = clean.match(/\.([a-z0-9]{2,8})$/i)
  return match?.[1]?.toLowerCase() || null
}
