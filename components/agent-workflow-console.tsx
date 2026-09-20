'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, FileCheck2, Loader2, Play, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react'
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

const REVIEW_LABELS: Record<string, string> = {
  not_started: 'Pendiente',
  in_progress: 'En revisión',
  approved: 'Aprobada',
  changes_requested: 'Cambios solicitados',
  rejected: 'Rechazada',
}

const CLOSURE_LABELS: Record<string, string> = {
  pending_evidence: 'Falta evidencia',
  ready_for_review: 'Listo para verificar',
  verified: 'Cierre verificado',
  changes_requested: 'Cambios solicitados',
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
type OutcomeEvidence = {
  label: string
  location: string | null
  supports: string | null
}
type WorkflowOutcome = {
  status: string
  headline: string
  summary: string
  decision: string | null
  resolved: string[]
  nextAction: OutcomeAction | null
  actions: OutcomeAction[]
  missing: string[]
  blockers: string[]
  evidence: OutcomeEvidence[]
  evidenceCount: number
  humanReviewRequired: boolean
  humanReviewStatus: string
  humanReviewReasons: string[]
  humanReviewComment: string | null
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
type ClosurePlan = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  source_snapshot_id: string
  source_contract_version: string
}
type ClosureTask = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  owner_role: string | null
  target_label: string | null
  sequence: number
  dependencies: string[]
  closure_criteria: string[]
  evidence_requirements: string[]
  verification_status: string
  completion_note: string | null
  verification_notes: string | null
  verified_at: string | null
  evidenceIds: string[]
}
type ClosureEvidenceOption = {
  id: string
  name: string
  evidence_type: string
  validation_status: string
  integrity_status: string
  created_at: string
}
type ClosurePlanDetail = {
  plan: ClosurePlan | null
  tasks: ClosureTask[]
  availableEvidence: ClosureEvidenceOption[]
  canMaterialize: boolean
}

export function AgentWorkflowConsole({ cases, initialWorkflowId = '' }: { cases: CaseOption[]; initialWorkflowId?: string }) {
  const [caseId, setCaseId] = useState(cases[0]?.id || '')
  const [context, setContext] = useState('')
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
  const [selectedId, setSelectedId] = useState(initialWorkflowId)
  const [detail, setDetail] = useState<WorkflowDetail | null>(null)
  const [closure, setClosure] = useState<ClosurePlanDetail | null>(null)
  const [closureEvidence, setClosureEvidence] = useState<Record<string, string>>({})
  const [closureNotes, setClosureNotes] = useState<Record<string, string>>({})
  const [closureReviewNotes, setClosureReviewNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [closureLoading, setClosureLoading] = useState(false)
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

  async function loadClosurePlan(id: string) {
    if (!id) return setClosure(null)
    const response = await fetch(`/api/agents/workflows/${id}/closure-plan`, { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'No fue posible cargar el plan de cierre')
    setClosure(data)
  }

  useEffect(() => { loadWorkflows().catch((err) => setError(err.message)) }, [])
  useEffect(() => {
    if (!selectedId) return
    Promise.all([loadDetail(selectedId), loadClosurePlan(selectedId)]).catch((err) => setError(err.message))
  }, [selectedId])

  async function createWorkflow() {
    if (!caseId) return
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/agents/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          instructions: context || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible crear el workflow')
      setSelectedId(data.workflow.id)
      setContext('')
      await loadWorkflows()
      await Promise.all([loadDetail(data.workflow.id), loadClosurePlan(data.workflow.id)])
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
      await Promise.all([loadWorkflows(), loadDetail(selectedId), loadClosurePlan(selectedId)])
    } catch (err) { setError(err instanceof Error ? err.message : 'Error desconocido') }
    finally { setLoading(false) }
  }

  async function activateClosurePlan() {
    if (!selectedId) return
    setClosureLoading(true); setError('')
    try {
      const response = await fetch(`/api/agents/workflows/${selectedId}/closure-plan`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible activar el plan de cierre')
      await loadClosurePlan(selectedId)
    } catch (err) { setError(err instanceof Error ? err.message : 'Error desconocido') }
    finally { setClosureLoading(false) }
  }

  async function submitClosureTask(taskId: string) {
    const evidenceId = closureEvidence[taskId]
    if (!selectedId || !evidenceId) return setError('Selecciona evidencia aceptada y con integridad verificada para esta acción.')
    setClosureLoading(true); setError('')
    try {
      const response = await fetch(`/api/agents/workflows/${selectedId}/closure-plan/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidenceIds: [evidenceId], note: closureNotes[taskId] || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible preparar el cierre')
      await loadClosurePlan(selectedId)
    } catch (err) { setError(err instanceof Error ? err.message : 'Error desconocido') }
    finally { setClosureLoading(false) }
  }

  async function reviewClosureTask(taskId: string, decision: 'verified' | 'changes_requested') {
    if (!selectedId) return
    const comment = (closureReviewNotes[taskId] || '').trim()
    if (comment.length < 3) return setError('La revisión de cierre necesita un comentario breve y explícito.')
    setClosureLoading(true); setError('')
    try {
      const response = await fetch(`/api/agents/workflows/${selectedId}/closure-plan/tasks/${taskId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible revisar el cierre')
      await loadClosurePlan(selectedId)
    } catch (err) { setError(err instanceof Error ? err.message : 'Error desconocido') }
    finally { setClosureLoading(false) }
  }

  const currentStage = detail?.stages.find((stage) => stage.stage_index === detail.workflow.current_stage)
  const canAdvance = detail && !['completed', 'cancelled', 'pending_review'].includes(detail.workflow.status)
    && currentStage?.status !== 'running'
    && (currentStage?.attempt_count || 0) < (currentStage?.max_attempts || 3)
  const outcome = detail?.outcome
  const hasOutcome = Boolean(outcome && detail?.artifacts.length)
  const closureTasks = closure?.tasks || []
  const verifiedClosureTasks = closureTasks.filter((task) => task.verification_status === 'verified').length
  const nextClosureTask = closureTasks.find((task) => task.verification_status !== 'verified') || null

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Resultado primero</p>
          <h2 className="mt-2 font-semibold">Analizar una situación</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Describe qué necesitas resolver. Kumplio reúne contexto, especialistas y evidencia y te lleva desde la respuesta hasta un cierre verificable.</p>
          <label className="mt-4 block text-sm font-medium">Caso</label>
          <select value={caseId} onChange={(event) => setCaseId(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm">
            {cases.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <label className="mt-4 block text-sm font-medium">Qué necesitas resolver</label>
          <textarea value={context} onChange={(event) => setContext(event.target.value)} rows={6} className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm" placeholder="Ej.: dime qué falta, qué debo hacer primero y qué evidencia demuestra que realmente quedó cerrado..." />
          <Button onClick={createWorkflow} disabled={loading || !caseId} className="mt-4 w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Resolver con Kumplio
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Resultado del caso</p>
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
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Resuelto</p><p className="mt-1 text-2xl font-semibold">{outcome.resolved.length}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Evidencia</p><p className="mt-1 text-2xl font-semibold">{outcome.evidenceCount}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Acciones</p><p className="mt-1 text-2xl font-semibold">{outcome.actions.length}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Faltantes</p><p className="mt-1 text-2xl font-semibold">{outcome.missing.length}</p></div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,.6fr)]">
              <div className="rounded-xl border border-border bg-background p-5">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Qué quedó resuelto</p></div>
                {outcome.resolved.length ? <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{outcome.resolved.slice(0, 8).map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-3 text-sm leading-6 text-muted-foreground">Todavía no hay elementos confirmados como resueltos. Kumplio los mostrará aquí sólo cuando exista respaldo explícito.</p>}
              </div>
              <div className="rounded-xl border border-border bg-background p-5">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Revisión humana</p></div>
                <p className="mt-3 text-lg font-semibold">{REVIEW_LABELS[outcome.humanReviewStatus] || outcome.humanReviewStatus}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Un resultado sólo pasa a “Resultado listo” después de aprobación humana final y sin faltantes o bloqueos conocidos.</p>
                {outcome.humanReviewComment && <p className="mt-3 rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">{outcome.humanReviewComment}</p>}
              </div>
            </div>

            {outcome.nextAction && <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Próxima acción</p>
              <p className="mt-2 font-semibold">{outcome.nextAction.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">Responsable: {outcome.nextAction.ownerRole || 'por asignar'}{outcome.nextAction.target ? ` · objetivo ${outcome.nextAction.target}` : ''}</p>
              {outcome.nextAction.closureCriteria.length > 0 && <p className="mt-3 text-sm leading-6 text-muted-foreground">Cierre: {outcome.nextAction.closureCriteria.join(' · ')}</p>}
            </div>}

            {outcome.humanReviewStatus === 'approved' && outcome.actions.length > 0 && <div className="rounded-xl border border-primary/40 bg-primary/5 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Del outcome al cierre</p>
                  <h3 className="mt-2 text-lg font-semibold">Plan de cierre verificable</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Kumplio convierte las acciones aprobadas en trabajo trazable. Una acción no cuenta como cerrada sólo por marcarla hecha: necesita evidencia aceptada, integridad verificada y una revisión humana del criterio de cierre.</p>
                </div>
                {!closure?.plan && <Button onClick={activateClosurePlan} disabled={closureLoading || !closure?.canMaterialize}>
                  {closureLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} Activar plan de cierre
                </Button>}
              </div>

              {closure?.plan && <div className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/70 bg-background p-3"><p className="text-xs uppercase tracking-wide text-muted-foreground">Verificadas</p><p className="mt-1 text-xl font-semibold">{verifiedClosureTasks}/{closureTasks.length}</p></div>
                  <div className="rounded-lg border border-border/70 bg-background p-3"><p className="text-xs uppercase tracking-wide text-muted-foreground">Estado del plan</p><p className="mt-1 text-sm font-semibold">{closure.plan.status}</p></div>
                  <div className="rounded-lg border border-border/70 bg-background p-3"><p className="text-xs uppercase tracking-wide text-muted-foreground">Outcome congelado</p><p className="mt-1 text-sm font-semibold">{closure.plan.source_contract_version}</p></div>
                </div>

                {closure.plan.status === 'completed' ? <div className="rounded-lg border border-primary/30 bg-background p-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /><p className="font-semibold">Cierre verificado</p></div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Todas las acciones del outcome quedaron verificadas contra evidencia aceptada y revisión humana. La trazabilidad permanece vinculada al snapshot aprobado.</p>
                </div> : nextClosureTask && <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Siguiente paso de cierre</p>
                      <p className="mt-1 font-semibold">{nextClosureTask.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{CLOSURE_LABELS[nextClosureTask.verification_status] || nextClosureTask.verification_status} · responsable {nextClosureTask.owner_role || 'por asignar'}{nextClosureTask.target_label ? ` · objetivo ${nextClosureTask.target_label}` : ''}</p>
                    </div>
                    <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">{nextClosureTask.priority}</span>
                  </div>

                  {nextClosureTask.closure_criteria.length > 0 ? <div className="mt-3"><p className="text-xs font-medium">Criterios que deben quedar demostrados</p><ul className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">{nextClosureTask.closure_criteria.map((item) => <li key={item}>• {item}</li>)}</ul></div> : <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs leading-5 text-muted-foreground">Esta acción todavía no tiene un criterio de cierre verificable. Kumplio no permitirá declararla verificada sólo con una marca de completitud.</div>}

                  {nextClosureTask.verification_status !== 'ready_for_review' && nextClosureTask.verification_status !== 'verified' && <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                    <label className="text-xs font-medium">Evidencia aceptada
                      <select value={closureEvidence[nextClosureTask.id] || ''} onChange={(event) => setClosureEvidence((current) => ({ ...current, [nextClosureTask.id]: event.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card p-2.5 text-sm">
                        <option value="">Seleccionar evidencia...</option>
                        {closure.availableEvidence.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.evidence_type}</option>)}
                      </select>
                    </label>
                    <label className="text-xs font-medium">Nota de ejecución
                      <input value={closureNotes[nextClosureTask.id] || ''} onChange={(event) => setClosureNotes((current) => ({ ...current, [nextClosureTask.id]: event.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card p-2.5 text-sm" placeholder="Qué se hizo y qué demuestra la evidencia" />
                    </label>
                    <Button onClick={() => submitClosureTask(nextClosureTask.id)} disabled={closureLoading || !closureEvidence[nextClosureTask.id] || nextClosureTask.closure_criteria.length === 0}>{closureLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-2 h-4 w-4" />} Preparar cierre</Button>
                  </div>}

                  {closure.availableEvidence.length === 0 && nextClosureTask.verification_status !== 'ready_for_review' && <p className="mt-3 text-xs leading-5 text-muted-foreground">No hay evidencia aceptada con integridad verificada disponible en este proyecto todavía. El cierre permanece abierto.</p>}

                  {nextClosureTask.verification_status === 'ready_for_review' && <div className="mt-4 space-y-3">
                    <label className="block text-xs font-medium">Revisión humana del cierre
                      <textarea value={closureReviewNotes[nextClosureTask.id] || ''} onChange={(event) => setClosureReviewNotes((current) => ({ ...current, [nextClosureTask.id]: event.target.value }))} rows={2} className="mt-1 block w-full rounded-lg border border-border bg-card p-2.5 text-sm" placeholder="Explica por qué la evidencia demuestra —o no demuestra— el criterio de cierre" />
                    </label>
                    <div className="flex flex-wrap gap-2"><Button onClick={() => reviewClosureTask(nextClosureTask.id, 'verified')} disabled={closureLoading}><ShieldCheck className="mr-2 h-4 w-4" /> Verificar cierre</Button><Button variant="outline" onClick={() => reviewClosureTask(nextClosureTask.id, 'changes_requested')} disabled={closureLoading}>Pedir cambios</Button></div>
                  </div>}
                </div>}

                <details>
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Ver plan completo ({closureTasks.length} acciones)</summary>
                  <div className="mt-3 space-y-2">{closureTasks.map((task) => <div key={task.id} className="rounded-lg border border-border/70 bg-background p-3">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{task.sequence}. {task.title}</p><p className="mt-1 text-xs text-muted-foreground">{CLOSURE_LABELS[task.verification_status] || task.verification_status}{task.evidenceIds.length ? ` · ${task.evidenceIds.length} evidencia(s)` : ''}</p></div>{task.verification_status === 'verified' && <CheckCircle2 className="h-4 w-4 text-primary" />}</div>
                  </div>)}</div>
                </details>
              </div>}
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

            <div className="rounded-xl border border-border bg-background p-5">
              <div className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Evidencia usada</p></div>
              {outcome.evidence.length ? <div className="mt-3 grid gap-3 md:grid-cols-2">{outcome.evidence.slice(0, 8).map((item, index) => <div key={`${item.label}-${item.location || index}`} className="rounded-lg border border-border/70 p-3">
                <p className="text-sm font-medium">{item.label}</p>
                {item.supports && <p className="mt-1 text-xs leading-5 text-muted-foreground">Respalda: {item.supports}</p>}
                {item.location && <p className="mt-1 break-all text-[11px] leading-4 text-muted-foreground">{item.location}</p>}
              </div>)}</div> : <p className="mt-3 text-sm leading-6 text-muted-foreground">No hay referencias de evidencia disponibles todavía; el resultado no las presume.</p>}
            </div>

            {outcome.humanReviewReasons.length > 0 && <div className="rounded-xl border border-border bg-background p-5">
              <p className="text-sm font-semibold">Por qué requiere revisión humana</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{outcome.humanReviewReasons.slice(0, 8).map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>}

            <div className="text-xs leading-5 text-muted-foreground">
              Especialistas activados: {outcome.specialistsUsed.join(', ') || 'ninguno todavía'}.
              {outcome.humanReviewRequired ? ' Las decisiones sensibles permanecen bajo control humano.' : ''}
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
