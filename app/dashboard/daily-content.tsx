import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileCheck2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Mission = {
  id: string
  title: string
  objective: string
  status: string
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

type Priority = {
  id: string
  missionId: string
  title: string
  explanation: string
  severity: 'high' | 'medium' | 'low'
  estimatedMinutes: number
}

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
  const [{ data: organization }, { data: missionRows, error: missionsError }] = await Promise.all([
    admin.from('organizations').select('id,name').eq('id', organizationId).maybeSingle(),
    admin
      .from('missions')
      .select('id,title,objective,status,due_at,updated_at')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(30),
  ])

  if (missionsError) throw new Error(`No fue posible revisar el trabajo de cumplimiento: ${missionsError.message}`)

  const missions = (missionRows || []) as Mission[]
  const missionIds = missions.map((mission) => mission.id)
  let runs: CapabilityRun[] = []
  let results: MissionResult[] = []

  if (missionIds.length > 0) {
    const [{ data: runRows, error: runsError }, { data: resultRows, error: resultsError }] = await Promise.all([
      admin
        .from('mission_capability_runs')
        .select('id,mission_id,status')
        .in('mission_id', missionIds),
      admin
        .from('mission_results')
        .select('id,mission_id,title,status')
        .in('mission_id', missionIds),
    ])

    if (runsError) throw new Error(`No fue posible revisar las decisiones pendientes: ${runsError.message}`)
    if (resultsError) throw new Error(`No fue posible revisar los resultados preparados: ${resultsError.message}`)

    runs = (runRows || []) as CapabilityRun[]
    results = (resultRows || []) as MissionResult[]
  }

  const priorities = buildPriorities(missions, runs, results)
  const hasCritical = priorities.some((priority) => priority.severity === 'high')
  const statusTitle = hasCritical
    ? 'Encontré una situación que merece atención.'
    : priorities.length > 0
      ? `Encontré ${priorities.length === 1 ? 'un asunto' : `${priorities.length} asuntos`} para revisar.`
      : 'Hoy no encontré asuntos críticos.'

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-primary">Estado de cumplimiento de hoy</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">{statusTitle}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          {priorities.length > 0
            ? 'Los ordené por impacto y dejé una sola acción para cada uno.'
            : 'Con la información disponible, tu organización se mantiene estable. Puedes continuar con tu trabajo.'}
        </p>
        <p className="mt-6 text-sm text-muted-foreground">{organization?.name || 'Tu organización'}</p>
      </section>

      <section>
        <p className="text-sm font-semibold text-primary">Lo que requiere atención</p>
        <h2 className="mt-1 text-2xl font-bold">Empieza por lo más importante</h2>

        <div className="mt-5 space-y-4">
          {priorities.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
              <h3 className="mt-4 text-xl font-bold">No necesitas hacer nada ahora.</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Aquí aparecerán únicamente situaciones que requieran una decisión o una acción de cumplimiento.
              </p>
            </div>
          ) : (
            priorities.map((priority, index) => (
              <article key={priority.id} className="rounded-2xl border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className={severityTone(priority.severity)}>{priorityIcon(priority.severity)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Prioridad {index + 1}</p>
                    <h3 className="mt-2 text-xl font-bold">{priority.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{priority.explanation}</p>
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">Tiempo estimado: {priority.estimatedMinutes} min</p>
                  </div>
                  <Link
                    href={`/resolve/${priority.missionId}`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
                  >
                    Resolver <ArrowRight className="h-4 w-4" />
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
            <h2 className="font-bold">Cada recomendación conserva evidencia y trazabilidad.</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Kumplio prepara el trabajo. Las decisiones importantes siguen en manos de las personas.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function buildPriorities(missions: Mission[], runs: CapabilityRun[], results: MissionResult[]): Priority[] {
  const priorities: Priority[] = []
  const now = Date.now()
  const soon = now + 7 * 24 * 60 * 60 * 1000

  for (const mission of missions) {
    if (mission.status === 'blocked') {
      priorities.push({
        id: `blocked-${mission.id}`,
        missionId: mission.id,
        title: mission.title,
        explanation: 'Este trabajo de cumplimiento está bloqueado y necesita una intervención para continuar.',
        severity: 'high',
        estimatedMinutes: 5,
      })
    }
  }

  for (const run of runs) {
    if (run.status !== 'review_required') continue
    const mission = missions.find((item) => item.id === run.mission_id)
    if (!mission) continue
    priorities.push({
      id: `run-${run.id}`,
      missionId: mission.id,
      title: mission.title,
      explanation: 'El análisis terminó y necesita una decisión humana antes de avanzar.',
      severity: 'medium',
      estimatedMinutes: 5,
    })
  }

  for (const result of results) {
    if (!['proposed', 'in_review'].includes(result.status)) continue
    priorities.push({
      id: `result-${result.id}`,
      missionId: result.mission_id,
      title: result.title || 'Resultado pendiente de aprobación',
      explanation: 'Existe un resultado preparado que todavía no forma parte del estado oficial de cumplimiento.',
      severity: 'medium',
      estimatedMinutes: 6,
    })
  }

  for (const mission of missions) {
    if (!mission.due_at || ['completed', 'cancelled'].includes(mission.status)) continue
    const dueAt = new Date(mission.due_at).getTime()
    if (dueAt > soon) continue
    const overdue = dueAt < now
    priorities.push({
      id: `due-${mission.id}`,
      missionId: mission.id,
      title: mission.title,
      explanation: overdue
        ? 'La fecha comprometida ya pasó. Conviene revisar qué falta y dejar una decisión registrada.'
        : `La fecha comprometida es ${new Date(mission.due_at).toLocaleDateString('es-CL')}.`,
      severity: overdue ? 'high' : 'low',
      estimatedMinutes: overdue ? 8 : 5,
    })
  }

  const rank = { high: 0, medium: 1, low: 2 }
  return priorities
    .sort((a, b) => rank[a.severity] - rank[b.severity])
    .filter((priority, index, all) => all.findIndex((item) => item.missionId === priority.missionId) === index)
    .slice(0, 3)
}

function severityTone(severity: Priority['severity']) {
  const base = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border'
  if (severity === 'high') return `${base} border-red-500/30 bg-red-500/10 text-red-600`
  if (severity === 'medium') return `${base} border-amber-500/30 bg-amber-500/10 text-amber-600`
  return `${base} border-primary/30 bg-primary/10 text-primary`
}

function priorityIcon(severity: Priority['severity']) {
  if (severity === 'high') return <AlertTriangle className="h-5 w-5" />
  if (severity === 'medium') return <FileCheck2 className="h-5 w-5" />
  return <Clock3 className="h-5 w-5" />
}
