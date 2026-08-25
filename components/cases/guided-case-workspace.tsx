import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, FileCheck2, History } from 'lucide-react'
import { ArtifactResultPreview } from '@/components/cases/artifact-result-preview'
import { CaseSpecialistContributions } from '@/components/cases/case-specialist-contributions'
import { FinalCaseSummary } from '@/components/cases/final-case-summary'
import { LiveCaseRefresh } from '@/components/cases/live-case-refresh'
import { LiveWorkflowActions } from '@/components/cases/live-workflow-actions'
import { StartCaseResolution } from '@/components/cases/start-case-resolution'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { AGENT_CATALOG } from '@/lib/agents/catalog'

const STALE_EXECUTION_MS = 7 * 60 * 1000

const statusLabels: Record<string, string> = {
  draft: 'Preparado',
  queued: 'En cola',
  running: 'Trabajando',
  pending_review: 'Necesita tu revisión',
  paused: 'Esperando cambios',
  changes_requested: 'Requiere cambios',
  completed: 'Listo para cerrar',
  approved: 'Resuelto',
  rejected: 'Rechazado',
  failed: 'No completado',
  superseded: 'Reemplazado',
  active: 'En curso',
  archived: 'Archivado',
}

export async function GuidedCaseWorkspace({ caseId }: { caseId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/app/casos/${caseId}`)

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
    .select('id, title, description, status, created_at, updated_at')
    .eq('id', caseId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!complianceCase) notFound()

  const { data: workflow } = await supabase
    .from('agent_workflows')
    .select('id, workflow_type, status, current_stage, total_stages, updated_at')
    .eq('case_id', caseId)
    .eq('organization_id', organizationId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const [stagesResult, artifactsResult, reviewsResult, eventsResult] = workflow
    ? await Promise.all([
        supabase
          .from('agent_workflow_stages')
          .select('id, stage_index, agent_id, status, attempt_count, max_attempts, run_id, output_artifact_id, started_at, completed_at')
          .eq('workflow_id', workflow.id)
          .eq('organization_id', organizationId)
          .order('stage_index', { ascending: true }),
        supabase
          .from('agent_artifacts')
          .select('id, run_id, artifact_type, title, content, status, version, created_at')
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
        supabase
          .from('compliance_case_events')
          .select('id, event_type, summary, created_at')
          .eq('case_id', caseId)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(10),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]

  const stages = stagesResult.data || []
  const artifacts = artifactsResult.data || []
  const reviews = reviewsResult.data || []
  const events = eventsResult.data || []
  const active = Boolean(workflow && ['draft', 'queued', 'running', 'pending_review', 'paused'].includes(workflow.status))
  const actionableStage = workflow
    ? stages.find((stage) => ['pending_review', 'changes_requested', 'failed'].includes(stage.status))
      || stages.find((stage) => stage.stage_index === workflow.current_stage)
      || null
    : null
  const canRecoverStale = Boolean(
    workflow?.status === 'running'
      && actionableStage?.status === 'running'
      && actionableStage.started_at
      && Date.now() - new Date(actionableStage.started_at).getTime() >= STALE_EXECUTION_MS,
  )
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
  const approvedStages = stages.filter((stage) => stage.status === 'approved').length

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/app/casos" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Tus casos
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {workflow && (
              <Link
                href={`/cases/${caseId}/live`}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border bg-background px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <History className="mr-2 h-4 w-4" /> Ver trazabilidad
              </Link>
            )}
            <LiveCaseRefresh active={active} />
          </div>
        </div>

        <header className="mt-6 overflow-hidden rounded-[30px] border bg-card shadow-sm">
          <div className="border-b bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_46%)] p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Qué necesitas resolver</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">{complianceCase.title}</h1>
            <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
              {complianceCase.description || 'Kumplio reunirá el contexto, preparará decisiones y conservará el respaldo de cada paso.'}
            </p>

            {workflow ? (
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Metric label="Estado actual" value={statusLabels[workflow.status] || workflow.status} />
                <Metric label="Pasos validados" value={`${approvedStages} de ${workflow.total_stages}`} />
                <Metric label="Resultados disponibles" value={String(artifacts.filter((artifact) => artifact.status !== 'superseded').length)} />
              </div>
            ) : (
              <div className="mt-8 max-w-xl rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <h2 className="text-xl font-black">Este caso todavía no tiene trabajo guiado.</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Inicia la resolución para que Kumplio organice el análisis, prepare resultados revisables y deje evidencia de cada decisión.
                </p>
                <div className="mt-5">
                  <StartCaseResolution
                    caseId={caseId}
                    instructions={[complianceCase.title, complianceCase.description].filter(Boolean).join('\n\n')}
                  />
                </div>
              </div>
            )}
          </div>

          {workflow && (
            <div className="grid gap-5 p-6 sm:p-8 lg:grid-cols-[1fr_0.72fr]">
              <section className="rounded-2xl border bg-background/55 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Qué importa ahora</p>
                <h2 className="mt-3 text-2xl font-black">{currentMessage(workflow.status, actionableStage?.status || null)}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {currentDetail(workflow.status, actionableStage?.status || null)}
                </p>
              </section>
              <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Control humano</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Kumplio no presenta una etapa como validada hasta que exista un resultado persistido y una aprobación humana registrada.
                </p>
              </section>
            </div>
          )}
        </header>

        {workflow && (
          <div className="mt-8 space-y-8">
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

            <CaseSpecialistContributions stages={stages} artifacts={artifacts} reviews={reviews} />

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
              <section className="rounded-[28px] border bg-card p-6 shadow-sm sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Resultados persistidos</p>
                <h2 className="mt-2 text-2xl font-black">Conclusiones y respaldo</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Aquí se muestran resultados guardados y revisables. Las versiones reemplazadas permanecen en la trazabilidad del expediente.
                </p>

                <div className="mt-6 space-y-4">
                  {artifacts.length === 0 ? (
                    <p className="text-sm leading-6 text-muted-foreground">Los resultados aparecerán aquí cuando estén guardados.</p>
                  ) : artifacts.map((artifact) => (
                    <article key={artifact.id} className="rounded-xl border p-4">
                      <p className="font-semibold">{artifact.title}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{statusLabels[artifact.status] || artifact.status} · versión {artifact.version}</p>
                      <ArtifactResultPreview content={artifact.content} />
                    </article>
                  ))}
                </div>
              </section>

              <aside className="space-y-6">
                <LiveWorkflowActions
                  workflowId={workflow.id}
                  runId={actionableStage?.run_id || null}
                  stageStatus={actionableStage?.status || null}
                  workflowStatus={workflow.status}
                  attemptCount={actionableStage?.attempt_count ?? null}
                  maxAttempts={actionableStage?.max_attempts ?? null}
                  canRecoverStale={canRecoverStale}
                />

                <section className="rounded-[28px] border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-5 w-5 text-primary" />
                    <h2 className="font-black">Últimos avances</h2>
                  </div>
                  <div className="mt-4 space-y-3">
                    {events.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Todavía no hay eventos registrados.</p>
                    ) : events.slice(0, 6).map((event) => (
                      <div key={event.id} className="border-l-2 border-primary/20 pl-3">
                        <p className="text-sm font-semibold">{event.summary}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        )}
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

function currentMessage(workflowStatus: string, stageStatus: string | null) {
  if (stageStatus === 'pending_review') return 'Hay un resultado esperando tu decisión.'
  if (stageStatus === 'changes_requested') return 'El siguiente resultado necesita instrucciones claras.'
  if (stageStatus === 'failed' || workflowStatus === 'failed') return 'Una etapa no pudo terminar, pero el trabajo anterior está protegido.'
  if (stageStatus === 'running' || workflowStatus === 'running') return 'Kumplio está preparando el siguiente resultado.'
  if (workflowStatus === 'completed') return 'El análisis terminó y el caso está listo para cerrar.'
  return 'El caso está preparado para continuar.'
}

function currentDetail(workflowStatus: string, stageStatus: string | null) {
  if (stageStatus === 'pending_review') return 'Revisa el contenido y decide si puede usarse como base para el siguiente paso.'
  if (stageStatus === 'changes_requested') return 'Tus observaciones quedarán asociadas a la nueva versión del resultado.'
  if (stageStatus === 'failed' || workflowStatus === 'failed') return 'Puedes solicitar una nueva ejecución sin perder resultados aprobados, fuentes ni trazabilidad.'
  if (stageStatus === 'running' || workflowStatus === 'running') return 'La pantalla se actualizará cuando exista un resultado persistido o una falla concreta.'
  if (workflowStatus === 'completed') return 'Confirma el resultado final y registra el cierre cuando ya esté listo para llevarse a la práctica.'
  return 'El siguiente paso se habilitará cuando sus dependencias estén disponibles.'
}
