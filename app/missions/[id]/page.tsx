import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bot,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FileCheck2,
  ShieldCheck,
  Target,
  UserRound,
} from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type PageParams = Promise<{ id: string }>

type CapabilityRun = {
  id: string
  sequence: number
  status: string
  assigned_agent_id: string | null
  started_at: string | null
  completed_at: string | null
  capability: { name: string; customer_outcome: string; review_required: boolean } | null
}

type MissionEvent = {
  id: string
  event_type: string
  actor_type: string
  actor_agent_id: string | null
  from_status: string | null
  to_status: string | null
  payload: Record<string, unknown>
  created_at: string
}

type MissionResult = {
  id: string
  result_type: string
  version: number
  status: string
  title: string
  summary: string | null
  evidence_ids: string[]
  reviewed_at: string | null
  created_at: string
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  ready: 'Lista para iniciar',
  active: 'En ejecución',
  blocked: 'Bloqueada',
  in_review: 'En revisión',
  completed: 'Finalizada',
  cancelled: 'Cancelada',
  pending: 'Pendiente',
  running: 'Trabajando',
  review_required: 'Requiere revisión',
  failed: 'Con error',
  skipped: 'Omitida',
}

const eventLabels: Record<string, string> = {
  mission_created: 'Misión creada',
  mission_started: 'Misión iniciada',
  capability_assigned: 'Especialista asignado',
  capability_started: 'Capacidad iniciada',
  capability_completed: 'Capacidad completada',
  mission_result_recorded: 'Resultado propuesto',
  mission_result_reviewed: 'Resultado revisado',
  evidence_added: 'Evidencia vinculada',
  mission_completed: 'Misión finalizada',
}

function formatDate(value: string | null, includeTime = false) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CL', includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(new Date(value))
}

function statusTone(status: string) {
  if (['blocked', 'failed', 'critical'].includes(status)) return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
  if (['completed', 'approved'].includes(status)) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
  if (['in_review', 'review_required'].includes(status)) return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  return 'border-primary/20 bg-primary/10 text-primary'
}

export default async function MissionWorkspacePage({ params }: { params: PageParams }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data: mission } = await supabase
    .from('missions')
    .select('id,title,objective,status,priority,owner_id,created_by,started_at,due_at,completed_at,created_at,updated_at,case_id,playbook:mission_playbooks(id,name,description,objective,vertical,closing_criteria)')
    .eq('id', id)
    .maybeSingle()

  if (!mission) notFound()

  const [runsResult, eventsResult, resultsResult] = await Promise.all([
    supabase
      .from('mission_capability_runs')
      .select('id,sequence,status,assigned_agent_id,started_at,completed_at,capability:mission_capabilities(name,customer_outcome,review_required)')
      .eq('mission_id', id)
      .order('sequence'),
    supabase
      .from('mission_events')
      .select('id,event_type,actor_type,actor_agent_id,from_status,to_status,payload,created_at')
      .eq('mission_id', id)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('mission_results')
      .select('id,result_type,version,status,title,summary,evidence_ids,reviewed_at,created_at')
      .eq('mission_id', id)
      .order('created_at', { ascending: false }),
  ])

  const runs = (runsResult.data || []) as unknown as CapabilityRun[]
  const events = (eventsResult.data || []) as MissionEvent[]
  const results = (resultsResult.data || []) as MissionResult[]
  const completedRuns = runs.filter((run) => run.status === 'completed').length
  const progress = runs.length ? Math.round((completedRuns / runs.length) * 100) : 0
  const pendingReviews = results.filter((result) => ['proposed', 'in_review'].includes(result.status)).length
  const evidenceCount = new Set(results.flatMap((result) => result.evidence_ids || [])).size
  const playbook = Array.isArray(mission.playbook) ? mission.playbook[0] : mission.playbook

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <Link href="/missions" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Misiones
          </Link>

          <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('rounded-full border px-3 py-1 text-xs font-bold', statusTone(mission.status))}>
                    {statusLabels[mission.status] || mission.status}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize text-muted-foreground">
                    Prioridad {mission.priority === 'critical' ? 'crítica' : mission.priority === 'high' ? 'alta' : mission.priority === 'low' ? 'baja' : 'media'}
                  </span>
                  {playbook?.vertical && <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize text-muted-foreground">{playbook.vertical}</span>}
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{mission.title}</h1>
                <p className="mt-3 text-base text-muted-foreground sm:text-lg">{mission.objective}</p>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center"><CalendarDays className="mr-2 h-4 w-4" />Fecha objetivo: {formatDate(mission.due_at)}</span>
                  <span className="inline-flex items-center"><Clock3 className="mr-2 h-4 w-4" />Actualizada: {formatDate(mission.updated_at)}</span>
                  {mission.case_id && <span className="inline-flex items-center"><ShieldCheck className="mr-2 h-4 w-4" />Expediente vinculado</span>}
                </div>
              </div>

              <div className="w-full rounded-2xl border border-border bg-background/70 p-5 xl:w-72">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Capacidades completadas</p>
                    <p className="mt-1 text-3xl font-bold">{completedRuns}/{runs.length}</p>
                  </div>
                  <p className="text-lg font-bold text-primary">{progress}%</p>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">El avance operativo no equivale a una certificación de cumplimiento.</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={Target} label="Capacidades" value={String(runs.length)} detail={`${completedRuns} completadas`} />
            <Metric icon={Bot} label="Equipo IA" value={String(runs.filter((run) => run.assigned_agent_id).length)} detail="asignaciones visibles" />
            <Metric icon={AlertCircle} label="Decisiones" value={String(pendingReviews)} detail="resultados por revisar" />
            <Metric icon={FileCheck2} label="Evidencias" value={String(evidenceCount)} detail="vinculadas a resultados" />
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-primary">Trabajo</p>
                    <h2 className="mt-1 text-2xl font-bold">Capacidades de la misión</h2>
                  </div>
                  <span className="text-sm text-muted-foreground">Playbook: {playbook?.name || 'Sin nombre'}</span>
                </div>

                <div className="mt-6 space-y-3">
                  {runs.map((run) => {
                    const done = run.status === 'completed'
                    const active = ['ready', 'running', 'review_required'].includes(run.status)
                    return (
                      <article key={run.id} className={cn('rounded-xl border p-4', active ? 'border-primary/30 bg-primary/5' : 'border-border')}>
                        <div className="flex gap-4">
                          <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold', done ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' : active ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                            {done ? <CheckCircle2 className="h-4 w-4" /> : run.sequence}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h3 className="font-bold">{run.capability?.name || 'Capacidad especializada'}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{run.capability?.customer_outcome || 'Resultado pendiente de definición.'}</p>
                              </div>
                              <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', statusTone(run.status))}>{statusLabels[run.status] || run.status}</span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                              <span className="inline-flex items-center"><Bot className="mr-1.5 h-3.5 w-3.5" />{run.assigned_agent_id || 'Especialista aún no asignado'}</span>
                              {run.capability?.review_required && <span className="inline-flex items-center"><UserRound className="mr-1.5 h-3.5 w-3.5" />Revisión humana requerida</span>}
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                  {!runs.length && <EmptyState title="La misión no tiene capacidades" description="Revisa la configuración del playbook antes de continuar." />}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6">
                <p className="text-sm font-semibold text-primary">Resultados</p>
                <h2 className="mt-1 text-2xl font-bold">Entregables y decisiones</h2>
                <div className="mt-6 space-y-3">
                  {results.map((result) => (
                    <article key={result.id} className="rounded-xl border border-border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{result.result_type} · versión {result.version}</p>
                          <h3 className="mt-1 font-bold">{result.title}</h3>
                          {result.summary && <p className="mt-2 text-sm text-muted-foreground">{result.summary}</p>}
                        </div>
                        <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', statusTone(result.status))}>
                          {result.status === 'proposed' ? 'Propuesto' : result.status === 'approved' ? 'Aprobado' : result.status === 'rejected' ? 'Rechazado' : result.status === 'superseded' ? 'Reemplazado' : 'En revisión'}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>{result.evidence_ids?.length || 0} evidencias</span>
                        <span>Creado {formatDate(result.created_at)}</span>
                        {result.reviewed_at && <span>Revisado {formatDate(result.reviewed_at)}</span>}
                      </div>
                    </article>
                  ))}
                  {!results.length && <EmptyState title="Todavía no hay resultados" description="Los entregables aparecerán aquí cuando las capacidades produzcan propuestas revisables." />}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-border bg-card p-6">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="mt-3 text-xl font-bold">Actividad</h2>
                <div className="mt-5 space-y-5">
                  {events.map((event, index) => (
                    <div key={event.id} className="relative flex gap-3">
                      {index < events.length - 1 && <div className="absolute left-[7px] top-5 h-[calc(100%+8px)] w-px bg-border" />}
                      <Circle className="mt-1 h-4 w-4 shrink-0 fill-primary text-primary" />
                      <div>
                        <p className="text-sm font-semibold">{eventLabels[event.event_type] || event.event_type.replaceAll('_', ' ')}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {event.actor_type === 'agent' ? event.actor_agent_id || 'Equipo IA' : event.actor_type === 'user' ? 'Persona autorizada' : 'Sistema'} · {formatDate(event.created_at, true)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!events.length && <p className="text-sm text-muted-foreground">Todavía no hay actividad registrada.</p>}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="mt-3 text-xl font-bold">Criterio de cierre</h2>
                <p className="mt-2 text-sm text-muted-foreground">La misión solo puede considerarse preparada cuando sus resultados estén respaldados y revisados.</p>
                <div className="mt-5 space-y-3">
                  {(Array.isArray(playbook?.closing_criteria) ? playbook.closing_criteria : []).map((criterion, index) => (
                    <div key={index} className="flex gap-3 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{typeof criterion === 'string' ? criterion : JSON.stringify(criterion)}</span>
                    </div>
                  ))}
                  {(!Array.isArray(playbook?.closing_criteria) || !playbook.closing_criteria.length) && <p className="text-sm text-muted-foreground">Sin criterios publicados.</p>}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Target; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-7 text-center">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
