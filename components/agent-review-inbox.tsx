'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Clock3, FileCheck2, Fingerprint, Loader2, RefreshCw, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AGENT_CATALOG } from '@/lib/agents/catalog'

type ReviewItem = {
  id: string
  agent_id: string
  status: string
  task: string
  output_payload: unknown
  output_text: string | null
  model: string | null
  total_tokens: number | null
  elapsed_ms: number | null
  created_at: string
  completed_at: string | null
  compliance_cases?: { id?: string; title?: string; priority?: string } | Array<{ id?: string; title?: string; priority?: string }> | null
  artifact?: {
    id: string
    title: string
    artifact_type: string
    lineage_id: string
    version: number
    supersedes_artifact_id: string | null
    content_hash: string
    integrity_version: string
    content: unknown
    source_refs: unknown
    status: string
  } | null
  workflowStage?: {
    id: string
    workflow_id: string
    stage_index: number
    status: string
    agent_workflows?: { id?: string; status?: string; current_stage?: number; total_stages?: number } | Array<{ id?: string; status?: string; current_stage?: number; total_stages?: number }> | null
  } | null
  reviews?: Array<{
    id: string
    decision: string
    comment: string | null
    previous_review_id: string | null
    decision_hash: string
    integrity_version: string
    signed_at: string
    created_at: string
  }>
}

const FILTERS = [
  { value: 'pending_review', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'rejected', label: 'Rechazados' },
  { value: 'all', label: 'Todos' },
] as const

function compactHash(value?: string | null) {
  return value ? `${value.slice(0, 12)}…${value.slice(-8)}` : '—'
}

export function AgentReviewInbox() {
  const [status, setStatus] = useState<(typeof FILTERS)[number]['value']>('pending_review')
  const [items, setItems] = useState<ReviewItem[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selected = useMemo(() => items.find((item) => item.id === selectedId) || items[0] || null, [items, selectedId])

  async function loadItems(nextStatus = status) {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/agents/reviews?status=${nextStatus}&limit=100`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible cargar la bandeja de revisión')
      setItems(data.items || [])
      setSelectedId((current) => data.items?.some((item: ReviewItem) => item.id === current) ? current : data.items?.[0]?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadItems(status) }, [status])

  async function submitDecision(decision: 'approved' | 'rejected' | 'changes_requested') {
    if (!selected) return
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`/api/agents/runs/${selected.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment: comment.trim() || undefined }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible guardar la revisión')
      setComment('')
      await loadItems(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSubmitting(false)
    }
  }

  const caseData = selected
    ? Array.isArray(selected.compliance_cases) ? selected.compliance_cases[0] : selected.compliance_cases
    : null
  const workflowData = selected?.workflowStage
    ? Array.isArray(selected.workflowStage.agent_workflows) ? selected.workflowStage.agent_workflows[0] : selected.workflowStage.agent_workflows
    : null
  const agent = selected ? AGENT_CATALOG.find((item) => item.id === selected.agent_id) : null

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Bandeja de revisión</p>
              <p className="mt-1 text-xs text-muted-foreground">Decisiones humanas sobre ejecuciones y etapas.</p>
            </div>
            <button type="button" onClick={() => void loadItems()} aria-label="Actualizar"><RefreshCw className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {FILTERS.map((filter) => (
              <button key={filter.value} type="button" onClick={() => setStatus(filter.value)} className={`rounded-lg border px-3 py-2 text-xs font-medium ${status === filter.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'}`}>
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section className="max-h-[720px] space-y-2 overflow-y-auto">
          {loading ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Cargando revisiones…</div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">No hay elementos para este filtro.</div>
          ) : items.map((item) => {
            const itemCase = Array.isArray(item.compliance_cases) ? item.compliance_cases[0] : item.compliance_cases
            const itemAgent = AGENT_CATALOG.find((catalogItem) => catalogItem.id === item.agent_id)
            return (
              <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full rounded-xl border p-4 text-left ${selected?.id === item.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{itemAgent?.name || item.agent_id}</p>
                  <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{item.status}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{itemCase?.title || item.task}</p>
                <p className="mt-2 text-[10px] text-muted-foreground">{new Date(item.completed_at || item.created_at).toLocaleString('es-CL')}</p>
              </button>
            )
          })}
        </section>
      </aside>

      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        {!selected ? (
          <p className="text-muted-foreground">Selecciona una ejecución para revisarla.</p>
        ) : (
          <div className="space-y-6">
            <header className="border-b border-border pb-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{agent?.name || selected.agent_id}</p>
                  <h2 className="mt-2 text-2xl font-bold">{caseData?.title || selected.artifact?.title || 'Ejecución de agente'}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{selected.task}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{selected.status}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {selected.model && <span>{selected.model}</span>}
                {selected.elapsed_ms && <span>{(selected.elapsed_ms / 1000).toFixed(1)} s</span>}
                {selected.total_tokens && <span>{selected.total_tokens} tokens</span>}
                {workflowData && <span>Workflow · etapa {(selected.workflowStage?.stage_index || 0) + 1}/{workflowData.total_stages || '?'}</span>}
              </div>
            </header>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Trazabilidad</p></div>
                <dl className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between gap-4"><dt>Run</dt><dd className="max-w-[180px] truncate font-mono" title={selected.id}>{selected.id}</dd></div>
                  {selected.artifact && <div className="flex justify-between gap-4"><dt>Artefacto</dt><dd className="font-mono">v{selected.artifact.version}</dd></div>}
                  {caseData?.priority && <div className="flex justify-between gap-4"><dt>Prioridad</dt><dd>{caseData.priority}</dd></div>}
                  {selected.reviews?.length ? <div className="flex justify-between gap-4"><dt>Revisiones</dt><dd>{selected.reviews.length}</dd></div> : null}
                </dl>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Integridad del artefacto</p></div>
                <dl className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between gap-4"><dt>Hash</dt><dd className="font-mono" title={selected.artifact?.content_hash}>{compactHash(selected.artifact?.content_hash)}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Linaje</dt><dd className="font-mono" title={selected.artifact?.lineage_id}>{selected.artifact?.lineage_id ? compactHash(selected.artifact.lineage_id.replaceAll('-', '')) : '—'}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Supersede</dt><dd className="font-mono" title={selected.artifact?.supersedes_artifact_id || undefined}>{selected.artifact?.supersedes_artifact_id ? compactHash(selected.artifact.supersedes_artifact_id.replaceAll('-', '')) : '—'}</dd></div>
                </dl>
                <p className="mt-3 text-[10px] leading-4 text-muted-foreground">Huella de integridad SHA-256; no constituye firma electrónica legal.</p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Estado de aprobación</p></div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {selected.workflowStage
                    ? 'Esta ejecución pertenece a una etapa coordinada. La siguiente etapa permanecerá bloqueada hasta que esta revisión quede aprobada.'
                    : 'Esta ejecución individual requiere una decisión humana antes de considerarse aprobada.'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold">Resultado estructurado</p>
              <pre className="mt-3 max-h-[620px] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background p-5 text-xs leading-6">{selected.output_text || JSON.stringify(selected.artifact?.content || selected.output_payload, null, 2)}</pre>
            </div>

            {selected.reviews?.length ? (
              <details className="rounded-xl border border-border bg-background p-4">
                <summary className="cursor-pointer text-sm font-semibold">Cadena de decisiones</summary>
                <div className="mt-4 space-y-3">
                  {selected.reviews.map((review) => (
                    <div key={review.id} className="rounded-lg bg-muted p-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{review.decision}</p>
                        <span className="font-mono text-[10px] text-muted-foreground" title={review.decision_hash}>{compactHash(review.decision_hash)}</span>
                      </div>
                      {review.comment && <p className="mt-1 text-muted-foreground">{review.comment}</p>}
                      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                        <span>{new Date(review.signed_at || review.created_at).toLocaleString('es-CL')}</span>
                        <span>Previo: {review.previous_review_id ? compactHash(review.previous_review_id.replaceAll('-', '')) : 'inicio'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}

            {selected.status === 'pending_review' && (
              <div className="space-y-3 border-t border-border pt-5">
                <label htmlFor="review-comment" className="text-sm font-semibold">Comentario de revisión</label>
                <textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} rows={4} maxLength={5000} className="w-full rounded-xl border border-border bg-background p-4 text-sm" placeholder="Fundamento, observaciones o cambios solicitados…" />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void submitDecision('approved')} disabled={submitting}><Check className="mr-2 h-4 w-4" />Aprobar</Button>
                  <Button variant="outline" onClick={() => void submitDecision('changes_requested')} disabled={submitting}><RotateCcw className="mr-2 h-4 w-4" />Solicitar cambios</Button>
                  <Button variant="destructive" onClick={() => void submitDecision('rejected')} disabled={submitting}><X className="mr-2 h-4 w-4" />Rechazar</Button>
                </div>
              </div>
            )}

            {error && <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
          </div>
        )}
      </section>
    </div>
  )
}
