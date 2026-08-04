import { redirect } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { Activity, Bot, CircleDollarSign, Clock3, Database, Gauge, RotateCcw, Zap } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type TelemetryRun = {
  id: string
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
  estimated_cost_usd: number | string | null
  success: boolean
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

function formatUsd(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(value)
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

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ai_platform_runs')
    .select('id,intent,tool_names,provider,model,generation_mode,fallback_reason,latency_ms,input_tokens,output_tokens,total_tokens,estimated_cost_usd,success,created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) throw new Error(`No fue posible cargar la telemetría: ${error.message}`)

  const runs: TelemetryRun[] = Array.isArray(data) ? data.map((row) => ({
    id: String(row.id),
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
    estimated_cost_usd: row.estimated_cost_usd == null ? null : String(row.estimated_cost_usd),
    success: row.success === true,
    created_at: String(row.created_at),
  })) : []

  const llmRuns = runs.filter((run) => run.generation_mode === 'llm_grounded')
  const fallbackRuns = runs.filter((run) => run.generation_mode === 'deterministic')
  const latencies = runs.map((run) => toNumber(run.latency_ms))
  const totalTokens = runs.reduce((sum, run) => sum + toNumber(run.total_tokens), 0)
  const totalCost = runs.reduce((sum, run) => sum + toNumber(run.estimated_cost_usd), 0)
  const successful = runs.filter((run) => run.success).length

  const grouped = runs.reduce<Record<string, { count: number; latency: number; fallback: number; tokens: number; cost: number }>>((acc, run) => {
    const current = acc[run.intent] ?? { count: 0, latency: 0, fallback: 0, tokens: 0, cost: 0 }
    current.count += 1
    current.latency += toNumber(run.latency_ms)
    current.fallback += run.generation_mode === 'deterministic' ? 1 : 0
    current.tokens += toNumber(run.total_tokens)
    current.cost += toNumber(run.estimated_cost_usd)
    acc[run.intent] = current
    return acc
  }, {})

  const byIntent = Object.entries(grouped).sort(([, left], [, right]) => right.count - left.count)

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
                  <span>{formatUsd(toNumber(run.estimated_cost_usd))}</span>
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
