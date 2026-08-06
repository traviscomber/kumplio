import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Clock3, Play, UserCheck } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import {
  completeAssignedMission,
  getPersonalWork,
  rescheduleAssignedMission,
  startAssignedMission,
  type PersonalWorkItem,
  type WorkUrgency,
} from '@/lib/compliance/accountability/my-work'

export const dynamic = 'force-dynamic'

export default async function MyWorkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/my-work')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  async function startMission(formData: FormData) {
    'use server'
    const context = await getActionContext()
    await startAssignedMission(context.admin, context.access, String(formData.get('missionId') || ''))
    revalidateWork()
  }

  async function rescheduleMission(formData: FormData) {
    'use server'
    const context = await getActionContext()
    await rescheduleAssignedMission(
      context.admin,
      context.access,
      String(formData.get('missionId') || ''),
      String(formData.get('dueDate') || ''),
    )
    revalidateWork()
  }

  async function completeMission(formData: FormData) {
    'use server'
    const context = await getActionContext()
    await completeAssignedMission(
      context.admin,
      context.access,
      String(formData.get('missionId') || ''),
      String(formData.get('completionNotes') || ''),
    )
    revalidateWork()
  }

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
            Inicia, reprograma y cierra tus misiones desde una sola bandeja. El cambio y su evento de auditoría se guardan en una misma transacción.
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
          ) : work.items.map((item) => (
            <WorkCard
              key={`${item.kind}-${item.id}`}
              item={item}
              startAction={startMission}
              rescheduleAction={rescheduleMission}
              completeAction={completeMission}
            />
          ))}
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

async function getActionContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/my-work')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')
  return { admin, access }
}

function revalidateWork() {
  revalidatePath('/my-work')
  revalidatePath('/accountability')
  revalidatePath('/dashboard')
  revalidatePath('/missions')
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

function WorkCard({
  item,
  startAction,
  rescheduleAction,
  completeAction,
}: {
  item: PersonalWorkItem
  startAction: (formData: FormData) => Promise<void>
  rescheduleAction: (formData: FormData) => Promise<void>
  completeAction: (formData: FormData) => Promise<void>
}) {
  const canStart = item.status === 'draft' || item.status === 'ready'

  return (
    <article className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className={urgencyTone(item.urgency)}>{urgencyIcon(item.urgency)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
            <span>{item.kind === 'decision' ? 'Decisión' : 'Misión'}</span>
            <span>Prioridad {priorityLabel(item.priority)}</span>
            <span>{urgencyLabel(item.urgency, item.dueAt)}</span>
            {item.kind === 'mission' && <span>{statusLabel(item.status)}</span>}
          </div>
          <h2 className="mt-2 text-xl font-bold">{item.title}</h2>
          {item.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>}

          {item.kind === 'mission' && (
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {canStart && (
                <form action={startAction}>
                  <input type="hidden" name="missionId" value={item.id} />
                  <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold hover:bg-muted">
                    <Play className="h-4 w-4" /> Iniciar
                  </button>
                </form>
              )}

              <form action={rescheduleAction} className="flex gap-2">
                <input type="hidden" name="missionId" value={item.id} />
                <input
                  type="date"
                  name="dueDate"
                  required
                  defaultValue={dateInputValue(item.dueAt)}
                  className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2 text-sm"
                  aria-label={`Nueva fecha para ${item.title}`}
                />
                <button type="submit" className="rounded-xl border px-3 py-2 text-sm font-bold hover:bg-muted">Guardar</button>
              </form>

              <form action={completeAction} className="flex gap-2 lg:col-span-1">
                <input type="hidden" name="missionId" value={item.id} />
                <input
                  name="completionNotes"
                  required
                  minLength={3}
                  placeholder="Nota de cierre"
                  className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2 text-sm"
                />
                <button type="submit" className="rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">Completar</button>
              </form>
            </div>
          )}
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

function statusLabel(status: string) {
  if (status === 'active') return 'En curso'
  if (status === 'blocked') return 'Bloqueada'
  if (status === 'in_review') return 'En revisión'
  if (status === 'ready') return 'Lista para iniciar'
  if (status === 'draft') return 'Borrador'
  return status
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

function dateInputValue(value: string | null) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}
