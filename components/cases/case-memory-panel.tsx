'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrainCircuit, DatabaseZap, RefreshCw } from 'lucide-react'

interface CaseMemoryPanelProps {
  caseId: string
  nodeCount: number
  edgeCount: number
  latestStatus: string | null
  latestCompletedAt: string | null
  canRefresh: boolean
}

const statusLabels: Record<string, string> = {
  succeeded: 'Actualizada',
  unchanged: 'Sin cambios',
  failed: 'Con errores',
  running: 'Procesando',
}

export function CaseMemoryPanel({
  caseId,
  nodeCount,
  edgeCount,
  latestStatus,
  latestCompletedAt,
  canRefresh,
}: CaseMemoryPanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function refreshMemory() {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch(`/api/cases/${caseId}/memory`, { method: 'POST' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No fue posible actualizar la memoria.')
      const status = payload.projection?.status === 'unchanged' ? 'La memoria ya estaba al día.' : 'Memoria Organizacional actualizada.'
      setMessage(status)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible actualizar la memoria.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold">Memoria Organizacional</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Representa documentos, controles y evidencias como conocimiento privado de la organización. No reemplaza los registros operacionales.
            </p>
          </div>
        </div>

        {canRefresh && (
          <button
            type="button"
            onClick={refreshMemory}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Actualizando…' : 'Actualizar memoria'}
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><DatabaseZap className="h-4 w-4" /> Nodos privados</div>
          <p className="mt-2 text-2xl font-bold">{nodeCount}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Relaciones privadas</p>
          <p className="mt-2 text-2xl font-bold">{edgeCount}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Última sincronización</p>
          <p className="mt-2 font-semibold">{latestStatus ? statusLabels[latestStatus] || latestStatus : 'Aún no ejecutada'}</p>
          {latestCompletedAt && <p className="mt-1 text-xs text-muted-foreground">{new Date(latestCompletedAt).toLocaleString('es-CL')}</p>}
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-muted-foreground" role="status">{message}</p>}
      {!canRefresh && <p className="mt-4 text-xs text-muted-foreground">Solo propietarios y administradores pueden actualizar la memoria.</p>}
    </section>
  )
}
