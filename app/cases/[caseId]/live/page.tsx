import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileCheck2,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { ArtifactResultPreview } from '@/components/cases/artifact-result-preview'
import { FinalCaseSummary } from '@/components/cases/final-case-summary'
import { LiveCaseRefresh } from '@/components/cases/live-case-refresh'
import { LiveWorkflowActions } from '@/components/cases/live-workflow-actions'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { AGENT_CATALOG } from '@/lib/agents/catalog'
import { getWorkflowStage } from '@/lib/agents/orchestration'

export const dynamic = 'force-dynamic'

const workflowLabels: Record<string, string> = {
  compliance_assessment: 'Evaluación integral',
  contract_review: 'Revisión contractual',
  control_assessment: 'Evaluación de controles',
}

const statusLabels: Record<string, string> = {
  draft: 'Preparado',
  queued: 'En cola',
  running: 'En ejecución',
  pending_review: 'En revisión',
  paused: 'Pausado',
  changes_requested: 'Requiere cambios',
  completed: 'Finalizado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  failed: 'Fallido',
}

export default async function LiveCasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/cases/${caseId}/live`)

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) notFound()
  const organizationId = membership.organization_id

  const { data: complianceCase } = await supabase
    .from('compliance_cases')
    .select('id, title, description, status, created_at')
    .eq('id', caseId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!complianceCase) notFound()

  const { data: workflow } = await supabase
    .from('agent_workflows')
    .select('id, workflow_type, status, current_stage, total_stages, created_at, updated_at, completed_at')
    .eq('case_id', caseId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const [stagesResult, artifactsResult, eventsResult, reviewsResult] = workflow
    ? await Promise.all([
        supabase
          .from('agent_workflow_stages')
          .select('id, stage_index, agent_id, status, attempt_count, run_id, output_artifact_id, started_at, completed_at, updated_at')
          .eq('workflow_id', workflow.id)
          .eq('organization_id', organizationId)
          .order('stage_index', { ascending: true }),
        supabase
          .from('agent_artifacts')
          .select('id, run_id, artifact_type, title, content, status, version, created_at')
          .eq('case_id', caseId)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('compliance_case_events')
          .select('id, event_type, summary, changes, created_at')
          .eq('case_id', caseId)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('agent_reviews')
          .select('id, run_id, artifact_id, decision, comment, created_at')
          .eq('case_id', caseId)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(30),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]

  const stages = stagesResult.data || []
  const artifacts = artifactsResult.data || []
  const events = eventsResult.data || []
  const reviews = reviewsResult.data || []
  const active = Boolean(workflow && ['draft', 'queued', 'running', 'pending_review', 'paused'].includes(workflow.status))
  const completedStages = stages.filter((stage) => ['completed', 'approved'].includes(stage.status)).length
  const actionableStage = workflow
    ? stages.find((stage) => ['pending_review', 'changes_requested'].includes(stage.status))
      || stages.find((stage) => stage.stage_index === workflow.current_stage)
      || null
    : null
  const finalStage = stages.length > 0 ? stages[stages.length - 1] : null
  const finalArtifact = finalStage
    ? artifacts.find((artifact) => artifact.id === finalStage.output_artifact_id)
      || artifacts.find((artifact) => artifact.run_id === finalStage.run_id)
      || null
    : null
  const finalReview = finalStage?.run_id
    ? reviews.find((review) => review.run_id === finalStage.run_id) || null
    : null
  const finalAgent = finalStage
    ? AGENT_CATALOG.find((item) => item.id === finalStage.agent_id) || null
    : null

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href={`/cases/${caseId}`} className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al expediente
          </Link>
          <LiveCaseRefresh active={active} />
        </div>

        <section className="mt-6 overflow-hidden rounded-[28px] border bg-card shadow-sm">
          <div className="border-b bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_44%)] px-6 py-9 sm:px-9">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Caso en vivo</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">{complianceCase.title}</h1>
            <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
              {workflow
                ? `${workflowLabels[workflow.workflow_type] || workflow.workflow_type}. La vista se alimenta únicamente de estados, eventos, revisiones y artefactos persistidos.`
                : 'Este expediente todavía no tiene un workflow asociado.'}
            </p>

            {workflow && (
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <Metric label="Estado" value={statusLabels[workflow.status] || workflow.status} />
                <Metric label="Etapas terminadas" value={`${completedStages} de ${workflow.total_stages}`} />
                <Metric label="Artefactos" value={String(artifacts.length)} />
              </div>
            )}
          </div>

          {!workflow ? (
            <div className="p-8 text-sm text-muted-foreground">No hay trabajo agentic preparado para este caso.</div>
          ) : (
            <div className="space-y-8 p-6 sm:p-9">
              <FinalCaseSummary
                workflowStatus={workflow.status}
                finalStageStatus={finalStage?.status || null}
                finalAgentName={finalAgent?.name || null}
                artifactTitle={finalArtifact?.title || null}
                artifactContent={finalArtifact?.content || null}
                reviewDecision={finalReview?.decision || null}
                reviewComment={finalReview?.comment || null}
                reviewedAt={finalReview?.created_at || null}
              />

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
                <section>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Equipo trabajando</p>
                      <h2 className="mt-2 text-2xl font-black">Etapas reales</h2>
                    </div>
                    {active && <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">Actualización automática</span>}
                  </div>

                  <div className="mt-6 space-y-4">
                    {stages.map((stage) => {
                      const agent = AGENT_CATALOG.find((item) => item.id === stage.agent_id)
                      const stageLabel = getWorkflowStage(workflow.workflow_type, stage.stage_index)?.label || `Etapa ${stage.stage_index + 1}`
                      const isRunning = stage.status === 'running'
                      const isDone = ['completed', 'approved'].includes(stage.status)
                      const needsReview = ['pending_review', 'changes_requested'].includes(stage.status)
                      return (
                        <article key={stage.id} className={`rounded-2xl border p-5 ${isRunning ? 'border-primary/40 bg-primary/5' : 'bg-background/50'}`}>
                          <div className="flex items-start gap-4">
                            <div className="mt-0.5 text-primary">
                              {isRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : isDone ? <CheckCircle2 className="h-5 w-5" /> : needsReview ? <ShieldCheck className="h-5 w-5" /> : <CircleDashed className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-black">{agent?.name || stage.agent_id}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">{stageLabel}</p>
                                </div>
                                <span className="rounded-full border px-3 py-1 text-xs font-semibold">{statusLabels[stage.status] || stage.status}</span>
                              </div>
                              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                                <span>Etapa {stage.stage_index + 1}</span>
                                <span>Intentos: {stage.attempt_count}</span>
                                {stage.started_at && <span>Inicio: {new Date(stage.started_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>}
                                {stage.completed_at && <span>Fin: {new Date(stage.completed_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>}
                              </div>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </section>

                <aside className="space-y-6">
                  <LiveWorkflowActions
                    workflowId={workflow.id}
                    runId={actionableStage?.run_id || null}
                    stageStatus={actionableStage?.status || null}
                    workflowStatus={workflow.status}
                  />

                  <section className="rounded-2xl border bg-background/50 p-5">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-5 w-5 text-primary" />
                      <h2 className="font-black">Resultados generados</h2>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Se muestra solo contenido persistido. Los bloques aparecen cuando el artefacto contiene campos reconocibles.
                    </p>
                    <div className="mt-4 space-y-4">
                      {artifacts.length === 0 ? (
                        <p className="text-sm leading-6 text-muted-foreground">Todavía no existe un artefacto persistido.</p>
                      ) : artifacts.map((artifact) => (
                        <article key={artifact.id} className="rounded-xl border p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-semibold">{artifact.title}</p>
                            <span className="rounded-full border px-2 py-1 text-[11px] font-semibold">
                              {statusLabels[artifact.status] || artifact.status}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">{artifact.artifact_type} · versión {artifact.version}</p>
                          <ArtifactResultPreview content={artifact.content} />
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border bg-background/50 p-5">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-5 w-5 text-primary" />
                      <h2 className="font-black">Bitácora</h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      {events.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay eventos registrados.</p>
                      ) : events.map((event) => (
                        <div key={event.id} className="border-l-2 border-primary/20 pl-4">
                          <p className="text-sm font-semibold">{event.summary}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </aside>
              </div>
            </div>
          )}
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
