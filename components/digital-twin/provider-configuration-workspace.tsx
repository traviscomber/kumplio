'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, DatabaseBackup, Loader2, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProviderConfigurationWork } from '@/lib/compliance/digital-twin/provider-configuration'

type Props = { items: ProviderConfigurationWork[]; canManage: boolean }
type SourceType = 'management_api' | 'provider_dashboard' | 'provider_contract'
type Feedback = { type: 'success' | 'error'; message: string } | null

type Draft = {
  configurationAsOf: string
  sourceType: SourceType
  sourceLabel: string
  sourceReference: string
  sourceCapturedAt: string
  limitations: string
  reviewNote: string
  backupModeObserved: 'daily' | 'pitr'
  pitrState: 'enabled' | 'disabled'
  effectiveRecoveryWindowDays: string
  projectReference: string
  organizationReference: string
  dataRetentionMode: 'standard' | 'modified_abuse_monitoring' | 'zero_data_retention'
}

function freshDraft(item: ProviderConfigurationWork): Draft {
  const now = new Date(Date.now() - 60_000).toISOString().slice(0, 16)
  return {
    configurationAsOf: now,
    sourceType: 'provider_dashboard',
    sourceLabel: item.provider === 'Supabase' ? 'Supabase Dashboard · Backups' : 'OpenAI Platform · Data controls',
    sourceReference: '',
    sourceCapturedAt: now,
    limitations: item.provider === 'Supabase'
      ? 'La evidencia acredita la configuración observable del proyecto; no demuestra purga física de una copia concreta.'
      : 'La evidencia acredita el modo administrativo observado; no demuestra eliminación retroactiva de abuse monitoring logs.',
    reviewNote: '',
    backupModeObserved: 'daily',
    pitrState: 'disabled',
    effectiveRecoveryWindowDays: '7',
    projectReference: item.provider === 'Supabase' ? 'qhhybqfuenxojboymrsd' : '',
    organizationReference: '',
    dataRetentionMode: 'standard',
  }
}

export function ProviderConfigurationWorkspace({ items, canManage }: Props) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = items.find((item) => item.processId === selectedId) || null
  const [draft, setDraft] = useState<Draft | null>(null)
  const [working, setWorking] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [reviewDecision, setReviewDecision] = useState<'accepted' | 'changes_requested' | 'rejected'>('accepted')
  const [reviewComment, setReviewComment] = useState('')

  function open(item: ProviderConfigurationWork) {
    setSelectedId(item.processId)
    setDraft(freshDraft(item))
    setFeedback(null)
    setReviewDecision('accepted')
    setReviewComment('')
  }

  function close() {
    setSelectedId(null)
    setDraft(null)
    setFeedback(null)
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current)
  }

  async function submit() {
    if (!selected || !draft) return
    setWorking(true)
    setFeedback(null)
    try {
      const common = {
        action: 'submit' as const,
        requestKey: crypto.randomUUID(),
        configurationAsOf: new Date(draft.configurationAsOf).toISOString(),
        effectiveConfigurationObserved: true as const,
        sourceRefs: [{
          type: draft.sourceType,
          label: draft.sourceLabel,
          reference: draft.sourceReference,
          capturedAt: new Date(draft.sourceCapturedAt).toISOString(),
        }],
        limitations: draft.limitations.split('\n').map((value) => value.trim()).filter(Boolean),
        reviewNote: draft.reviewNote,
      }
      const providerPayload = selected.provider === 'Supabase'
        ? {
          configurationKind: 'supabase_backup_pitr' as const,
          projectReference: draft.projectReference,
          backupModeObserved: draft.backupModeObserved,
          pitrState: draft.pitrState,
          effectiveRecoveryWindowDays: Number(draft.effectiveRecoveryWindowDays),
        }
        : {
          configurationKind: 'openai_data_retention' as const,
          organizationReference: draft.organizationReference,
          projectReference: draft.projectReference,
          projectBindingObserved: true as const,
          dataRetentionMode: draft.dataRetentionMode,
        }
      const response = await fetch(`/api/processing-activities/${selected.processId}/provider-configuration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...common, ...providerPayload }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No fue posible entregar la configuración.')
      setFeedback({ type: 'success', message: payload.message || 'Configuración entregada.' })
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible entregar la configuración.' })
    } finally {
      setWorking(false)
    }
  }

  async function review() {
    if (!selected) return
    setWorking(true)
    setFeedback(null)
    try {
      const response = await fetch(`/api/processing-activities/${selected.processId}/provider-configuration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'review', decision: reviewDecision, comment: reviewComment }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No fue posible registrar la revisión.')
      setFeedback({ type: 'success', message: payload.message || 'Revisión registrada.' })
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible registrar la revisión.' })
    } finally {
      setWorking(false)
    }
  }

  return (
    <section className="mt-10 space-y-5 rounded-3xl border bg-card p-5 sm:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary"><DatabaseBackup className="h-5 w-5" /><p className="text-sm font-bold">Configuración tenant del proveedor</p></div>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Cierra el dato administrado, no la inferencia.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Sólo una fuente administrable o contractual puede acreditar PITR/backups de Supabase o el modo efectivo de Data Retention de OpenAI. La revisión humana sigue siendo obligatoria antes de promover el gate.</p>
        </div>
        <div className="rounded-2xl border px-4 py-3 text-center"><p className="text-xs text-muted-foreground">Verificadas</p><p className="text-2xl font-black">{items.filter((item) => item.tenantStatus === 'verified').length}/{items.length}</p></div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {items.map((item) => {
          const submitted = item.request?.status === 'submitted' || item.request?.status === 'under_review'
          const verified = item.tenantStatus === 'verified'
          return <article key={item.processId} className="rounded-2xl border bg-background/40 p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wide text-primary">{item.provider}</p><h3 className="mt-1 font-black leading-5">{item.processName}</h3></div>
              {verified ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Request: <strong>{item.request?.status || 'sin solicitud'}</strong></p>
            {item.submittedEvidence && <p className="mt-1 text-xs text-muted-foreground">Evidencia {item.submittedEvidence.integrityStatus} · {item.submittedEvidence.snapshotHash?.slice(0, 12) || 'sin hash'}…</p>}
            {canManage && !verified && item.request && (
              <Button className="mt-4 w-full" variant="outline" onClick={() => open(item)}>{submitted ? 'Revisar configuración' : 'Entregar configuración'}</Button>
            )}
          </article>
        })}
      </div>

      {selected && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border bg-background p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">{selected.provider}</p><h3 className="mt-1 text-xl font-black">{selected.processName}</h3></div><button onClick={close} aria-label="Cerrar"><X className="h-5 w-5" /></button></div>

            {selected.request?.status === 'submitted' || selected.request?.status === 'under_review' ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border bg-muted/30 p-4 text-sm">La evidencia ya fue entregada. Aceptarla también ejecutará la promoción tenant-specific, pero sólo si el RPC confirma que todas las condiciones administradas se cumplen.</div>
                <label className="block text-sm font-semibold">Decisión<select className={fieldClass} value={reviewDecision} onChange={(event) => setReviewDecision(event.target.value as typeof reviewDecision)}><option value="accepted">Aceptar y verificar</option><option value="changes_requested">Solicitar cambios</option><option value="rejected">Rechazar</option></select></label>
                <label className="block text-sm font-semibold">Comentario de revisión<textarea className={`${fieldClass} min-h-28`} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} /></label>
                <Button onClick={review} disabled={working || reviewComment.trim().length < 20}>{working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Registrar revisión</Button>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Observado el"><input className={fieldClass} type="datetime-local" value={draft.configurationAsOf} onChange={(event) => set('configurationAsOf', event.target.value)} /></Field>
                  <Field label="Tipo de fuente"><select className={fieldClass} value={draft.sourceType} onChange={(event) => set('sourceType', event.target.value as SourceType)}><option value="management_api">Management API</option><option value="provider_dashboard">Dashboard proveedor</option><option value="provider_contract">Contrato / anexo</option></select></Field>
                  <Field label="Nombre de la fuente"><input className={fieldClass} value={draft.sourceLabel} onChange={(event) => set('sourceLabel', event.target.value)} /></Field>
                  <Field label="Capturada el"><input className={fieldClass} type="datetime-local" value={draft.sourceCapturedAt} onChange={(event) => set('sourceCapturedAt', event.target.value)} /></Field>
                  <Field label="Referencia administrable"><input className={fieldClass} value={draft.sourceReference} onChange={(event) => set('sourceReference', event.target.value)} placeholder="URL, ID de captura, contrato o referencia verificable" /></Field>
                  <Field label="Proyecto"><input className={fieldClass} value={draft.projectReference} onChange={(event) => set('projectReference', event.target.value)} /></Field>
                </div>

                {selected.provider === 'Supabase' ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="PITR"><select className={fieldClass} value={draft.pitrState} onChange={(event) => { const value = event.target.value as Draft['pitrState']; set('pitrState', value); set('backupModeObserved', value === 'enabled' ? 'pitr' : 'daily') }}><option value="enabled">Habilitado</option><option value="disabled">Deshabilitado</option></select></Field>
                    <Field label="Modo backup"><select className={fieldClass} value={draft.backupModeObserved} onChange={(event) => set('backupModeObserved', event.target.value as Draft['backupModeObserved'])}><option value="daily">Daily backups</option><option value="pitr">PITR</option></select></Field>
                    <Field label="Ventana efectiva (días)"><input className={fieldClass} type="number" min="0" max="90" value={draft.effectiveRecoveryWindowDays} onChange={(event) => set('effectiveRecoveryWindowDays', event.target.value)} /></Field>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Organización OpenAI"><input className={fieldClass} value={draft.organizationReference} onChange={(event) => set('organizationReference', event.target.value)} /></Field>
                    <Field label="Data Retention"><select className={fieldClass} value={draft.dataRetentionMode} onChange={(event) => set('dataRetentionMode', event.target.value as Draft['dataRetentionMode'])}><option value="standard">Standard</option><option value="modified_abuse_monitoring">Modified Abuse Monitoring</option><option value="zero_data_retention">Zero Data Retention</option></select></Field>
                  </div>
                )}

                <Field label="Limitaciones preservadas"><textarea className={`${fieldClass} min-h-24`} value={draft.limitations} onChange={(event) => set('limitations', event.target.value)} /></Field>
                <Field label="Nota de revisión"><textarea className={`${fieldClass} min-h-24`} value={draft.reviewNote} onChange={(event) => set('reviewNote', event.target.value)} /></Field>
                <Button onClick={submit} disabled={working || draft.sourceReference.trim().length < 3 || draft.reviewNote.trim().length < 30}>{working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseBackup className="mr-2 h-4 w-4" />}Entregar para revisión</Button>
              </div>
            )}

            {feedback && <div className={`mt-5 rounded-xl border p-3 text-sm ${feedback.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-destructive/30 bg-destructive/10'}`}>{feedback.message}</div>}
          </div>
        </div>
      )}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold">{label}{children}</label> }
const fieldClass = 'mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm'
