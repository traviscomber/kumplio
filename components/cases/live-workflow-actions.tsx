'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Loader2, RotateCcw } from 'lucide-react'

type Props = {
  workflowId: string
  runId: string | null
  stageStatus: string | null
  workflowStatus: string
}

export function LiveWorkflowActions({ workflowId, runId, stageStatus, workflowStatus }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<'approve' | 'changes' | 'advance' | null>(null)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const canReview = Boolean(runId && stageStatus === 'pending_review')
  const canAdvance = ['draft', 'running', 'paused'].includes(workflowStatus) && !canReview

  async function request(path: string, body: unknown) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.error || 'No fue posible completar la acción')
    return payload
  }

  async function approveAndContinue() {
    if (!runId || busy) return
    setBusy('approve')
    setError('')
    try {
      const review = await request(`/api/agents/runs/${runId}/review`, { decision: 'approved' })
      if (review.workflowStatus !== 'completed') {
        await request(`/api/agents/workflows/${workflowId}/advance`, {})
      }
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
      setComment('')
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

  if (!canReview && !canAdvance) return null

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <h2 className="font-black">Siguiente decisión</h2>
      {canReview ? (
        <>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Revisa el resultado persistido. Al aprobarlo, Kumplio iniciará la siguiente etapa real.
          </p>
          <button
            type="button"
            onClick={approveAndContinue}
            disabled={Boolean(busy)}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy === 'approve' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Aprobar y continuar
          </button>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            placeholder="Explica qué debe corregirse..."
            className="mt-4 w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary"
          />
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
      ) : (
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
      )}
      {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
    </section>
  )
}
