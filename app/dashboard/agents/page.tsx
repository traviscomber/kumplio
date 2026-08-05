import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, CheckCircle2, CircleDashed, FileCheck2, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { LiveCaseRefresh } from '@/components/cases/live-case-refresh'
import { AGENT_CATALOG } from '@/lib/agents/catalog'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Equipo de especialistas | Kumplio',
  description: 'Estado real de los workflows y resultados persistidos del equipo de especialistas de Kumplio.',
}

const statusLabels: Record<string, string> = {
  draft: 'Preparado',
  queued: 'En cola',
  running: 'Trabajando',
  pending_review: 'Necesita revisión',
  paused: 'En pausa',
  changes_requested: 'Requiere cambios',
  completed: 'Finalizado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  failed: 'No completado',
}

export default async function AgentsDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/dashboard/agents')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')
  const organizationId = membership.organization_id

  const [{ data: workflow }, { data: latestCase }] = await Promise.all([
    supabase
      .from('agent_workflows')
      .select('id, case_id, status, current_stage, total_stages, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('compliance_cases')
      .select('id, title, status, updated_at')
      .eq('organization_id', organizationId)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const [stagesResult, artifactsResult, workflowCaseResult] = workflow
    ? await Promise.all([
        supabase
          .from('agent_workflow_stages')
          .select('id, stage_index, agent_id, label, status, run_id, output_artifact_id')
          .eq('workflow_id', workflow.id)
          .eq('organization_id', organizationId)
          .order('stage_index', { ascending: true }),
        supabase
          .from('agent_artifacts')
          .select('id')
          .eq('case_id', workflow.case_id)
          .eq('organization_id', organizationId),
        supabase
          .from('compliance_cases')
          .select('id, title, status')
          .eq('id', workflow.case_id)
          .eq('organization_id', organizationId)
          .maybeSingle(),
      ])
    : [{ data: [] }, { data: [] }, { data: null }]

  const stages = stagesResult.data || []
  const artifactCount = artifactsResult.data?.length || 0
  const workflowCase = workflowCaseResult.data || latestCase
  const active = Boolean(workflow && ['draft', 'queued', 'running', 'pending_review', 'paused'].includes(workflow.status))
  const completedStages = stages.filter((stage) => ['completed', 'approved'].includes(stage.status)).length

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-primary">Equipo de especialistas</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Trabajo real, no estados simulados.</h1>
            <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
              Kumplio asigna especialistas según el objetivo de cada caso. Esta pantalla muestra únicamente workflows, etapas y resultados que existen en el expediente.
            </p>
          </div>
          <LiveCaseRefresh active={active} />
        </div>

        {!workflow ? (
          <section className="rounded-[28px] border bg-card p-7 shadow-sm sm:p-9">
            <div className="flex items-start gap-4">
              <CircleDashed className="mt-1 h-7 w-7 shrink-0 text-primary" />
              <div>
                <h2 className="text-2xl font-black">Todavía no existe una ejecución persistida.</h2>
                <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                  El clic anterior en “Iniciar Análisis” no creó un run ni activó agentes. Para iniciar trabajo real primero debes describir el resultado que necesitas; Kumplio creará el caso, seleccionará el equipo e iniciará la primera etapa.
                </p>
                {latestCase && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Último expediente disponible: <strong className="text-foreground">{latestCase.title}</strong>.
                  </p>
                )}
                <Link
                  href="/cases/new"
                  className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:opacity-90"
                >
                  Iniciar análisis real <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-[28px] border bg-card p-7 shadow-sm sm:p-9">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Caso activo</p>
                  <h2 className="mt-3 text-2xl font-black sm:text-3xl">{workflowCase?.title || 'Caso de cumplimiento'}</h2>
                  <p className="mt-3 text-muted-foreground">
                    Estado: <strong className="text-foreground">{statusLabels[workflow.status] || workflow.status}</strong>
                  </p>
                </div>
                <Link
                  href={`/cases/${workflow.case_id}/beta`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground transition hover:opacity-90"
                >
                  Abrir caso <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <Metric label="Etapas completadas" value={`${completedStages} de ${workflow.total_stages}`} />
                <Metric label="Resultados guardados" value={String(artifactCount)} />
                <Metric label="Estado del workflow" value={statusLabels[workflow.status] || workflow.status} />
              </div>
            </section>

            <section className="rounded-[28px] border bg-card p-6 shadow-sm sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Equipo asignado</p>
              <h2 className="mt-2 text-2xl font-black">Qué está aportando cada especialista</h2>
              <div className="mt-6 space-y-4">
                {stages.map((stage) => {
                  const agent = AGENT_CATALOG.find((item) => item.id === stage.agent_id)
                  return (
                    <article key={stage.id} className="rounded-2xl border bg-background/60 p-5">
                      <div className="flex items-start gap-4">
                        <StageIcon status={stage.status} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-black">{agent?.name || stage.agent_id}</p>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">{valueMessage(stage.status, stage.label)}</p>
                            </div>
                            <span className="rounded-full border px-3 py-1 text-xs font-semibold">
                              {statusLabels[stage.status] || stage.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          </>
        )}

        <section className="rounded-[28px] border bg-muted/25 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-black">Catálogo oficial</h2>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Los siete especialistas disponibles son Isidora, Rodrigo, Javier, Beatriz, Verónica, Andrés y Julieta. No todos se activan en cada caso: el orquestador selecciona solo los necesarios y Julieta revisa el resultado final cuando corresponde.
          </p>
        </section>
      </main>
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-background/60 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  )
}

function StageIcon({ status }: { status: string }) {
  if (status === 'running') return <Loader2 className="mt-1 h-5 w-5 shrink-0 animate-spin text-primary" />
  if (['completed', 'approved'].includes(status)) return <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
  if (['pending_review', 'changes_requested'].includes(status)) return <FileCheck2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
  if (status === 'failed' || status === 'rejected') return <TriangleAlert className="mt-1 h-5 w-5 shrink-0 text-destructive" />
  return <CircleDashed className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
}

function valueMessage(status: string, label: string) {
  if (status === 'running') return `${label}. Está preparando un resultado verificable para este caso.`
  if (status === 'pending_review') return `${label}. El resultado está disponible y necesita una decisión antes de continuar.`
  if (status === 'changes_requested') return `${label}. Debe incorporar los cambios solicitados antes de avanzar.`
  if (['completed', 'approved'].includes(status)) return `${label}. Su resultado quedó guardado en el expediente.`
  if (status === 'failed') return `${label}. La etapa no terminó y no se presentará como resultado válido.`
  return `${label}. Comenzará cuando estén disponibles los insumos necesarios.`
}
