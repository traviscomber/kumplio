import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  FileDiff,
  GitBranch,
  ListChecks,
  ShieldCheck,
} from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ runId: string }> }

type ImpactTarget = {
  id: string
  impact_kind: string
  severity: string
  review_status: string
  path_depth: number
  path: string[]
  organization_id: string | null
  node_snapshot: Record<string, unknown>
  edge_snapshot: Record<string, unknown>
  created_at: string
}

function text(value: unknown, fallback = 'Sin información') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function severityClass(severity: string) {
  if (severity === 'critical') return 'border-red-500/30 bg-red-500/10 text-red-200'
  if (severity === 'high') return 'border-orange-500/30 bg-orange-500/10 text-orange-200'
  return 'border-amber-500/30 bg-amber-500/10 text-amber-100'
}

export default async function ImpactDetailPage({ params }: PageProps) {
  const { runId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/roc/${runId}`)

  const admin = createAdminClient()
  const [{ data: run, error: runError }, { data: targets, error: targetsError }] = await Promise.all([
    admin
      .from('regulatory_impact_runs')
      .select('id,status,trigger_kind,trigger_reference,metrics,organization_id,queued_at,started_at,finished_at,engine_version')
      .eq('id', runId)
      .maybeSingle(),
    admin
      .from('regulatory_impact_targets')
      .select('id,impact_kind,severity,review_status,path_depth,path,organization_id,node_snapshot,edge_snapshot,created_at')
      .eq('impact_run_id', runId)
      .order('path_depth', { ascending: true })
      .order('severity', { ascending: true }),
  ])

  if (runError) throw new Error(`No fue posible cargar el impacto: ${runError.message}`)
  if (targetsError) throw new Error(`No fue posible cargar los objetivos afectados: ${targetsError.message}`)
  if (!run) notFound()

  const impactTargets = (targets || []) as ImpactTarget[]
  const metrics = (run.metrics || {}) as Record<string, unknown>
  const mutations = Number(metrics.mutations_applied || 0)

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
        <header>
          <Link href="/roc" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver al ROC
          </Link>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <GitBranch className="h-5 w-5" />
                <p className="text-xs font-bold uppercase tracking-[0.2em]">Impact Explorer</p>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{text(run.trigger_reference?.reason, 'Impacto regulatorio propagado')}</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Run {run.id} · motor {run.engine_version} · {new Date(run.queued_at).toLocaleString('es-CL')}
              </p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
              {mutations === 0 ? '0 mutaciones automáticas' : `${mutations} mutaciones registradas`}
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ['Objetivos', Number(metrics.targets || impactTargets.length), ListChecks],
            ['Críticos', Number(metrics.critical || 0), ShieldCheck],
            ['Organizaciones', Number(metrics.organizations || 0), Building2],
            ['Revisión requerida', Number(metrics.review_required || 0), FileDiff],
          ].map(([label, value, Icon]) => (
            <article key={String(label)} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">{String(label)}</p>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-4 text-3xl font-extrabold">{String(value)}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="font-bold">Recorrido afectado</h2>
              <p className="mt-1 text-xs text-muted-foreground">Cada fila conserva el nodo, la relación y la profundidad detectada.</p>
            </div>
            <div className="divide-y">
              {impactTargets.map((target) => {
                const node = target.node_snapshot || {}
                const edge = target.edge_snapshot || {}
                return (
                  <article key={target.id} className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${severityClass(target.severity)}`}>{target.severity}</span>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">profundidad {target.path_depth}</span>
                          <span className="text-xs text-muted-foreground">{target.impact_kind}</span>
                        </div>
                        <h3 className="mt-3 font-bold">{text(node.title)}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{text(node.node_type, 'nodo')} · {text(edge.edge_type, 'origen')}</p>
                      </div>
                      <span className="rounded-full border px-3 py-1 text-xs font-semibold">{target.review_status}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {target.path.map((nodeId, index) => (
                        <span key={`${nodeId}-${index}`} className="inline-flex items-center gap-2">
                          {index > 0 && <ArrowRight className="h-3 w-3" />}
                          <code className="rounded bg-muted px-2 py-1">{nodeId.slice(0, 8)}</code>
                        </span>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="font-bold">Decisión pendiente</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Este impacto fue detectado y explicado, pero no se transformó en cumplimiento, controles ni tareas. El siguiente paso será convertirlo en un plan de acción revisable.
              </p>
              <button type="button" disabled className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground opacity-60">
                Crear plan de acción <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-2 text-center text-xs text-muted-foreground">Se habilitará en la Épica 2.</p>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <h2 className="font-bold">Datos del run</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Estado</dt><dd className="font-semibold">{run.status}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Inicio</dt><dd className="font-semibold">{run.started_at ? new Date(run.started_at).toLocaleString('es-CL') : '—'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Fin</dt><dd className="font-semibold">{run.finished_at ? new Date(run.finished_at).toLocaleString('es-CL') : '—'}</dd></div>
              </dl>
            </div>
          </aside>
        </section>
      </main>
    </>
  )
}
