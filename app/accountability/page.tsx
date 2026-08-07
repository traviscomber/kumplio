import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AlertTriangle, BellRing, CheckCircle2, Clock3, History, UserRoundCheck, Users } from 'lucide-react'
import { WhyDetails } from '@/components/explainability/why-details'
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
    const ownerValue = String(formData.get('ownerId') || '')
    const dueAtValue = String(formData.get('dueAt') || '')
    await assignMissionOwner(
      serverAdmin,
      currentAccess.organizationId,
      missionId,
      ownerValue || null,
      dueAtValue ? new Date(`${dueAtValue}T23:59:59`).toISOString() : null,
      currentUser.id,
    )
    revalidatePath('/accountability')
    revalidatePath('/my-work')
    revalidatePath('/missions')
    revalidatePath('/advisor')
    revalidatePath('/follow-up')
  }

  const [missions, members, auditEvents] = await Promise.all([
    listAccountableMissions(admin, access.organizationId),
    listWorkspaceMembers(admin, access.organizationId),
    listAuditEvents(admin, access.organizationId),
  ])

  const overdue = missions.filter((mission) => mission.sla === 'overdue').length
  const dueSoon = missions.filter((mission) => mission.sla === 'due_soon').length
  const unassigned = missions.filter((mission) => !mission.ownerId).length
  const escalations = missions.filter((mission) => ['compliance', 'executive'].includes(mission.slaDetail.escalationLevel)).length

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Responsabilidad operativa</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Cada tarea con responsable, capacidad, plazo y escalamiento claro.
          </h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Kumplio usa historial, carga activa y atrasos para sugerir responsables. La persona mantiene la decisión final y cada cambio sigue dejando trazabilidad.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={AlertTriangle} label="Vencidas" value={overdue} tone={overdue > 0 ? 'danger' : 'default'} />
            <Metric icon={Clock3} label="Vencen en 72 horas" value={dueSoon} tone={dueSoon > 0 ? 'warning' : 'default'} />
            <Metric icon={UserRoundCheck} label="Sin responsable" value={unassigned} />
            <Metric icon={BellRing} label="Escalar ahora" value={escalations} tone={escalations > 0 ? 'danger' : 'default'} />
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div>
            <p className="text-sm font-semibold text-primary">Trabajo activo</p>
            <h2 className="mt-1 text-2xl font-bold">Responsables, SLA y seguimiento</h2>
            <div className="mt-5 space-y-4">
              {missions.length === 0 ? (
                <div className="rounded-2xl border bg-card p-8 text-center">
                  <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
                  <h3 className="mt-4 text-xl font-bold">No hay trabajo activo.</h3>
                </div>
              ) : missions.map((mission) => (
                <article key={mission.id} className="rounded-2xl border bg-card p-5 sm:p-6">
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                          <span className="rounded-full border px-2.5 py-1">{priorityLabel(mission.priority)}</span>
                          <span className="rounded-full border px-2.5 py-1">{statusLabel(mission.status)}</span>
                          <span className={`rounded-full border px-2.5 py-1 ${slaTone(mission.sla)}`}>{slaLabel(mission.sla)}</span>
                          <span className={`rounded-full border px-2.5 py-1 ${escalationTone(mission.slaDetail.escalationLevel)}`}>
                            {mission.slaDetail.followUpLabel}
                          </span>
                        </div>
                        <h3 className="mt-3 text-xl font-bold">{mission.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Responsable: {mission.ownerLabel}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Vence: {mission.dueAt ? new Date(mission.dueAt).toLocaleDateString('es-CL') : 'sin fecha'}
                        </p>
                      </div>

                      {access.canAssignWork ? (
                        <form action={assign} className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto] lg:max-w-2xl">
                          <input type="hidden" name="missionId" value={mission.id} />
                          <select name="ownerId" defaultValue={mission.ownerId || ''} className="rounded-xl border bg-background px-4 py-3 text-sm">
                            <option value="">Sin responsable</option>
                            {members.map((member) => (
                              <option key={member.userId} value={member.userId}>
                                {member.label} · {member.activeCount} activas
                              </option>
                            ))}
                          </select>
                          <input name="dueAt" type="date" defaultValue={mission.dueAt?.slice(0, 10) || ''} className="rounded-xl border bg-background px-4 py-3 text-sm" />
                          <button type="submit" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Guardar</button>
                        </form>
                      ) : (
                        <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">Solo lectura para tu rol.</p>
                      )}
                    </div>

                    {!mission.ownerId && mission.suggestedOwnerId && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.13em] text-primary">Delegación sugerida</p>
                            <p className="mt-1 font-bold">{mission.suggestedOwnerLabel}</p>
                            <p className="mt-1 text-sm text-muted-foreground">Sugerencia basada en experiencia, carga y atrasos registrados.</p>
                          </div>
                          {access.canAssignWork && (
                            <form action={assign}>
                              <input type="hidden" name="missionId" value={mission.id} />
                              <input type="hidden" name="ownerId" value={mission.suggestedOwnerId} />
                              <input type="hidden" name="dueAt" value={mission.dueAt?.slice(0, 10) || ''} />
                              <button type="submit" className="rounded-xl border border-primary/30 bg-background px-4 py-2.5 text-sm font-bold text-primary">
                                Usar sugerencia
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    )}

                    <WhyDetails
                      reasons={[mission.slaDetail.nextAction, ...mission.suggestionReasons]}
                      facts={[
                        `Prioridad: ${priorityLabel(mission.priority)}.`,
                        `Estado: ${statusLabel(mission.status)}.`,
                        `Responsable actual: ${mission.ownerLabel}.`,
                        mission.slaDetail.hoursToDue === null
                          ? 'No existe una fecha objetivo.'
                          : mission.slaDetail.hoursToDue < 0
                            ? `El plazo venció hace ${Math.abs(mission.slaDetail.hoursToDue)} horas.`
                            : `Quedan aproximadamente ${mission.slaDetail.hoursToDue} horas.`,
                      ]}
                      nextAction={mission.slaDetail.nextAction}
                      sourceLabel="Seguimiento y capacidad"
                      compact
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border bg-card p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="font-black">Capacidad del equipo</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Esta vista no impone asignaciones: ayuda a evitar que una persona saturada reciba más trabajo sin advertencia.
              </p>
              <div className="mt-5 space-y-3">
                {members.map((member) => (
                  <div key={member.userId} className="rounded-xl border bg-background/50 p-4">
                    <p className="text-sm font-bold">{member.label}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <CapacityMetric label="Activas" value={member.activeCount} />
                      <CapacityMetric label="Vencidas" value={member.overdueCount} tone={member.overdueCount > 0 ? 'danger' : 'default'} />
                      <CapacityMetric label="Cerradas" value={member.completedCount} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <BellRing className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-black">Seguimiento automático</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Los asuntos sin fecha, bloqueados, próximos a vencer o vencidos quedan identificados automáticamente para que el equipo sepa qué seguimiento corresponde.
              </p>
              <div className="mt-4 text-sm">
                <p><strong>{missions.filter((mission) => mission.slaDetail.shouldFollowUp).length}</strong> requieren seguimiento.</p>
                <p className="mt-1"><strong>{escalations}</strong> requieren escalamiento de Compliance o ejecutivo.</p>
              </div>
            </section>
          </aside>
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
                  <p className="mt-1 text-sm text-muted-foreground">{eventLabel(event.eventType)} · {actorLabel(event.actorType)}</p>
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

function Metric({ icon: Icon, label, value, tone = 'default' }: { icon: typeof AlertTriangle; label: string; value: number; tone?: 'default' | 'warning' | 'danger' }) {
  const toneClass = tone === 'danger' ? 'border-red-500/35 bg-red-500/10' : tone === 'warning' ? 'border-amber-500/35 bg-amber-500/10' : 'bg-background/70'
  const iconClass = tone === 'danger' ? 'text-red-600' : tone === 'warning' ? 'text-amber-600' : 'text-primary'
  return <div className={`rounded-2xl border p-4 ${toneClass}`}><Icon className={`h-5 w-5 ${iconClass}`} /><p className="mt-3 text-3xl font-black">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
}

function CapacityMetric({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'danger' }) {
  return <div className="rounded-lg border bg-card p-2"><p className={`text-lg font-black ${tone === 'danger' ? 'text-red-600' : ''}`}>{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>
}

function slaLabel(value: 'overdue' | 'due_soon' | 'on_track' | 'unscheduled') {
  if (value === 'overdue') return 'Vencida'
  if (value === 'due_soon') return 'Próxima a vencer'
  if (value === 'on_track') return 'En plazo'
  return 'Sin fecha'
}

function slaTone(value: 'overdue' | 'due_soon' | 'on_track' | 'unscheduled') {
  if (value === 'overdue') return 'border-red-500/35 bg-red-500/10 text-red-600'
  if (value === 'due_soon') return 'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  if (value === 'on_track') return 'border-primary/25 bg-primary/5 text-primary'
  return ''
}

function escalationTone(value: 'none' | 'owner' | 'compliance' | 'executive') {
  if (value === 'executive') return 'border-red-500/35 bg-red-500/10 text-red-600'
  if (value === 'compliance') return 'border-orange-500/35 bg-orange-500/10 text-orange-700 dark:text-orange-300'
  if (value === 'owner') return 'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  return 'border-primary/25 bg-primary/5 text-primary'
}

function priorityLabel(value: string) {
  if (value === 'critical') return 'Prioridad crítica'
  if (value === 'high') return 'Prioridad alta'
  if (value === 'low') return 'Prioridad baja'
  return 'Prioridad media'
}

function statusLabel(value: string) {
  if (value === 'active') return 'En curso'
  if (value === 'blocked') return 'Bloqueada'
  if (value === 'in_review') return 'En revisión'
  if (value === 'ready') return 'Lista para iniciar'
  if (value === 'draft') return 'Borrador'
  return value
}

function eventLabel(value: string) {
  if (value === 'ownership_updated') return 'Responsable o vencimiento actualizado'
  if (value === 'mission_started') return 'Misión iniciada'
  if (value === 'mission_rescheduled') return 'Misión reprogramada'
  if (value === 'mission_completed') return 'Misión completada'
  if (value === 'status_changed') return 'Estado actualizado'
  if (value === 'created') return 'Misión creada'
  return value.replaceAll('_', ' ')
}

function actorLabel(value: string) {
  if (value === 'user') return 'cambio realizado por una persona'
  if (value === 'agent') return 'cambio realizado por un agente'
  return 'cambio del sistema'
}
