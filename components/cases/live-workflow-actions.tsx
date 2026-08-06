'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Loader2, RotateCcw } from 'lucide-react'

type Props = {
  workflowId: string
  runId: string | null
  stageStatus: string | null
  workflowStatus: string
  attemptCount: number | null
  maxAttempts: number | null
  canRecoverStale: boolean
}

type BusyAction = 'approve' | 'changes' | 'advance' | 'retry' | 'recover' | 'close' | null

type ApprovalChecklist = {
  evidence_reviewed: boolean
  limitations_understood: boolean
  outcome_supported: boolean
}

const initialChecklist: ApprovalChecklist = {
  evidence_reviewed: false,
  limitations_understood: false,
  outcome_supported: false,
}

export function LiveWorkflowActions({
  workflowId,
  runId,
  stageStatus,
  workflowStatus,
  attemptCount,
  maxAttempts,
  canRecoverStale,
}: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<BusyAction>(null)
  const [comment, setComment] = useState('')
  const [checklist, setChecklist] = useState<ApprovalChecklist>(initialChecklist)
  const [error, setError] = useState('')
  const [closed, setClosed] = useState(false)

  const canReview = Boolean(runId && stageStatus === 'pending_review')
  const canRetryFailed = stageStatus === 'failed' && workflowStatus === 'failed'
  const canRetryChanges = stageStatus === 'changes_requested' && workflowStatus === 'paused'
  const hasRetryState = canRetryFailed || canRetryChanges
  const retriesExhausted = Boolean(
    hasRetryState
      && attemptCount !== null
      && maxAttempts !== null
      && attemptCount >= maxAttempts,
  )
  const canAdvance = ['draft', 'running'].includes(workflowStatus) && !canReview && !canRecoverStale
  const canClose = workflowStatus === 'completed'
  const approvalReady = comment.trim().length >= 3
    && checklist.evidence_reviewed
    && checklist.limitations_understood
    && checklist.outcome_supported

  async function request(path: string, body?: unknown) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = new Error(payload.error || 'No fue posible completar la acción') as Error & { code?: string }
      error.code = payload.code
      throw error
    }
    return payload
  }

  function resetReviewFields() {
    setComment('')
    setChecklist(initialChecklist)
  }

  function toggleChecklist(key: keyof ApprovalChecklist) {
    setChecklist((current) => ({ ...current, [key]: !current[key] }))
  }

  async function approveAndContinue() {
    if (!runId || busy || !approvalReady) return
    setBusy('approve')
    setError('')
    try {
      const review = await request(`/api/agents/runs/${runId}/review`, {
        decision: 'approved',
        comment: comment.trim(),
        checklist,
      })
      if (review.workflowStatus !== 'completed') {
        await request(`/api/agents/workflows/${workflowId}/advance`, {})
      }
      resetReviewFields()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible aprobar la etapa')
    } finally {
      setBusy(null)
    }
  }

  async function requestChanges() {
    if (!runId || busy || comment.trim().length < 3) return
    setBusy('changes')
    setError('')
    try {
      await request(`/api/agents/runs/${runId}/review`, {
        decision: 'changes_requested',
        comment: comment.trim(),
      })
      resetReviewFields()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible solicitar cambios')
    } finally {
      setBusy(null)
    }
  }

  async function advance() {
    if (busy) return
    setBusy('advance')
    setError('')
    try {
      await request(`/api/agents/workflows/${workflowId}/advance`, {})
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible iniciar la siguiente etapa')
    } finally {
      setBusy(null)
    }
  }

  async function retry() {
    if (busy || retriesExhausted || (canRetryChanges && comment.trim().length < 3)) return
    setBusy('retry')
    setError('')
    try {
      await request(`/api/agents/workflows/${workflowId}/advance`, canRetryChanges
        ? { instructions: comment.trim() }
        : {})
      setComment('')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible reintentar la etapa')
    } finally {
      setBusy(null)
    }
  }

  async function recoverStale() {
    if (busy || !canRecoverStale) return
    setBusy('recover')
    setError('')
    try {
      await request(`/api/agents/workflows/${workflowId}/recover-stale`)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible recuperar la ejecución detenida')
    } finally {
      setBusy(null)
    }
  }

  async function closeCase() {
    if (busy || closed) return
    setBusy('close')
    setError('')
    try {
      await request(`/api/agents/workflows/${workflowId}/close-case`)
      setClosed(true)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible cerrar el caso')
    } finally {
      setBusy(null)
    }
  }

  if (!canReview && !hasRetryState && !canAdvance && !canRecoverStale && !canClose) return null

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <h2 className="font-black">{canClose ? 'Cierre del caso' : 'Siguiente decisión'}</h2>

      {canRecoverStale ? (
        <>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            La ejecución superó el tiempo máximo del servidor y no entregó un resultado. Recupérala para liberar la etapa y habilitar un reintento trazable.
          </p>
          <button
            type="button"
            onClick={recoverStale}
            disabled={Boolean(busy)}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy === 'recover' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
            Recuperar ejecución detenida
          </button>
        </>
      ) : canReview ? (
        <>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Revisa el resultado persistido. Aprobar significa que verificaste su respaldo y sus límites; no solo que el agente terminó.
          </p>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            placeholder="Justifica la aprobación o explica qué debe corregirse..."
            className="mt-4 w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary"
          />

          <fieldset className="mt-4 space-y-3 rounded-xl border bg-background/60 p-4">
            <legend className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Confirmaciones para aprobar</legend>
            <ChecklistItem
              checked={checklist.evidence_reviewed}
              onChange={() => toggleChecklist('evidence_reviewed')}
              label="Revisé las fuentes y evidencias relacionadas."
            />
            <ChecklistItem
              checked={checklist.limitations_understood}
              onChange={() => toggleChecklist('limitations_understood')}
              label="Entiendo los supuestos, reservas y datos que todavía faltan."
            />
            <ChecklistItem
              checked={checklist.outcome_supported}
              onChange={() => toggleChecklist('outcome_supported')}
              label="La conclusión está suficientemente respaldada para avanzar."
            />
          </fieldset>

          <button
            type="button"
            onClick={approveAndContinue}
            disabled={Boolean(busy) || !approvalReady}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === 'approve' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Aprobar y continuar
          </button>
          <button
            type="button"
            onClick={requestChanges}
            disabled={Boolean(busy) || comment.trim().length < 3}
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl border px-4 py-3 font-semibold disabled:opacity-50"
          >
            {busy === 'changes' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
            Solicitar cambios
          </button>
        </>
      ) : hasRetryState ? (
        retriesExhausted ? (
          <>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Esta etapa alcanzó el máximo de intentos permitidos. El historial y los errores permanecen disponibles para revisión técnica.
            </p>
            <p className="mt-3 text-sm font-semibold text-destructive">
              Límite alcanzado: {attemptCount ?? 0} de {maxAttempts ?? 0} intentos.
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {canRetryChanges
                ? 'La etapa necesita una nueva ejecución. Escribe instrucciones concretas para el siguiente intento.'
                : 'La etapa falló antes de producir un resultado revisable. Puedes usar el siguiente intento disponible.'}
            </p>
            {attemptCount !== null && maxAttempts !== null && (
              <p className="mt-2 text-xs font-semibold text-muted-foreground">
                Intentos usados: {attemptCount} de {maxAttempts}.
              </p>
            )}
            {canRetryChanges && (
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                placeholder="Instrucciones para el reintento..."
                className="mt-4 w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary"
              />
            )}
            <button
              type="button"
              onClick={retry}
              disabled={Boolean(busy) || (canRetryChanges && comment.trim().length < 3)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy === 'retry' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              Reintentar etapa
            </button>
          </>
        )
      ) : canAdvance ? (
        <>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            La siguiente etapa está preparada y todavía no se ha ejecutado.
          </p>
          <button
            type="button"
            onClick={advance}
            disabled={Boolean(busy)}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy === 'advance' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            Ejecutar siguiente etapa
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            El workflow terminó y su revisión final fue aprobada. Registra el cierre cuando el resultado ya esté listo para llevarse a la práctica.
          </p>
          <button
            type="button"
            onClick={closeCase}
            disabled={Boolean(busy) || closed}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy === 'close' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {closed ? 'Caso marcado como resuelto' : 'Marcar como resuelto'}
          </button>
        </>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
    </section>
  )
}

function ChecklistItem({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 shrink-0 accent-primary"
      />
      <span>{label}</span>
    </label>
  )
}
