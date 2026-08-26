import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Activity, ArrowRight, Clock3 } from 'lucide-react'
import { getComplianceTimeline } from '@/lib/compliance/continuous/daily-summary'
import { buildOperationalActivity, type OperationalActivityItem } from '@/lib/product/operations/activity'
import { createClient } from '@/lib/supabase/server'

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/app/actividad')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')
  const organizationId = membership.organization_id

  const [timeline, { data: events }] = await Promise.all([
    getComplianceTimeline(supabase, organizationId, 20),
    supabase
      .from('compliance_case_events')
      .select('id,case_id,event_type,summary,created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(60),
  ])

  const caseIds = [...new Set((events || []).map((event) => String(event.case_id)).filter(Boolean))]
  const { data: cases } = caseIds.length > 0
    ? await supabase.from('compliance_cases').select('id,title').eq('organization_id', organizationId).in('id', caseIds)
    : { data: [] as Array<{ id: string; title: string | null }> }

  const caseTitleById = new Map((cases || []).map((item) => [String(item.id), String(item.title || 'Caso')]))
  const items = buildOperationalActivity({
    caseEvents: (events || []).map((event) => ({
      id: String(event.id), caseId: String(event.case_id), caseTitle: caseTitleById.get(String(event.case_id)) || null,
      eventType: String(event.event_type || ''), summary: typeof event.summary === 'string' ? event.summary : null,
      createdAt: String(event.created_at),
    })),
    continuousReviews: timeline.map((item) => ({ id: item.id, date: item.date, headline: item.headline, changesFound: item.changesFound, criticalItems: item.criticalItems })),
    limit: 50,
  })

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-12 max-w-3xl border-b border-border/70 pb-8">
        <div className="flex items-center gap-3 text-primary">
          <Activity className="h-5 w-5" aria-hidden="true" />
          <p className="text-xs font-medium uppercase tracking-[0.18em]">Trazabilidad operativa</p>
        </div>
        <h1 className="mt-4 font-heading text-3xl font-normal tracking-[-0.025em] sm:text-4xl">Actividad reciente</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Un historial legible de acciones y revisiones ya registradas en tu organización.</p>
      </header>

      {items.length === 0 ? (
        <section className="rounded-[4px] border border-dashed border-border bg-card/45 p-8 text-center">
          <Clock3 className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-xl font-normal">Todavía no hay actividad reciente para mostrar.</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Cuando existan acciones, revisiones o cambios persistidos, aparecerán aquí en orden cronológico.</p>
        </section>
      ) : (
        <ol className="divide-y divide-border/70 border-y border-border/70" aria-label="Actividad reciente">
          {items.map((item) => <ActivityRow key={item.id} item={item} />)}
        </ol>
      )}
    </main>
  )
}

function ActivityRow({ item }: { item: OperationalActivityItem }) {
  return (
    <li className="grid gap-5 py-6 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-start">
      <time className="text-xs font-medium text-muted-foreground" dateTime={item.occurredAt}>{formatDate(item.occurredAt)}</time>
      <div className="min-w-0">
        <p className="font-heading text-base font-normal">{item.label}</p>
        {item.detail && <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">{item.detail}</p>}
        {item.context && <p className="mt-2 break-words text-xs font-medium text-muted-foreground">{item.context}</p>}
      </div>
      <Link
        href={item.href}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[4px] border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Ver contexto <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </li>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
}
