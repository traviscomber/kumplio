import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileCheck2, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { refreshDailyComplianceSummary, type DailyPriority } from '@/lib/compliance/continuous/daily-summary'

export async function DailyComplianceContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/dashboard')

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')

  const organizationId = membership.organization_id
  const [{ data: organization }, dailySummary] = await Promise.all([
    admin.from('organizations').select('id,name').eq('id', organizationId).maybeSingle(),
    refreshDailyComplianceSummary(admin, organizationId),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <section className={statusCardTone(dailySummary.status)}>
        <p className="text-sm font-semibold text-primary">Estado de cumplimiento de hoy</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          {dailySummary.headline}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          {dailySummary.summary}
        </p>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span>{organization?.name || 'Tu organización'}</span>
          <span>Revisado {formatReviewedAt(dailySummary.reviewedAt)}</span>
          <span>{dailySummary.engineVersion}</span>
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold text-primary">Lo que requiere atención</p>
        <h2 className="mt-1 text-2xl font-bold">Empieza por lo más importante</h2>

        <div className="mt-5 space-y-4">
          {dailySummary.priorities.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
              <h3 className="mt-4 text-xl font-bold">No necesitas hacer nada ahora.</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                La revisión continua no encontró situaciones abiertas que requieran una decisión inmediata.
              </p>
            </div>
          ) : (
            dailySummary.priorities.map((priority, index) => (
              <PriorityCard key={priority.id} priority={priority} index={index} />
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-muted/20 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-bold">Cada hallazgo conserva su origen y su siguiente acción.</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Kumplio revisa misiones, resultados, evidencias, políticas, proveedores e impactos regulatorios. La plataforma propone; las decisiones importantes siguen en manos de las personas.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function PriorityCard({ priority, index }: { priority: DailyPriority; index: number }) {
  const href = priority.href || '/review-center'

  return (
    <article className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className={severityTone(priority.severity)}>{priorityIcon(priority.severity)}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Prioridad {index + 1}</p>
          <h3 className="mt-2 text-xl font-bold">{priority.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{priority.summary}</p>
          {priority.why && (
            <p className="mt-3 max-w-2xl text-sm leading-6">
              <span className="font-semibold">Por qué importa:</span> {priority.why}
            </p>
          )}
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

function formatReviewedAt(value: string) {
  return new Date(value).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
