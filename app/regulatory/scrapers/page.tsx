import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Activity, AlertTriangle, CheckCircle2, Clock3, DatabaseZap, PauseCircle, RefreshCw } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Operación de scrapers',
  description: 'Salud, ejecuciones, reintentos y fallas de conectores regulatorios.',
  robots: { index: false, follow: false },
}

const statusLabel: Record<string, string> = {
  queued: 'En cola',
  running: 'Ejecutando',
  succeeded: 'Completada',
  unchanged: 'Sin cambios',
  failed: 'Fallida',
  blocked: 'Bloqueada',
  requires_review: 'Requiere revisión',
  dead_letter: 'Dead letter',
  cancelled: 'Cancelada',
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin registro'
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default async function ScraperOperationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')

  const [{ data: connectors }, { data: runs }] = await Promise.all([
    supabase
      .from('scraper_connectors')
      .select('id, connector_key, display_name, connector_version, adapter_type, status, circuit_state, consecutive_failures, parser_health, last_started_at, last_succeeded_at, last_unchanged_at, last_failed_at, last_error_code')
      .order('display_name'),
    supabase
      .from('scraper_runs')
      .select('id, connector_id, status, trigger_type, attempt, requested_url, started_at, finished_at, duration_ms, byte_size, section_count, change_count, error_code, retryable, created_at')
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const connectorById = new Map((connectors || []).map((connector) => [connector.id, connector]))
  const activeRuns = (runs || []).filter((run) => ['queued', 'running'].includes(run.status)).length
  const failedRuns = (runs || []).filter((run) => ['failed', 'dead_letter'].includes(run.status)).length
  const reviewRuns = (runs || []).filter((run) => run.status === 'requires_review').length

  return (
    <main className="min-h-screen bg-slate-50">
      <WorkspaceNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Regulatory Evidence Engine</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Operación de scrapers</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Cada ejecución queda encolada, toma un lease, registra métricas y termina en revisión, sin cambios, retry o dead letter.
            </p>
          </div>
          <a href="/regulatory/capture" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
            <DatabaseZap className="h-4 w-4" /> Ejecutar LeyChile
          </a>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard icon={<Clock3 className="h-5 w-5" />} label="Activas" value={activeRuns} />
          <SummaryCard icon={<RefreshCw className="h-5 w-5" />} label="Requieren revisión" value={reviewRuns} />
          <SummaryCard icon={<AlertTriangle className="h-5 w-5" />} label="Fallidas / dead letter" value={failedRuns} />
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-950">Conectores</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {(connectors || []).map((connector) => (
              <article key={connector.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{connector.display_name}</p>
                    <p className="mt-1 text-xs text-slate-500">{connector.connector_key} · {connector.connector_version}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{connector.status}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <Metric label="Circuito" value={connector.circuit_state} warning={connector.circuit_state !== 'closed'} />
                  <Metric label="Parser" value={connector.parser_health} warning={connector.parser_health === 'failed'} />
                  <Metric label="Fallos consecutivos" value={String(connector.consecutive_failures)} warning={connector.consecutive_failures > 0} />
                  <Metric label="Adaptador" value={connector.adapter_type} />
                </div>
                <dl className="mt-5 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between gap-4"><dt>Último éxito</dt><dd className="text-right">{formatDate(connector.last_succeeded_at)}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Último sin cambios</dt><dd className="text-right">{formatDate(connector.last_unchanged_at)}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Último error</dt><dd className="text-right">{connector.last_error_code || 'Sin errores'}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-950">Últimas ejecuciones</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Conector</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Intento</th>
                    <th className="px-4 py-3">Secciones</th><th className="px-4 py-3">Cambios</th><th className="px-4 py-3">Duración</th><th className="px-4 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(runs || []).map((run) => {
                    const connector = connectorById.get(run.connector_id)
                    return (
                      <tr key={run.id} className="text-slate-700">
                        <td className="px-4 py-3"><p className="font-medium text-slate-950">{connector?.display_name || 'Conector'}</p><p className="text-xs text-slate-500">{run.trigger_type}</p></td>
                        <td className="px-4 py-3"><RunStatus status={run.status} errorCode={run.error_code} /></td>
                        <td className="px-4 py-3">{run.attempt}</td><td className="px-4 py-3">{run.section_count ?? '—'}</td><td className="px-4 py-3">{run.change_count ?? '—'}</td>
                        <td className="px-4 py-3">{run.duration_ms ? `${Math.round(run.duration_ms / 1000)} s` : '—'}</td><td className="px-4 py-3 whitespace-nowrap">{formatDate(run.created_at)}</td>
                      </tr>
                    )
                  })}
                  {!runs?.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Todavía no hay ejecuciones registradas.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3 text-slate-600">{icon}<span className="text-sm">{label}</span></div><p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p></div>
}
function Metric({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 font-medium ${warning ? 'text-amber-700' : 'text-slate-900'}`}>{value}</p></div>
}
function RunStatus({ status, errorCode }: { status: string; errorCode?: string | null }) {
  const Icon = ['succeeded', 'unchanged'].includes(status) ? CheckCircle2 : ['failed', 'dead_letter'].includes(status) ? AlertTriangle : status === 'blocked' ? PauseCircle : Activity
  return <div><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"><Icon className="h-3.5 w-3.5" />{statusLabel[status] || status}</span>{errorCode && <p className="mt-1 text-xs text-rose-600">{errorCode}</p>}</div>
}
