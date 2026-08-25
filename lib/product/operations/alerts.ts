export type OperationalAlert = {
  id: string
  category: 'Decisión requerida' | 'Revisión pendiente' | 'Evidencia requerida' | 'Acción pendiente' | 'Cambio relevante'
  title: string
  reason: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  occurredAt: string | null
  href: string
}

export type OperationalAlertInput = {
  priorities: Array<{
    id: string
    type: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    title: string
    summary: string
    href?: string | null
  }>
  cases: Array<{
    id: string
    title: string
    status: string
    updatedAt?: string | null
  }>
}

const categoryWeight: Record<OperationalAlert['category'], number> = {
  'Decisión requerida': 0,
  'Revisión pendiente': 1,
  'Evidencia requerida': 2,
  'Acción pendiente': 3,
  'Cambio relevante': 4,
}

const severityWeight: Record<OperationalAlert['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export function buildOperationalAlerts(input: OperationalAlertInput): OperationalAlert[] {
  const priorityAlerts: OperationalAlert[] = input.priorities.map((priority) => ({
    id: `priority:${priority.id}`,
    category: categoryForPriority(priority.type),
    title: priority.title,
    reason: priority.summary,
    severity: priority.severity,
    occurredAt: null,
    href: canonicalHref(priority.href),
  }))

  const caseAlerts = input.cases.flatMap((item): OperationalAlert[] => {
    const category = categoryForCaseStatus(item.status)
    if (!category) return []
    return [{
      id: `case:${item.id}:${item.status}`,
      category,
      title: item.title,
      reason: reasonForCaseStatus(item.status),
      severity: severityForCaseStatus(item.status),
      occurredAt: item.updatedAt || null,
      href: `/app/casos/${item.id}`,
    }]
  })

  return dedupe([...priorityAlerts, ...caseAlerts])
    .sort((a, b) => categoryWeight[a.category] - categoryWeight[b.category]
      || severityWeight[a.severity] - severityWeight[b.severity]
      || timestamp(b.occurredAt) - timestamp(a.occurredAt)
      || a.id.localeCompare(b.id))
}

function categoryForPriority(type: string): OperationalAlert['category'] {
  const normalized = type.toLowerCase()
  if (normalized.includes('review')) return 'Revisión pendiente'
  if (normalized.includes('evidence') || normalized.includes('document')) return 'Evidencia requerida'
  if (normalized.includes('change') || normalized.includes('regulatory') || normalized.includes('regulation')) return 'Cambio relevante'
  return 'Acción pendiente'
}

function categoryForCaseStatus(status: string): OperationalAlert['category'] | null {
  if (status === 'pending_review') return 'Revisión pendiente'
  if (status === 'changes_requested' || status === 'failed') return 'Decisión requerida'
  return null
}

function reasonForCaseStatus(status: string) {
  if (status === 'pending_review') return 'Hay un resultado persistido que necesita revisión humana antes de continuar.'
  if (status === 'changes_requested') return 'El caso requiere una decisión o instrucciones adicionales para poder avanzar.'
  return 'Una etapa no pudo completarse y requiere una decisión para retomar el trabajo.'
}

function severityForCaseStatus(status: string): OperationalAlert['severity'] {
  if (status === 'failed') return 'high'
  if (status === 'changes_requested') return 'high'
  return 'medium'
}

function canonicalHref(href?: string | null) {
  if (!href) return '/app/inicio'
  if (href === '/app' || href.startsWith('/app/')) return href
  const caseMatch = href.match(/^\/cases\/([^/]+)$/)
  if (caseMatch) return `/app/casos/${caseMatch[1]}`
  if (href === '/documents') return '/app/documentos'
  if (href === '/evidence') return '/app/evidencia'
  return '/app/inicio'
}

function dedupe(alerts: OperationalAlert[]) {
  const seen = new Set<string>()
  return alerts.filter((alert) => {
    const key = `${alert.href}|${alert.category}|${alert.title}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function timestamp(value: string | null) {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}
