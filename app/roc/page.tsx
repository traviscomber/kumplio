import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Radar,
  ShieldAlert,
} from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type ImpactRun = {
  id: string
  status: string
  trigger_kind: string
  trigger_reference: Record<string, unknown>
  metrics: Record<string, unknown>
  organization_id: string | null
  queued_at: string
  finished_at: string | null
}

function metricNumber(metrics: Record<string, unknown>, key: string) {
  const value = metrics[key]
  return typeof value === 'number' ? value : Number(value || 0)
}

function triggerLabel(kind: string) {
  const labels: Record<string, string> = {
    regulatory_version: 'Nueva versión regulatoria',
    claim_revision: 'Revisión de claim',
    profile_change: 'Cambio de perfil',
    manual_recalculation: 'Revisión manual',
  }
  return labels[kind] || 'Impacto regulatorio'
}

function severity(run: ImpactRun) {
  const critical = metricNumber(run.metrics, 'critical')
  const high = metricNumber(run.metrics, 'high')
  if (critical > 0) return { label: 'Crítico', className: 'border-red-500/30 bg-red-500/10 text-red-200' }
  if (high > 0) return { label: 'Alto', className: 'border-orange-500/30 bg-orange-500/10 text-orange-200' }
  return { label: 'Medio', className: 'border-amber-500/30 bg-amber-500/10 text-amber-100' }
}

export default async function RegulatoryOperationsCenterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/roc')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('regulatory_impact_runs')
    .select('id,status,trigger_kind,trigger_reference,metrics,organization_id,queued_at,finished_at')
    .order('queued_at', { ascending: false })
    .limit(30)

  if (error) throw new Error(`No fue posible cargar el centro de operaciones: ${error.message}`)

  const runs = (data || []) as ImpactRun[]
  const openRuns = runs.filter((run) => ['queued', 'running', 'succeeded'].includes(run.status))
  const critical = runs.reduce((sum, run) => sum + metricNumber(run.metrics, 'critical'), 0)
  const reviewRequired = runs.reduce((sum, run) => sum + metricNumber(run.metrics, 'review_required'), 0)
  const affectedOrganizations = new Set(runs.filter((run) => run.organization_id).map((run) => run.organization_id)).size
  const resolved = runs.filter((run) => ['unchanged'].includes(run.status)).length

  const kpis = [
    { label: 'Impactos activos', value: openRuns.length, icon: Radar, detail: 'Runs trazables en la cola' },
    { label: 'Objetivos críticos', value: critical, icon: ShieldAlert, detail: 'Exigen revisión prioritaria' },
    { label: 'Pendientes de revisión', value: reviewRequired, icon: Clock3, detail: 'Sin mutaciones automáticas' },
    { label: 'Organizaciones afectadas', value: affectedOrganizations, icon: Building2, detail: 'Alcance empresarial detectado' },
  ]

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Activity className="h-5 w-5" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Regulatory Operations Center</p>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Cambios que requieren una decisión</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Cada impacto conserva su origen, recorrido por el grafo, severidad y alcance. Kumplio detecta y explica; la persona decide qué convertir en trabajo.
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
            {resolved} ejecuciones sin cambios pendientes
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ label, value, icon: Icon, detail }) => (
            <article key={label} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-4 text-3xl font-extrabold">{value}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-2xl border bg-card">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-bold">Cola de impactos</h2>
                <p className="mt-1 text-xs text-muted-foreground">Ordenada desde el cambio más reciente</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{runs.length} runs</span>
            </div>

            <div className="divide-y">
              {runs.length === 0 ? (
                <div className="p-10 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
                  <h3 className="mt-4 font-bold">No hay impactos registrados</h3>
                  <p className="mt-2 text-sm text-muted-foreground">La próxima propagación aparecerá aquí.</p>
                </div>
              ) : runs.map((run) => {
                const badge = severity(run)
                const targets = metricNumber(run.metrics, 'targets')
                const organizations = metricNumber(run.metrics, 'organizations')
                const review = metricNumber(run.metrics, 'review_required')
                const reference = typeof run.trigger_reference?.reason === 'string'
                  ? String(run.trigger_reference.reason)
                  : triggerLabel(run.trigger_kind)

                return (
                  <Link key={run.id} href={`/roc/${run.id}`} className="group grid gap-4 p-5 transition-colors hover:bg-muted/40 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${badge.className}`}>{badge.label}</span>
                        <span className="text-xs text-muted-foreground">{triggerLabel(run.trigger_kind)}</span>
                      </div>
                      <h3 className="mt-3 truncate font-bold">{reference}</h3>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                        <span>{targets} objetivos</span>
                        <span>{organizations} organizaciones</span>
                        <span>{review} revisiones requeridas</span>
                        <span>{new Date(run.queued_at).toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      Ver impacto <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <h2 className="font-bold">Principio operativo</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                El ROC nunca modifica cumplimiento, controles o responsables por sí solo. Cada resultado permanece revisable y trazable.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <h2 className="font-bold">Próximas capacidades</h2>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>• Convertir un impacto en plan de acción.</p>
                <p>• Comparar versiones normativas.</p>
                <p>• Explicar el recorrido mediante Copilot.</p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </>
  )
}
