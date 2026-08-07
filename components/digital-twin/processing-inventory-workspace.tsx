'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileCheck2,
  Loader2,
  Network,
  Plus,
  Server,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProcessingInventoryActivity, ProcessingInventorySummary } from '@/lib/compliance/digital-twin/processing-inventory'

type ProjectOption = { id: string; name: string }
type MemberOption = { id: string; label: string }
type CaseOption = { id: string; projectId: string; title: string }
type ControlOption = { id: string; projectId: string; name: string; code: string | null }

type Props = {
  activities: ProcessingInventoryActivity[]
  summary: ProcessingInventorySummary
  projects: ProjectOption[]
  members: MemberOption[]
  cases: CaseOption[]
  controls: ControlOption[]
  currentUserId: string
  initialRequestKey: string
  canManage: boolean
}

export function ProcessingInventoryWorkspace({
  activities,
  summary,
  projects,
  members,
  cases,
  controls,
  currentUserId,
  initialRequestKey,
  canManage,
}: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(canManage && activities.length === 0)
  const [requestKey, setRequestKey] = useState(initialRequestKey)
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [caseId, setCaseId] = useState('')
  const [controlId, setControlId] = useState(controls.find((item) => item.projectId === projects[0]?.id && item.code?.startsWith('BASE-INVENTORY-'))?.id || '')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [purpose, setPurpose] = useState('')
  const [proposedLegalBasis, setProposedLegalBasis] = useState('Pendiente de validación jurídica; registrar la hipótesis y la fuente revisada.')
  const [ownerId, setOwnerId] = useState(currentUserId)
  const [criticality, setCriticality] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [dataSubjects, setDataSubjects] = useState('')
  const [dataCategories, setDataCategories] = useState('')
  const [sensitivity, setSensitivity] = useState<'public' | 'internal' | 'confidential' | 'restricted'>('confidential')
  const [retentionRule, setRetentionRule] = useState('Pendiente de definir y aprobar.')
  const [crossBorderTransfer, setCrossBorderTransfer] = useState(false)
  const [containsSensitiveData, setContainsSensitiveData] = useState(false)
  const [assetName, setAssetName] = useState('')
  const [assetType, setAssetType] = useState('web_application_database')
  const [hostingCountry, setHostingCountry] = useState('')
  const [providerName, setProviderName] = useState('')
  const [vendorName, setVendorName] = useState('')
  const [vendorService, setVendorService] = useState('')
  const [vendorCountry, setVendorCountry] = useState('')
  const [vendorProcessesPersonalData, setVendorProcessesPersonalData] = useState(true)
  const [vendorCrossBorder, setVendorCrossBorder] = useState(false)
  const [vendorRisk, setVendorRisk] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [sourceType, setSourceType] = useState<'document' | 'system' | 'code' | 'code_and_database' | 'interview' | 'contract' | 'other'>('system')
  const [sourceLabel, setSourceLabel] = useState('')
  const [sourceReference, setSourceReference] = useState('')
  const [completeness, setCompleteness] = useState<'partial' | 'complete'>('partial')
  const [unknowns, setUnknowns] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [scopeConfirmed, setScopeConfirmed] = useState(false)
  const [basisConfirmed, setBasisConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const projectCases = useMemo(() => cases.filter((item) => item.projectId === projectId), [cases, projectId])
  const projectControls = useMemo(() => controls.filter((item) => item.projectId === projectId), [controls, projectId])

  function changeProject(value: string) {
    setProjectId(value)
    setCaseId('')
    setControlId(controls.find((item) => item.projectId === value && item.code?.startsWith('BASE-INVENTORY-'))?.id || '')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)

    try {
      const response = await fetch('/api/processing-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestKey,
          projectId,
          caseId: caseId || null,
          controlId: controlId || null,
          name,
          description: description || null,
          purpose,
          proposedLegalBasis,
          ownerId,
          criticality,
          dataSubjects: splitList(dataSubjects),
          dataCategories: splitList(dataCategories),
          sensitivity,
          retentionRule,
          crossBorderTransfer,
          containsSensitiveData,
          asset: {
            name: assetName,
            type: assetType,
            hostingCountry: hostingCountry || null,
            providerName: providerName || vendorName || null,
          },
          vendor: vendorName ? {
            name: vendorName,
            serviceCategory: vendorService || null,
            country: vendorCountry || null,
            processesPersonalData: vendorProcessesPersonalData,
            crossBorderTransfer: vendorCrossBorder,
            riskTier: vendorRisk,
          } : null,
          source: {
            type: sourceType,
            label: sourceLabel,
            reference: sourceReference || null,
          },
          review: {
            decision: 'approved',
            completeness,
            note: reviewNote,
            unknowns: splitList(unknowns),
            scopeConfirmed,
            legalBasisIsProposed: basisConfirmed,
          },
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No fue posible registrar la actividad.')

      setFeedback({ type: 'success', message: result.message || 'Actividad registrada y revisada.' })
      setShowForm(false)
      setRequestKey(crypto.randomUUID())
      resetForm(currentUserId)
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible registrar la actividad.' })
    } finally {
      setLoading(false)
    }
  }

  function resetForm(userId: string) {
    setName('')
    setDescription('')
    setPurpose('')
    setProposedLegalBasis('Pendiente de validación jurídica; registrar la hipótesis y la fuente revisada.')
    setOwnerId(userId)
    setCriticality('medium')
    setDataSubjects('')
    setDataCategories('')
    setSensitivity('confidential')
    setRetentionRule('Pendiente de definir y aprobar.')
    setCrossBorderTransfer(false)
    setContainsSensitiveData(false)
    setAssetName('')
    setAssetType('web_application_database')
    setHostingCountry('')
    setProviderName('')
    setVendorName('')
    setVendorService('')
    setVendorCountry('')
    setVendorProcessesPersonalData(true)
    setVendorCrossBorder(false)
    setVendorRisk('medium')
    setSourceType('system')
    setSourceLabel('')
    setSourceReference('')
    setCompleteness('partial')
    setUnknowns('')
    setReviewNote('')
    setScopeConfirmed(false)
    setBasisConfirmed(false)
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border bg-card">
        <div className="bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_48%)] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Network className="h-5 w-5" />
                <p className="text-sm font-bold">Inventario de tratamientos</p>
              </div>
              <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">Qué datos usas, para qué y dónde están.</h1>
              <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
                Cada actividad conecta propósito, titulares, categorías de datos, sistema, proveedor, fuente y revisión humana. Una base propuesta no se presenta como conclusión jurídica.
              </p>
            </div>
            {canManage && (
              <Button onClick={() => setShowForm((value) => !value)} className="min-h-11 gap-2">
                {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showForm ? 'Cerrar formulario' : 'Registrar actividad'}
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric icon={Network} label="Actividades" value={summary.activities} helper={`${summary.reviewed} revisadas`} />
        <Metric icon={Server} label="Sistemas" value={summary.systems} helper="Repositorios vinculados" />
        <Metric icon={Database} label="Conjuntos de datos" value={summary.datasets} helper="Titulares y categorías" />
        <Metric icon={UsersRound} label="Terceros" value={summary.vendors} helper="Proveedores o destinatarios" />
        <Metric icon={ShieldCheck} label="Cobertura media" value={summary.averageScore === null ? '—' : `${summary.averageScore}%`} helper={`${summary.unknowns} desconocidos abiertos`} />
      </section>

      {feedback && (
        <div className={`rounded-xl border p-4 text-sm ${feedback.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
          {feedback.message}
        </div>
      )}

      {showForm && canManage && (
        <form onSubmit={submit} className="space-y-6 rounded-3xl border bg-card p-5 sm:p-8">
          <FormSection number="1" title="Actividad y propósito" description="Describe un tratamiento que realmente ocurre. No copies una obligación legal como nombre del proceso.">
            <Field label="Ámbito de cumplimiento">
              <select value={projectId} onChange={(event) => changeProject(event.target.value)} required className={inputClass}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </Field>
            <Field label="Expediente relacionado" optional>
              <select value={caseId} onChange={(event) => setCaseId(event.target.value)} className={inputClass}>
                <option value="">Sin expediente específico</option>
                {projectCases.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </Field>
            <Field label="Control de inventario" optional>
              <select value={controlId} onChange={(event) => setControlId(event.target.value)} className={inputClass}>
                <option value="">Sin control vinculado</option>
                {projectControls.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </Field>
            <Field label="Responsable">
              <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} required className={inputClass}>
                {members.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}
              </select>
            </Field>
            <Field label="Nombre de la actividad" wide>
              <input value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={180} required className={inputClass} placeholder="Ej.: Gestión de solicitudes comerciales" />
            </Field>
            <Field label="Propósito" wide>
              <textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} minLength={10} maxLength={2000} rows={3} required className={inputClass} placeholder="Qué resultado busca la organización al tratar estos datos." />
            </Field>
            <Field label="Descripción operacional" wide optional>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} rows={2} className={inputClass} placeholder="Cómo comienza, qué ocurre y cuándo termina." />
            </Field>
            <Field label="Base propuesta" wide>
              <textarea value={proposedLegalBasis} onChange={(event) => setProposedLegalBasis(event.target.value)} minLength={3} maxLength={1000} rows={2} required className={inputClass} />
            </Field>
            <Field label="Criticidad">
              <select value={criticality} onChange={(event) => setCriticality(event.target.value as typeof criticality)} className={inputClass}>
                <option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option><option value="critical">Crítica</option>
              </select>
            </Field>
          </FormSection>

          <FormSection number="2" title="Datos, sistema y tercero" description="Registra lo conocido y conserva explícitamente lo que todavía no has confirmado.">
            <Field label="Titulares" wide>
              <input value={dataSubjects} onChange={(event) => setDataSubjects(event.target.value)} required className={inputClass} placeholder="Prospectos, clientes, trabajadores — separados por coma" />
            </Field>
            <Field label="Categorías de datos" wide>
              <input value={dataCategories} onChange={(event) => setDataCategories(event.target.value)} required className={inputClass} placeholder="Identificación, contacto, financieros — separados por coma" />
            </Field>
            <Field label="Sensibilidad">
              <select value={sensitivity} onChange={(event) => setSensitivity(event.target.value as typeof sensitivity)} className={inputClass}>
                <option value="public">Pública</option><option value="internal">Interna</option><option value="confidential">Confidencial</option><option value="restricted">Restringida</option>
              </select>
            </Field>
            <Field label="Retención">
              <input value={retentionRule} onChange={(event) => setRetentionRule(event.target.value)} minLength={3} maxLength={1000} required className={inputClass} />
            </Field>
            <CheckField checked={containsSensitiveData} onChange={setContainsSensitiveData} label="Incluye datos sensibles" />
            <CheckField checked={crossBorderTransfer} onChange={setCrossBorderTransfer} label="Existe transferencia internacional" />
            <Field label="Sistema o repositorio" wide>
              <input value={assetName} onChange={(event) => setAssetName(event.target.value)} required className={inputClass} placeholder="Ej.: CRM y base de datos de contactos" />
            </Field>
            <Field label="Tipo de sistema">
              <input value={assetType} onChange={(event) => setAssetType(event.target.value)} required className={inputClass} />
            </Field>
            <Field label="País o región de hosting" optional>
              <input value={hostingCountry} onChange={(event) => setHostingCountry(event.target.value)} className={inputClass} placeholder="Ej.: Chile, Brasil, us-east-1" />
            </Field>
            <Field label="Proveedor técnico" optional>
              <input value={providerName} onChange={(event) => setProviderName(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Tercero o destinatario" wide optional>
              <input value={vendorName} onChange={(event) => setVendorName(event.target.value)} className={inputClass} placeholder="Déjalo vacío solo si confirmaste que no interviene un tercero." />
            </Field>
            <Field label="Servicio del tercero" optional>
              <input value={vendorService} onChange={(event) => setVendorService(event.target.value)} className={inputClass} />
            </Field>
            <Field label="País del tercero" optional>
              <input value={vendorCountry} onChange={(event) => setVendorCountry(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Riesgo del tercero" optional>
              <select value={vendorRisk} onChange={(event) => setVendorRisk(event.target.value as typeof vendorRisk)} className={inputClass}>
                <option value="low">Bajo</option><option value="medium">Medio</option><option value="high">Alto</option><option value="critical">Crítico</option>
              </select>
            </Field>
            <CheckField checked={vendorProcessesPersonalData} onChange={setVendorProcessesPersonalData} label="El tercero trata datos personales" />
            <CheckField checked={vendorCrossBorder} onChange={setVendorCrossBorder} label="El tercero implica transferencia internacional" />
          </FormSection>

          <FormSection number="3" title="Fuente y revisión humana" description="La aprobación acredita la declaración revisada. No transforma una hipótesis en conclusión legal.">
            <Field label="Tipo de fuente">
              <select value={sourceType} onChange={(event) => setSourceType(event.target.value as typeof sourceType)} className={inputClass}>
                <option value="system">Sistema</option><option value="document">Documento</option><option value="code">Código</option><option value="code_and_database">Código y base de datos</option><option value="interview">Entrevista</option><option value="contract">Contrato</option><option value="other">Otra</option>
              </select>
            </Field>
            <Field label="Fuente revisada" wide>
              <input value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} minLength={3} maxLength={300} required className={inputClass} placeholder="Documento, sistema, contrato o persona que respalda la declaración." />
            </Field>
            <Field label="Referencia" wide optional>
              <input value={sourceReference} onChange={(event) => setSourceReference(event.target.value)} maxLength={1000} className={inputClass} placeholder="Ruta, URL, identificador o ubicación verificable." />
            </Field>
            <Field label="Estado de completitud">
              <select value={completeness} onChange={(event) => setCompleteness(event.target.value as typeof completeness)} className={inputClass}>
                <option value="partial">Parcial</option><option value="complete">Completa</option>
              </select>
            </Field>
            <Field label="Desconocidos abiertos" wide optional={completeness === 'complete'}>
              <textarea value={unknowns} onChange={(event) => setUnknowns(event.target.value)} rows={3} className={inputClass} placeholder="Retención no aprobada, destinatarios pendientes — separados por coma" />
            </Field>
            <Field label="Justificación de revisión" wide>
              <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} minLength={10} maxLength={4000} rows={4} required className={inputClass} placeholder="Qué verificaste, qué aprobaste y qué límites conserva esta revisión." />
            </Field>
            <CheckField checked={scopeConfirmed} onChange={setScopeConfirmed} label="Revisé esta actividad y confirmo que la evidencia solo respalda el alcance declarado." wide />
            <CheckField checked={basisConfirmed} onChange={setBasisConfirmed} label="Entiendo que la base registrada es una propuesta pendiente de validación jurídica." wide />
          </FormSection>

          <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">Se generará un snapshot con hash SHA-256, evidencia aceptada para este alcance y una revisión humana trazable.</p>
            <Button type="submit" disabled={loading || !scopeConfirmed || !basisConfirmed || !projectId} className="min-h-11 gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
              Registrar y revisar
            </Button>
          </div>
        </form>
      )}

      {activities.length === 0 ? (
        <section className="rounded-3xl border border-dashed bg-card p-10 text-center">
          <Network className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-black">Todavía no hay actividades de tratamiento revisadas.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">La primera actividad debe venir de una operación real y una fuente verificable. Kumplio no completará campos desconocidos por inferencia.</p>
        </section>
      ) : (
        <section className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-primary">Registro operativo</p>
            <h2 className="mt-1 text-2xl font-black">Actividades revisadas</h2>
          </div>
          {activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}
        </section>
      )}
    </div>
  )
}

function ActivityCard({ activity }: { activity: ProcessingInventoryActivity }) {
  return (
    <article className="rounded-3xl border bg-card p-5 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border px-2.5 py-1">{activity.code}</span>
            <span className={`rounded-full border px-2.5 py-1 ${activity.completeness === 'complete' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>
              {activity.completeness === 'complete' ? 'Completa' : activity.completeness === 'partial' ? 'Parcial' : 'Sin revisar'}
            </span>
            <span className="rounded-full border px-2.5 py-1">{activity.score}% de cobertura registrada</span>
          </div>
          <h3 className="mt-3 text-2xl font-black">{activity.name}</h3>
          {activity.purpose && <p className="mt-3 max-w-4xl leading-7 text-muted-foreground">{activity.purpose}</p>}
        </div>
        <div className="rounded-2xl border bg-background/60 px-5 py-4 text-sm">
          <p className="font-bold">Responsable</p>
          <p className="mt-1 text-muted-foreground">{activity.ownerLabel || 'Sin responsable'}</p>
          <p className="mt-3 font-bold">Última revisión</p>
          <p className="mt-1 text-muted-foreground">{activity.reviewedAt ? new Date(activity.reviewedAt).toLocaleDateString('es-CL') : 'Sin revisión'}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Detail title="Base propuesta" value={activity.proposedLegalBasis || 'No registrada'} warning />
        <Detail title="Retención" value={activity.dataset?.retentionRule || 'No registrada'} />
        <Detail title="Titulares" value={activity.dataset?.dataSubjects.join(', ') || 'No registrados'} />
        <Detail title="Categorías de datos" value={activity.dataset?.dataCategories.join(', ') || 'No registradas'} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border bg-background/50 p-4">
        <div className="flex min-w-max items-center gap-3 text-sm font-semibold">
          <ChainNode icon={Network} label="Actividad" value={activity.name} />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <ChainNode icon={Database} label="Datos" value={activity.dataset?.name || 'Sin dataset'} />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <ChainNode icon={Server} label="Sistema" value={activity.asset?.name || 'Sin sistema'} />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <ChainNode icon={UsersRound} label="Tercero" value={activity.vendor?.name || 'No registrado'} />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <ChainNode icon={FileCheck2} label="Evidencia" value={activity.evidence?.name || 'Sin evidencia'} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-2xl border p-5">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            <h4 className="font-black">Fuente y revisión</h4>
          </div>
          <p className="mt-3 text-sm"><strong>Fuente:</strong> {activity.source.label || activity.evidence?.source || 'No identificada'}</p>
          {activity.source.reference && <p className="mt-2 break-all text-xs text-muted-foreground">{activity.source.reference}</p>}
          {activity.reviewNote && <p className="mt-4 text-sm leading-6 text-muted-foreground">{activity.reviewNote}</p>}
          {activity.evidence && (
            <div className="mt-4 rounded-xl bg-muted/50 p-3 text-xs">
              <p><strong>Estado:</strong> {activity.evidence.validationStatus} · {activity.evidence.integrityStatus}</p>
              {activity.evidence.integrityHash && <p className="mt-1 break-all font-mono">SHA-256 {activity.evidence.integrityHash}</p>}
            </div>
          )}
        </section>

        <section className={`rounded-2xl border p-5 ${activity.unknowns.length ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
          <div className="flex items-center gap-2">
            {activity.unknowns.length ? <AlertTriangle className="h-5 w-5 text-amber-600" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            <h4 className="font-black">Lo que todavía no sabemos</h4>
          </div>
          {activity.unknowns.length ? (
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {activity.unknowns.map((unknown) => <li key={unknown}>• {unknown}</li>)}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Esta actividad no conserva desconocidos abiertos en su última revisión.</p>
          )}
        </section>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-primary">
        {activity.controlId && <Link href={`/controls/${activity.controlId}`} className="hover:underline">Ver control</Link>}
        {activity.caseId && <Link href={`/cases/${activity.caseId}`} className="hover:underline">Ver expediente</Link>}
        {activity.evidence && <Link href="/evidence" className="hover:underline">Abrir evidencia</Link>}
      </div>
    </article>
  )
}

function Metric({ icon: Icon, label, value, helper }: { icon: typeof Network; label: string; value: number | string; helper: string }) {
  return (
    <article className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </article>
  )
}

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border p-5 sm:p-6">
      <div className="flex gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground">{number}</div>
        <div><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  )
}

function Field({ label, optional = false, wide = false, children }: { label: string; optional?: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`space-y-2 text-sm font-semibold ${wide ? 'md:col-span-2' : ''}`}>
      <span>{label}{optional && <span className="ml-2 font-normal text-muted-foreground">Opcional</span>}</span>
      {children}
    </label>
  )
}

function CheckField({ checked, onChange, label, wide = false }: { checked: boolean; onChange: (value: boolean) => void; label: string; wide?: boolean }) {
  return (
    <label className={`flex min-h-11 items-center gap-3 rounded-xl border bg-background px-4 py-3 text-sm font-semibold ${wide ? 'md:col-span-2' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4" />
      <span>{label}</span>
    </label>
  )
}

function Detail({ title, value, warning = false }: { title: string; value: string; warning?: boolean }) {
  return <div className={`rounded-xl border p-4 ${warning ? 'border-amber-500/25 bg-amber-500/5' : ''}`}><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{title}</p><p className="mt-2 text-sm leading-6">{value}</p></div>
}

function ChainNode({ icon: Icon, label, value }: { icon: typeof Network; label: string; value: string }) {
  return <div className="w-48 rounded-xl border bg-card p-3"><Icon className="h-4 w-4 text-primary" /><p className="mt-2 text-xs text-muted-foreground">{label}</p><p className="mt-1 line-clamp-2 font-bold">{value}</p></div>
}

function splitList(value: string) {
  return [...new Set(value.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean))]
}

const inputClass = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15'
