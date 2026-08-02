'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, FileCheck2, Hash, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Project = { id: string; name: string }
type Document = { id: string; projectId: string; name: string }
type Control = { id: string; projectId: string; name: string }

export type EvidenceListItem = {
  id: string
  projectId: string
  projectName: string
  name: string
  description: string | null
  evidenceType: string
  source: string | null
  validationStatus: string
  integrityStatus: string
  confidentiality: string
  issuedAt: string | null
  expiresAt: string | null
  linkedControls: string[]
}

type Props = {
  projects: Project[]
  documents: Document[]
  controls: Control[]
  evidence: EvidenceListItem[]
}

const validationLabels: Record<string, string> = {
  pending: 'Pendiente',
  valid: 'Válida',
  expiring: 'Por vencer',
  expired: 'Vencida',
  incomplete: 'Incompleta',
  rejected: 'Rechazada',
}

const integrityLabels: Record<string, string> = {
  pending: 'Integridad pendiente',
  verified: 'Integridad verificada',
  mismatch: 'Hash no coincide',
  unverifiable: 'No verificable',
}

export function EvidenceWorkspace({ projects, documents, controls, evidence }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(!evidence.length)
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [evidenceType, setEvidenceType] = useState('document')
  const [source, setSource] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [controlId, setControlId] = useState('')
  const [issuedDate, setIssuedDate] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [expiresDate, setExpiresDate] = useState('')
  const [integrityHash, setIntegrityHash] = useState('')
  const [confidentiality, setConfidentiality] = useState<'internal' | 'confidential' | 'restricted'>('internal')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const projectDocuments = useMemo(() => documents.filter((item) => item.projectId === projectId), [documents, projectId])
  const projectControls = useMemo(() => controls.filter((item) => item.projectId === projectId), [controls, projectId])

  async function submitEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)

    try {
      const response = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name,
          description: description || null,
          evidenceType,
          source: source || null,
          documentId: documentId || null,
          controlId: controlId || null,
          issuedAt: issuedDate ? `${issuedDate}T12:00:00.000Z` : null,
          periodStart: periodStart || null,
          periodEnd: periodEnd || null,
          expiresAt: expiresDate ? `${expiresDate}T12:00:00.000Z` : null,
          integrityHash: integrityHash || null,
          confidentiality,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No fue posible registrar la evidencia.')

      setName('')
      setDescription('')
      setSource('')
      setDocumentId('')
      setControlId('')
      setIssuedDate('')
      setPeriodStart('')
      setPeriodEnd('')
      setExpiresDate('')
      setIntegrityHash('')
      setFeedback({ type: 'success', message: 'Evidencia registrada y disponible para revisión.' })
      setShowForm(false)
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible registrar la evidencia.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Biblioteca verificable</h2>
          <p className="mt-1 text-sm text-muted-foreground">Registra origen, vigencia, integridad y relación con controles, sin duplicar el documento fuente.</p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)} className="gap-2">
          <Plus className="h-4 w-4" /> {showForm ? 'Cerrar formulario' : 'Registrar evidencia'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submitEvidence} className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Ámbito
              <select value={projectId} onChange={(event) => { setProjectId(event.target.value); setDocumentId(''); setControlId('') }} className="w-full rounded-lg border border-border bg-background px-3 py-2" required>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Tipo de evidencia
              <select value={evidenceType} onChange={(event) => setEvidenceType(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                <option value="document">Documento</option>
                <option value="system_report">Reporte de sistema</option>
                <option value="log">Log o registro técnico</option>
                <option value="screenshot">Captura</option>
                <option value="attestation">Declaración o certificación</option>
                <option value="record">Registro operacional</option>
                <option value="other">Otra</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium md:col-span-2">
              Nombre
              <input value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={180} className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Ej.: Reporte de revisión de accesos — julio 2026" required />
            </label>

            <label className="space-y-2 text-sm font-medium md:col-span-2">
              Descripción
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Qué demuestra, cómo se obtuvo y qué período cubre." />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Documento fuente
              <select value={documentId} onChange={(event) => setDocumentId(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                <option value="">Sin documento vinculado</option>
                {projectDocuments.map((document) => <option key={document.id} value={document.id}>{document.name}</option>)}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Control respaldado
              <select value={controlId} onChange={(event) => setControlId(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                <option value="">Sin control vinculado</option>
                {projectControls.map((control) => <option key={control.id} value={control.id}>{control.name}</option>)}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium md:col-span-2">
              Origen
              <input value={source} onChange={(event) => setSource(event.target.value)} maxLength={500} className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Sistema, área, proveedor o responsable que generó la evidencia." />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Fecha de emisión
              <input type="date" value={issuedDate} onChange={(event) => setIssuedDate(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Fecha de vencimiento
              <input type="date" value={expiresDate} onChange={(event) => setExpiresDate(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Inicio del período cubierto
              <input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Fin del período cubierto
              <input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Confidencialidad
              <select value={confidentiality} onChange={(event) => setConfidentiality(event.target.value as typeof confidentiality)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                <option value="internal">Interna</option>
                <option value="confidential">Confidencial</option>
                <option value="restricted">Restringida</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Hash de integridad
              <input value={integrityHash} onChange={(event) => setIntegrityHash(event.target.value)} maxLength={256} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs" placeholder="SHA-256 u otro identificador verificable" />
            </label>
          </div>

          {feedback && <div className={`mt-5 rounded-lg border p-3 text-sm ${feedback.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>{feedback.message}</div>}

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={loading || !projectId} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
              Guardar evidencia
            </Button>
          </div>
        </form>
      )}

      {!evidence.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <FileCheck2 className="mx-auto h-9 w-9 text-primary" />
          <p className="mt-4 font-semibold">No hay evidencias registradas.</p>
          <p className="mt-2 text-sm text-muted-foreground">Registra una evidencia y relaciónala con el control que respalda.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {evidence.map((item) => (
            <article key={item.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{item.evidenceType}</span>
                <span className="rounded-full bg-muted px-2.5 py-1">{validationLabels[item.validationStatus] || item.validationStatus}</span>
                <span className="rounded-full bg-muted px-2.5 py-1">{item.confidentiality}</span>
              </div>
              <h3 className="mt-3 text-lg font-bold">{item.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{item.projectName}</p>
              {item.description && <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>}

              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><Hash className="h-4 w-4" /> {integrityLabels[item.integrityStatus] || item.integrityStatus}</p>
                <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Vence: {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString('es-CL') : 'sin vencimiento'}</p>
              </div>

              {item.source && <p className="mt-3 text-xs"><strong>Origen:</strong> {item.source}</p>}
              {item.linkedControls.length > 0 && (
                <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs">
                  <strong>Controles respaldados:</strong> {item.linkedControls.join(', ')}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
