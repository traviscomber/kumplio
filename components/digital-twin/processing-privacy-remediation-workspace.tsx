'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileCheck2, Loader2, ShieldCheck, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  ProcessingPrivacyRemediation,
  ProcessingPrivacyRemediationSummary,
} from '@/lib/compliance/digital-twin/privacy-remediation'

type Props = {
  actions: ProcessingPrivacyRemediation[]
  summary: ProcessingPrivacyRemediationSummary
  canManage: boolean
}

type Feedback = { type: 'success' | 'error'; message: string } | null

type DeletionDraft = {
  method: 'deletion' | 'anonymization'
  executedAt: string
  provider: string
  assetOrDataset: string
  scope: string
  executor: string
  result: string
  backupPurgaProgramada: string
  backupPurgaConfirmada: string
  reviewNote: string
}

function newDeletionDraft(): DeletionDraft {
  return {
    method: 'deletion',
    executedAt: new Date(Date.now() - 60_000).toISOString().slice(0, 16),
    provider: '',
    assetOrDataset: '',
    scope: '',
    executor: '',
    result: '',
    backupPurgaProgramada: '',
    backupPurgaConfirmada: '',
    reviewNote: '',
  }
}

export function ProcessingPrivacyRemediationWorkspace({ actions, summary, canManage }: Props) {
  const router = useRouter()
  const [panel, setPanel] = useState<{ kind: 'plan' | 'mapping' | 'deletion'; processId: string } | null>(null)

  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID())
  const [scopeConfirmed, setScopeConfirmed] = useState(false)
  const [ownerConfirmed, setOwnerConfirmed] = useState(false)
  const [planLoading, setPlanLoading] = useState(false)
  const [planFeedback, setPlanFeedback] = useState<Feedback>(null)

  const [mappingKey, setMappingKey] = useState(() => crypto.randomUUID())
  const [mappingReviewed, setMappingReviewed] = useState(false)
  const [limitationsConfirmed, setLimitationsConfirmed] = useState(false)
  const [mappingLoading, setMappingLoading] = useState(false)
  const [mappingFeedback, setMappingFeedback] = useState<Feedback>(null)

  const [deletionKey, setDeletionKey] = useState(() => crypto.randomUUID())
  const [deletionDraft, setDeletionDraft] = useState<DeletionDraft>(() => newDeletionDraft())
  const [deletionReviewed, setDeletionReviewed] = useState(false)
  const [noPersonalDataConfirmed, setNoPersonalDataConfirmed] = useState(false)
  const [deletionLoading, setDeletionLoading] = useState(false)
  const [deletionFeedback, setDeletionFeedback] = useState<Feedback>(null)

  const selected = panel ? actions.find((item) => item.processId === panel.processId) || null : null
  const deletionReady = deletionReviewed
    && noPersonalDataConfirmed
    && deletionDraft.provider.trim().length >= 2
    && deletionDraft.assetOrDataset.trim().length >= 3
    && deletionDraft.scope.trim().length >= 20
    && deletionDraft.executor.trim().length >= 3
    && deletionDraft.result.trim().length >= 20
    && deletionDraft.reviewNote.trim().length >= 30
    && deletionDraft.backupPurgaProgramada.trim().length >= 3
    && deletionDraft.backupPurgaConfirmada.trim().length >= 3
    && deletionDraft.backupPurgaProgramada.trim() !== deletionDraft.backupPurgaConfirmada.trim()
    && Boolean(deletionDraft.executedAt)

  function open(kind: 'plan' | 'mapping' | 'deletion', action: ProcessingPrivacyRemediation) {
    setPanel({ kind, processId: action.processId })
    if (kind === 'plan') {
      setRequestKey(crypto.randomUUID())
      setScopeConfirmed(false)
      setOwnerConfirmed(false)
      setPlanFeedback(null)
    }
    if (kind === 'mapping') {
      setMappingKey(crypto.randomUUID())
      setMappingReviewed(false)
      setLimitationsConfirmed(false)
      setMappingFeedback(null)
    }
    if (kind === 'deletion') {
      setDeletionKey(crypto.randomUUID())
      setDeletionDraft(newDeletionDraft())
      setDeletionReviewed(false)
      setNoPersonalDataConfirmed(false)
      setDeletionFeedback(null)
    }
  }

  async function createPlan() {
    if (!selected) return
    setPlanLoading(true)
    setPlanFeedback(null)
    try {
      const response = await fetch(`/api/processing-activities/${selected.processId}/privacy-remediation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestKey, scopeConfirmed, ownerAndDatesConfirmed: ownerConfirmed }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No fue posible crear el plan.')
      setPlanFeedback({ type: 'success', message: result.message || 'Plan creado.' })
      router.refresh()
    } catch (error) {
      setPlanFeedback({ type: 'error', message: message(error) })
    } finally {
      setPlanLoading(false)
    }
  }

  async function acceptMapping() {
    if (!selected) return
    setMappingLoading(true)
    setMappingFeedback(null)
    try {
      const response = await fetch(`/api/processing-activities/${selected.processId}/notice-mapping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestKey: mappingKey, mappingReviewed, limitationsConfirmed }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No fue posible aceptar el mapeo.')
      setMappingFeedback({ type: 'success', message: result.message || 'Mapeo aceptado.' })
      router.refresh()
    } catch (error) {
      setMappingFeedback({ type: 'error', message: message(error) })
    } finally {
      setMappingLoading(false)
    }
  }

  async function acceptDeletion() {
    if (!selected) return
    setDeletionLoading(true)
    setDeletionFeedback(null)
    try {
      const sourceRefs = [
        { type: 'backup_purga_programada', label: 'Purga programada', reference: deletionDraft.backupPurgaProgramada },
        { type: 'backup_purga_confirmada', label: 'Purga confirmada', reference: deletionDraft.backupPurgaConfirmada },
      ]
      const response = await fetch(`/api/processing-activities/${selected.processId}/deletion-evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestKey: deletionKey,
          ...deletionDraft,
          executedAt: new Date(deletionDraft.executedAt).toISOString(),
          sourceRefs,
          deletionReviewed,
          noPersonalDataConfirmed,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No fue posible aceptar la prueba.')
      setDeletionFeedback({ type: 'success', message: result.message || 'Prueba aceptada.' })
      router.refresh()
    } catch (error) {
      setDeletionFeedback({ type: 'error', message: message(error) })
    } finally {
      setDeletionLoading(false)
    }
  }

  function updateDeletion<K extends keyof DeletionDraft>(key: K, value: DeletionDraft[K]) {
    setDeletionDraft((draft) => ({ ...draft, [key]: value }))
  }

  return (
    <section className="mt-10 space-y-6 rounded-3xl border bg-card p-5 sm:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /><p className="text-sm font-bold">Aviso, eliminación y terceros</p></div>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Cada capa necesita su propia evidencia.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Kumplio separa mecanismo controlado, eliminación en el almacén primario, assurance del proveedor, configuración tenant y eliminación final. Una política pública o una fila eliminada no cierran por sí solas las capas de backup o proveedor.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-3 xl:grid-cols-6">
          <Metric label="Mapeos" value={`${summary.noticeRequestsAccepted}/${summary.activities}`} />
          <Metric label="Mecanismo" value={`${summary.controlledMechanismsValidated}/${summary.activities}`} />
          <Metric label="Primario" value={`${summary.primaryDeletionsDemonstrated}/${summary.activities}`} />
          <Metric label="Assurance" value={`${summary.providerAssuranceReviewed}/${summary.activities}`} />
          <Metric label="Tenant proveedor" value={`${summary.providerTenantConfigurationsVerified}/${summary.activities}`} />
          <Metric label="Final" value={`${summary.deletionsDemonstrated}/${summary.activities}`} />
        </div>
      </div>

      <div className="space-y-4">
        {actions.map((action) => {
          const mappingAccepted = action.noticeRequest?.status === 'accepted' && Boolean(action.noticeRequest.submittedEvidenceId)
          const mechanismValidated = action.controlledDeletion.status === 'passed_controlled_test' && action.controlledDeletion.reviewStatus === 'validated_controlled'
          const primaryDemonstrated = action.primaryDeletion.status === 'demonstrated_controlled_primary' && Boolean(action.primaryDeletion.evidenceId)
          const assuranceReviewed = ['partial_policy_verified', 'tenant_configuration_verified'].includes(action.providerAssurance.status) && Boolean(action.providerAssurance.evidenceId)
          const tenantVerified = assuranceReviewed && action.providerAssurance.tenantConfigurationStatus === 'verified'
          const deletionDemonstrated = demonstrated(action)

          return (
            <article key={action.processId} className="rounded-2xl border bg-background/40 p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black">{action.processName}</h3>
                    <StateBadge ok={primaryDemonstrated} label={primaryDemonstrated ? 'Primario demostrado' : 'Acción requerida'} />
                    <span className="rounded-full border px-2.5 py-1 text-xs font-semibold">Owner: {action.ownerLabel || 'Sin responsable'}</span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <EvidenceCard
                      icon={<ClipboardCheck className="h-4 w-4" />}
                      title="Mapeo y mecanismo"
                      status={mappingAccepted && mechanismValidated ? 'Mapeo + mecanismo validados' : 'Cierre técnico pendiente'}
                      detail={action.mapping.snapshotHash ? shortHash(action.mapping.snapshotHash) : null}
                      ok={mappingAccepted && mechanismValidated}
                    />
                    <EvidenceCard
                      icon={<Trash2 className="h-4 w-4" />}
                      title="Almacén primario"
                      status={primaryDemonstrated ? 'Eliminación primaria demostrada' : 'Prueba primaria pendiente'}
                      detail={primaryDemonstrated ? `${formatDateTime(action.primaryDeletion.executedAt)} · ${shortHash(action.primaryDeletion.snapshotHash || '')}` : null}
                      ok={primaryDemonstrated}
                    />
                    <EvidenceCard
                      icon={<FileCheck2 className="h-4 w-4" />}
                      title="Assurance proveedor"
                      status={assuranceReviewed ? providerAssuranceLabel(action) : 'Política/configuración no revisada'}
                      detail={assuranceReviewed ? shortHash(action.providerAssurance.snapshotHash || '') : null}
                      ok={assuranceReviewed}
                    />
                    <EvidenceCard
                      icon={<ShieldCheck className="h-4 w-4" />}
                      title="Tenant + cierre final"
                      status={deletionDemonstrated ? 'Eliminación final demostrada' : tenantVerified ? 'Tenant verificado · falta prueba final' : tenantBlockerLabel(action)}
                      detail={deletionDemonstrated ? shortHash(action.deletion.snapshotHash || '') : tenantBlockerDetail(action)}
                      ok={deletionDemonstrated}
                    />
                  </div>

                  {!tenantVerified && assuranceReviewed && (
                    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950/90 dark:text-amber-100/90">
                      <div className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" />Bloqueo externo identificado</div>
                      <p className="mt-1 leading-6">{tenantBlockerDetail(action)} La evidencia pública del proveedor queda preservada, pero no se convierte en una purga tenant-specific.</p>
                    </div>
                  )}
                </div>

                {canManage && (
                  <div className="flex shrink-0 flex-col gap-2">
                    {!action.mission && <Button variant="outline" onClick={() => open('plan', action)}>Crear plan</Button>}
                    {action.mission && !mappingAccepted && action.mappingSuggestion.ready && <Button variant="outline" onClick={() => open('mapping', action)}>Revisar mapeo</Button>}
                    {action.deletionRequest && tenantVerified && !deletionDemonstrated && <Button variant="outline" onClick={() => open('deletion', action)}><Trash2 className="mr-2 h-4 w-4" />Registrar prueba final</Button>}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {selected && panel?.kind === 'deletion' && (
        <Panel title="Prueba final de eliminación o anonimización" subtitle={selected.processName} onClose={() => setPanel(null)} feedback={deletionFeedback}>
          <div className="rounded-xl border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">Este formulario sólo se habilita cuando la configuración tenant del proveedor está verificada. La prueba final debe enlazar ejecución primaria y evidencia aplicable de backup/propagación.</div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Método"><select className={fieldClass} value={deletionDraft.method} onChange={(event) => updateDeletion('method', event.target.value as DeletionDraft['method'])}><option value="deletion">Eliminación</option><option value="anonymization">Anonimización</option></select></Field>
            <Field label="Fecha y hora"><input className={fieldClass} type="datetime-local" value={deletionDraft.executedAt} onChange={(event) => updateDeletion('executedAt', event.target.value)} /></Field>
            <Field label="Proveedor / sistema"><input className={fieldClass} value={deletionDraft.provider} onChange={(event) => updateDeletion('provider', event.target.value)} /></Field>
            <Field label="Activo o dataset"><input className={fieldClass} value={deletionDraft.assetOrDataset} onChange={(event) => updateDeletion('assetOrDataset', event.target.value)} /></Field>
            <Field label="Responsable"><input className={fieldClass} value={deletionDraft.executor} onChange={(event) => updateDeletion('executor', event.target.value)} /></Field>
            <Field label="Purga programada"><input className={fieldClass} value={deletionDraft.backupPurgaProgramada} onChange={(event) => updateDeletion('backupPurgaProgramada', event.target.value)} /></Field>
            <Field label="Purga confirmada"><input className={fieldClass} value={deletionDraft.backupPurgaConfirmada} onChange={(event) => updateDeletion('backupPurgaConfirmada', event.target.value)} /></Field>
          </div>
          <Field label="Alcance"><textarea className={`${fieldClass} min-h-24`} value={deletionDraft.scope} onChange={(event) => updateDeletion('scope', event.target.value)} /></Field>
          <Field label="Resultado"><textarea className={`${fieldClass} min-h-24`} value={deletionDraft.result} onChange={(event) => updateDeletion('result', event.target.value)} /></Field>
          <Field label="Nota de revisión"><textarea className={`${fieldClass} min-h-24`} value={deletionDraft.reviewNote} onChange={(event) => updateDeletion('reviewNote', event.target.value)} /></Field>
          <Confirmation checked={deletionReviewed} onChange={setDeletionReviewed} label="Revisé ejecución, alcance, resultado y ambas referencias de purga." />
          <Confirmation checked={noPersonalDataConfirmed} onChange={setNoPersonalDataConfirmed} label="La evidencia no contiene datos personales innecesarios." />
          <div className="flex justify-end"><Button onClick={acceptDeletion} disabled={!deletionReady || deletionLoading}>{deletionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Aceptar prueba final</Button></div>
        </Panel>
      )}

      {selected && panel?.kind === 'mapping' && (
        <Panel title="Revisión humana del mapeo" subtitle={selected.processName} onClose={() => setPanel(null)} feedback={mappingFeedback}>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"><div className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" />Brechas preservadas</div><ul className="mt-2 space-y-1">{selected.mappingSuggestion.unknowns.map((item) => <li key={item}>• {item}</li>)}</ul></div>
          <Confirmation checked={mappingReviewed} onChange={setMappingReviewed} label="Revisé el mapeo, sus dimensiones y fuentes." />
          <Confirmation checked={limitationsConfirmed} onChange={setLimitationsConfirmed} label={selected.mappingSuggestion.limitation} />
          <div className="flex justify-end"><Button onClick={acceptMapping} disabled={!mappingReviewed || !limitationsConfirmed || mappingLoading}>{mappingLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}Aceptar mapeo con brechas</Button></div>
        </Panel>
      )}

      {selected && panel?.kind === 'plan' && (
        <Panel title="Plan operacional" subtitle={selected.processName} onClose={() => setPanel(null)} feedback={planFeedback}>
          <Confirmation checked={scopeConfirmed} onChange={setScopeConfirmed} label="Vincular el aviso general no demuestra que cubra esta actividad." />
          <Confirmation checked={ownerConfirmed} onChange={setOwnerConfirmed} label={`Confirmo a ${selected.ownerLabel || 'la persona responsable'} como owner y acepto los vencimientos.`} />
          <div className="flex justify-end"><Button onClick={createPlan} disabled={!scopeConfirmed || !ownerConfirmed || planLoading}>{planLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Crear misión y solicitudes</Button></div>
        </Panel>
      )}
    </section>
  )
}

const fieldClass = 'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary'

function Panel({ title, subtitle, onClose, feedback, children }: { title: string; subtitle: string; onClose: () => void; feedback: Feedback; children: React.ReactNode }) {
  return <div className="space-y-4 rounded-2xl border-2 border-primary/20 bg-background p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{title}</p><h3 className="mt-1 text-xl font-black">{subtitle}</h3></div><Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button></div>{feedback && <div className={`rounded-xl border p-3 text-sm ${feedback.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-emerald-500/30 bg-emerald-500/10'}`}>{feedback.message}</div>}{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2 text-sm font-semibold"><span>{label}</span>{children}</label> }
function Confirmation({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) { return <label className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"><input className="mt-1 h-4 w-4" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label> }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border bg-background px-3 py-2"><p className="text-lg font-black">{value}</p><p className="text-muted-foreground">{label}</p></div> }
function StateBadge({ ok, label }: { ok: boolean; label: string }) { return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' : 'border-amber-500/30 bg-amber-500/10 text-amber-700'}`}>{ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}{label}</span> }
function EvidenceCard({ icon, title, status, detail, ok }: { icon: React.ReactNode; title: string; status: string; detail: string | null; ok: boolean }) { return <div className={`rounded-xl border p-3 ${ok ? 'border-emerald-500/25 bg-emerald-500/5' : 'bg-background'}`}><div className="flex items-center gap-2 text-sm font-bold">{icon}{title}</div><p className="mt-2 text-xs font-semibold">{status}</p>{detail && <p className="mt-1 break-all text-[11px] leading-5 text-muted-foreground">{detail}</p>}</div> }
function demonstrated(action: ProcessingPrivacyRemediation) { return action.deletion.status === 'demonstrated' && action.deletion.validationStatus === 'accepted' && action.deletion.integrityStatus === 'verified' && Boolean(action.deletion.evidenceId) && Boolean(action.deletion.snapshotHash) }
function providerAssuranceLabel(action: ProcessingPrivacyRemediation) { if (action.providerAssurance.tenantConfigurationStatus === 'verified') return 'Política + tenant verificados'; if (action.providerAssurance.backupPurgeStatus === 'policy_known_configuration_unverified') return 'Política de backups revisada'; if (action.providerAssurance.externalPropagationStatus === 'application_state_minimized') return 'Retención minimizada · tenant pendiente'; return 'Assurance parcial revisado' }
function tenantBlockerLabel(action: ProcessingPrivacyRemediation) { if (action.providerAssurance.tenantConfigurationStatus === 'verified') return 'Tenant verificado'; return action.providerAssurance.status === 'not_reviewed' ? 'Assurance pendiente' : 'Configuración tenant pendiente' }
function tenantBlockerDetail(action: ProcessingPrivacyRemediation) { if (action.providerAssurance.backupPurgeStatus === 'policy_known_configuration_unverified') return 'Falta acreditar la configuración efectiva de backups/PITR y su período de recuperación/expiración para este proyecto Supabase.'; if (action.providerAssurance.externalPropagationStatus === 'application_state_minimized') return 'Kumplio usa store:false, pero falta acreditar la configuración efectiva de retención del tenant OpenAI (ZDR/MAM/estándar).'; return 'Falta evidencia tenant-specific del proveedor antes de habilitar el cierre final.' }
function formatDateTime(value: string | null) { return value ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santiago' }).format(new Date(value)) : 'Sin fecha' }
function shortHash(value: string) { return value ? `SHA-256 ${value.slice(0, 12)}…${value.slice(-8)}` : '' }
function message(error: unknown) { return error instanceof Error ? error.message : 'No fue posible completar la operación.' }
