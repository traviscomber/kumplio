'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LeyChileCaptureButton({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function capture() {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/regulatory/leychile/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'No fue posible capturar LeyChile.')
      }

      const articleCount = payload.capture?.articleCount || 0
      const sectionCount = payload.capture?.sectionCount || 0
      setMessage(`Captura completada: ${articleCount} artículos y ${sectionCount} secciones.`)
      router.refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No fue posible capturar LeyChile.')
    } finally {
      setLoading(false)
    }
  }

  if (!enabled) {
    return (
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        La captura manual está disponible para propietarios y administradores del workspace.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
          <div>
            <p className="font-semibold">Scraper LeyChile operativo</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Captura la versión oficial de la Ley 21.719, calcula hash, normaliza artículos e incisos y registra cambios sin sobrescribir versiones anteriores.
            </p>
          </div>
        </div>
        <Button onClick={capture} disabled={loading} className="shrink-0 gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? 'Capturando…' : 'Capturar Ley 21.719'}
        </Button>
      </div>

      {message && <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">{message}</p>}
      {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}
    </div>
  )
}
