'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, ArrowRight, Loader2, Plus } from 'lucide-react'

type Props = {
  caseId: string
  caseStatus: string
  title: string
}

export function CasePostResultActions({ caseId, caseStatus, title }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const canArchive = caseStatus === 'approved'

  async function archiveCase() {
    if (!canArchive || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/cases/${caseId}/archive`, { method: 'POST' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'No fue posible archivar el caso')
      router.push('/cases')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible archivar el caso')
    } finally {
      setBusy(false)
    }
  }

  if (caseStatus !== 'approved' && caseStatus !== 'archived') return null

  return (
    <section className="rounded-2xl border bg-card p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Después del resultado</p>
      <h2 className="mt-2 font-black">Mantén la continuidad sin alterar este expediente</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Crea un caso nuevo para una necesidad posterior o archiva este expediente cuando ya no requiera seguimiento visible.
      </p>

      <div className="mt-4 grid gap-2">
        <Link href="/cases/new" className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Preparar otro caso <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        {canArchive && (
          <button type="button" onClick={archiveCase} disabled={busy} className="inline-flex items-center justify-center rounded-xl border px-4 py-3 font-semibold disabled:opacity-60">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
            Archivar “{title.length > 38 ? `${title.slice(0, 38)}…` : title}”
          </button>
        )}
      </div>
      {caseStatus === 'archived' && <p className="mt-3 text-sm font-semibold text-muted-foreground">Este expediente ya está archivado.</p>}
      {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
    </section>
  )
}
