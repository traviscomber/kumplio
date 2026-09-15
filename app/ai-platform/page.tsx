import { redirect } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { Activity, Bot, CircleDollarSign, Clock3, Database, Gauge, RotateCcw, Route, Zap } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { summarizeRoutingTelemetry, type TrackMetrics } from '@/lib/compliance-copilot/routing-metrics'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type TelemetryRun = {
  id: string
  organization_id: string | null
  surface: string
  intent: string
  tool_names: string[] | null
  provider: string | null
  model: string | null
  generation_mode: string
  fallback_reason: string | null
  latency_ms: number
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  estimated_cost_usd: number | null
  source_count: number
  action_count: number
  success: boolean
  metadata: Record<string, unknown>
  created_at: string
}

type MetricCard = readonly [label: string, value: string | number, icon: LucideIcon]

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function percentile(values: number[], target: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * target) - 1))
  return sorted[index] ?? 0
}

function formatUsd(value: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(value)
}

function formatPercent(value: number | null) {
  if (value == null) return '—'
  return `${Math.round(value * 1000) / 10}%`
}

function formatMetric(value: number | null, suffix = '') {
  if (value == null) return '—'
  return `${value.toLocaleString('es-CL', { maximumFractionDigits: 2 })}${suffix}`
}

function isAuthorized(input: {
  email: string | null | undefined
  appMetadata: Record<string, unknown>
}) {
  if (input.appMetadata.ai_platform_admin === true || input.appMetadata.regulatory_reviewer === true) return true

  const allowed = (process.env.AI_PLATFORM_ADMIN_EMAILS || process.env.REGULATORY_REVIEWER_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  return Boolean(input.email && allowed.includes(input.email.toLowerCase()))
}

function RoutingColumn({ metrics }: { metrics: TrackMetrics }) {
  const rows = [
    ['Runs', metrics.count.toLocaleString('es-CL')],
    ['Participación', formatPercent(metrics.share)],
    ['Éxito', formatPercent(metrics.successRate)],
    ['Fallback', formatPercent(metrics.fallbackRate)],
    ['Generación omitida', formatPercent(metrics.generationSkippedRate)],
    ['Latencia media', formatMetric(metrics.averageLatencyMs, ' ms')],
    ['Latencia p50', formatMetric(metrics.p50LatencyMs, ' ms')],
    ['Latencia p95', formatMetric(metrics.p95LatencyMs, ' ms')],
    ['Costo medio estimado', formatUsd(metrics.averageEstimatedCostUsd)],
    ['Fuentes medias', formatMetric(metrics.averageSources)],
    ['Acciones medias', formatMetric(metrics.averageActions)],
  ] as const

  return (
    <article className="rounded-2xl border bg-background/40 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">{metrics.track === 'fast_track' ? 'FastTrack' : 'FullAgentic'}</h3>
        <span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {metrics.count} runs
        </span>
      </div>
      <dl className="mt-5 divide-y">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

export default async function AIPlatformDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/ai-platform')

  if (!isAuthorized({
    email: user.email,
    appMetadata: (user.app_metadata || {}) as Record<string, unknown>,
  })) {
    redirect('/dashboard')
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  const currentOrganizationId = membership?.organization_id ? String(membership.organization_id) : null

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ai_platform_runs')
    .select('id,organization_id,surface,intent,tool_names,provider,model,generation_mode,fallback_reason,latency_ms,input_tokens,output_tokens,total_tokens,estimated_cost_usd,source_count,action_count,success,metadata,created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) throw new Error(`No fue posible cargar la telemetría: ${error.message}`)

  const runs: TelemetryRun[] = Array.isArray(data) ? data.map((row) => ({
    id: String(row.id),
    organization_id: typeof row.organization_id === 'string' ? row.organization_id : null,
    surface: typeof row.surface === 'string' ? row.surface : 'copilot',
    intent: String(row.intent),
    tool_names: Array.isArray(row.tool_names) ? row.tool_names.map(String) : [],
    provider: typeof row.provider === 'string' ? row.provider : null,
    model: typeof row.model === 'string' ? row.model : null,
    generation_mode: String(row.generation_mode),
    fallback_reason: typeof row.fallback_reason === 'string' ? row.fallback_reason : null,
    latency_ms: toNumber(row.latency_ms),
    input_tokens: row.input_tokens == null ? null : toNumber(row.input_tokens),
    output_tokens: row.output_tokens == null ? null : toNumber(row.output_tokens),
    total_tokens: row.total_tokens == null ? null : toNumber(row.total_tokens),
    estimated_cost_usd: row.estimated_cost_usd == null ? null : toNumber(row.estimated_cost_usd),
    source_count: toNumber(row.source_count),
    action_count: toNumber(row.action_count),
    success: row.success === true,
    metadata: row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? row.metadata as Record<string, unknown>
      : {},
    created_at: String(row.created_at),
  })) : []

  const llmRuns = runs.filter((run) => run.generation_mode === 'llm_grounded')
  const fallbackRuns = runs.filter((run) => Boolean(run.fallback_reason))
  const latencies = runs.map((run) => toNumber(run.latency_ms))
  const totalTokens = runs.reduce((sum, run) => sum + toNumber(run.total_tokens), 0)
  const totalCost = runs.reduce((sum, run) => sum + toNumber(run.estimated_cost_usd), 0)
  const successful = runs.filter((run) => run.success).length

  const grouped = runs.reduce<Record<string, { count: number; latency: number; fallback: number; tokens: number; cost: number }>>((acc, run) => {
    const current = acc[run.intent] ?? { count: 0, latency: 0, fallback: 0, tokens: 0, cost: 0 }
    current.count += 1
    current.latency += toNumber(run.latency_ms)
    current.fallback += run.fallback_reason ? 1 : 0
    current.tokens += toNumber(run.total_tokens)
    current.cost += toNumber(run.estimated_cost_usd)
    acc[run.intent] = current
    return acc
  }, {})

  const byIntent = Object.entries(grouped).sort(([, left], [, right]) => right.count - left.count)
  const workspaceCopilotRuns = currentOrganizationId
    ? runs.filter((run) => run.organization_id === currentOrganizationId && run.surface === 'copilot')
    : []
  const routingSummary = summarizeRoutingTelemetry(workspaceCopilotRuns)

  const cards: MetricCard[] = [
    ['Ejecuciones', runs.length, Activity],
    ['Éxito', runs.length ? `${Math.round((successful / runs.length) * 100)}%` : '—', Gauge],
    ['LLM grounded', llmRuns.length, Bot],
    ['Fallback', fallbackRuns.length, RotateCcw],
    ['Latencia p50', runs.length ? `${Math.round(percentile(latencies, 0.5))} ms` : '—', Clock3],
    ['Latencia p95', runs.length ? `${Math.round(percentile(latencies, 0.95))} ms` : '—', Zap],
    ['Tokens', totalTokens.toLocaleString('es-CL'), Database],
    ['Costo estimado', formatUsd(totalCost), CircleDollarSign],
  ]

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
        <header>
          <div className="flex items-center gap-2 text-primary">
            <Activity className="h-5 w-5" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">AI Platform</p>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Telemetría operacional</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Últimos 30 días. No se almacenan prompts ni respuestas; solo métricas operacionales, fingerprints y metadatos de ejecución.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value, Icon]) => (
            <article key={label} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-4 text-3xl font-extrabold">{String(value)}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Route className="h-5 w-5" />
                <p className="text-xs font-bold uppercase tracking-[0.18em]">Routing por workspace</p>
              </div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">FastTrack vs FullAgentic</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Sólo ejecuciones Copilot de tu workspace actual durante los últimos 30 días. Esta vista separa tenants y no usa estas métricas como score de cumplimiento.
              </p>
            </div>
            <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${routingSummary.comparisonReady ? 'bg-amber-500/10 text-amber-300' : 'bg-muted text-muted-foreground'}`}>
              {routingSummary.comparisonReady
                ? 'Muestra mínima alcanzada · revisar comparabilidad'
                : `Comparación aún no lista · mínimo ${routingSummary.minimumSamplesPerTrack} por track`}
            </span>
          </div>

          {!currentOrganizationId ? (
            <div className="mt-6 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              No hay un workspace activo asociado a este usuario; no se muestran métricas tenant-scoped.
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <article className="rounded-xl border bg-background/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Muestra clasificada</p>
                  <p className="mt-2 text-2xl font-extrabold">{routingSummary.classifiedSampleSize}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{routingSummary.unknownRouteCount} sin track clasificable</p>
                </article>
                <article className="rounded-xl border bg-background/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">FastTrack</p>
                  <p className="mt-2 text-2xl font-extrabold">{routingSummary.fastTrack.count}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatPercent(routingSummary.fastTrack.share)} de rutas clasificadas</p>
                </article>
                <article className="rounded-xl border bg-background/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">FullAgentic</p>
                  <p className="mt-2 text-2xl font-extrabold">{routingSummary.fullAgentic.count}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatPercent(routingSummary.fullAgentic.share)} de rutas clasificadas</p>
                </article>
                <article className="rounded-xl border bg-background/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Escalaciones</p>
                  <p className="mt-2 text-2xl font-extrabold">{routingSummary.escalatedCount}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatPercent(routingSummary.escalatedRate)} de rutas clasificadas</p>
                </article>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <RoutingColumn metrics={routingSummary.fastTrack} />
                <RoutingColumn metrics={routingSummary.fullAgentic} />
              </div>

              <div className="mt-5 rounded-xl border border-dashed p-4">
                <p className="text-sm font-semibold">Lectura responsable</p>
                <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
                  {routingSummary.caveats.map((caveat) => <li key={caveat}>• {caveat}</li>)}
                </ul>
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl border bg-card">
          <div className="border-b px-5 py-4"><h2 className="font-bold">Rendimiento por intención</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Intención</th>
                  <th className="px-5 py-3">Runs</th>
                  <th className="px-5 py-3">Latencia media</th>
                  <th className="px-5 py-3">Fallback</th>
                  <th className="px-5 py-3">Tokens</th>
                  <th className="px-5 py-3">Costo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {byIntent.map(([intent, metrics]) => (
                  <tr key={intent}>
                    <td className="px-5 py-4 font-semibold">{intent.replaceAll('_', ' ')}</td>
                    <td className="px-5 py-4">{metrics.count}</td>
                    <td className="px-5 py-4">{Math.round(metrics.latency / metrics.count)} ms</td>
                    <td className="px-5 py-4">{metrics.fallback}</td>
                    <td className="px-5 py-4">{metrics.tokens.toLocaleString('es-CL')}</td>
                    <td className="px-5 py-4">{formatUsd(metrics.cost)}</td>
                  </tr>
                ))}
                {!byIntent.length && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Aún no hay ejecuciones registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border bg-card">
          <div className="border-b px-5 py-4"><h2 className="font-bold">Ejecuciones recientes</h2></div>
          <div className="divide-y">
            {runs.slice(0, 25).map((run) => (
              <article key={run.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{run.intent.replaceAll('_', ' ')}</span>
                    <span className="rounded-full border px-2 py-0.5 text-[11px]">{run.generation_mode}</span>
                    {!run.success && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300">error</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(run.created_at).toLocaleString('es-CL')} · {(run.tool_names ?? []).join(', ') || 'sin herramientas'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>{run.latency_ms} ms</span>
                  <span>{toNumber(run.total_tokens).toLocaleString('es-CL')} tokens</span>
                  <span>{formatUsd(run.estimated_cost_usd)}</span>
                  <span>{run.model || 'determinístico'}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
