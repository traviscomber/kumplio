'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Sparkles,
  Target,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { cn } from '@/lib/utils'

type Mission = {
  id: string
  title: string
  objective: string
  status: string
  priority: string
  due_at: string | null
  updated_at: string
  playbook_id: string
}

type CapabilityRun = {
  id: string
  mission_id: string
  sequence: number
  status: string
  assigned_agent_id: string | null
  capability_id: string
}

type Capability = {
  id: string
  name: string
  customer_outcome: string
}

type Playbook = {
  id: string
  slug: string
  name: string
  description: string | null
  objective: string
  vertical: string
}

type MissionEvent = {
  id: string
  mission_id: string
  event_type: string
  actor_type: string
  actor_agent_id: string | null
  created_at: string
}

type MissionResult = {
  id: string
  mission_id: string
  title: string
  status: string
  result_type: string
  created_at: string
}

type DashboardData = {
  organization: { id: string; name: string } | null
  missions: Mission[]
  runs: CapabilityRun[]
  capabilities: Capability[]
  playbooks: Playbook[]
  events: MissionEvent[]
  results: MissionResult[]
}

const emptyData: DashboardData = {
  organization: null,
  missions: [],
  runs: [],
  capabilities: [],
  playbooks: [],
  events: [],
  results: [],
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  ready: 'Lista para iniciar',
  active: 'En ejecución',
  blocked: 'Bloqueada',
  in_review: 'En revisión',
  completed: 'Completada',
  cancelled: 'Cancelada',
  pending: 'Pendiente',
  running: 'Trabajando',
  review_required: 'Requiere revisión',
  failed: 'Con dificultad',
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData>(emptyData)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      try {
        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) {
          window.location.href = '/sign-in'
          return
        }

        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', auth.user.id)
          .limit(1)
          .maybeSingle()

        if (!membership?.organization_id) {
          const { data: documents } = await supabase.from('documents').select('id').eq('user_id', auth.user.id).limit(1)
          setShowOnboarding(!documents?.length)
          if (documents?.length) setWarning('Tu cuenta todavía no está vinculada a una organización.')
          return
        }

        const organizationId = membership.organization_id
        const [organizationResult, missionsResult, playbooksResult, capabilitiesResult] = await Promise.all([
          supabase.from('organizations').select('id, name').eq('id', organizationId).maybeSingle(),
          supabase
            .from('missions')
            .select('id,title,objective,status,priority,due_at,updated_at,playbook_id')
            .eq('organization_id', organizationId)
            .order('updated_at', { ascending: false })
            .limit(12),
          supabase
            .from('mission_playbooks')
            .select('id,slug,name,description,objective,vertical')
            .eq('status', 'published')
            .order('name'),
          supabase
            .from('mission_capabilities')
            .select('id,name,customer_outcome')
            .eq('status', 'active'),
        ])

        const missions = (missionsResult.data || []) as Mission[]
        const missionIds = missions.map((mission) => mission.id)
        let runs: CapabilityRun[] = []
        let events: MissionEvent[] = []
        let results: MissionResult[] = []

        if (missionIds.length) {
          const [runsResult, eventsResult, resultsResult] = await Promise.all([
            supabase
              .from('mission_capability_runs')
              .select('id,mission_id,sequence,status,assigned_agent_id,capability_id')
              .in('mission_id', missionIds)
              .order('sequence'),
            supabase
              .from('mission_events')
              .select('id,mission_id,event_type,actor_type,actor_agent_id,created_at')
              .in('mission_id', missionIds)
              .order('created_at', { ascending: false })
              .limit(8),
            supabase
              .from('mission_results')
              .select('id,mission_id,title,status,result_type,created_at')
              .in('mission_id', missionIds)
              .order('created_at', { ascending: false })
              .limit(12),
          ])
          runs = (runsResult.data || []) as CapabilityRun[]
          events = (eventsResult.data || []) as MissionEvent[]
          results = (resultsResult.data || []) as MissionResult[]
        }

        setData({
          organization: organizationResult.data,
          missions,
          runs,
          capabilities: (capabilitiesResult.data || []) as Capability[],
          playbooks: (playbooksResult.data || []) as Playbook[],
          events,
          results,
        })
      } catch (error) {
        console.error('[operations-center] Load error:', error)
        setWarning('No fue posible cargar todo el Centro de Operaciones.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const capabilityMap = useMemo(
    () => new Map(data.capabilities.map((capability) => [capability.id, capability])),
    [data.capabilities],
  )

  const activeMissions = data.missions.filter((mission) => !['completed', 'cancelled'].includes(mission.status))
  const pendingDecisions = data.runs.filter((run) => run.status === 'review_required').length +
    data.results.filter((result) => ['proposed', 'in_review'].includes(result.status)).length
  const blockedMissions = activeMissions.filter((mission) => mission.status === 'blocked').length
  const completedThisMonth = data.missions.filter((mission) => {
    if (mission.status !== 'completed') return false
    const updated = new Date(mission.updated_at)
    const now = new Date()
    return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear()
  }).length

  if (loading) return <div className="py-20 text-center text-muted-foreground">Preparando tu Centro de Operaciones…</div>

  if (showOnboarding) {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm font-semibold text-primary">Comienza con contexto real</p>
          <h1 className="mt-2 text-3xl font-bold">Prepara tu primera misión</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Carga una fuente regulatoria, contrato o política para que Kumplio comprenda tu organización.
          </p>
        </div>
        <OnboardingFlow onComplete={() => (window.location.href = '/dashboard')} />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Centro de Operaciones</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {data.organization?.name || 'Kumplio'}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
              {pendingDecisions > 0
                ? `${pendingDecisions} decisiones requieren tu atención para que el trabajo avance.`
                : 'Tu equipo de cumplimiento está al día. Elige el próximo resultado que quieres lograr.'}
            </p>
          </div>
          <Link
            href="/missions"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/85"
          >
            Nueva misión
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {warning && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">{warning}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Target} label="Misiones activas" value={activeMissions.length} helper="Objetivos en curso" />
        <Metric icon={CheckCircle2} label="Decisiones pendientes" value={pendingDecisions} helper="Requieren revisión humana" emphasis={pendingDecisions > 0} />
        <Metric icon={AlertTriangle} label="Misiones bloqueadas" value={blockedMissions} helper="Necesitan intervención" emphasis={blockedMissions > 0} />
        <Metric icon={FileCheck2} label="Completadas este mes" value={completedThisMonth} helper="Resultados demostrables" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">Trabajo en curso</p>
              <h2 className="mt-1 text-2xl font-bold">Misiones activas</h2>
            </div>
            <Link href="/missions" className="text-sm font-semibold text-primary hover:underline">Ver todas</Link>
          </div>

          <div className="mt-6 space-y-4">
            {activeMissions.length === 0 ? (
              <EmptyMissions playbooks={data.playbooks} />
            ) : (
              activeMissions.slice(0, 5).map((mission) => {
                const missionRuns = data.runs.filter((run) => run.mission_id === mission.id)
                const completed = missionRuns.filter((run) => run.status === 'completed').length
                const progress = missionRuns.length ? Math.round((completed / missionRuns.length) * 100) : 0
                const decisions = missionRuns.filter((run) => run.status === 'review_required').length
                return (
                  <Link
                    key={mission.id}
                    href={`/missions/${mission.id}`}
                    className="block rounded-xl border border-border p-4 transition hover:border-primary/40 hover:bg-muted/30"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold">{mission.title}</h3>
                          <span className={cn('rounded-full px-2 py-1 text-xs font-semibold', statusTone(mission.status))}>
                            {statusLabels[mission.status] || mission.status}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{mission.objective}</p>
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-2xl font-bold">{progress}%</p>
                        <p className="text-xs text-muted-foreground">{completed} de {missionRuns.length} capacidades</p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      {decisions > 0 && <span className="font-semibold text-amber-600">{decisions} decisiones pendientes</span>}
                      {mission.due_at && <span>Vence {new Date(mission.due_at).toLocaleDateString('es-CL')}</span>}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary"><Bot className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-primary">Equipo IA</p>
                <h2 className="font-bold">Trabajo por capacidad</h2>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {data.runs.filter((run) => !['completed', 'cancelled', 'skipped'].includes(run.status)).slice(0, 5).map((run) => {
                const capability = capabilityMap.get(run.capability_id)
                return (
                  <div key={run.id} className="flex gap-3">
                    <div className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', run.status === 'running' ? 'bg-primary' : 'bg-muted-foreground/40')} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{capability?.name || 'Capacidad especializada'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {run.assigned_agent_id ? `${run.assigned_agent_id} · ` : ''}{statusLabels[run.status] || run.status}
                      </p>
                    </div>
                  </div>
                )
              })}
              {!data.runs.some((run) => !['completed', 'cancelled', 'skipped'].includes(run.status)) && (
                <p className="text-sm text-muted-foreground">No hay capacidades ejecutándose en este momento.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary"><Clock3 className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-primary">Trazabilidad</p>
                <h2 className="font-bold">Actividad reciente</h2>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {data.events.slice(0, 5).map((event) => (
                <div key={event.id} className="border-l-2 border-primary/30 pl-3">
                  <p className="text-sm font-semibold">{eventLabel(event.event_type)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              ))}
              {!data.events.length && <p className="text-sm text-muted-foreground">La actividad aparecerá al iniciar una misión.</p>}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

function Metric({ icon: Icon, label, value, helper, emphasis = false }: { icon: typeof Target; label: string; value: number; helper: string; emphasis?: boolean }) {
  return (
    <div className={cn('rounded-2xl border bg-card p-5', emphasis ? 'border-primary/50' : 'border-border')}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  )
}

function EmptyMissions({ playbooks }: { playbooks: Playbook[] }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-primary/10 p-3 text-primary"><Sparkles className="h-5 w-5" /></div>
        <div>
          <h3 className="font-bold">¿Qué quieres lograr?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Elige un playbook y Kumplio preparará la misión con las capacidades necesarias.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {playbooks.slice(0, 4).map((playbook) => (
          <Link key={playbook.id} href={`/missions?playbook=${playbook.slug}`} className="rounded-lg border border-border p-4 transition hover:border-primary/40 hover:bg-muted/30">
            <p className="font-semibold">{playbook.name}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{playbook.description || playbook.objective}</p>
          </Link>
        ))}
      </div>
      <Link href="/missions" className="mt-5 inline-flex items-center text-sm font-semibold text-primary hover:underline">
        Explorar misiones <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  )
}

function statusTone(status: string) {
  if (status === 'blocked') return 'bg-red-500/10 text-red-600'
  if (status === 'in_review') return 'bg-amber-500/10 text-amber-700'
  if (status === 'active') return 'bg-primary/10 text-primary'
  return 'bg-muted text-muted-foreground'
}

function eventLabel(type: string) {
  const labels: Record<string, string> = {
    mission_created: 'Misión creada',
    mission_started: 'Misión iniciada',
    capability_assigned: 'Capacidad asignada',
    capability_started: 'Trabajo iniciado',
    capability_completed: 'Capacidad completada',
    result_proposed: 'Nuevo resultado propuesto',
    result_approved: 'Resultado aprobado',
    mission_completed: 'Misión completada',
  }
  return labels[type] || type.replaceAll('_', ' ')
}
