export type RoutingTrack = 'fast_track' | 'full_agentic' | 'unknown'

export type RoutingTelemetryRow = {
  generation_mode?: string | null
  fallback_reason?: string | null
  latency_ms?: number | null
  estimated_cost_usd?: number | null
  source_count?: number | null
  action_count?: number | null
  success?: boolean | null
  error_code?: string | null
  metadata?: unknown
  created_at?: string | null
}

export type TrackMetrics = {
  track: Exclude<RoutingTrack, 'unknown'>
  count: number
  share: number
  successRate: number | null
  fallbackRate: number | null
  generationSkippedRate: number | null
  averageLatencyMs: number | null
  p50LatencyMs: number | null
  p95LatencyMs: number | null
  averageEstimatedCostUsd: number | null
  averageSources: number | null
  averageActions: number | null
}

export type RoutingMetricsSummary = {
  sampleSize: number
  classifiedSampleSize: number
  unknownRouteCount: number
  fastTrack: TrackMetrics
  fullAgentic: TrackMetrics
  escalatedCount: number
  escalatedRate: number | null
  comparisonReady: boolean
  minimumSamplesPerTrack: number
  caveats: string[]
}

const MINIMUM_SAMPLES_PER_TRACK = 20

export function summarizeRoutingTelemetry(rows: RoutingTelemetryRow[]): RoutingMetricsSummary {
  const classified = rows.map((row) => ({ row, route: readRoute(row.metadata) }))
  const fast = classified.filter((item) => item.route.track === 'fast_track')
  const full = classified.filter((item) => item.route.track === 'full_agentic')
  const unknown = classified.filter((item) => item.route.track === 'unknown')
  const classifiedCount = fast.length + full.length
  const escalatedCount = classified.filter((item) => item.route.escalated).length

  return {
    sampleSize: rows.length,
    classifiedSampleSize: classifiedCount,
    unknownRouteCount: unknown.length,
    fastTrack: summarizeTrack('fast_track', fast, classifiedCount),
    fullAgentic: summarizeTrack('full_agentic', full, classifiedCount),
    escalatedCount,
    escalatedRate: classifiedCount ? roundRate(escalatedCount / classifiedCount) : null,
    comparisonReady: fast.length >= MINIMUM_SAMPLES_PER_TRACK && full.length >= MINIMUM_SAMPLES_PER_TRACK,
    minimumSamplesPerTrack: MINIMUM_SAMPLES_PER_TRACK,
    caveats: [
      'Estas métricas describen comportamiento técnico del routing; no son un score de cumplimiento.',
      'Latencia y costo pueden variar por complejidad de consulta, proveedor, carga y disponibilidad de contexto.',
      `No se debe afirmar superioridad entre tracks hasta tener al menos ${MINIMUM_SAMPLES_PER_TRACK} observaciones de cada track y revisar la comparabilidad de los casos.`,
    ],
  }
}

function summarizeTrack(
  track: Exclude<RoutingTrack, 'unknown'>,
  items: Array<{ row: RoutingTelemetryRow; route: ReturnType<typeof readRoute> }>,
  classifiedCount: number,
): TrackMetrics {
  const rows = items.map((item) => item.row)
  const latencies = numeric(rows.map((row) => row.latency_ms))
  const costs = numeric(rows.map((row) => row.estimated_cost_usd))
  const sources = numeric(rows.map((row) => row.source_count))
  const actions = numeric(rows.map((row) => row.action_count))
  const successValues = rows.map((row) => row.success).filter((value): value is boolean => typeof value === 'boolean')
  const fallbackValues = rows.map((row) => Boolean(row.fallback_reason || row.error_code))
  const generationSkipped = items.map((item) => item.route.generationSkipped)

  return {
    track,
    count: rows.length,
    share: classifiedCount ? roundRate(rows.length / classifiedCount) : 0,
    successRate: successValues.length ? roundRate(successValues.filter(Boolean).length / successValues.length) : null,
    fallbackRate: rows.length ? roundRate(fallbackValues.filter(Boolean).length / rows.length) : null,
    generationSkippedRate: rows.length ? roundRate(generationSkipped.filter(Boolean).length / rows.length) : null,
    averageLatencyMs: average(latencies),
    p50LatencyMs: percentile(latencies, 0.5),
    p95LatencyMs: percentile(latencies, 0.95),
    averageEstimatedCostUsd: average(costs, 6),
    averageSources: average(sources),
    averageActions: average(actions),
  }
}

function readRoute(metadata: unknown): {
  track: RoutingTrack
  escalated: boolean
  generationSkipped: boolean
} {
  const root = asRecord(metadata)
  const routing = asRecord(root.routing)
  const rawTrack = typeof routing.track === 'string' ? routing.track : root.track
  const track: RoutingTrack = rawTrack === 'fast_track' || rawTrack === 'full_agentic' ? rawTrack : 'unknown'
  return {
    track,
    escalated: routing.escalated === true,
    generationSkipped: root.generationSkipped === true,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function numeric(values: Array<number | null | undefined>) {
  return values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0)
}

function average(values: number[], precision = 1) {
  if (!values.length) return null
  const factor = 10 ** precision
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * factor) / factor
}

function percentile(values: number[], quantile: number) {
  if (!values.length) return null
  const ordered = [...values].sort((a, b) => a - b)
  const index = Math.min(ordered.length - 1, Math.max(0, Math.ceil(quantile * ordered.length) - 1))
  return Math.round(ordered[index] * 10) / 10
}

function roundRate(value: number) {
  return Math.round(value * 1000) / 1000
}
