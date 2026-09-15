'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Loader2, Play, RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STAGE_NAMES: Record<string, string> = {
  isidora: 'Isidora · Entender',
  rodrigo: 'Rodrigo · Riesgo y prioridad',
  beatriz: 'Beatriz · Cambio regulatorio',
  veronica: 'Verónica · Resolver y demostrar',
  javier: 'Javier · Plan de ejecución',
  andres: 'Andrés · Aprendizaje',
  catalina: 'Julieta · Revisión legal y calidad',
}

const OUTCOME_LABELS: Record<string, string> = {
  ready: 'Resultado listo',
  needs_attention: 'Necesita atención',
  blocked: 'Bloqueado',
  review_required: 'Listo para revisión humana',
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
type OutcomeAction = {
  title: string
  ownerRole: string | null
  target: string | null
  priority: string
  dependencies: string[]
  closureCriteria: string[]
}
type WorkflowOutcome = {
  status: string
  headline: string
  summary: string
  decision: string | null
  nextAction: OutcomeAction | null
  actions: OutcomeAction[]
  missing: string[]
  blockers: string[]
  evidenceCount: number
  humanReviewRequired: boolean
  humanReviewReasons: string[]
  specialistsUsed: string[]
}
type WorkflowDetail = {
  workflow: WorkflowSummary & { final_payload?: unknown }
  stages: Array<{
    id: string
    stage_index: number
    agent_id: string
    status: string
    attempt_count: number
    max_attempts: number
    output_artifact_id?: string | null
  }>
  artifacts: Array<{ id: string; artifact_type: string; title: string; content: unknown; status: string }>
  outcome?: WorkflowOutcome
}

export function AgentWorkflowConsole({ cases }: { cases: CaseOption[] }) {
  const [caseId, setCaseId] = useState(cases[0]?.id || '')
  const [context, setContext] = useState('')
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<WorkflowDetail | null>(null)
  const [loading, setLoading] = useState(false)
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

  async function createWorkflow() {
    if (!caseId) return
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/agents/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          workflowType: 'compliance_assessment',
          instructions: context || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible crear el workflow')
      setSelectedId(data.workflow.id)
      setContext('')
      await loadWorkflows()
      await loadDetail(data.workflow.id)
    } catch (err) { setError(err instanceof Error ? err.message : 'Error desconocido') }
    finally { setLoading(false) }
  }

  async function advanceWorkflow() {
    if (!selectedId) return
    setLoading(true); setError('')
    try {
      const response = await fetch(`/api/agents/workflows/${selectedId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible avanzar el workflow')
      await Promise.all([loadWorkflows(), loadDetail(selectedId)])
    } catch (err) { setError(err instanceof Error ? err.message : 'Error desconocido') }
    finally { setLoading(false) }
  }

  const currentStage = detail?.stages.find((stage) => stage.stage_index === detail.workflow.current_stage)
  const canAdvance = detail && !['completed', 'cancelled', 'pending_review'].includes(detail.workflow.status)
    && currentStage?.status !== 'running'
    && (currentStage?.attempt_count || 0) < (currentStage?.max_attempts || 3)
  const outcome = detail?.outcome
  const hasOutcome = Boolean(outcome && detail?.artifacts.length)

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Resultado primero</p>
          <h2 className="mt-2 font-semibold">Analizar una situación</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Kumplio activa sólo los especialistas necesarios y consolida un único resultado verificable.</p>
          <label className="mt-4 block text-sm font-medium">Caso</label>
          <select value={caseId} onChange={(event) => setCaseId(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm">
            {cases.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <label className="mt-4 block text-sm font-medium">Resultado que necesitas</label>
          <textarea value={context} onChange={(event) => setContext(event.target.value)} rows={6} className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm" placeholder="Ej.: necesito saber qué falta, qué debo hacer primero y qué evidencia demuestra el cierre..." />
          <Button onClick={createWorkflow} disabled={loading || !caseId} className="mt-4 w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Obtener resultado
          </Button>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Análisis recientes</h2><button onClick={() => loadWorkflows()} aria-label="Actualizar"><RefreshCw className="h-4 w-4" /></button></div>
          {workflows.map((workflow) => {
            const caseData = Array.isArray(workflow.compliance_cases) ? workflow.compliance_cases[0] : workflow.compliance_cases
            return <button key={workflow.id} onClick={() => setSelectedId(workflow.id)} className={`w-full rounded-xl border p-4 text-left ${selectedId === workflow.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
              <p className="font-medium">{caseData?.title || 'Caso de cumplimiento'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{workflow.status} · progreso {Math.min(workflow.current_stage + 1, workflow.total_stages)}/{workflow.total_stages}</p>
            </button>
          })}
        </section>
      </aside>

      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        {!detail ? <p className="text-muted-foreground">Selecciona un análisis o inicia uno nuevo.</p> : <>
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Outcome del caso</p>
              <h2 className="mt-2 text-2xl font-bold">{hasOutcome ? OUTCOME_LABELS[outcome?.status || ''] || outcome?.headline : 'Construyendo resultado'}</h2>
            </div>
            <Button onClick={advanceWorkflow} disabled={loading || !canAdvance}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {currentStage?.status === 'failed' ? 'Reintentar' : 'Continuar análisis'}
            </Button>
          </div>

          {error && <div className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"><TriangleAlert className="mr-2 inline h-4 w-4" />{error}</div>}

          {hasOutcome && outcome && <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="text-base leading-7 text-foreground">{outcome.summary}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Evidencia</p><p className="mt-1 text-2xl font-semibold">{outcome.evidenceCount}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Acciones</p><p className="mt-1 text-2xl font-semibold">{outcome.actions.length}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Faltantes</p><p className="mt-1 text-2xl font-semibold">{outcome.missing.length}</p></div>
              </div>
            </div>

            {outcome.nextAction && <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Próxima acción</p>
              <p className="mt-2 font-semibold">{outcome.nextAction.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">Responsable: {outcome.nextAction.ownerRole || 'por asignar'}{outcome.nextAction.target ? ` · objetivo ${outcome.nextAction.target}` : ''}</p>
              {outcome.nextAction.closureCriteria.length > 0 && <p className="mt-3 text-sm leading-6 text-muted-foreground">Cierre: {outcome.nextAction.closureCriteria.join(' · ')}</p>}
            </div>}

            {(outcome.blockers.length > 0 || outcome.missing.length > 0) && <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-5">
                <p className="text-sm font-semibold">Qué falta</p>
                {outcome.missing.length ? <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{outcome.missing.slice(0, 6).map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Sin faltantes detectados.</p>}
              </div>
              <div className="rounded-xl border border-border bg-background p-5">
                <p className="text-sm font-semibold">Bloqueos y reservas</p>
                {outcome.blockers.length ? <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{outcome.blockers.slice(0, 6).map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Sin bloqueos críticos detectados.</p>}
              </div>
            </div>}

            <div className="text-xs leading-5 text-muted-foreground">
              Especialistas activados: {outcome.specialistsUsed.join(', ') || 'ninguno todavía'}.
              {outcome.humanReviewRequired ? ' La decisión sensible permanece sujeta a revisión humana.' : ''}
            </div>
          </div>}

          <details className="mt-8 border-t border-border pt-6">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground">Ver cómo llegó Kumplio a este resultado</summary>
            <div className="mt-5 space-y-3">
              {detail.stages.map((stage) => {
                const artifact = detail.artifacts.find((item) => item.id === stage.output_artifact_id)
                const done = ['pending_review', 'approved'].includes(stage.status)
                return <div key={stage.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start gap-3">
                    {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" /> : stage.status === 'running' ? <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-primary" /> : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{STAGE_NAMES[stage.agent_id] || stage.agent_id}</p><span className="text-xs text-muted-foreground">{stage.status} · intento {stage.attempt_count}/{stage.max_attempts}</span></div>
                      {artifact && <details className="mt-3"><summary className="cursor-pointer text-sm text-primary">Ver artefacto técnico</summary><pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs">{JSON.stringify(artifact.content, null, 2)}</pre></details>}
                    </div>
                  </div>
                </div>
              })}
            </div>
          </details>
        </>}
      </section>
    </div>
  )
}
