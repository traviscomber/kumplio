'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Loader2,
  RefreshCw,
  Scale,
  ShieldAlert,
  TimerReset,
  UsersRound,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  LifecycleDimensionStatus,
  ProcessingInventoryActivity,
} from '@/lib/compliance/digital-twin/processing-inventory'

type Props = {
  activities: ProcessingInventoryActivity[]
  canManage: boolean
}

type Decision = 'approved' | 'changes_requested' | 'rejected'
type SourceType = 'document' | 'system' | 'code' | 'code_and_database' | 'interview' | 'contract' | 'other'

const statusOptions: Array<{ value: LifecycleDimensionStatus; label: string }> = [
  { value: 'validated', label: 'Validada' },
  { value: 'needs_changes', label: 'Requiere cambios' },
  { value: 'pending_evidence', label: 'Falta evidencia' },
  { value: 'not_applicable', label: 'No aplica' },
]

export function ProcessingLifecycleReviewWorkspace({ activities, canManage }: Props) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID())
  const [decision, setDecision] = useState<Decision>('changes_requested')
  const [basisStatus, setBasisStatus] = useState<LifecycleDimensionStatus>('pending_evidence')
  const [basisType, setBasisType] = useState('')
  const [basisSummary, setBasisSummary] = useState('')
  const [retentionStatus, setRetentionStatus] = useState<LifecycleDimensionStatus>('pending_evidence')
  const [retentionRule, setRetentionRule] = useState('')
  const [retentionTrigger, setRetentionTrigger] = useState('')
  const [retentionPeriod, setRetentionPeriod] = useState('')
  const [recipientsStatus, setRecipientsStatus] = useState<LifecycleDimensionStatus>('pending_evidence')
  const [recipients, setRecipients] = useState('')
  const [subprocessorsStatus, setSubprocessorsStatus] = useState<LifecycleDimensionStatus>('pending_evidence')
  const [subprocessors, setSubprocessors] = useState('')
  const [transfersStatus, setTransfersStatus] = useState<LifecycleDimensionStatus>('pending_evidence')
  const [transfers, setTransfers] = useState('')
  const [sourceRefs, setSourceRefs] = useState('')
  const [unknowns, setUnknowns] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [scopeConfirmed, setScopeConfirmed] = useState(false)
  const [legalDecisionConfirmed, setLegalDecisionConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const selected = useMemo(
    () => activities.find((activity) => activity.id === selectedId) || null,
    [activities, selectedId],
  )
  const reviewed = activities.filter((activity) => activity.lifecycleReview).length
  const approved = activities.filter((activity) => activity.lifecycleReview?.decision === 'approved').length
  const changes = activities.filter((activity) => activity.lifecycleReview?.decision === 'changes_requested').length

  function openReview(activity: ProcessingInventoryActivity) {
    const lifecycle = activity.lifecycleReview
    setSelectedId(activity.id)
    setRequestKey(crypto.randomUUID())
    setDecision(lifecycle?.decision || 'changes_requested')
    setBasisStatus(lifecycle?.statuses.basis || 'pending_evidence')
    setBasisType(lifecycle?.basisType || '')
    setBasisSummary(lifecycle?.basisSummary || activity.proposedLegalBasis || '')
    setRetentionStatus(lifecycle?.statuses.retention || 'pending_evidence')
    setRetentionRule(lifecycle?.retentionRule || activity.dataset?.retentionRule || '')
    setRetentionTrigger(lifecycle?.retentionTrigger || '')
    setRetentionPeriod(lifecycle?.retentionPeriod || '')
    setRecipientsStatus(lifecycle?.statuses.recipients || 'pending_evidence')
    setRecipients(formatLines(lifecycle?.recipients, ['name', 'role', 'country', 'evidenceStatus']))
    setSubprocessorsStatus(lifecycle?.statuses.subprocessors || 'pending_evidence')
    setSubprocessors(
      lifecycle?.subprocessors.length
        ? formatLines(lifecycle.subprocessors, ['name', 'service', 'country', 'contractStatus'])
        : activity.vendor
          ? `${activity.vendor.name} | ${activity.vendor.serviceCategory || 'Proveedor técnico'} | ${activity.vendor.country || ''} | Pendiente de validar contrato y subencargados`
          : '',
    )
    setTransfersStatus(lifecycle?.statuses.transfers || 'pending_evidence')
    setTransfers(
      lifecycle?.transfers.length
        ? formatLines(lifecycle.transfers, ['destination', 'mechanism', 'safeguardStatus', 'dataScope'])
        : activity.dataset?.crossBorderTransfer || activity.vendor?.crossBorderTransfer
          ? `${activity.vendor?.country || activity.asset?.hostingCountry || 'Destino pendiente'} | Pendiente de validar | Pendiente de validar salvaguardas | ${activity.dataset?.name || 'Datos de la actividad'}`
          : '',
    )
    setSourceRefs(
      lifecycle?.sourceRefs.length
        ? formatLines(lifecycle.sourceRefs, ['label', 'reference', 'type'])
        : activity.source.label && activity.source.reference
          ? `${activity.source.label} | ${activity.source.reference} | ${normalizeSourceType(activity.source.type)}`
          : '',
    )
    setUnknowns((lifecycle?.unknowns.length ? lifecycle.unknowns : activity.unknowns).join('\n'))
    setReviewNote(lifecycle?.reviewNote || '')
    setScopeConfirmed(false)
    setLegalDecisionConfirmed(false)
    setFeedback(null)
  }

  function closeReview() {
    setSelectedId(null)
    setFeedback(null)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    setLoading(true)
    setFeedback(null)

    try {
      const response = await fetch(`/api/processing-activities/${selected.id}/lifecycle-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestKey,
          decision,
          basis: { status: basisStatus, type: basisType || null, summary: basisSummary || null },
          retention: {
            status: retentionStatus,
            rule: retentionRule || null,
            trigger: retentionTrigger || null,
            period: retentionPeriod || null,
          },
          recipientsReview: { status: recipientsStatus },
          subprocessorsReview: { status: subprocessorsStatus },
          transfersReview: { status: transfersStatus },
          recipients: parseLines(recipients, ['name', 'role', 'country', 'evidenceStatus'], ['Pendiente de clasificar']),
          subprocessors: parseLines(subprocessors, ['name', 'service', 'country', 'contractStatus'], ['Pendiente de clasificar']),
          transfers: parseLines(transfers, ['destination', 'mechanism', 'safeguardStatus', 'dataScope']),
          sourceRefs: parseSources(sourceRefs),
          unknowns: splitList(unknowns),
          reviewNote,
          scopeConfirmed,
          legalDecisionConfirmed,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No fue posible guardar la revisión.')

      setFeedback({ type: 'success', message: result.message || 'Revisión registrada.' })
      setRequestKey(crypto.randomUUID())
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible guardar la revisión.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-10 space-y-6 rounded-3xl border bg-card p-5 sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Scale className="h-5 w-5" />
            <p className="text-sm font-bold">Base y ciclo de vida</p>
          </div>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Cinco decisiones que no deben mezclarse.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Cada actividad separa base jurídica, retención, destinatarios, subencargados y transferencias. Una revisión puede solicitar cambios sin borrar el inventario inicial ni elevar artificialmente la confianza.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <LifecycleMetric label="Revisadas" value={`${reviewed}/${activities.length}`} />
          <LifecycleMetric label="Aprobadas" value={approved} />
          <LifecycleMetric label="Con cambios" value={changes} />
        </div>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const review = activity.lifecycleReview
          return (
            <article key={activity.id} className="rounded-2xl border bg-background/40 p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black">{activity.name}</h3>
                    <DecisionBadge decision={review?.decision || null} />
                    {review && <span className="rounded-full border px-2 py-0.5 text-xs font-semibold">v{review.version}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge label="Base" status={review?.statuses.basis} />
                    <StatusBadge label="Retención" status={review?.statuses.retention} />
                    <StatusBadge label="Destinatarios" status={review?.statuses.recipients} />
                    <StatusBadge label="Subencargados" status={review?.statuses.subprocessors} />
                    <StatusBadge label="Transferencias" status={review?.statuses.transfers} />
                  </div>
                  {review?.reviewNote && <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">{review.reviewNote}</p>}
                  {review?.evidence?.integrityHash && (
                    <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">SHA-256 {review.evidence.integrityHash}</p>
                  )}
                </div>
                {canManage && (
                  <Button type="button" variant="outline" onClick={() => openReview(activity)} className="gap-2">
                    {review ? <RefreshCw className="h-4 w-4" /> : <FileSearch className="h-4 w-4" />}
                    {review ? 'Nueva versión' : 'Revisar ciclo de vida'}
                  </Button>
                )}
              </div>

              {review?.unknowns.length ? (
                <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                    {review.unknowns.length} asuntos abiertos
                  </div>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
                    {review.unknowns.slice(0, 4).map((unknown) => <li key={unknown}>• {unknown}</li>)}
                    {review.unknowns.length > 4 && <li>• y {review.unknowns.length - 4} adicionales</li>}
                  </ul>
                </div>
              ) : review ? (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  La última versión no conserva desconocidos abiertos.
                </div>
              ) : null}
            </article>
          )
        })}
      </div>

      {selected && canManage && (
        <form onSubmit={submit} className="space-y-6 rounded-2xl border-2 border-primary/20 bg-background p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Revisión versionada</p>
              <h3 className="mt-1 text-xl font-black">{selected.name}</h3>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={closeReview} aria-label="Cerrar revisión">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {feedback && (
            <div className={`rounded-xl border p-3 text-sm ${feedback.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
              {feedback.message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <ReviewSelect label="Conclusión" value={decision} onChange={(value) => setDecision(value as Decision)} options={[
              { value: 'changes_requested', label: 'Solicitar cambios' },
              { value: 'approved', label: 'Aprobar alcance revisado' },
              { value: 'rejected', label: 'Rechazar revisión' },
            ]} />
            <ReviewSelect label="Base jurídica" value={basisStatus} onChange={(value) => setBasisStatus(value as LifecycleDimensionStatus)} options={statusOptions} />
            <ReviewField label="Tipo de base" value={basisType} onChange={setBasisType} placeholder="Ej.: medidas precontractuales, contrato, consentimiento" />
            <ReviewField label="Fundamento revisado" value={basisSummary} onChange={setBasisSummary} placeholder="Qué fuente y alcance sostienen la conclusión" />

            <ReviewSelect label="Retención" value={retentionStatus} onChange={(value) => setRetentionStatus(value as LifecycleDimensionStatus)} options={statusOptions} />
            <ReviewField label="Regla de retención" value={retentionRule} onChange={setRetentionRule} placeholder="Regla aprobada o hipótesis pendiente" />
            <ReviewField label="Inicio del cómputo" value={retentionTrigger} onChange={setRetentionTrigger} placeholder="Ej.: cierre del caso o última interacción" />
            <ReviewField label="Período" value={retentionPeriod} onChange={setRetentionPeriod} placeholder="Ej.: 24 meses; pendiente de aprobación" />

            <ReviewSelect label="Destinatarios" value={recipientsStatus} onChange={(value) => setRecipientsStatus(value as LifecycleDimensionStatus)} options={statusOptions} />
            <ReviewSelect label="Subencargados" value={subprocessorsStatus} onChange={(value) => setSubprocessorsStatus(value as LifecycleDimensionStatus)} options={statusOptions} />
            <ReviewArea label="Destinatarios" value={recipients} onChange={setRecipients} placeholder="Nombre | rol | país | estado de evidencia — uno por línea" />
            <ReviewArea label="Subencargados" value={subprocessors} onChange={setSubprocessors} placeholder="Nombre | servicio | país | estado contractual — uno por línea" />

            <ReviewSelect label="Transferencias" value={transfersStatus} onChange={(value) => setTransfersStatus(value as LifecycleDimensionStatus)} options={statusOptions} />
            <ReviewArea label="Transferencias" value={transfers} onChange={setTransfers} placeholder="Destino | mecanismo | salvaguardas | alcance de datos — uno por línea" />

            <ReviewArea label="Fuentes revisadas" value={sourceRefs} onChange={setSourceRefs} placeholder="Etiqueta | referencia | tipo — una por línea" wide />
            <ReviewArea label="Asuntos abiertos" value={unknowns} onChange={setUnknowns} placeholder="Un desconocido por línea" wide />
            <ReviewArea label="Justificación humana" value={reviewNote} onChange={setReviewNote} placeholder="Qué se verificó, qué conclusión se adopta y qué límites permanecen" wide />
          </div>

          <div className="space-y-3">
            <Confirmation checked={scopeConfirmed} onChange={setScopeConfirmed} label="Revisé las fuentes y confirmo que cada estado refleja solo el alcance respaldado." />
            <Confirmation checked={legalDecisionConfirmed} onChange={setLegalDecisionConfirmed} label="Entiendo que aprobar una dimensión requiere evidencia suficiente y que los asuntos pendientes deben permanecer abiertos." />
          </div>

          <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">Se guardará una nueva versión con evidencia, SHA-256 y relación con el expediente. La versión anterior no se sobrescribe.</p>
            <Button type="submit" disabled={loading || !scopeConfirmed || !legalDecisionConfirmed} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
              Guardar revisión
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}

function StatusBadge({ label, status }: { label: string; status?: LifecycleDimensionStatus }) {
  const value = status || 'pending_evidence'
  const styles = value === 'validated'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : value === 'not_applicable'
      ? 'border-slate-400/30 bg-slate-400/10 text-muted-foreground'
      : value === 'needs_changes'
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}>{label}: {statusLabel(value)}</span>
}

function DecisionBadge({ decision }: { decision: Decision | null }) {
  const label = decision === 'approved' ? 'Aprobada' : decision === 'rejected' ? 'Rechazada' : decision === 'changes_requested' ? 'Cambios requeridos' : 'Sin revisión'
  const styles = decision === 'approved'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : decision === 'rejected'
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}>{label}</span>
}

function LifecycleMetric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-xl border bg-background px-3 py-2"><p className="text-lg font-black">{value}</p><p className="text-muted-foreground">{label}</p></div>
}

function ReviewSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="space-y-2 text-sm font-semibold">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

function ReviewField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="space-y-2 text-sm font-semibold"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} placeholder={placeholder} /></label>
}

function ReviewArea({ label, value, onChange, placeholder, wide = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; wide?: boolean }) {
  return <label className={`space-y-2 text-sm font-semibold ${wide ? 'md:col-span-2' : ''}`}><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className={inputClass} placeholder={placeholder} /></label>
}

function Confirmation({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="flex items-start gap-3 rounded-xl border bg-background px-4 py-3 text-sm"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4" /><span className="leading-6">{label}</span></label>
}

function parseLines(value: string, keys: string[], defaults: string[] = []) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = line.split('|').map((part) => part.trim())
    return Object.fromEntries(keys.map((key, index) => [key, parts[index] || defaults[index - 1] || null]))
  })
}

function parseSources(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [label, reference, rawType] = line.split('|').map((part) => part.trim())
    return { label, reference, type: normalizeSourceType(rawType) as SourceType }
  })
}

function formatLines(values: Array<Record<string, string | null>> | undefined, keys: string[]) {
  return (values || []).map((value) => keys.map((key) => value[key] || '').join(' | ')).join('\n')
}

function splitList(value: string) {
  return [...new Set(value.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean))]
}

function normalizeSourceType(value: string | null | undefined): SourceType {
  return value === 'document' || value === 'system' || value === 'code' || value === 'code_and_database' || value === 'interview' || value === 'contract'
    ? value
    : 'other'
}

function statusLabel(status: LifecycleDimensionStatus) {
  return status === 'validated' ? 'validada' : status === 'needs_changes' ? 'requiere cambios' : status === 'not_applicable' ? 'no aplica' : 'falta evidencia'
}

const inputClass = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15'
