import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileCheck2, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import {
  getComplianceTimeline,
  refreshDailyComplianceSummary,
  type ComplianceTimelineItem,
  type DailyPriority,
} from '@/lib/compliance/continuous/daily-summary'
import {
  calculateOrganizationHealth,
  rankPriorities,
  type ScoredPriority,
} from '@/lib/compliance/scoring/intelligence'

export async function DailyComplianceContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/dashboard')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')
  const organizationId = access.organizationId
  const [{ data: organization }, dailySummary, timeline] = await Promise.all([
    admin.from('organizations').select('id,name').eq('id', organizationId).maybeSingle(),
    refreshDailyComplianceSummary(admin, organizationId),
    getComplianceTimeline(admin, organizationId),
  ])

  const priorities = rankPriorities(dailySummary.priorities)
  const health = calculateOrganizationHealth(dailySummary.priorities)

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <section className={statusCardTone(health.status)}>
        <p className="text-sm font-semibold text-primary">Estado de cumplimiento de hoy</p>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              {health.label}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {health.explanation}
            </p>
          </div>
          <div className="rounded-2xl border bg-background/70 px-4 py-3 text-sm">
            <p className="font-semibold">Impacto máximo</p>
            <p className="mt-1 text-2xl font-black">{health.highestScore}</p>
            <p className="text-xs text-muted-foreground">escala interna 0–100</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span>{organization?.name || 'Tu organización'}</span>
          <span>Revisado {formatReviewedAt(dailySummary.reviewedAt)}</span>
          <span>{dailySummary.engineVersion}</span>
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold text-primary">Lo que requiere atención</p>
        <h2 className="mt-1 text-2xl font-bold">Ordenado por impacto</h2>

        <div className="mt-5 space-y-4">
          {priorities.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
              <h3 className="mt-4 text-xl font-bold">No necesitas hacer nada ahora.</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                La revisión continua no encontró situaciones abiertas de impacto relevante.
              </p>
            </div>
          ) : (
            priorities.map((priority, index) => (
              <PriorityCard key={priority.id} priority={priority} index={index} />
            ))
          )}
        </div>
      </section>

      <Timeline items={timeline} />

      <section className="rounded-2xl border bg-muted/20 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-bold">La prioridad combina criticidad, urgencia y evidencia disponible.</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              El score ordena el trabajo; no reemplaza el juicio profesional ni la aprobación humana.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function PriorityCard({ priority, index }: { priority: ScoredPriority; index: number }) {
  const href = priority.href || '/review-center'

  return (
    <article className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className={severityTone(priority.severity)}>{priorityIcon(priority.severity)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Prioridad {index + 1}</p>
            <span className="rounded-full border px-2.5 py-1 text-xs font-semibold">Impacto {impactLabel(priority.impact)}</span>
            <span className="rounded-full border px-2.5 py-1 text-xs font-semibold">Score {priority.score}</span>
          </div>
          <h3 className="mt-2 text-xl font-bold">{priority.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{priority.summary}</p>
          <p className="mt-3 max-w-2xl text-sm leading-6">
            <span className="font-semibold">Por qué importa:</span> {priority.impactReason}
          </p>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Tiempo estimado: {priority.estimatedMinutes} min
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          Resolver <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

function Timeline({ items }: { items: ComplianceTimelineItem[] }) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Activity className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">Actividad reciente</p>
          <h2 className="mt-1 text-2xl font-bold">Qué cambió en los últimos días</h2>
          <div className="mt-5 divide-y">
            {items.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Todavía no hay revisiones históricas suficientes.</p>
            ) : items.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{item.headline}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.changesFound} cambios · {item.criticalItems} críticos
                  </p>
                </div>
                <div className="text-sm text-muted-foreground sm:text-right">
                  <p>{formatReviewedAt(item.date)}</p>
                  <p className="mt-1 font-semibold">{statusLabel(item.status)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function statusCardTone(status: 'healthy' | 'attention' | 'critical') {
  const base = 'rounded-3xl border bg-card p-6 shadow-sm sm:p-8'
  if (status === 'critical') return `${base} border-red-500/40`
  if (status === 'attention') return `${base} border-amber-500/35`
  return base
}

function severityTone(severity: DailyPriority['severity']) {
  const base = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border'
  if (severity === 'critical') return `${base} border-red-600/40 bg-red-600/10 text-red-700`
  if (severity === 'high') return `${base} border-red-500/30 bg-red-500/10 text-red-600`
  if (severity === 'medium') return `${base} border-amber-500/30 bg-amber-500/10 text-amber-600`
  return `${base} border-primary/30 bg-primary/10 text-primary`
}

function priorityIcon(severity: DailyPriority['severity']) {
  if (severity === 'critical') return <ShieldAlert className="h-5 w-5" />
  if (severity === 'high') return <AlertTriangle className="h-5 w-5" />
  if (severity === 'medium') return <FileCheck2 className="h-5 w-5" />
  return <Clock3 className="h-5 w-5" />
}

function impactLabel(impact: ScoredPriority['impact']) {
  if (impact === 'critical') return 'crítico'
  if (impact === 'high') return 'alto'
  if (impact === 'medium') return 'medio'
  return 'bajo'
}

function statusLabel(status: ComplianceTimelineItem['status']) {
  if (status === 'critical') return 'Crítico'
  if (status === 'attention') return 'Requiere atención'
  return 'Estable'
}

function formatReviewedAt(value: string) {
  return new Date(value).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
