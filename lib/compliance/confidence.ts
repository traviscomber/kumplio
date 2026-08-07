export type ConfidenceDimension = {
  key: string
  label: string
  score: number
  covered: number
  total: number
  detail: string
  href: string
  weight: number
}

export type ConfidenceCap = {
  key: string
  maximum: number
  reason: string
}

export type ComplianceConfidence = {
  overall: number | null
  raw: number | null
  dimensions: ConfidenceDimension[]
  caps: ConfidenceCap[]
  basis: string[]
  scope: string
}

type ConfidenceInput = {
  obligations: Array<Record<string, unknown>>
  controls: Array<Record<string, unknown>>
  controlObligations: Array<Record<string, unknown>>
  controlEvidence: Array<Record<string, unknown>>
  evidence: Array<Record<string, unknown>>
}

const SCOPE = 'Confianza del alcance registrado. No equivale a cumplimiento global ni a una certificación.'

export function calculateComplianceConfidence(input: ConfidenceInput): ComplianceConfidence {
  if (input.controls.length === 0) {
    return {
      overall: null,
      raw: null,
      dimensions: [],
      caps: [],
      basis: ['Aún no existen controles registrados para calcular una confianza operacional defendible.'],
      scope: SCOPE,
    }
  }

  const obligationIds = new Set(input.obligations.map((row) => String(row.id)))
  const coveredObligationIds = new Set(
    input.controlObligations
      .map((row) => String(row.obligation_id))
      .filter((id) => obligationIds.has(id)),
  )
  const controlsWithOwner = input.controls.filter((row) => Boolean(row.owner_id)).length
  const controlsWithSufficientEvidence = new Set(
    input.controlEvidence
      .filter((row) => row.sufficiency_status === 'sufficient')
      .map((row) => String(row.control_id)),
  ).size
  const validEvidence = input.evidence.filter((row) =>
    ['valid', 'validated', 'accepted'].includes(String(row.validation_status)),
  ).length

  const design = effectivenessSummary(input.controls, 'design_effectiveness')
  const operating = effectivenessSummary(input.controls, 'operating_effectiveness')

  const dimensions: ConfidenceDimension[] = []
  if (input.obligations.length > 0) {
    dimensions.push({
      key: 'obligations',
      label: 'Requerimientos con control',
      score: percentage(coveredObligationIds.size, input.obligations.length),
      covered: coveredObligationIds.size,
      total: input.obligations.length,
      detail: 'Requerimientos del alcance registrado vinculados al menos a un control.',
      href: '/obligations',
      weight: 15,
    })
  }

  dimensions.push(
    {
      key: 'owners',
      label: 'Responsables definidos',
      score: percentage(controlsWithOwner, input.controls.length),
      covered: controlsWithOwner,
      total: input.controls.length,
      detail: 'Controles con una persona responsable asignada.',
      href: '/accountability',
      weight: 10,
    },
    {
      key: 'evidence',
      label: 'Evidencia suficiente',
      score: percentage(controlsWithSufficientEvidence, input.controls.length),
      covered: controlsWithSufficientEvidence,
      total: input.controls.length,
      detail: 'Controles con evidencia revisada como suficiente para su alcance declarado.',
      href: '/evidence',
      weight: 20,
    },
    {
      key: 'design',
      label: 'Efectividad de diseño',
      score: design.score,
      covered: design.effective,
      total: design.total,
      detail: effectivenessDetail(design),
      href: '/controls',
      weight: 20,
    },
    {
      key: 'operating',
      label: 'Efectividad operacional',
      score: operating.score,
      covered: operating.effective,
      total: operating.total,
      detail: effectivenessDetail(operating),
      href: '/controls',
      weight: 25,
    },
  )

  if (input.evidence.length > 0) {
    dimensions.push({
      key: 'evidence_quality',
      label: 'Evidencia validada',
      score: percentage(validEvidence, input.evidence.length),
      covered: validEvidence,
      total: input.evidence.length,
      detail: 'Evidencias aceptadas o validadas sobre el total registrado.',
      href: '/evidence',
      weight: 10,
    })
  }

  const totalWeight = dimensions.reduce((sum, item) => sum + item.weight, 0)
  const raw = Math.round(dimensions.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight)
  const caps = confidenceCaps(input, design, operating, controlsWithSufficientEvidence)
  const overall = Math.min(raw, ...caps.map((cap) => cap.maximum), 100)

  return {
    overall,
    raw,
    dimensions,
    caps,
    basis: [
      ...dimensions.map((item) => `${item.label}: ${item.score}% (${item.covered}/${item.total}).`),
      ...caps.map((cap) => `Tope ${cap.maximum}%: ${cap.reason}`),
      SCOPE,
    ],
    scope: SCOPE,
  }
}

type EffectivenessSummary = {
  total: number
  effective: number
  partial: number
  ineffective: number
  notEvaluated: number
  score: number
}

function effectivenessSummary(controls: Array<Record<string, unknown>>, field: string): EffectivenessSummary {
  const applicable = controls.filter((row) => String(row[field] || 'not_evaluated') !== 'not_applicable')
  const values = applicable.map((row) => String(row[field] || 'not_evaluated'))
  const effective = values.filter((value) => value === 'effective').length
  const partial = values.filter((value) => value === 'partial').length
  const ineffective = values.filter((value) => value === 'ineffective').length
  const notEvaluated = values.filter((value) => value === 'not_evaluated').length
  const points = effective * 100 + partial * 50
  return {
    total: applicable.length,
    effective,
    partial,
    ineffective,
    notEvaluated,
    score: applicable.length > 0 ? Math.round(points / applicable.length) : 0,
  }
}

function confidenceCaps(
  input: ConfidenceInput,
  design: EffectivenessSummary,
  operating: EffectivenessSummary,
  controlsWithSufficientEvidence: number,
): ConfidenceCap[] {
  const caps: ConfidenceCap[] = []
  if (input.obligations.length === 0) {
    caps.push({ key: 'no_requirements', maximum: 45, reason: 'no hay requerimientos del alcance vinculables a los controles.' })
  }
  if (design.ineffective > 0) {
    caps.push({ key: 'design_ineffective', maximum: 40, reason: 'existe al menos un control con diseño inefectivo.' })
  } else if (design.notEvaluated > 0) {
    caps.push({ key: 'design_unassessed', maximum: 60, reason: 'existen controles cuyo diseño todavía no fue evaluado.' })
  }
  if (operating.ineffective > 0) {
    caps.push({ key: 'operating_ineffective', maximum: 35, reason: 'existe al menos un control operacionalmente inefectivo.' })
  } else if (operating.notEvaluated > 0) {
    caps.push({ key: 'operating_unassessed', maximum: 50, reason: 'existen controles cuya operación todavía no fue evaluada.' })
  } else if (operating.partial > 0) {
    caps.push({ key: 'operating_partial', maximum: 65, reason: 'la operación es parcial y todavía requiere completar o probar el universo.' })
  }
  if (controlsWithSufficientEvidence === 0) {
    caps.push({ key: 'no_sufficient_evidence', maximum: 50, reason: 'ningún control tiene evidencia revisada como suficiente.' })
  }
  return caps
}

function effectivenessDetail(summary: EffectivenessSummary) {
  return `${summary.effective} efectivos, ${summary.partial} parciales, ${summary.ineffective} inefectivos y ${summary.notEvaluated} sin evaluar.`
}

function percentage(covered: number, total: number) {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((covered / total) * 100)))
}
