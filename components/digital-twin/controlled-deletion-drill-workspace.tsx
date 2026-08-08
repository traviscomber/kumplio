'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, FlaskConical, Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProcessingPrivacyRemediation } from '@/lib/compliance/digital-twin/privacy-remediation'

type Props = {
  actions: ProcessingPrivacyRemediation[]
  canManage: boolean
}

export function ControlledDeletionDrillWorkspace({ actions, canManage }: Props) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [syntheticOnlyConfirmed, setSyntheticOnlyConfirmed] = useState(false)
  const [limitationsConfirmed, setLimitationsConfirmed] = useState(false)
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID())
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const selected = actions.find((item) => item.processId === selectedId) || null
  const eligible = actions.filter((item) => (
    ['accepted_with_gaps', 'accepted_complete'].includes(item.mapping.status)
    && item.deletionRequest
    && item.deletionRequest.status !== 'accepted'
  ))

  function open(processId: string) {
    setSelectedId(processId)
    setSyntheticOnlyConfirmed(false)
    setLimitationsConfirmed(false)
    setRequestKey(crypto.randomUUID())
    setFeedback(null)
  }

  async function runDrill() {
    if (!selected) return
    setLoading(true)
    setFeedback(null)
    try {
      const response = await fetch(`/api/processing-activities/${selected.processId}/controlled-deletion-drill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestKey, syntheticOnlyConfirmed, limitationsConfirmed }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'No fue posible ejecutar el drill controlado.')
      setFeedback({ type: 'success', message: body.message || 'Drill controlado ejecutado.' })
      setRequestKey(crypto.randomUUID())
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible ejecutar el drill controlado.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-10 space-y-6 rounded-3xl border bg-card p-5 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <FlaskConical className="h-5 w-5" />
            <p className="text-sm font-bold">Drill controlado de eliminación</p>
          </div>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Probar el mecanismo sin tocar datos reales.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Kumplio crea un probe sintético, registra su hash, anonimiza sus identificadores y entrega una evidencia para revisión. El drill no cuenta como eliminación real de titulares, backups o proveedores externos.
          </p>
        </div>
        <div className="rounded-2xl border bg-background px-4 py-3 text-sm">
          <p className="font-black">{actions.filter((item) => item.controlledDeletion.status === 'passed_controlled_test').length}/{actions.length}</p>
          <p className="text-xs text-muted-foreground">drills controlados ejecutados</p>
        </div>
      </div>

      <div className="space-y-3">
        {eligible.map((action) => {
          const passed = action.controlledDeletion.status === 'passed_controlled_test'
          return (
            <article key={action.processId} className="rounded-2xl border bg-background/40 p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black">{action.processName}</h3>
                    {passed
                      ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Drill aprobado técnicamente</span>
                      : <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"><AlertTriangle className="h-3.5 w-3.5" /> Aún no probado</span>}
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <p>Mapeo: <strong className="text-foreground">{mappingLabel(action.mapping.status)}</strong></p>
                    <p>Solicitud: <strong className="text-foreground">{requestLabel(action.deletionRequest?.status)}</strong></p>
                    <p>Eliminación real: <strong className="text-foreground">no demostrada</strong></p>
                  </div>
                </div>

                {canManage && !passed && (
                  <Button type="button" variant="outline" onClick={() => open(action.processId)} className="gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Ejecutar drill sintético
                  </Button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {selected && (
        <div className="space-y-5 rounded-2xl border-2 border-primary/20 bg-background p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Confirmación humana</p>
            <h3 className="mt-1 text-xl font-black">{selected.processName}</h3>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <div className="flex gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="leading-6">Este ejercicio solo valida un probe sintético en la base primaria. No borra datos productivos, no prueba purga de backups y no demuestra propagación a OpenAI, Supabase u otros procesadores.</p>
            </div>
          </div>

          {feedback && (
            <div className={`rounded-xl border p-3 text-sm ${feedback.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
              {feedback.message}
            </div>
          )}

          <label className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm">
            <input type="checkbox" checked={syntheticOnlyConfirmed} onChange={(event) => setSyntheticOnlyConfirmed(event.target.checked)} className="mt-1 h-4 w-4" />
            <span>Confirmo que este drill debe usar exclusivamente datos sintéticos creados para la prueba.</span>
          </label>
          <label className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm">
            <input type="checkbox" checked={limitationsConfirmed} onChange={(event) => setLimitationsConfirmed(event.target.checked)} className="mt-1 h-4 w-4" />
            <span>Entiendo que un drill aprobado no equivale a eliminación real de titulares, backups ni terceros.</span>
          </label>

          <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
              La evidencia quedará `submitted` para revisión. La solicitud de eliminación no será aceptada automáticamente.
            </p>
            <Button type="button" onClick={runDrill} disabled={loading || !syntheticOnlyConfirmed || !limitationsConfirmed} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
              Ejecutar prueba controlada
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

function mappingLabel(status: string) {
  return status === 'accepted_complete' ? 'aceptado completo' : status === 'accepted_with_gaps' ? 'aceptado con brechas' : 'pendiente'
}

function requestLabel(status: string | undefined) {
  if (status === 'accepted') return 'aceptada'
  if (status === 'submitted') return 'evidencia entregada'
  if (status === 'under_review') return 'en revisión'
  if (status === 'changes_requested') return 'requiere cambios'
  return 'abierta'
}
