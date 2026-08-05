export type DocumentKind =
  | 'policy'
  | 'procedure'
  | 'contract'
  | 'evidence'
  | 'regulation'
  | 'report'
  | 'unknown'

export type DocumentClassification = {
  kind: DocumentKind
  confidence: number
  domains: string[]
  signals: string[]
}

const KIND_PATTERNS: Array<{ kind: Exclude<DocumentKind, 'unknown'>; patterns: RegExp[] }> = [
  { kind: 'policy', patterns: [/\bpol[ií]tica\b/i, /\bprincipios?\b/i, /\balcance\b/i] },
  { kind: 'procedure', patterns: [/\bprocedimiento\b/i, /\bpasos?\b/i, /\bresponsable\b/i, /\bflujo\b/i] },
  { kind: 'contract', patterns: [/\bcontrato\b/i, /\bcl[aá]usula\b/i, /\bpartes\b/i, /\bvigencia\b/i] },
  { kind: 'evidence', patterns: [/\bevidencia\b/i, /\bregistro\b/i, /\bacta\b/i, /\bcomprobante\b/i] },
  { kind: 'regulation', patterns: [/\bley\b/i, /\bdecreto\b/i, /\bresoluci[oó]n\b/i, /\bnorma\b/i] },
  { kind: 'report', patterns: [/\binforme\b/i, /\breporte\b/i, /\bhallazgos?\b/i, /\bconclusiones?\b/i] },
]

const DOMAIN_PATTERNS: Array<{ domain: string; patterns: RegExp[] }> = [
  { domain: 'datos-personales', patterns: [/datos personales/i, /tratamiento de datos/i, /encargado del tratamiento/i, /titular(?:es)? de datos/i] },
  { domain: 'seguridad-informacion', patterns: [/seguridad de la informaci[oó]n/i, /incidente(?:s)? de seguridad/i, /control de acceso/i, /ciberseguridad/i] },
  { domain: 'proveedores', patterns: [/proveedor(?:es)?/i, /tercero(?:s)?/i, /subcontrat/i, /due diligence/i] },
  { domain: 'laboral', patterns: [/trabajador(?:es)?/i, /relaci[oó]n laboral/i, /recursos humanos/i, /acoso laboral/i] },
  { domain: 'prevencion-delito', patterns: [/modelo de prevenci[oó]n/i, /delito(?:s)?/i, /canal de denuncias/i, /oficial de cumplimiento/i] },
]

export function classifyDocument(input: { title?: string | null; text?: string | null }): DocumentClassification {
  const source = `${input.title || ''}\n${input.text || ''}`.trim()
  if (!source) return { kind: 'unknown', confidence: 0, domains: [], signals: [] }

  const ranked = KIND_PATTERNS.map(({ kind, patterns }) => {
    const matches = patterns.filter((pattern) => pattern.test(source)).map((pattern) => pattern.source)
    return { kind, score: matches.length, matches }
  }).sort((left, right) => right.score - left.score)

  const winner = ranked[0]
  const kind: DocumentKind = winner?.score ? winner.kind : 'unknown'
  const confidence = winner?.score ? Math.min(95, 45 + winner.score * 15) : 20
  const domains = DOMAIN_PATTERNS
    .filter(({ patterns }) => patterns.some((pattern) => pattern.test(source)))
    .map(({ domain }) => domain)

  return {
    kind,
    confidence,
    domains,
    signals: winner?.matches || [],
  }
}
