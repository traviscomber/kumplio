'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
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
import type { NoticeMappingCoverage } from '@/lib/privacy/processing-notice-mapping'
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

  const [mappingId, setMappingId] = useState<string | null>(null)
  const [mappingReviewed, setMappingReviewed] = useState(false)
  const [limitationsConfirmed, setLimitationsConfirmed] = useState(false)
  const [mappingRequestKey, setMappingRequestKey] = useState(() => crypto.randomUUID())
  const [mappingLoading, setMappingLoading] = useState(false)
  const [mappingFeedback, setMappingFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const selected = actions.find((item) => item.processId === selectedId) || null
  const mappingSelected = actions.find((item) => item.processId === mappingId) || null

  function open(action: ProcessingPrivacyRemediation) {
    setSelectedId(action.processId)
    setMappingId(null)
    setRequestKey(crypto.randomUUID())
    setScopeConfirmed(false)
    setOwnerAndDatesConfirmed(false)
    setFeedback(null)
  }

  function close() {
    setSelectedId(null)
    setFeedback(null)
  }

  function openMapping(action: ProcessingPrivacyRemediation) {
    setMappingId(action.processId)
    setSelectedId(null)
    setMappingRequestKey(crypto.randomUUID())
    setMappingReviewed(false)
    setLimitationsConfirmed(false)
    setMappingFeedback(null)
  }

  function closeMapping() {
    setMappingId(null)
    setMappingFeedback(null)
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

  async function acceptMapping() {
    if (!mappingSelected) return
    setMappingLoading(true)
    setMappingFeedback(null)
    try {
      const response = await fetch(`/api/processing-activities/${mappingSelected.processId}/notice-mapping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestKey: mappingRequestKey,
          mappingReviewed,
          limitationsConfirmed,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No fue posible aceptar el mapeo.')
      setMappingFeedback({ type: 'success', message: result.message || 'Mapeo aceptado.' })
      setMappingRequestKey(crypto.randomUUID())
      router.refresh()
    } catch (error) {
      setMappingFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible aceptar el mapeo.' })
    } finally {
      setMappingLoading(false)
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
            Kumplio vincula la versión vigente, revisa cómo aplica a cada actividad y conserva las brechas que todavía necesitan contratos, decisiones o evidencia operacional.
          </p>
          <a href={PRIVACY_NOTICE.route} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Ver aviso público v{PRIVACY_NOTICE.version}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
          <Metric label="Avisos vinculados" value={`${summary.noticesLinked}/${summary.activities}`} />
          <Metric label="Planes listos" value={`${summary.plansReady}/${summary.activities}`} />
          <Metric label="Mapeos aceptados" value={`${summary.noticeRequestsAccepted}/${summary.activities}`} />
          <Metric label="Eliminaciones probadas" value={`${summary.deletionRequestsAccepted}/${summary.activities}`} />
        </div>
      </div>

      <div className="space-y-4">
        {actions.map((action) => {
          const mappingAccepted = action.noticeRequest?.status === 'accepted'
            && Boolean(action.noticeRequest.submittedEvidenceId)
          const deletionAccepted = action.deletionRequest?.status === 'accepted'
            && Boolean(action.deletionRequest.submittedEvidenceId)

          return (
            <article key={action.processId} className="rounded-2xl border bg-background/40 p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
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
                      icon={<ClipboardCheck className="h-4 w-4" />}
                      title="Mapeo aplicable"
                      status={mappingAccepted
                        ? `Aceptado con ${action.mapping.unknowns.length} brechas`
                        : requestStatus(action.noticeRequest?.status)}
                      due={action.mapping.snapshotHash
                        ? `SHA-256 ${shortHash(action.mapping.snapshotHash)}`
                        : formatDue(action.noticeRequest?.dueAt)}
                      success={mappingAccepted}
                    />
                    <EvidenceCard
                      icon={<Trash2 className="h-4 w-4" />}
                      title="Eliminación demostrada"
                      status={requestStatus(action.deletionRequest?.status)}
                      due={formatDue(action.deletionRequest?.dueAt)}
                      success={deletionAccepted}
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

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                  {canManage && !action.mission && (
                    <Button type="button" variant="outline" onClick={() => open(action)} className="gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Crear plan de cierre
                    </Button>
                  )}
                  {canManage && action.mission && action.noticeRequest && !mappingAccepted && action.mappingSuggestion.ready && (
                    <Button type="button" variant="outline" onClick={() => openMapping(action)} className="gap-2">
                      <ClipboardCheck className="h-4 w-4" />
                      Revisar mapeo
                    </Button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {mappingSelected && (
        <div className="space-y-5 rounded-2xl border-2 border-primary/20 bg-background p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Revisión humana del mapeo</p>
              <h3 className="mt-1 text-xl font-black">{mappingSelected.processName}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                El mapeo compara la actividad y su revisión lifecycle con el aviso público v{mappingSelected.mappingSuggestion.noticeVersion}. Puede aceptarse aunque conserve brechas, porque lo aceptado es la matriz y no una conclusión de cumplimiento.
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={closeMapping} aria-label="Cerrar revisión del mapeo">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {mappingFeedback && (
            <Feedback feedback={mappingFeedback} />
          )}

          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Scope principal</p>
            <p className="mt-2 font-black">{mappingSelected.mappingSuggestion.primaryScope || 'Sin correspondencia defendible'}</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {mappingSelected.mappingSuggestion.mappedScopes.map((scope) => (
              <MappingScope key={scope.scope} scope={scope.scope} status={scope.status} note={scope.note} />
            ))}
          </div>

          <div>
            <p className="text-sm font-black">Cobertura por dimensión</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(mappingSelected.mappingSuggestion.dimensions).map(([key, dimension]) => (
                <DimensionCard key={key} label={dimensionLabel(key)} status={dimension.status} note={dimension.note} />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              Brechas que permanecen abiertas
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-950/80 dark:text-amber-100/80">
              {mappingSelected.mappingSuggestion.unknowns.map((unknown) => <li key={unknown}>• {unknown}</li>)}
            </ul>
          </div>

          <div className="space-y-3">
            <Confirmation
              checked={mappingReviewed}
              onChange={setMappingReviewed}
              label="Revisé el scope principal, las dimensiones y las fuentes observadas para esta actividad."
            />
            <Confirmation
              checked={limitationsConfirmed}
              onChange={setLimitationsConfirmed}
              label={mappingSelected.mappingSuggestion.limitation}
            />
          </div>

          <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-3xl text-xs leading-5 text-muted-foreground">
              La evidencia quedará `accepted · verified`, pero su suficiencia para el control será `partial` mientras existan brechas. Base jurídica, retención, destinatarios, subencargados, transferencias y eliminación siguen requiriendo evidencia separada.
            </p>
            <Button
              type="button"
              onClick={acceptMapping}
              disabled={mappingLoading || !mappingReviewed || !limitationsConfirmed}
              className="gap-2"
            >
              {mappingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
              Aceptar mapeo con brechas
            </Button>
          </div>
        </div>
      )}

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

          {feedback && <Feedback feedback={feedback} />}

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

function MappingScope({ scope, status, note }: { scope: string; status: NoticeMappingCoverage; note: string }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <CoverageBadge status={status} />
      <p className="mt-3 font-black">{scope}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  )
}

function DimensionCard({ label, status, note }: { label: string; status: NoticeMappingCoverage; note: string }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">{label}</p>
        <CoverageBadge status={status} />
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  )
}

function CoverageBadge({ status }: { status: NoticeMappingCoverage }) {
  const label = status === 'covered'
    ? 'Cubierto'
    : status === 'partial'
      ? 'Parcial'
      : status === 'not_applicable'
        ? 'No aplica'
        : 'No cubierto'
  const className = status === 'covered'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : status === 'partial'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
      : 'border-border bg-muted/40 text-muted-foreground'
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${className}`}>{label}</span>
}

function Feedback({ feedback }: { feedback: { type: 'success' | 'error'; message: string } }) {
  return (
    <div className={`rounded-xl border p-3 text-sm ${feedback.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
      {feedback.message}
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
  if (status === 'accepted') return 'Aceptada con evidencia'
  if (status === 'rejected') return 'Rechazada'
  if (status === 'submitted') return 'Entregada · pendiente de revisión'
  if (status === 'under_review') return 'En revisión'
  if (status === 'changes_requested') return 'Cambios solicitados'
  if (status === 'cancelled') return 'Cancelada'
  return status ? 'Pendiente de entrega' : 'Sin solicitud'
}

function missionStatus(status: string) {
  if (status === 'completed') return 'completada'
  if (status === 'active') return 'en curso'
  if (status === 'in_review') return 'en revisión'
  if (status === 'blocked') return 'bloqueada'
  if (status === 'cancelled') return 'cancelada'
  if (status === 'draft') return 'borrador'
  return 'lista para iniciar'
}

function dimensionLabel(key: string) {
  return ({
    purpose: 'Finalidad',
    dataSubjects: 'Titulares',
    dataCategories: 'Categorías',
    recipients: 'Destinatarios',
    rights: 'Derechos',
    transfers: 'Transferencias',
    retention: 'Retención',
  } as Record<string, string>)[key] || key
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
