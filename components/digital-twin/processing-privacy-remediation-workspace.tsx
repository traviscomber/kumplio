'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileClock,
  Loader2,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  ProcessingPrivacyRemediation,
  ProcessingPrivacyRemediationSummary,
} from '@/lib/compliance/digital-twin/privacy-remediation'
import { PRIVACY_NOTICE } from '@/lib/privacy/notice'

type Props = {
  actions: ProcessingPrivacyRemediation[]
  summary: ProcessingPrivacyRemediationSummary
  canManage: boolean
}

export function ProcessingPrivacyRemediationWorkspace({ actions, summary, canManage }: Props) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scopeConfirmed, setScopeConfirmed] = useState(false)
  const [ownerAndDatesConfirmed, setOwnerAndDatesConfirmed] = useState(false)
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID())
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const selected = actions.find((item) => item.processId === selectedId) || null

  function open(action: ProcessingPrivacyRemediation) {
    setSelectedId(action.processId)
    setRequestKey(crypto.randomUUID())
    setScopeConfirmed(false)
    setOwnerAndDatesConfirmed(false)
    setFeedback(null)
  }

  function close() {
    setSelectedId(null)
    setFeedback(null)
  }

  async function createPlan() {
    if (!selected) return
    setLoading(true)
    setFeedback(null)
    try {
      const response = await fetch(`/api/processing-activities/${selected.processId}/privacy-remediation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestKey, scopeConfirmed, ownerAndDatesConfirmed }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No fue posible crear el plan.')
      setFeedback({ type: 'success', message: result.message || 'Plan creado.' })
      setRequestKey(crypto.randomUUID())
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible crear el plan.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-10 space-y-6 rounded-3xl border bg-card p-5 sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <p className="text-sm font-bold">Aviso y eliminación</p>
          </div>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">La política pública no reemplaza la prueba.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Kumplio vincula la versión vigente del aviso y, cuando todavía no acredita el alcance o la eliminación, crea trabajo real con responsable, vencimiento y solicitudes de evidencia.
          </p>
          <a href={PRIVACY_NOTICE.route} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Ver aviso público v{PRIVACY_NOTICE.version}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
          <Metric label="Avisos vinculados" value={`${summary.noticesLinked}/${summary.activities}`} />
          <Metric label="Planes listos" value={`${summary.plansReady}/${summary.activities}`} />
          <Metric label="Avisos pendientes" value={summary.noticeRequestsOpen} />
          <Metric label="Eliminaciones probadas" value={`${summary.deletionRequestsAccepted}/${summary.activities}`} />
        </div>
      </div>

      <div className="space-y-4">
        {actions.map((action) => (
          <article key={action.processId} className="rounded-2xl border bg-background/40 p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black">{action.processName}</h3>
                  <StateBadge ready={Boolean(action.mission)} />
                  <span className="rounded-full border px-2.5 py-1 text-xs font-semibold">Owner: {action.ownerLabel || 'Sin responsable'}</span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <EvidenceCard
                    icon={<FileCheck2 className="h-4 w-4" />}
                    title="Aviso público"
                    status={action.notice.evidenceId ? `Vinculado · v${action.notice.version || PRIVACY_NOTICE.version}` : 'Sin vincular'}
                    due={action.notice.integrityHash ? `SHA-256 ${shortHash(action.notice.integrityHash)}` : null}
                    success={Boolean(action.notice.evidenceId)}
                  />
                  <EvidenceCard
                    icon={<FileClock className="h-4 w-4" />}
                    title="Mapeo aplicable"
                    status={requestStatus(action.noticeRequest?.status)}
                    due={formatDue(action.noticeRequest?.dueAt)}
                    success={action.noticeRequest?.status === 'accepted'}
                  />
                  <EvidenceCard
                    icon={<Trash2 className="h-4 w-4" />}
                    title="Eliminación demostrada"
                    status={requestStatus(action.deletionRequest?.status)}
                    due={formatDue(action.deletionRequest?.dueAt)}
                    success={action.deletionRequest?.status === 'accepted'}
                  />
                </div>

                {action.mission && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border bg-muted/20 px-4 py-3 text-sm">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{action.mission.title}</span>
                    <span className="text-muted-foreground">Estado: {missionStatus(action.mission.status)}</span>
                    <span className="text-muted-foreground">Vence: {formatDate(action.mission.dueAt)}</span>
                  </div>
                )}
              </div>

              {canManage && !action.mission && (
                <Button type="button" variant="outline" onClick={() => open(action)} className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Crear plan de cierre
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <div className="space-y-5 rounded-2xl border-2 border-primary/20 bg-background p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Plan operacional</p>
              <h3 className="mt-1 text-xl font-black">{selected.processName}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Se vinculará el aviso v{PRIVACY_NOTICE.version}. Además se crearán una misión y dos solicitudes: mapeo del aviso y prueba de eliminación.
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={close} aria-label="Cerrar plan de aviso y eliminación">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {feedback && (
            <div className={`rounded-xl border p-3 text-sm ${feedback.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
              {feedback.message}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <PlanStep title="14 días" description="Matriz de cobertura o aviso corregido." />
            <PlanStep title="30 días" description="Prueba de eliminación o anonimización." />
            <PlanStep title="35 días" description="Cierre de la misión y revisión final." />
          </div>

          <div className="space-y-3">
            <Confirmation checked={scopeConfirmed} onChange={setScopeConfirmed} label="Entiendo que vincular el aviso general no demuestra que cubra esta actividad." />
            <Confirmation checked={ownerAndDatesConfirmed} onChange={setOwnerAndDatesConfirmed} label={`Confirmo a ${selected.ownerLabel || 'la persona responsable'} como owner y acepto los vencimientos propuestos.`} />
          </div>

          <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
              La evidencia de eliminación deberá incluir timestamp, proveedor, activo o dataset, alcance, responsable y los campos `backup_purga_programada` y `backup_purga_confirmada`.
            </p>
            <Button type="button" onClick={createPlan} disabled={loading || !scopeConfirmed || !ownerAndDatesConfirmed} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Crear misión y solicitudes
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border bg-background px-3 py-2"><p className="text-lg font-black">{value}</p><p className="text-muted-foreground">{label}</p></div>
}

function StateBadge({ ready }: { ready: boolean }) {
  return ready
    ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Plan activo</span>
    : <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"><AlertTriangle className="h-3.5 w-3.5" /> Acción requerida</span>
}

function EvidenceCard({ icon, title, status, due, success }: { icon: React.ReactNode; title: string; status: string; due: string | null; success: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${success ? 'border-emerald-500/25 bg-emerald-500/5' : 'bg-background'}`}>
      <div className="flex items-center gap-2 text-sm font-bold">{icon}{title}</div>
      <p className="mt-2 text-xs font-semibold">{status}</p>
      {due && <p className="mt-1 break-all text-[11px] text-muted-foreground">{due}</p>}
    </div>
  )
}

function PlanStep({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border bg-muted/20 p-3"><p className="font-black">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
}

function Confirmation({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="flex items-start gap-3 rounded-xl border bg-background px-4 py-3 text-sm"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4" /><span className="leading-6">{label}</span></label>
}

function requestStatus(status: string | undefined) {
  return status === 'accepted' ? 'Aceptada' : status === 'rejected' ? 'Rechazada' : status === 'submitted' ? 'Entregada · en revisión' : status === 'cancelled' ? 'Cancelada' : status ? 'Pendiente de entrega' : 'Sin solicitud'
}

function missionStatus(status: string) {
  return status === 'completed' ? 'completada' : status === 'in_progress' ? 'en curso' : status === 'blocked' ? 'bloqueada' : status === 'cancelled' ? 'cancelada' : 'lista para iniciar'
}

function formatDue(value: string | null | undefined) {
  return value ? `Vence ${formatDate(value)}` : null
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'America/Santiago' }).format(new Date(value))
}

function shortHash(value: string) {
  return `${value.slice(0, 12)}…${value.slice(-8)}`
}
