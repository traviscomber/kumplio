'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'

type Props = {
  caseId: string
  instructions: string
}

export function StartCaseResolution({ caseId, instructions }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function start() {
    if (busy) return
    setBusy(true)
    setError('')

    try {
      const workflowResponse = await fetch('/api/agents/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          workflowType: 'compliance_assessment',
          instructions,
        }),
      })
      const workflowPayload = await workflowResponse.json().catch(() => ({}))

      const workflowId = workflowPayload.workflow?.id || workflowPayload.workflowId
      if (!workflowResponse.ok && workflowResponse.status !== 409) {
        throw new Error(workflowPayload.error || 'No fue posible preparar el trabajo guiado')
      }
      if (!workflowId) {
        throw new Error('No fue posible identificar el trabajo preparado para este caso')
      }

      if (workflowResponse.ok) {
        const advanceResponse = await fetch(`/api/agents/workflows/${workflowId}/advance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        const advancePayload = await advanceResponse.json().catch(() => ({}))
        if (!advanceResponse.ok) {
          throw new Error(advancePayload.error || 'El caso quedó preparado, pero la primera etapa no pudo comenzar')
        }
      }

      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible iniciar la resolución')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
        {busy ? 'Preparando el equipo…' : 'Iniciar resolución guiada'}
      </button>
      {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
    </div>
  )
}
