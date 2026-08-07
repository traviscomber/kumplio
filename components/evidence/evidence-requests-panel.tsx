'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock3, FileQuestion, Loader2, Plus, Send, ShieldCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Project = { id: string; name: string }
type Control = { id: string; projectId: string; name: string }
type Member = { id: string; name: string }
type CaseItem = { id: string; projectId: string; title: string }
type EvidenceItem = { id: string; projectId: string; name: string }

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
  submittedEvidenceId: string | null
  submittedEvidenceName: string | null
  reviewComment: string | null
  reviewedByName: string | null
  reviewedAt: string | null
}

type Props = {
  projects: Project[]
  controls: Control[]
  members: Member[]
  cases: CaseItem[]
  evidence: EvidenceItem[]
  requests: EvidenceRequestItem[]
}

const statusLabel: Record<string, string> = {
  open: 'Pendiente de entrega', submitted: 'Entregada', under_review: 'En revisión', accepted: 'Aceptada', rejected: 'Rechazada', changes_requested: 'Cambios solicitados', cancelled: 'Cancelada',
}

const statusClass: Record<string, string> = {
  accepted: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  submitted: 'border-violet-500/30 bg-violet-500/10 text-violet-700',
  under_review: 'border-violet-500/30 bg-violet-500/10 text-violet-700',
  changes_requested: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
  open: 'border-border bg-muted text-muted-foreground',
  cancelled: 'border-border bg-muted text-muted-foreground',
}

export function EvidenceRequestsPanel({ projects, controls, members, cases, evidence, requests }: Props) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [controlId, setControlId] = useState('')
  const [caseId, setCaseId] = useState('')
  const [requestedFrom, setRequestedFrom] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const projectControls = useMemo(() => controls.filter((item) => item.projectId === projectId), [controls, projectId])
  const projectCases = useMemo(() => cases.filter((item) => item.projectId === projectId), [cases, projectId])

  async function createRequest(event: FormEvent) {
    event.preventDefault(); setBusy('create'); setFeedback(null)
    const response = await fetch('/api/evidence/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      projectId, controlId: controlId || null, caseId: caseId || null, requestedFrom: requestedFrom || null, title,
      description: description || null, dueAt: dueDate ? new Date(`${dueDate}T18:00:00-04:00`).toISOString() : null,
    }) })
    const payload = await response.json()
    if (!response.ok) setFeedback(payload.error || 'No fue posible crear la solicitud.')
    else { setShowCreate(false); setTitle(''); setDescription(''); setDueDate(''); setControlId(''); setCaseId(''); setRequestedFrom(''); router.refresh() }
    setBusy(null)
  }

  async function submitEvidence(requestId: string, evidenceId: string) {
    if (!evidenceId) return
    setBusy(requestId); setFeedback(null)
    const response = await fetch(`/api/evidence/requests/${requestId}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ evidenceId, comment: 'Evidencia entregada desde la bandeja de Kumplio.' }) })
    const payload = await response.json()
    if (!response.ok) setFeedback(payload.error || 'No fue posible entregar la evidencia.')
    else router.refresh()
    setBusy(null)
  }

  async function review(requestId: string, decision: 'accepted' | 'rejected' | 'changes_requested') {
    const comment = window.prompt(decision === 'accepted' ? 'Justificación de aceptación' : 'Indica qué debe corregirse o por qué se rechaza')?.trim()
    if (!comment || comment.length < 3) return
    setBusy(requestId); setFeedback(null)
    const response = await fetch(`/api/evidence/requests/${requestId}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision, comment }) })
    const payload = await response.json()
    if (!response.ok) setFeedback(payload.error || 'No fue posible revisar la evidencia.')
    else router.refresh()
    setBusy(null)
  }

  return <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><FileQuestion className="h-5 w-5" /></div><div><h2 className="text-xl font-bold">Solicitudes de evidencia</h2><p className="text-sm text-muted-foreground">Pide lo que falta, recibe respaldo y deja la decisión registrada.</p></div></div></div>
      <Button onClick={() => setShowCreate((value) => !value)} className="gap-2"><Plus className="h-4 w-4" /> Nueva solicitud</Button>
    </div>

    {showCreate && <form onSubmit={createRequest} className="mt-6 grid gap-4 rounded-xl border border-border bg-background p-5 md:grid-cols-2">
      <label className="space-y-2 text-sm font-medium">Ámbito<select value={projectId} onChange={(e) => { setProjectId(e.target.value); setControlId(''); setCaseId('') }} className="w-full rounded-lg border bg-background px-3 py-2">{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="space-y-2 text-sm font-medium">Responsable<select value={requestedFrom} onChange={(e) => setRequestedFrom(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2"><option value="">Sin asignar</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      <label className="space-y-2 text-sm font-medium">Control<select value={controlId} onChange={(e) => setControlId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2"><option value="">Sin control</option>{projectControls.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="space-y-2 text-sm font-medium">Expediente<select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2"><option value="">Sin expediente</option>{projectCases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
      <label className="space-y-2 text-sm font-medium md:col-span-2">Qué necesitamos<input value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} maxLength={180} required className="w-full rounded-lg border bg-background px-3 py-2" placeholder="Ej.: Registro de altas y bajas de accesos del último trimestre" /></label>
      <label className="space-y-2 text-sm font-medium md:col-span-2">Por qué sirve<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border bg-background px-3 py-2" placeholder="Explica qué debe demostrar esta evidencia y qué período debería cubrir." /></label>
      <label className="space-y-2 text-sm font-medium">Fecha objetivo<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2" /></label>
      <div className="flex items-end justify-end"><Button type="submit" disabled={busy === 'create'}>{busy === 'create' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Crear solicitud</Button></div>
    </form>}

    {feedback && <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{feedback}</div>}

    {!requests.length ? <div className="mt-6 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Aún no hay solicitudes. Crea la primera desde un control para comenzar el circuito verificable.</div> : <div className="mt-6 space-y-4">{requests.map((item) => {
      const candidates = evidence.filter((e) => e.projectId === item.projectId)
      return <article key={item.id} className="rounded-xl border border-border bg-background p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass[item.status] || statusClass.open}`}>{statusLabel[item.status] || item.status}</span>{item.controlName && <span className="text-xs text-muted-foreground">Control: {item.controlName}</span>}</div><h3 className="mt-3 font-bold">{item.title}</h3>{item.description && <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>}</div>{item.dueAt && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{new Date(item.dueAt).toLocaleDateString('es-CL')}</span>}</div>
        <div className="mt-4 grid gap-2 text-xs text-muted-foreground md:grid-cols-3"><span>Responsable: {item.requestedFromName || 'Sin asignar'}</span><span>Expediente: {item.caseTitle || 'Sin expediente'}</span><span>Evidencia: {item.submittedEvidenceName || 'Pendiente'}</span></div>
        {['open','changes_requested'].includes(item.status) && <div className="mt-4 flex flex-col gap-2 sm:flex-row"><select id={`evidence-${item.id}`} className="min-h-11 flex-1 rounded-lg border bg-background px-3 text-sm"><option value="">Selecciona evidencia para entregar</option>{candidates.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select><Button variant="outline" disabled={busy === item.id} onClick={() => submitEvidence(item.id, (document.getElementById(`evidence-${item.id}`) as HTMLSelectElement)?.value || '')}><Send className="mr-2 h-4 w-4" />Entregar</Button></div>}
        {['submitted','under_review'].includes(item.status) && <div className="mt-4 flex flex-wrap gap-2"><Button disabled={busy === item.id} onClick={() => review(item.id, 'accepted')}><CheckCircle2 className="mr-2 h-4 w-4" />Aceptar</Button><Button variant="outline" disabled={busy === item.id} onClick={() => review(item.id, 'changes_requested')}><ShieldCheck className="mr-2 h-4 w-4" />Pedir cambios</Button><Button variant="outline" disabled={busy === item.id} onClick={() => review(item.id, 'rejected')}><XCircle className="mr-2 h-4 w-4" />Rechazar</Button></div>}
        {item.reviewComment && <div className="mt-4 rounded-lg bg-muted/60 p-3 text-xs"><strong>Revisión:</strong> {item.reviewComment}{item.reviewedByName ? ` · ${item.reviewedByName}` : ''}</div>}
      </article>
    })}</div>}
  </section>
}
