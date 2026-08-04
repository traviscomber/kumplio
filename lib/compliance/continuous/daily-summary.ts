import type { SupabaseClient } from '@supabase/supabase-js'

export type ComplianceStatus = 'healthy' | 'attention' | 'critical'
export type FindingSeverity = 'low' | 'medium' | 'high' | 'critical'

export type DailyPriority = {
  id: string
  type: string
  severity: FindingSeverity
  title: string
  summary: string
  why: string | null
  action: string
  href: string | null
  estimatedMinutes: number
}

export type DailyComplianceSummary = {
  id: string
  organizationId: string
  status: ComplianceStatus
  headline: string
  summary: string
  changesFound: number
  criticalItems: number
  priorities: DailyPriority[]
  reviewedAt: string
  engineVersion: string
}

export type ComplianceTimelineItem = {
  id: string
  date: string
  status: ComplianceStatus
  headline: string
  changesFound: number
  criticalItems: number
}

type DailyRunRow = {
  id: string
  organization_id: string
  overall_status: ComplianceStatus
  headline: string | null
  summary: string | null
  changes_found: number
  critical_items: number
  priorities: unknown
  finished_at: string | null
  started_at: string
  engine_version: string
}

export async function refreshDailyComplianceSummary(
  admin: SupabaseClient,
  organizationId: string,
): Promise<DailyComplianceSummary> {
  const { data, error } = await admin.rpc('refresh_compliance_daily_summary_v1', {
    p_organization_id: organizationId,
  })

  if (error) {
    throw new Error(`No fue posible ejecutar la revisión continua: ${error.message}`)
  }

  const row = data as DailyRunRow | null
  if (!row) {
    throw new Error('La revisión continua no devolvió un resumen.')
  }

  return mapDailyRun(row)
}

export async function getLatestDailyComplianceSummary(
  admin: SupabaseClient,
  organizationId: string,
): Promise<DailyComplianceSummary | null> {
  const { data, error } = await admin
    .from('compliance_daily_runs')
    .select('id,organization_id,overall_status,headline,summary,changes_found,critical_items,priorities,finished_at,started_at,engine_version')
    .eq('organization_id', organizationId)
    .eq('status', 'completed')
    .order('run_date', { ascending: false })
    .order('finished_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`No fue posible cargar el último resumen: ${error.message}`)
  }

  return data ? mapDailyRun(data as DailyRunRow) : null
}

export async function getComplianceTimeline(
  admin: SupabaseClient,
  organizationId: string,
  limit = 7,
): Promise<ComplianceTimelineItem[]> {
  const { data, error } = await admin
    .from('compliance_daily_runs')
    .select('id,overall_status,headline,changes_found,critical_items,finished_at,started_at')
    .eq('organization_id', organizationId)
    .eq('status', 'completed')
    .order('run_date', { ascending: false })
    .order('finished_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`No fue posible cargar la actividad reciente: ${error.message}`)
  }

  return (data || []).map((row) => ({
    id: String(row.id),
    date: String(row.finished_at || row.started_at),
    status: normalizeStatus(row.overall_status),
    headline: String(row.headline || 'Revisión de cumplimiento completada.'),
    changesFound: Number(row.changes_found || 0),
    criticalItems: Number(row.critical_items || 0),
  }))
}

function mapDailyRun(row: DailyRunRow): DailyComplianceSummary {
  return {
    id: row.id,
    organizationId: row.organization_id,
    status: row.overall_status,
    headline: row.headline || 'Hoy no encontré asuntos críticos.',
    summary: row.summary || 'Con la información disponible, la organización se mantiene estable.',
    changesFound: Number(row.changes_found || 0),
    criticalItems: Number(row.critical_items || 0),
    priorities: normalizePriorities(row.priorities),
    reviewedAt: row.finished_at || row.started_at,
    engineVersion: row.engine_version,
  }
}

function normalizePriorities(value: unknown): DailyPriority[] {
  if (!Array.isArray(value)) return []

  return value.slice(0, 3).flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const severity = normalizeSeverity(row.severity)

    return [{
      id: String(row.id || ''),
      type: String(row.type || 'finding'),
      severity,
      title: String(row.title || 'Situación que requiere revisión'),
      summary: String(row.summary || 'Existe una situación de cumplimiento pendiente.'),
      why: typeof row.why === 'string' && row.why.trim() ? row.why : null,
      action: String(row.action || 'Revisar la situación.'),
      href: typeof row.href === 'string' && row.href.trim() ? row.href : null,
      estimatedMinutes: Math.max(1, Number(row.estimatedMinutes || 5)),
    }]
  })
}

function normalizeSeverity(value: unknown): FindingSeverity {
  if (value === 'critical' || value === 'high' || value === 'medium' || value === 'low') return value
  return 'medium'
}

function normalizeStatus(value: unknown): ComplianceStatus {
  if (value === 'healthy' || value === 'attention' || value === 'critical') return value
  return 'attention'
}
