'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

export function CaseClosureActions({ caseId, canClose, caseStatus }: { caseId: string; canClose: boolean; caseStatus: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!canClose && caseStatus !== 'approved') return null

  async function closeCase() {
    if (busy || caseStatus === 'approved') return
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/cases/${caseId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'No fue posible cerrar el caso')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible cerrar el caso')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <h2 className="font-black">{caseStatus === 'approved' ? 'Caso resuelto' : 'Cerrar este caso'}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {caseStatus === 'approved'
              ? 'El resultado final quedó aprobado y el cierre fue registrado en la bitácora.'
              : 'Marca el caso como resuelto solo cuando el resultado aprobado ya esté listo para llevarse a la práctica.'}
          </p>
        </div>
      </div>

      {caseStatus !== 'approved' && (
        <button
          type="button"
          onClick={closeCase}
          disabled={busy}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          Marcar como resuelto
        </button>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
    </section>
  )
}
