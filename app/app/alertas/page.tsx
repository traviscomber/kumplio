import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, ArrowRight, Bell, CheckCircle2 } from 'lucide-react'
import { getLatestDailyComplianceSummary } from '@/lib/compliance/continuous/daily-summary'
import { buildOperationalAlerts, type OperationalAlert } from '@/lib/product/operations/alerts'
import { createClient } from '@/lib/supabase/server'

export default async function AlertsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/app/alertas')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')
  const organizationId = membership.organization_id

  const [dailySummary, { data: cases }] = await Promise.all([
    getLatestDailyComplianceSummary(supabase, organizationId),
    supabase
      .from('compliance_cases')
      .select('id,title,status,updated_at')
      .eq('organization_id', organizationId)
      .not('status', 'in', '(closed,archived)')
      .order('updated_at', { ascending: false })
      .limit(50),
  ])

  const alerts = buildOperationalAlerts({
    priorities: dailySummary?.priorities || [],
    cases: (cases || []).map((item) => ({
      id: String(item.id),
      title: String(item.title || 'Caso sin título'),
      status: String(item.status || 'active'),
      updatedAt: item.updated_at ? String(item.updated_at) : null,
    })),
  })

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-12 max-w-3xl border-b border-border/70 pb-8">
        <div className="flex items-center gap-3 text-primary">
          <Bell className="h-5 w-5" aria-hidden="true" />
          <p className="text-xs font-medium uppercase tracking-[0.18em]">Operación continua</p>
        </div>
        <h1 className="mt-4 font-heading text-3xl font-normal tracking-[-0.025em] sm:text-4xl">Qué requiere tu atención</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
          Alertas reúne situaciones ya detectadas por Kumplio que requieren revisión o acción.
        </p>
      </header>

      {alerts.length === 0 ? (
        <section className="rounded-[4px] border border-dashed border-border bg-card/45 p-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-xl font-normal">No hay asuntos pendientes en esta vista.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Esto refleja la información observada por Kumplio y no significa que todas tus obligaciones estén cumplidas.
          </p>
        </section>
      ) : (
        <section aria-label="Alertas operacionales" className="divide-y divide-border/70 border-y border-border/70">
          {alerts.map((alert) => <AlertRow key={alert.id} alert={alert} />)}
        </section>
      )}
    </main>
  )
}

function AlertRow({ alert }: { alert: OperationalAlert }) {
  return (
    <article className="grid gap-5 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-[4px] border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">{alert.category}</span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-[var(--kumplio-sepia)]" aria-hidden="true" />
            Impacto {severityLabel(alert.severity)}
          </span>
        </div>
        <h2 className="mt-4 break-words font-heading text-xl font-normal">{alert.title}</h2>
        <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-muted-foreground">{alert.reason}</p>
        {alert.occurredAt && <p className="mt-3 text-xs font-medium text-muted-foreground">Actualizado {formatDate(alert.occurredAt)}</p>}
      </div>
      <Link
        href={alert.href}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[4px] bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Revisar <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  )
}

function severityLabel(severity: OperationalAlert['severity']) {
  if (severity === 'critical') return 'crítico'
  if (severity === 'high') return 'alto'
  if (severity === 'medium') return 'medio'
  return 'bajo'
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
}
