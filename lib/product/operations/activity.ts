export type OperationalActivityItem = {
  id: string
  label: string
  detail: string | null
  occurredAt: string
  href: string
  context: string | null
}

export type OperationalActivityInput = {
  caseEvents: Array<{
    id: string
    caseId: string
    caseTitle?: string | null
    eventType: string
    summary?: string | null
    createdAt: string
  }>
  continuousReviews: Array<{
    id: string
    date: string
    headline: string
    changesFound: number
    criticalItems: number
  }>
  limit?: number
}

export function buildOperationalActivity(input: OperationalActivityInput): OperationalActivityItem[] {
  const caseItems: OperationalActivityItem[] = input.caseEvents.map((event) => ({
    id: `case:${event.id}`,
    label: labelForEvent(event.eventType),
    detail: event.summary?.trim() || null,
    occurredAt: event.createdAt,
    href: `/app/casos/${event.caseId}`,
    context: event.caseTitle?.trim() || null,
  }))

  const continuousItems: OperationalActivityItem[] = input.continuousReviews.map((row) => ({
    id: `continuous:${row.id}`,
    label: 'Análisis actualizado',
    detail: row.headline,
    occurredAt: row.date,
    href: '/app/inicio',
    context: row.changesFound > 0 || row.criticalItems > 0
      ? `${row.changesFound} cambios · ${row.criticalItems} críticos`
      : 'Revisión continua',
  }))

  const limit = clamp(input.limit || 50, 1, 100)
  return [...caseItems, ...continuousItems]
    .sort((a, b) => timestamp(b.occurredAt) - timestamp(a.occurredAt) || a.id.localeCompare(b.id))
    .slice(0, limit)
}

function labelForEvent(type: string) {
  const normalized = type.toLowerCase()
  if (normalized.includes('created')) return 'Caso creado'
  if (normalized.includes('evidence') || normalized.includes('artifact')) return 'Evidencia agregada'
  if (normalized.includes('review_requested') || normalized.includes('pending_review')) return 'Revisión solicitada'
  if (normalized.includes('review') || normalized.includes('approved') || normalized.includes('rejected')) return 'Revisión completada'
  if (normalized.includes('action') || normalized.includes('plan')) return 'Acción actualizada'
  if (normalized.includes('closed') || normalized.includes('completed')) return 'Caso cerrado'
  return 'Análisis actualizado'
}

function timestamp(value: string) {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
