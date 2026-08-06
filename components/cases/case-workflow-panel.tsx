'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Bot,
  CheckCircle2,
  Circle,
  FileCheck2,
  Loader2,
  PauseCircle,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type WorkflowType = 'compliance_assessment' | 'contract_review' | 'control_assessment'

type WorkflowTemplate = {
  type: WorkflowType
  label: string
  description: string
  totalStages: number
  agents: string[]
}

type WorkflowSummary = {
  id: string
  case_id: string
  workflow_type: WorkflowType
  status: string
  current_stage: number
  total_stages: number
  created_at: string
  updated_at: string
}

type WorkflowStage = {
  id: string
  stage_index: number
  agent_id: string
  status: string
  run_id: string | null
  output_artifact_id: string | null
  attempt_count: number
  max_attempts: number
  task_template: string
  context_snapshot: Record<string, unknown>
  started_at: string | null
  completed_at: string | null
}

type WorkflowArtifact = {
  id: string
  run_id: string
  artifact_type: string
  title: string
  version: number
  content: unknown
  source_refs: unknown
  confidence: number | null
  status: string
  created_at: string
}

type WorkflowReview = {
  id: string
  run_id: string
  artifact_id: string | null
  decision: string
  comment: string | null
  created_at: string
}

type WorkflowDetail = {
  workflow: WorkflowSummary & {
    input_payload: unknown
    final_payload: unknown
    error_code: string | null
    error_message: string | null
    started_at: string | null
    completed_at: string | null
  }
  template: {
    type: WorkflowType
    label: string
    description: string
  } | null
  stages: WorkflowStage[]
  artifacts: WorkflowArtifact[]
  reviews: WorkflowReview[]
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  queued: 'En cola',
  running: 'En ejecución',
  paused: 'Pausado',
  pending_review: 'Pendiente de revisión',
  approved: 'Aprobado',
  changes_requested: 'Cambios solicitados',
  completed: 'Completado',
  failed: 'Fallido',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
}

const statusClasses: Record<string, string> = {
  completed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  approved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  running: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  pending_review: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  paused: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  changes_requested: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  failed: 'border-destructive/30 bg-destructive/10 text-destructive',
  rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
  draft: 'border-border bg-muted text-muted-foreground',
  queued: 'border-border bg-muted text-muted-foreground',
}

const agentLabels: Record<string, string> = {
  isidora: 'Isidora',
  rodrigo: 'Rodrigo',
  veronica: 'Verónica',
  javier: 'Javier',
  catalina: 'Catalina',
  beatriz: 'Beatriz',
  andres: 'Andrés',
}

function sourceCount(sourceRefs: unknown) {
  return Array.isArray(sourceRefs) ? sourceRefs.length : 0
}

function stageLabel(stage: WorkflowStage) {
  const label = typeof stage.context_snapshot?.label === 'string' ? stage.context_snapshot.label : null
  return label || `Etapa ${stage.stage_index + 1}`
}

export function CaseWorkflowPanel({ caseId }: { caseId: string }) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<WorkflowDetail | null>(null)
  const [workflowType, setWorkflowType] = useState<WorkflowType>('compliance_assessment')
  const [instructions, setInstructions] = useState('')
  const [retryInstructions, setRetryInstructions] = useState('')
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'changes_requested' | 'rejected'>('approved')
  const [reviewComment, setReviewComment] = useState('')
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadWorkflows(preferredId?: string) {
    const response = await fetch(`/api/agents/workflows?caseId=${caseId}`, { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'No fue posible cargar los workflows.')

    const nextWorkflows = payload.workflows || []
    setWorkflows(nextWorkflows)
    setTemplates(payload.templates || [])

    const nextSelected = preferredId
      || (selectedId && nextWorkflows.some((item: WorkflowSummary) => item.id === selectedId) ? selectedId : '')
      || nextWorkflows[0]?.id
      || ''
    setSelectedId(nextSelected)
    return nextSelected
  }

  async function loadDetail(workflowId: string) {
    if (!workflowId) {
      setDetail(null)
      return
    }
    const response = await fetch(`/api/agents/workflows/${workflowId}`, { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'No fue posible cargar el workflow.')
    setDetail(payload)
  }

  async function refresh(preferredId?: string) {
    const workflowId = await loadWorkflows(preferredId)
    await loadDetail(workflowId)
  }

  useEffect(() => {
    refresh().catch((reason) => setError(reason instanceof Error ? reason.message : 'No fue posible cargar los workflows.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  useEffect(() => {
    if (!selectedId) return
    loadDetail(selectedId).catch((reason) => setError(reason instanceof Error ? reason.message : 'No fue posible cargar el workflow.'))
  }, [selectedId])

  const selectedTemplate = templates.find((template) => template.type === workflowType)
  const reviewableStage = detail?.stages.find((stage) => stage.status === 'pending_review') || null
  const executableStage = detail?.stages.find((stage) => stage.stage_index === detail.workflow.current_stage) || null
  const requiresRetryInstructions = executableStage?.status === 'changes_requested'
  const canAdvance = Boolean(detail)
    && !reviewableStage
    && !['completed', 'cancelled'].includes(detail?.workflow.status || '')
    && executableStage?.status !== 'running'
    && (executableStage?.attempt_count || 0) < (executableStage?.max_attempts || 3)
  const canReview = Boolean(reviewableStage?.run_id)

  const progress = useMemo(() => {
    if (!detail?.stages.length) return 0
    const approved = detail.stages.filter((stage) => stage.status === 'approved').length
    return Math.round((approved / detail.stages.length) * 100)
  }, [detail])

  async function createWorkflow() {
    setLoadingKey('create')
    setError('')
    setSuccess('')
    try {
      const response = await fetch('/api/agents/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          workflowType,
          instructions: instructions || null,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        if (payload.workflowId) setSelectedId(payload.workflowId)
        throw new Error(payload.error || 'No fue posible crear el workflow.')
      }

      setInstructions('')
      setSuccess('Workflow creado con el contexto actual del expediente.')
      await refresh(payload.workflow.id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No fue posible crear el workflow.')
    } finally {
      setLoadingKey(null)
    }
  }

  async function advanceWorkflow() {
    if (!selectedId) return
    if (requiresRetryInstructions && retryInstructions.trim().length < 3) {
      setError('Agrega instrucciones concretas antes de reintentar esta etapa.')
      return
    }

    setLoadingKey('advance')
    setError('')
    setSuccess('')
    try {
      const response = await fetch(`/api/agents/workflows/${selectedId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions: retryInstructions || null }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No fue posible ejecutar la etapa.')

      setRetryInstructions('')
      setSuccess('Etapa completada. Revisa el artefacto antes de aprobar.')
      await refresh(selectedId)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No fue posible ejecutar la etapa.')
    } finally {
      setLoadingKey(null)
    }
  }

  async function reviewStage() {
    if (!reviewableStage?.run_id) return
    if (reviewDecision !== 'approved' && reviewComment.trim().length < 3) {
      setError('La decisión necesita un comentario que explique el rechazo o los cambios requeridos.')
      return
    }

    setLoadingKey('review')
    setError('')
    setSuccess('')
    try {
      const response = await fetch(`/api/agents/runs/${reviewableStage.run_id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: reviewDecision,
          comment: reviewComment || undefined,
          checklist: {
            sourcesReviewed: true,
            limitationsVisible: true,
            humanDecision: true,
          },
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No fue posible registrar la revisión.')

      if (reviewDecision === 'approved') {
        const advanceResponse = await fetch(`/api/agents/workflows/${selectedId}/advance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instructions: null }),
        })
        const advancePayload = await advanceResponse.json()
        if (!advanceResponse.ok) {
          throw new Error(advancePayload.error || 'La aprobación se guardó, pero no fue posible iniciar la siguiente etapa.')
        }
      }

      setReviewComment('')
      setReviewDecision('approved')
      setSuccess(reviewDecision === 'approved'
        ? 'Etapa aprobada. La siguiente etapa se inició automáticamente.'
        : 'Decisión registrada. El intento anterior se conserva.')
      await refresh(selectedId)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No fue posible registrar la revisión.')
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><Bot className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold">Workflows agentic del expediente</h2>
              <p className="text-sm text-muted-foreground">Ejecuta agentes por etapas, con fuentes, reintentos y aprobación humana.</p>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
            El contexto se recupera desde los recursos vinculados al caso. Cada salida queda como artefacto pendiente de revisión y ningún reintento elimina intentos anteriores.
          </p>
        </div>
        <button type="button" onClick={() => refresh().catch((reason) => setError(reason.message))} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <RefreshCw className="h-4 w-4" /> Actualizar
        </button>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="font-semibold">Nuevo workflow</p>
            <label className="mt-4 block space-y-2 text-sm font-medium">
              Plantilla
              <select value={workflowType} onChange={(event) => setWorkflowType(event.target.value as WorkflowType)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                {templates.map((template) => <option key={template.type} value={template.type}>{template.label}</option>)}
              </select>
            </label>
            {selectedTemplate && <p className="mt-2 text-xs leading-5 text-muted-foreground">{selectedTemplate.description} · {selectedTemplate.totalStages} etapas.</p>}
            <label className="mt-4 block space-y-2 text-sm font-medium">
              Instrucciones iniciales
              <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} maxLength={2000} rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Alcance, prioridades o restricciones adicionales. Opcional." />
            </label>
            <Button onClick={createWorkflow} disabled={loadingKey !== null || !templates.length} className="mt-4 w-full gap-2">
              {loadingKey === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Crear workflow
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Historial de workflows</p>
            {!workflows.length ? (
              <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Aún no hay workflows para este caso.</div>
            ) : workflows.map((workflow) => (
              <button key={workflow.id} type="button" onClick={() => setSelectedId(workflow.id)} className={`w-full rounded-xl border p-4 text-left transition ${selectedId === workflow.id ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/40'}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{templates.find((template) => template.type === workflow.workflow_type)?.label || workflow.workflow_type}</p>
                  <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusClasses[workflow.status] || statusClasses.draft}`}>{statusLabels[workflow.status] || workflow.status}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Etapa {Math.min(workflow.current_stage + 1, workflow.total_stages)} de {workflow.total_stages} · {new Date(workflow.created_at).toLocaleDateString('es-CL')}</p>
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0 rounded-xl border border-border bg-background p-5 md:p-6">
          {!detail ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Selecciona o crea un workflow.</div>
          ) : (
            <div>
              <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{detail.template?.label || detail.workflow.workflow_type}</p>
                  <h3 className="mt-2 text-2xl font-bold">{statusLabels[detail.workflow.status] || detail.workflow.status}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{detail.template?.description}</p>
                </div>
                <div className="min-w-48 rounded-lg border border-border p-3 text-sm">
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">Progreso aprobado</span><strong>{progress}%</strong></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div>
                </div>
              </div>

              {error && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><TriangleAlert className="mr-2 inline h-4 w-4" />{error}</div>}
              {success && <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="mr-2 inline h-4 w-4" />{success}</div>}

              {canAdvance && (
                <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                    <div className="flex-1">
                      <p className="font-semibold">{executableStage?.status === 'changes_requested' ? 'Reintentar etapa' : 'Ejecutar próxima etapa'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{executableStage ? `${stageLabel(executableStage)} · ${agentLabels[executableStage.agent_id] || executableStage.agent_id}` : 'Etapa pendiente'}</p>
                      {(requiresRetryInstructions || executableStage?.status === 'failed') && (
                        <textarea value={retryInstructions} onChange={(event) => setRetryInstructions(event.target.value)} rows={3} maxLength={2000} className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Explica qué debe corregir o profundizar el nuevo intento." />
                      )}
                    </div>
                    <Button onClick={advanceWorkflow} disabled={loadingKey !== null} className="gap-2">
                      {loadingKey === 'advance' ? <Loader2 className="h-4 w-4 animate-spin" /> : executableStage?.status === 'changes_requested' || executableStage?.status === 'failed' ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {executableStage?.status === 'changes_requested' || executableStage?.status === 'failed' ? 'Reintentar' : 'Ejecutar'}
                    </Button>
                  </div>
                </div>
              )}

              {canReview && reviewableStage && (
                <div className="mt-5 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                  <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-violet-700 dark:text-violet-300" /><p className="font-semibold">Revisión humana requerida</p></div>
                  <p className="mt-2 text-xs text-muted-foreground">Revisa el artefacto, sus fuentes y limitaciones antes de decidir.</p>
                  <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-end">
                    <label className="space-y-2 text-sm font-medium">
                      Decisión
                      <select value={reviewDecision} onChange={(event) => setReviewDecision(event.target.value as typeof reviewDecision)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                        <option value="approved">Aprobar</option>
                        <option value="changes_requested">Solicitar cambios</option>
                        <option value="rejected">Rechazar</option>
                      </select>
                    </label>
                    <label className="space-y-2 text-sm font-medium">
                      Comentario
                      <input value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} maxLength={5000} className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Obligatorio para rechazo o solicitud de cambios." />
                    </label>
                    <Button onClick={reviewStage} disabled={loadingKey !== null} className="gap-2">
                      {loadingKey === 'review' ? <Loader2 className="h-4 w-4 animate-spin" /> : reviewDecision === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : reviewDecision === 'rejected' ? <XCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                      {reviewDecision === 'approved' ? 'Aprobar y continuar' : 'Registrar decisión'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                {detail.stages.map((stage) => {
                  const artifact = detail.artifacts.find((item) => item.id === stage.output_artifact_id)
                  const review = detail.reviews.find((item) => item.run_id === stage.run_id)
                  const done = stage.status === 'approved'
                  const active = ['running', 'pending_review'].includes(stage.status)
                  return (
                    <article key={stage.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start gap-3">
                        {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /> : active ? <Loader2 className={`mt-0.5 h-5 w-5 text-primary ${stage.status === 'running' ? 'animate-spin' : ''}`} /> : stage.status === 'failed' || stage.status === 'changes_requested' ? <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-600" /> : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div><p className="font-semibold">{stage.stage_index + 1}. {stageLabel(stage)}</p><p className="mt-1 text-xs text-muted-foreground">{agentLabels[stage.agent_id] || stage.agent_id}</p></div>
                            <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusClasses[stage.status] || statusClasses.draft}`}>{statusLabels[stage.status] || stage.status} · intento {stage.attempt_count}/{stage.max_attempts}</span>
                          </div>
                          <p className="mt-3 text-xs leading-5 text-muted-foreground">{stage.task_template}</p>

                          {artifact && (
                            <details className="mt-4 rounded-lg border border-border bg-background p-3">
                              <summary className="cursor-pointer list-none text-sm font-semibold text-primary"><FileCheck2 className="mr-2 inline h-4 w-4" />{artifact.title} · {sourceCount(artifact.source_refs)} referencias</summary>
                              <pre className="mt-3 max-h-[440px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs">{JSON.stringify(artifact.content, null, 2)}</pre>
                            </details>
                          )}

                          {review && (
                            <div className="mt-3 rounded-lg bg-muted/60 p-3 text-xs"><strong>Última revisión:</strong> {statusLabels[review.decision] || review.decision}{review.comment ? ` · ${review.comment}` : ''}</div>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
