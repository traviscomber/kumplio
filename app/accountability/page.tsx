import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Clock3, History, UserRoundCheck } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import {
  assignMissionOwner,
  listAccountableMissions,
  listAuditEvents,
  listWorkspaceMembers,
} from '@/lib/compliance/accountability/ownership-sla'

export const dynamic = 'force-dynamic'

export default async function AccountabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/accountability')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  async function assign(formData: FormData) {
    'use server'
    const serverSupabase = await createClient()
    const { data: { user: currentUser } } = await serverSupabase.auth.getUser()
    if (!currentUser) redirect('/sign-in?next=/accountability')

    const serverAdmin = createAdminClient()
    const currentAccess = await getWorkspaceAccess(serverAdmin, currentUser.id)
    if (!currentAccess) redirect('/onboarding')
    if (!currentAccess.canAssignWork) throw new Error('Tu rol no permite reasignar trabajo.')

    const missionId = String(formData.get('missionId') || '')
    const ownerId = String(formData.get('ownerId') || '')
    const dueAtValue = String(formData.get('dueAt') || '')
    await assignMissionOwner(
      serverAdmin,
      currentAccess.organizationId,
      missionId,
      ownerId,
      dueAtValue ? new Date(`${dueAtValue}T23:59:59`).toISOString() : null,
      currentUser.id,
    )
    revalidatePath('/accountability')
    revalidatePath('/missions')
    revalidatePath('/dashboard')
  }

  const [missions, members, auditEvents] = await Promise.all([
    listAccountableMissions(admin, access.organizationId),
    listWorkspaceMembers(admin, access.organizationId),
    listAuditEvents(admin, access.organizationId),
  ])

  const overdue = missions.filter((mission) => mission.sla === 'overdue').length
  const dueSoon = missions.filter((mission) => mission.sla === 'due_soon').length
  const unassigned = missions.filter((mission) => !mission.ownerId).length

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Responsabilidad operativa</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Cada tarea con dueño, plazo y rastro.</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Kumplio usa los responsables, vencimientos y eventos existentes. No crea un sistema paralelo de tareas.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Metric icon={AlertTriangle} label="Vencidas" value={overdue} />
            <Metric icon={Clock3} label="Vencen en 3 días" value={dueSoon} />
            <Metric icon={UserRoundCheck} label="Sin responsable" value={unassigned} />
          </div>
        </section>

        <section className="mt-8">
          <p className="text-sm font-semibold text-primary">Trabajo activo</p>
          <h2 className="mt-1 text-2xl font-bold">Responsables y SLA</h2>
          <div className="mt-5 space-y-4">
            {missions.length === 0 ? (
              <div className="rounded-2xl border bg-card p-8 text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
                <h3 className="mt-4 text-xl font-bold">No hay trabajo activo.</h3>
              </div>
            ) : missions.map((mission) => (
              <article key={mission.id} className="rounded-2xl border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                      <span>{priorityLabel(mission.priority)}</span>
                      <span>{statusLabel(mission.status)}</span>
                      <span className={slaTone(mission.sla)}>{slaLabel(mission.sla)}</span>
                    </div>
                    <h3 className="mt-2 text-xl font-bold">{mission.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Responsable: {mission.ownerLabel}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Vence: {mission.dueAt ? new Date(mission.dueAt).toLocaleDateString('es-CL') : 'sin fecha'}
                    </p>
                  </div>

                  {access.canAssignWork ? (
                    <form action={assign} className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto] lg:max-w-2xl">
                      <input type="hidden" name="missionId" value={mission.id} />
                      <select name="ownerId" required defaultValue={mission.ownerId || ''} className="rounded-xl border bg-background px-4 py-3 text-sm">
                        <option value="" disabled>Seleccionar responsable</option>
                        {members.map((member) => <option key={member.userId} value={member.userId}>{member.label}</option>)}
                      </select>
                      <input name="dueAt" type="date" defaultValue={mission.dueAt?.slice(0, 10) || ''} className="rounded-xl border bg-background px-4 py-3 text-sm" />
                      <button className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Guardar</button>
                    </form>
                  ) : (
                    <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">Solo lectura para tu rol.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-primary">Bitácora</p>
              <h2 className="text-xl font-bold">Últimos cambios trazables</h2>
            </div>
          </div>
          <div className="mt-5 divide-y">
            {auditEvents.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Todavía no hay eventos registrados.</p>
            ) : auditEvents.map((event) => (
              <div key={event.id} className="py-4 sm:flex sm:items-start sm:justify-between sm:gap-5">
                <div>
                  <p className="font-semibold">{event.missionTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{eventLabel(event.eventType)} · actor {event.actorType}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground sm:mt-0">{new Date(event.createdAt).toLocaleString('es-CL')}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof AlertTriangle; label: string; value: number }) {
  return <div className="rounded-2xl border bg-background/70 p-4"><Icon className="h-5 w-5 text-primary" /><p className="mt-3 text-3xl font-black">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
}

function slaLabel(value: 'overdue' | 'due_soon' | 'on_track' | 'unscheduled') {
  if (value === 'overdue') return 'Vencida'
  if (value === 'due_soon') return 'Próxima a vencer'
  if (value === 'on_track') return 'En plazo'
  return 'Sin fecha'
}

function slaTone(value: 'overdue' | 'due_soon' | 'on_track' | 'unscheduled') {
  if (value === 'overdue') return 'text-red-600'
  if (value === 'due_soon') return 'text-amber-600'
  if (value === 'on_track') return 'text-primary'
  return ''
}

function priorityLabel(value: string) {
  if (value === 'critical') return 'Prioridad crítica'
  if (value === 'high') return 'Prioridad alta'
  if (value === 'low') return 'Prioridad baja'
  return 'Prioridad media'
}

function statusLabel(value: string) {
  if (value === 'in_progress') return 'En curso'
  if (value === 'blocked') return 'Bloqueada'
  if (value === 'review') return 'En revisión'
  return 'Pendiente'
}

function eventLabel(value: string) {
  if (value === 'ownership_updated') return 'Responsable o vencimiento actualizado'
  if (value === 'status_changed') return 'Estado actualizado'
  if (value === 'created') return 'Misión creada'
  return value.replaceAll('_', ' ')
}
