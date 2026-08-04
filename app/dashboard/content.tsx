'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileCheck2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Mission = {
  id: string
  title: string
  objective: string
  status: string
  priority: string
  due_at: string | null
  updated_at: string
}

type CapabilityRun = {
  id: string
  mission_id: string
  status: string
}

type MissionResult = {
  id: string
  mission_id: string
  title: string
  status: string
}

type DashboardData = {
  organization: { id: string; name: string } | null
  missions: Mission[]
  runs: CapabilityRun[]
  results: MissionResult[]
}

type PriorityItem = {
  id: string
  title: string
  explanation: string
  actionLabel: string
  href: string
  severity: 'high' | 'medium' | 'low'
  icon: ReactNode
}

const emptyData: DashboardData = {
  organization: null,
  missions: [],
  runs: [],
  results: [],
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData>(emptyData)
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
          window.location.href = '/onboarding'
          return
        }

        const organizationId = membership.organization_id
        const [organizationResult, missionsResult] = await Promise.all([
          supabase.from('organizations').select('id,name').eq('id', organizationId).maybeSingle(),
          supabase
            .from('missions')
            .select('id,title,objective,status,priority,due_at,updated_at')
            .eq('organization_id', organizationId)
            .order('updated_at', { ascending: false })
            .limit(20),
        ])

        const missions = (missionsResult.data || []) as Mission[]
        const missionIds = missions.map((mission) => mission.id)
        let runs: CapabilityRun[] = []
        let results: MissionResult[] = []

        if (missionIds.length > 0) {
          const [runsResult, resultsResult] = await Promise.all([
            supabase
              .from('mission_capability_runs')
              .select('id,mission_id,status')
              .in('mission_id', missionIds),
            supabase
              .from('mission_results')
              .select('id,mission_id,title,status')
              .in('mission_id', missionIds),
          ])

          runs = (runsResult.data || []) as CapabilityRun[]
          results = (resultsResult.data || []) as MissionResult[]
        }

        setData({
          organization: organizationResult.data,
          missions,
          runs,
          results,
        })
      } catch (error) {
        console.error('[dashboard] Load error:', error)
        setWarning('No pude revisar toda la información disponible. Lo que ves puede estar incompleto.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const priorities = useMemo(() => buildPriorities(data), [data])
  const activeMissions = data.missions.filter((mission) => !['completed', 'cancelled'].includes(mission.status))
  const completedMissions = data.missions.filter((mission) => mission.status === 'completed').length
  const hasHighPriority = priorities.some((priority) => priority.severity === 'high')

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Revisando el estado de cumplimiento…</div>
  }

  const statusTitle = hasHighPriority
    ? 'Encontré una situación que merece atención.'
    : priorities.length > 0
      ? `Encontré ${priorities.length === 1 ? 'un asunto' : `${priorities.length} asuntos`} para revisar.`
      : 'Hoy no encontré asuntos críticos.'

  const statusExplanation = priorities.length > 0
    ? 'Los ordené por impacto y dejé una acción clara para cada uno.'
    : 'Con la información disponible, tu organización se mantiene estable. Puedes continuar con tu trabajo.'

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <section className="overflow-hidden rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-primary">Estado de cumplimiento de hoy</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          {statusTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          {statusExplanation}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="rounded-full border px-3 py-1.5">{data.organization?.name || 'Tu organización'}</span>
          <span className="rounded-full border px-3 py-1.5">{activeMissions.length} trabajos en curso</span>
          <span className="rounded-full border px-3 py-1.5">{completedMissions} resultados completados</span>
        </div>
      </section>

      {warning && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6">
          {warning}
        </div>
      )}

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Lo que requiere atención</p>
            <h2 className="mt-1 text-2xl font-bold">Empieza por lo más importante</h2>
          </div>
          <Link href="/review-center" className="hidden text-sm font-semibold text-primary hover:underline sm:block">
            Ver todos los pendientes
          </Link>
        </div>

        <div className="mt-5 space-y-4">
          {priorities.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
              <h3 className="mt-4 text-xl font-bold">No necesitas hacer nada ahora.</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Seguiré mostrando aquí únicamente las situaciones que requieran una decisión o una acción de cumplimiento.
              </p>
              <Link href="/copilot" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Hacer una pregunta de cumplimiento <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            priorities.map((priority, index) => (
              <article key={priority.id} className="rounded-2xl border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className={severityTone(priority.severity)}>{priority.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Prioridad {index + 1}
                    </p>
                    <h3 className="mt-2 text-xl font-bold">{priority.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {priority.explanation}
                    </p>
                  </div>
                  <Link
                    href={priority.href}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
                  >
                    {priority.actionLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-muted/20 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-bold">Cada recomendación debe poder demostrarse.</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Las acciones, revisiones y aprobaciones permanecen vinculadas a su evidencia y trazabilidad. Kumplio prepara el trabajo; las decisiones importantes siguen en manos de las personas.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function buildPriorities(data: DashboardData): PriorityItem[] {
  const priorities: PriorityItem[] = []
  const now = Date.now()
  const soon = now + 7 * 24 * 60 * 60 * 1000

  for (const mission of data.missions) {
    if (mission.status === 'blocked') {
      priorities.push({
        id: `blocked-${mission.id}`,
        title: mission.title,
        explanation: 'Este trabajo de cumplimiento está bloqueado y necesita una intervención para poder continuar.',
        actionLabel: 'Resolver bloqueo',
        href: `/missions/${mission.id}`,
        severity: 'high',
        icon: <AlertTriangle className="h-5 w-5" />,
      })
    }
  }

  for (const run of data.runs) {
    if (run.status === 'review_required') {
      const mission = data.missions.find((item) => item.id === run.mission_id)
      priorities.push({
        id: `run-${run.id}`,
        title: mission?.title || 'Resultado listo para revisión',
        explanation: 'Kumplio terminó una parte del análisis y necesita una decisión humana antes de continuar.',
        actionLabel: 'Revisar decisión',
        href: mission ? `/missions/${mission.id}` : '/review-center',
        severity: 'medium',
        icon: <FileCheck2 className="h-5 w-5" />,
      })
    }
  }

  for (const result of data.results) {
    if (['proposed', 'in_review'].includes(result.status)) {
      priorities.push({
        id: `result-${result.id}`,
        title: result.title || 'Resultado pendiente de aprobación',
        explanation: 'Existe un resultado preparado que todavía no forma parte del estado oficial de cumplimiento.',
        actionLabel: 'Revisar resultado',
        href: `/missions/${result.mission_id}`,
        severity: 'medium',
        icon: <FileCheck2 className="h-5 w-5" />,
      })
    }
  }

  for (const mission of data.missions) {
    if (!mission.due_at || ['completed', 'cancelled'].includes(mission.status)) continue
    const dueAt = new Date(mission.due_at).getTime()
    if (dueAt <= soon) {
      const overdue = dueAt < now
      priorities.push({
        id: `due-${mission.id}`,
        title: mission.title,
        explanation: overdue
          ? 'La fecha comprometida ya pasó. Conviene revisar qué falta y dejar una decisión registrada.'
          : `La fecha comprometida es ${new Date(mission.due_at).toLocaleDateString('es-CL')}.`,
        actionLabel: overdue ? 'Revisar atraso' : 'Preparar cierre',
        href: `/missions/${mission.id}`,
        severity: overdue ? 'high' : 'low',
        icon: <Clock3 className="h-5 w-5" />,
      })
    }
  }

  const rank = { high: 0, medium: 1, low: 2 }
  return priorities
    .sort((a, b) => rank[a.severity] - rank[b.severity])
    .filter((priority, index, all) => all.findIndex((item) => item.href === priority.href && item.title === priority.title) === index)
    .slice(0, 3)
}

function severityTone(severity: PriorityItem['severity']) {
  const base = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border'
  if (severity === 'high') return `${base} border-red-500/30 bg-red-500/10 text-red-600`
  if (severity === 'medium') return `${base} border-amber-500/30 bg-amber-500/10 text-amber-600`
  return `${base} border-primary/30 bg-primary/10 text-primary`
}
