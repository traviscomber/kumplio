import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Clock3, UserCheck } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { getPersonalWork, type PersonalWorkItem, type WorkUrgency } from '@/lib/compliance/accountability/my-work'

export const dynamic = 'force-dynamic'

export default async function MyWorkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/my-work')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  const work = await getPersonalWork(admin, access.organizationId, user.id)

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Mi trabajo</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {work.items.length === 0 ? 'No tienes asuntos asignados.' : `${work.items.length} asuntos requieren tu atención.`}
          </h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Kumplio reúne misiones y decisiones asignadas en una sola bandeja, ordenadas por vencimiento e impacto.
          </p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Vencidos" value={work.overdue} icon={AlertTriangle} />
          <SummaryCard label="Para hoy" value={work.dueToday} icon={Clock3} />
          <SummaryCard label="Próximos 7 días" value={work.dueSoon} icon={CalendarClock} />
          <SummaryCard label="Sin fecha" value={work.unassignedDates} icon={UserCheck} />
        </section>

        <section className="mt-8 space-y-4">
          {work.items.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
              <h2 className="mt-4 text-xl font-bold">Todo está al día.</h2>
              <p className="mt-2 text-sm text-muted-foreground">Cuando te asignen una misión o decisión aparecerá aquí.</p>
            </div>
          ) : work.items.map((item) => <WorkCard key={`${item.kind}-${item.id}`} item={item} />)}
        </section>

        {(work.overdue > 0 || work.dueToday > 0) && (
          <section className="mt-8 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5 sm:p-6">
            <h2 className="font-bold">Escalamiento operativo</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Los asuntos vencidos o críticos aparecen primero para evitar que una obligación quede sin responsable ni seguimiento.
            </p>
          </section>
        )}
      </main>
    </>
  )
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof AlertTriangle }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  )
}

function WorkCard({ item }: { item: PersonalWorkItem }) {
  return (
    <article className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className={urgencyTone(item.urgency)}>{urgencyIcon(item.urgency)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
            <span>{item.kind === 'decision' ? 'Decisión' : 'Misión'}</span>
            <span>Prioridad {priorityLabel(item.priority)}</span>
            <span>{urgencyLabel(item.urgency, item.dueAt)}</span>
          </div>
          <h2 className="mt-2 text-xl font-bold">{item.title}</h2>
          {item.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>}
        </div>
        <Link href={item.href} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
          Abrir <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

function urgencyTone(urgency: WorkUrgency) {
  const base = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border'
  if (urgency === 'overdue') return `${base} border-red-500/40 bg-red-500/10 text-red-600`
  if (urgency === 'today') return `${base} border-amber-500/40 bg-amber-500/10 text-amber-600`
  return `${base} border-primary/30 bg-primary/10 text-primary`
}

function urgencyIcon(urgency: WorkUrgency) {
  if (urgency === 'overdue') return <AlertTriangle className="h-5 w-5" />
  if (urgency === 'today') return <Clock3 className="h-5 w-5" />
  return <CalendarClock className="h-5 w-5" />
}

function urgencyLabel(urgency: WorkUrgency, dueAt: string | null) {
  if (urgency === 'overdue') return `Vencido ${formatDate(dueAt)}`
  if (urgency === 'today') return 'Requiere atención hoy'
  if (urgency === 'soon') return `Vence ${formatDate(dueAt)}`
  if (urgency === 'scheduled') return `Programado ${formatDate(dueAt)}`
  return 'Sin fecha definida'
}

function priorityLabel(priority: string) {
  if (priority === 'critical') return 'crítica'
  if (priority === 'high') return 'alta'
  if (priority === 'low') return 'baja'
  return 'media'
}

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('es-CL', { dateStyle: 'medium' })
}
