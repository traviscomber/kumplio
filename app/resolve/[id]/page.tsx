import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, FileCheck2, Scale } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

type Mission = {
  id: string
  title: string
  objective: string
  status: string
  due_at: string | null
  organization_id: string
}

type CapabilityRun = {
  id: string
  status: string
  capability_id: string
}

type MissionResult = {
  id: string
  title: string
  status: string
  result_type: string
  created_at: string
}

export default async function ResolvePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/resolve/${id}`)

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')

  const [{ data: mission, error: missionError }, { data: runRows }, { data: resultRows }] = await Promise.all([
    admin
      .from('missions')
      .select('id,title,objective,status,due_at,organization_id')
      .eq('id', id)
      .eq('organization_id', membership.organization_id)
      .maybeSingle(),
    admin
      .from('mission_capability_runs')
      .select('id,status,capability_id')
      .eq('mission_id', id)
      .order('sequence'),
    admin
      .from('mission_results')
      .select('id,title,status,result_type,created_at')
      .eq('mission_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (missionError) throw new Error(`No fue posible cargar la situación: ${missionError.message}`)
  if (!mission) notFound()

  const typedMission = mission as Mission
  const runs = (runRows || []) as CapabilityRun[]
  const results = (resultRows || []) as MissionResult[]
  const reviewRuns = runs.filter((run) => run.status === 'review_required')
  const pendingResults = results.filter((result) => ['proposed', 'in_review'].includes(result.status))

  const finding = buildFinding(typedMission, reviewRuns.length, pendingResults.length)
  const prepared = buildPrepared(reviewRuns.length, pendingResults)
  const primaryHref = pendingResults.length > 0 || reviewRuns.length > 0
    ? `/missions/${typedMission.id}`
    : `/missions/${typedMission.id}`

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al estado de hoy
        </Link>

        <header className="mt-6 border-b pb-6">
          <p className="text-sm font-semibold text-primary">Situación que requiere revisión</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{typedMission.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{typedMission.objective}</p>
        </header>

        <div className="mt-8 space-y-6">
          <section className="rounded-2xl border bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Encontré</p>
            <h2 className="mt-3 text-2xl font-bold">{finding.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{finding.description}</p>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <div className="flex items-start gap-3">
              <Scale className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Por qué importa</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Esta situación forma parte del trabajo de cumplimiento de tu organización. Antes de incorporarla al estado oficial, debe existir una revisión humana y una decisión trazable.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <div className="flex items-start gap-3">
              <FileCheck2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Preparé</p>
                <div className="mt-4 space-y-3">
                  {prepared.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm leading-6">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <details className="rounded-2xl border bg-card p-6">
            <summary className="cursor-pointer text-sm font-bold">Ver evidencia y trazabilidad</summary>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>{runs.length} capacidades registradas en esta misión.</p>
              <p>{results.length} resultados conservados.</p>
              {typedMission.due_at && <p>Fecha comprometida: {new Date(typedMission.due_at).toLocaleDateString('es-CL')}.</p>}
            </div>
          </details>

          <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <p className="text-sm font-semibold">La decisión sigue en tus manos.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Revisa la propuesta completa y aprueba únicamente cuando el fundamento y la evidencia sean suficientes.
            </p>
            <Link
              href={primaryHref}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 sm:w-auto"
            >
              Revisar propuesta <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </main>
    </>
  )
}

function buildFinding(mission: Mission, reviewRuns: number, pendingResults: number) {
  if (mission.status === 'blocked') {
    return {
      title: 'El trabajo no puede continuar todavía.',
      description: 'La misión está bloqueada. Conviene revisar la causa y registrar la decisión necesaria para reanudarla.',
    }
  }

  if (reviewRuns > 0) {
    return {
      title: 'El análisis terminó y requiere una decisión.',
      description: `${reviewRuns} ${reviewRuns === 1 ? 'resultado intermedio necesita' : 'resultados intermedios necesitan'} revisión humana antes de continuar.`,
    }
  }

  if (pendingResults > 0) {
    return {
      title: 'Existe una propuesta pendiente de aprobación.',
      description: `${pendingResults} ${pendingResults === 1 ? 'resultado todavía no forma' : 'resultados todavía no forman'} parte del estado oficial de cumplimiento.`,
    }
  }

  return {
    title: 'La fecha o el avance requieren revisión.',
    description: 'Conviene confirmar qué falta, quién debe intervenir y qué evidencia permitirá cerrar este trabajo.',
  }
}

function buildPrepared(reviewRuns: number, results: MissionResult[]) {
  const items = ['El contexto y el objetivo de cumplimiento', 'La trazabilidad del trabajo realizado']
  if (reviewRuns > 0) items.push(`${reviewRuns} decisiones listas para revisión`)
  if (results.length > 0) items.push(`${results.length} resultados disponibles como respaldo`)
  items.push('El acceso directo a la propuesta completa')
  return items
}
