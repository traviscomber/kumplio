'use client'

import { useEffect, useState } from 'react'
import { Check, CheckCircle2, Circle, Loader2, Play, RefreshCw, RotateCcw, TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STAGE_NAMES: Record<string, string> = {
  isidora: 'Isidora · Obligaciones',
  rodrigo: 'Rodrigo · Riesgos',
  veronica: 'Verónica · Brechas y controles',
  javier: 'Javier · Plan de acción',
  catalina: 'Catalina · Revisión de calidad',
}

type CaseOption = { id: string; title: string; status: string; priority: string }
type WorkflowSummary = {
  id: string
  case_id: string
  status: string
  current_stage: number
  total_stages: number
  created_at: string
  compliance_cases?: { title?: string } | Array<{ title?: string }> | null
}
type WorkflowStage = {
  id: string
  stage_index: number
  agent_id: string
  status: string
  run_id?: string | null
  attempt_count: number
  max_attempts: number
  output_artifact_id?: string | null
}
type WorkflowDetail = {
  workflow: WorkflowSummary & { final_payload?: unknown }
  stages: WorkflowStage[]
  artifacts: Array<{ id: string; artifact_type: string; title: string; content: unknown; status: string }>
}

export function AgentWorkflowConsole({ cases }: { cases: CaseOption[] }) {
  const [caseId, setCaseId] = useState(cases[0]?.id || '')
  const [context, setContext] = useState('')
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<WorkflowDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [reviewingRunId, setReviewingRunId] = useState('')
  const [error, setError] = useState('')

  async function loadWorkflows() {
    const response = await fetch('/api/agents/workflows', { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'No fue posible cargar los workflows')
    setWorkflows(data.workflows || [])
    if (!selectedId && data.workflows?.[0]?.id) setSelectedId(data.workflows[0].id)
  }

  async function loadDetail(id: string) {
    if (!id) return setDetail(null)
    const response = await fetch(`/api/agents/workflows/${id}`, { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'No fue posible cargar el workflow')
    setDetail(data)
  }

  useEffect(() => { loadWorkflows().catch((err) => setError(err.message)) }, [])
  useEffect(() => { loadDetail(selectedId).catch((err) => setError(err.message)) }, [selectedId])

  async function refreshSelected() {
    await Promise.all([loadWorkflows(), selectedId ? loadDetail(selectedId) : Promise.resolve()])
  }

  async function createWorkflow() {
    if (!caseId) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/agents/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, context }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible crear el workflow')
      setSelectedId(data.workflow.id)
      setContext('')
      await loadWorkflows()
      await loadDetail(data.workflow.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  async function advanceWorkflow() {
    if (!selectedId) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/agents/workflows/${selectedId}/advance`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible avanzar el workflow')
      await refreshSelected()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  async function reviewStage(stage: WorkflowStage, decision: 'approved' | 'changes_requested' | 'rejected') {
    if (!stage.run_id) return
    setReviewingRunId(stage.run_id)
    setError('')
    try {
      const response = await fetch(`/api/agents/runs/${stage.run_id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible registrar la revisión')
      await refreshSelected()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setReviewingRunId('')
    }
  }

  const currentStage = detail?.stages.find((stage) => stage.stage_index === detail.workflow.current_stage)
  const canAdvance = Boolean(
    detail
    && ['draft', 'running', 'failed', 'paused'].includes(detail.workflow.status)
    && currentStage
    && ['queued', 'failed', 'changes_requested'].includes(currentStage.status)
    && currentStage.attempt_count < currentStage.max_attempts,
  )

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Nuevo análisis coordinado</h2>
          <label className="mt-4 block text-sm font-medium">Caso</label>
          <select value={caseId} onChange={(event) => setCaseId(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm">
            {cases.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <label className="mt-4 block text-sm font-medium">Contexto inicial</label>
          <textarea value={context} onChange={(event) => setContext(event.target.value)} rows={6} className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm" placeholder="Fuentes, alcance, evidencia disponible y restricciones del caso..." />
          <Button onClick={createWorkflow} disabled={loading || !caseId} className="mt-4 w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Crear workflow
          </Button>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Workflows</h2><button onClick={() => void loadWorkflows()} aria-label="Actualizar"><RefreshCw className="h-4 w-4" /></button></div>
          {workflows.map((workflow) => {
            const caseData = Array.isArray(workflow.compliance_cases) ? workflow.compliance_cases[0] : workflow.compliance_cases
            return <button key={workflow.id} onClick={() => setSelectedId(workflow.id)} className={`w-full rounded-xl border p-4 text-left ${selectedId === workflow.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
              <p className="font-medium">{caseData?.title || 'Caso de cumplimiento'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{workflow.status} · etapa {Math.min(workflow.current_stage + 1, workflow.total_stages)}/{workflow.total_stages}</p>
            </button>
          })}
        </section>
      </aside>

      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        {!detail ? <p className="text-muted-foreground">Selecciona o crea un workflow.</p> : <>
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pipeline de cumplimiento</p><h2 className="mt-2 text-2xl font-bold">{detail.workflow.status}</h2></div>
            <Button onClick={advanceWorkflow} disabled={loading || !canAdvance}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {currentStage?.status === 'failed' || currentStage?.status === 'changes_requested' ? 'Reintentar etapa' : 'Ejecutar etapa'}
            </Button>
          </div>

          {detail.workflow.status === 'pending_review' && (
            <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
              La etapa actual está detenida hasta que una persona apruebe, solicite cambios o rechace el resultado.
            </div>
          )}

          {error && <div className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"><TriangleAlert className="mr-2 inline h-4 w-4" />{error}</div>}

          <div className="mt-6 space-y-3">
            {detail.stages.map((stage) => {
              const artifact = detail.artifacts.find((item) => item.id === stage.output_artifact_id)
              const done = stage.status === 'approved'
              const awaitingReview = stage.status === 'pending_review' && Boolean(stage.run_id)
              const isReviewing = reviewingRunId === stage.run_id
              return <div key={stage.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start gap-3">
                  {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" /> : stage.status === 'running' ? <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-primary" /> : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{STAGE_NAMES[stage.agent_id] || stage.agent_id}</p><span className="text-xs text-muted-foreground">{stage.status} · intento {stage.attempt_count}/{stage.max_attempts}</span></div>
                    {artifact && <details className="mt-3"><summary className="cursor-pointer text-sm text-primary">Ver artefacto</summary><pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs">{JSON.stringify(artifact.content, null, 2)}</pre></details>}
                    {awaitingReview && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                        <Button size="sm" onClick={() => void reviewStage(stage, 'approved')} disabled={isReviewing}><Check className="mr-2 h-4 w-4" />Aprobar</Button>
                        <Button size="sm" variant="outline" onClick={() => void reviewStage(stage, 'changes_requested')} disabled={isReviewing}><RotateCcw className="mr-2 h-4 w-4" />Solicitar cambios</Button>
                        <Button size="sm" variant="destructive" onClick={() => void reviewStage(stage, 'rejected')} disabled={isReviewing}><X className="mr-2 h-4 w-4" />Rechazar</Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            })}
          </div>
        </>}
      </section>
    </div>
  )
}
