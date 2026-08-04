'use client'

import { FormEvent, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileCheck2,
  History,
  Loader2,
  Plus,
  Send,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type ProjectOption = { id: string; name: string }
type MemberOption = { id: string; name: string }
type ControlOption = { id: string; projectId: string; name: string }
type CaseOption = { id: string; projectId: string; title: string }
type EvidenceOption = {
  id: string
  projectId: string
  name: string
  validationStatus: string
  integrityStatus: string
  expiresAt: string | null
}

export type EvidenceRequestEventItem = {
  id: string
  eventType: string
  fromStatus: string | null
  toStatus: string
  comment: string | null
  evidenceName: string | null
  actorName: string | null
  createdAt: string
}

export type EvidenceRequestItem = {
  id: string
  projectId: string
  projectName: string
  caseId: string | null
  caseTitle: string | null
  controlId: string | null
  controlName: string | null
  title: string
  description: string | null
  requestedFromName: string | null
  requestedByName: string | null
  dueAt: string | null
  status: string
  displayStatus: string
  submittedEvidenceId: string | null
  submittedEvidenceName: string | null
  reviewedByName: string | null
  reviewedAt: string | null
  reviewComment: string | null
  createdAt: string
  events: EvidenceRequestEventItem[]
}

type Props = {
  projects: ProjectOption[]
  members: MemberOption[]
  controls: ControlOption[]
  cases: CaseOption[]
  evidence: EvidenceOption[]
  requests: EvidenceRequestItem[]
  initialProjectId?: string | null
  initialControlId?: string | null
  initialCaseId?: string | null
}

const statusLabels: Record<string, string> = {
  open: 'Abierta',
  submitted: 'Entregada',
  under_review: 'En revisión',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  changes_requested: 'Reemplazo solicitado',
  cancelled: 'Cancelada',
  overdue: 'Vencida',
}

const statusClasses: Record<string, string> = {
  open: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  submitted: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  under_review: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  accepted: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
  changes_requested: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
  cancelled: 'border-border bg-muted text-muted-foreground',
  overdue: 'border-destructive/30 bg-destructive/10 text-destructive',
}

const eventLabels: Record<string, string> = {
  created: 'Solicitud creada',
  submitted: 'Evidencia entregada',
  accepted: 'Evidencia aceptada',
  rejected: 'Evidencia rechazada',
  changes_requested: 'Se solicitó reemplazo',
  cancelled: 'Solicitud cancelada',
}

function dateTimeLabel(value: string | null) {
  return value ? new Date(value).toLocaleString('es-CL') : 'Sin fecha'
}

export function EvidenceRequestsWorkspace({
  projects,
  members,
  controls,
  cases,
  evidence,
  requests,
  initialProjectId,
  initialControlId,
  initialCaseId,
}: Props) {
  const router = useRouter()
  const resolvedInitialProject = initialProjectId
    || controls.find((item) => item.id === initialControlId)?.projectId
    || cases.find((item) => item.id === initialCaseId)?.projectId
    || projects[0]?.id
    || ''

  const [showForm, setShowForm] = useState(!requests.length || Boolean(initialControlId || initialCaseId))
  const [projectId, setProjectId] = useState(resolvedInitialProject)
  const [caseId, setCaseId] = useState(initialCaseId || '')
  const [controlId, setControlId] = useState(initialControlId || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requestedFrom, setRequestedFrom] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [workingKey, setWorkingKey] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [submissionEvidence, setSubmissionEvidence] = useState<Record<string, string>>({})
  const [submissionComments, setSubmissionComments] = useState<Record<string, string>>({})
  const [reviewDecision, setReviewDecision] = useState<Record<string, 'accepted' | 'rejected' | 'changes_requested'>>({})
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({})

  const projectControls = useMemo(() => controls.filter((item) => item.projectId === projectId), [controls, projectId])
  const projectCases = useMemo(() => cases.filter((item) => item.projectId === projectId), [cases, projectId])

  const summary = useMemo(() => ({
    open: requests.filter((item) => ['open', 'changes_requested'].includes(item.status)).length,
    overdue: requests.filter((item) => item.displayStatus === 'overdue').length,
    review: requests.filter((item) => ['submitted', 'under_review'].includes(item.status)).length,
    accepted: requests.filter((item) => item.status === 'accepted').length,
  }), [requests])

  const summaryCards: Array<{ label: string; value: number; Icon: LucideIcon }> = [
    { label: 'Abiertas', value: summary.open, Icon: CircleDashed },
    { label: 'Vencidas', value: summary.overdue, Icon: AlertTriangle },
    { label: 'En revisión', value: summary.review, Icon: Clock3 },
    { label: 'Aceptadas', value: summary.accepted, Icon: CheckCircle2 },
  ]

  function setProject(nextProjectId: string) {
    setProjectId(nextProjectId)
    setCaseId('')
    setControlId('')
  }

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setWorkingKey('create')
    setFeedback(null)

    try {
      const dueAt = dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : null
      const response = await fetch('/api/evidence/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          caseId: caseId || null,
          controlId: controlId || null,
          title,
          description: description || null,
          requestedFrom: requestedFrom || null,
          dueAt,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No fue posible crear la solicitud.')

      setTitle('')
      setDescription('')
      setRequestedFrom('')
      setDueDate('')
      setFeedback({ type: 'success', message: 'Solicitud creada y registrada en el historial.' })
      setShowForm(false)
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible crear la solicitud.' })
    } finally {
      setWorkingKey(null)
    }
  }

  async function submitEvidence(requestItem: EvidenceRequestItem) {
    const evidenceId = submissionEvidence[requestItem.id]
    if (!evidenceId) return
    const key = `submit:${requestItem.id}`
    setWorkingKey(key)
    setFeedback(null)

    try {
      const response = await fetch(`/api/evidence/requests/${requestItem.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidenceId,
          comment: submissionComments[requestItem.id] || null,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No fue posible entregar la evidencia.')

      setFeedback({ type: 'success', message: 'Evidencia entregada para revisión.' })
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible entregar la evidencia.' })
    } finally {
      setWorkingKey(null)
    }
  }

  async function reviewEvidence(requestItem: EvidenceRequestItem) {
    const decision = reviewDecision[requestItem.id] || 'accepted'
    const comment = reviewComments[requestItem.id] || ''
    if (comment.trim().length < 3) {
      setFeedback({ type: 'error', message: 'La revisión necesita un comentario de al menos 3 caracteres.' })
      return
    }

    const key = `review:${requestItem.id}`
    setWorkingKey(key)
    setFeedback(null)

    try {
      const response = await fetch(`/api/evidence/requests/${requestItem.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No fue posible registrar la revisión.')

      setFeedback({ type: 'success', message: 'Revisión registrada de forma trazable.' })
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible registrar la revisión.' })
    } finally {
      setWorkingKey(null)
    }
  }

  async function cancelRequest(requestItem: EvidenceRequestItem) {
    if (!window.confirm(`¿Cancelar la solicitud “${requestItem.title}”?`)) return
    const key = `cancel:${requestItem.id}`
    setWorkingKey(key)
    setFeedback(null)

    try {
      const response = await fetch(`/api/evidence/requests/${requestItem.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: null }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No fue posible cancelar la solicitud.')

      setFeedback({ type: 'success', message: 'Solicitud cancelada.' })
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible cancelar la solicitud.' })
    } finally {
      setWorkingKey(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, Icon }) => (
          <article key={label} className="rounded-xl border border-border bg-card p-5">
            <Icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Solicitar evidencia</h2>
            <p className="mt-1 text-sm text-muted-foreground">Asigna responsable, ámbito, control, expediente y fecha objetivo.</p>
          </div>
          <Button onClick={() => setShowForm((value) => !value)} className="gap-2">
            <Plus className="h-4 w-4" /> {showForm ? 'Cerrar formulario' : 'Nueva solicitud'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={createRequest} className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Ámbito
              <select value={projectId} onChange={(event) => setProject(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" required>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Responsable de entrega
              <select value={requestedFrom} onChange={(event) => setRequestedFrom(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                <option value="">Sin asignar</option>
                {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Control relacionado
              <select value={controlId} onChange={(event) => setControlId(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                <option value="">Sin control específico</option>
                {projectControls.map((control) => <option key={control.id} value={control.id}>{control.name}</option>)}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Expediente relacionado
              <select value={caseId} onChange={(event) => setCaseId(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                <option value="">Sin expediente específico</option>
                {projectCases.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium md:col-span-2">
              Título
              <input value={title} onChange={(event) => setTitle(event.target.value)} minLength={3} maxLength={180} className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Ej.: Entregar registro mensual de solicitudes de acceso" required />
            </label>

            <label className="space-y-2 text-sm font-medium md:col-span-2">
              Descripción
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Indica el período, formato y criterios mínimos esperados." />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Fecha límite
              <input type="date" min={new Date().toISOString().slice(0, 10)} value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>

            <div className="flex items-end justify-end">
              <Button type="submit" disabled={workingKey !== null || !projectId} className="gap-2">
                {workingKey === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Crear solicitud
              </Button>
            </div>
          </form>
        )}
      </section>

      {feedback && (
        <div className={`rounded-xl border p-4 text-sm ${feedback.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
          {feedback.message}
        </div>
      )}

      {!requests.length ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <FileCheck2 className="mx-auto h-9 w-9 text-primary" />
          <p className="mt-4 font-semibold">Aún no hay solicitudes de evidencia.</p>
          <p className="mt-2 text-sm text-muted-foreground">Crea la primera solicitud para iniciar el seguimiento de entregas y revisiones.</p>
        </section>
      ) : (
        <section className="space-y-5">
          {requests.map((item) => {
            const projectEvidence = evidence.filter((entry) => entry.projectId === item.projectId)
            const canSubmit = ['open', 'changes_requested'].includes(item.status)
            const canReview = ['submitted', 'under_review'].includes(item.status)
            const canCancel = ['open', 'changes_requested'].includes(item.status)

            return (
              <article key={item.id} className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full border px-2.5 py-1 font-semibold ${statusClasses[item.displayStatus] || statusClasses.open}`}>{statusLabels[item.displayStatus] || item.displayStatus}</span>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{item.projectName}</span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold">{item.title}</h3>
                    {item.description && <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{item.description}</p>}
                  </div>
                  <div className="shrink-0 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> {item.dueAt ? new Date(item.dueAt).toLocaleDateString('es-CL') : 'Sin vencimiento'}</div>
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                  <div><dt className="text-xs text-muted-foreground">Responsable</dt><dd className="mt-1 font-semibold">{item.requestedFromName || 'Sin asignar'}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Solicitado por</dt><dd className="mt-1 font-semibold">{item.requestedByName || 'No disponible'}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Control</dt><dd className="mt-1 font-semibold">{item.controlId ? <Link href={`/controls/${item.controlId}`} className="text-primary hover:underline">{item.controlName || 'Abrir control'}</Link> : 'Sin control'}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Expediente</dt><dd className="mt-1 font-semibold">{item.caseId ? <Link href={`/cases/${item.caseId}`} className="text-primary hover:underline">{item.caseTitle || 'Abrir caso'}</Link> : 'Sin expediente'}</dd></div>
                </dl>

                {item.submittedEvidenceName && (
                  <div className="mt-5 rounded-xl border border-border bg-background p-4 text-sm">
                    <strong>Evidencia presentada:</strong> {item.submittedEvidenceName}
                    {item.reviewComment && <p className="mt-2 text-xs leading-5 text-muted-foreground"><strong>Última revisión:</strong> {item.reviewComment}</p>}
                  </div>
                )}

                {canSubmit && (
                  <div className="mt-5 rounded-xl border border-border bg-background p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                      <label className="flex-1 space-y-2 text-sm font-medium">
                        Evidencia a entregar
                        <select value={submissionEvidence[item.id] || ''} onChange={(event) => setSubmissionEvidence((current) => ({ ...current, [item.id]: event.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                          <option value="">Selecciona evidencia del mismo ámbito</option>
                          {projectEvidence.map((entry) => (
                            <option key={entry.id} value={entry.id}>{entry.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="flex-1 space-y-2 text-sm font-medium">
                        Comentario de entrega
                        <input value={submissionComments[item.id] || ''} onChange={(event) => setSubmissionComments((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={2000} className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Opcional" />
                      </label>
                      <Button onClick={() => submitEvidence(item)} disabled={!submissionEvidence[item.id] || workingKey !== null} className="gap-2">
                        {workingKey === `submit:${item.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Entregar
                      </Button>
                    </div>
                    {!projectEvidence.length && <p className="mt-3 text-xs text-muted-foreground">No hay evidencias disponibles. <Link href="/evidence" className="font-semibold text-primary hover:underline">Registrar una nueva evidencia</Link>.</p>}
                  </div>
                )}

                {canReview && (
                  <div className="mt-5 rounded-xl border border-border bg-background p-4">
                    <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-end">
                      <label className="space-y-2 text-sm font-medium">
                        Decisión
                        <select value={reviewDecision[item.id] || 'accepted'} onChange={(event) => setReviewDecision((current) => ({ ...current, [item.id]: event.target.value as 'accepted' | 'rejected' | 'changes_requested' }))} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                          <option value="accepted">Aceptar</option>
                          <option value="changes_requested">Solicitar reemplazo</option>
                          <option value="rejected">Rechazar</option>
                        </select>
                      </label>
                      <label className="space-y-2 text-sm font-medium">
                        Fundamento de revisión
                        <input value={reviewComments[item.id] || ''} onChange={(event) => setReviewComments((current) => ({ ...current, [item.id]: event.target.value }))} minLength={3} maxLength={2000} className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Explica por qué la evidencia es suficiente o qué debe corregirse." />
                      </label>
                      <Button onClick={() => reviewEvidence(item)} disabled={workingKey !== null} className="gap-2">
                        {workingKey === `review:${item.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Registrar revisión
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-6 border-t border-border pt-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4 text-primary" /> Historial ({item.events.length})</div>
                    {canCancel && (
                      <button type="button" onClick={() => cancelRequest(item)} disabled={workingKey !== null} className="inline-flex items-center gap-1 text-xs font-semibold text-destructive disabled:opacity-50">
                        {workingKey === `cancel:${item.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                        Cancelar solicitud
                      </button>
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    {item.events.map((event) => (
                      <div key={event.id} className="rounded-lg bg-muted/50 p-3 text-xs">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-semibold">{eventLabels[event.eventType] || event.eventType}</span>
                          <span className="text-muted-foreground">{dateTimeLabel(event.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-muted-foreground">{event.actorName || 'Sistema'}{event.evidenceName ? ` · ${event.evidenceName}` : ''}</p>
                        {event.comment && <p className="mt-2 leading-5">{event.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}
