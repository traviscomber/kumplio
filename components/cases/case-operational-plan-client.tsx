'use client'

import Link from 'next/link'
import { FormEvent, type ReactNode, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  Loader2,
  ShieldCheck,
  UserRoundCheck,
  X,
} from 'lucide-react'

export type OperationalPlanProject = { id: string; name: string }
export type OperationalPlanPlaybook = { id: string; name: string; objective: string | null }
export type OperationalPlanMember = { id: string; name: string; role: string }
export type ExistingOperationalMission = {
  id: string
  title: string
  status: string
  dueAt: string | null
  ownerName: string | null
}
export type ExistingEvidenceRequest = {
  id: string
  title: string
  status: string
  dueAt: string | null
  ownerName: string | null
}

type Props = {
  caseId: string
  caseTitle: string
  caseDescription: string | null
  caseProjectId: string | null
  projects: OperationalPlanProject[]
  playbooks: OperationalPlanPlaybook[]
  members: OperationalPlanMember[]
  defaultOwnerId: string
  canCreate: boolean
  existingMission: ExistingOperationalMission | null
  existingRequest: ExistingEvidenceRequest | null
}

type Result = {
  missionId: string
  evidenceRequestId: string
  resumed: boolean
}

const CONTROL_CLASS = 'min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground'

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  ready: 'Lista para iniciar',
  active: 'En curso',
  blocked: 'Bloqueada',
  in_review: 'En revisión',
  completed: 'Completada',
  open: 'Pendiente de entrega',
  submitted: 'Entregada',
  under_review: 'En revisión',
  accepted: 'Aceptada',
  changes_requested: 'Cambios solicitados',
}

export function CaseOperationalPlanClient({
  caseId,
  caseTitle,
  caseDescription,
  caseProjectId,
  projects,
  playbooks,
  members,
  defaultOwnerId,
  canCreate,
  existingMission,
  existingRequest,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [projectId, setProjectId] = useState(caseProjectId || projects[0]?.id || '')
  const [playbookId, setPlaybookId] = useState(playbooks[0]?.id || '')
  const [ownerId, setOwnerId] = useState(defaultOwnerId)
  const [missionTitle, setMissionTitle] = useState(existingMission?.title || `Ejecutar: ${caseTitle}`.slice(0, 160))
  const [missionObjective, setMissionObjective] = useState(
    caseDescription?.trim()
      || 'Organizar responsables, plazos, evidencia y criterios de cierre para resolver este expediente de forma verificable.',
  )
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high')
  const [missionDueDate, setMissionDueDate] = useState(dateInputValue(existingMission?.dueAt) || dateAfterDays(14))
  const [evidenceTitle, setEvidenceTitle] = useState(
    existingRequest?.title || 'Inventario de datos, procesos, responsables y terceros vinculados al expediente',
  )
  const [evidenceDescription, setEvidenceDescription] = useState(
    'Centralizar un respaldo vigente que identifique el alcance, los responsables, los sistemas, los terceros y la ubicación de la evidencia disponible.',
  )
  const [evidenceDueDate, setEvidenceDueDate] = useState(dateInputValue(existingRequest?.dueAt) || dateAfterDays(7))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const complete = Boolean(existingMission && existingRequest)
  const selectedPlaybook = useMemo(
    () => playbooks.find((playbook) => playbook.id === playbookId) || null,
    [playbookId, playbooks],
  )

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/cases/${caseId}/operational-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          playbookId,
          ownerId,
          missionTitle,
          missionObjective,
          priority,
          missionDueAt: new Date(`${missionDueDate}T23:59:59-04:00`).toISOString(),
          evidenceTitle,
          evidenceDescription,
          evidenceDueAt: new Date(`${evidenceDueDate}T18:00:00-04:00`).toISOString(),
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No fue posible crear el plan operativo.')

      setResult({
        missionId: String(payload.missionId),
        evidenceRequestId: String(payload.evidenceRequestId),
        resumed: Boolean(payload.resumed),
      })
      router.refresh()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'No fue posible crear el plan operativo.')
    } finally {
      setLoading(false)
    }
  }

  if (!canCreate && !existingMission && !existingRequest) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 inline-flex min-h-12 items-center gap-2 rounded-full border border-primary/25 bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
      >
        {complete ? <CheckCircle2 className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
        {complete ? 'Plan operativo' : 'Convertir en plan operativo'}
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="operational-plan-title"
            className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] border bg-background shadow-2xl sm:max-w-3xl sm:rounded-[28px]"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b bg-background/95 p-5 backdrop-blur sm:p-7">
              <div>
                <p className="text-sm font-bold text-primary">Del análisis a la ejecución</p>
                <h2 id="operational-plan-title" className="mt-1 text-2xl font-black">Plan operativo del expediente</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Crea en una sola operación una misión con responsable y plazo, además de la primera solicitud de evidencia necesaria para demostrar avance.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded-full border p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-6 p-5 sm:p-7">
              {(existingMission || existingRequest || result) && (
                <section className="grid gap-4 sm:grid-cols-2">
                  <StatusCard
                    icon={ClipboardList}
                    label="Misión"
                    title={existingMission?.title || missionTitle}
                    status={existingMission?.status || (result ? 'ready' : 'pending')}
                    dueAt={existingMission?.dueAt || (result ? `${missionDueDate}T23:59:59-04:00` : null)}
                    owner={existingMission?.ownerName || members.find((member) => member.id === ownerId)?.name || null}
                    href={existingMission?.id ? `/missions/${existingMission.id}` : result ? `/missions/${result.missionId}` : null}
                  />
                  <StatusCard
                    icon={FileQuestion}
                    label="Solicitud de evidencia"
                    title={existingRequest?.title || evidenceTitle}
                    status={existingRequest?.status || (result ? 'open' : 'pending')}
                    dueAt={existingRequest?.dueAt || (result ? `${evidenceDueDate}T18:00:00-04:00` : null)}
                    owner={existingRequest?.ownerName || members.find((member) => member.id === ownerId)?.name || null}
                    href="/evidence"
                  />
                </section>
              )}

              {result && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-800 dark:text-emerald-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-black">{result.resumed ? 'Plan existente recuperado.' : 'Plan operativo creado.'}</p>
                      <p className="mt-1 leading-6">El Escritorio y Seguimiento ya pueden priorizar esta misión y su solicitud de evidencia.</p>
                    </div>
                  </div>
                </div>
              )}

              {!complete && !result && canCreate && (
                <form onSubmit={submit} className="space-y-6">
                  <section className="rounded-2xl border bg-card p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-black">1. Contexto y resultado</h3>
                        <p className="text-sm text-muted-foreground">Vincula el expediente a un ámbito y elige el playbook que organizará el trabajo.</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <Field label="Ámbito">
                        <select value={projectId} onChange={(event) => setProjectId(event.target.value)} disabled={Boolean(caseProjectId)} required className={CONTROL_CLASS}>
                          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                        </select>
                      </Field>
                      <Field label="Playbook">
                        <select value={playbookId} onChange={(event) => {
                          setPlaybookId(event.target.value)
                          const playbook = playbooks.find((item) => item.id === event.target.value)
                          if (playbook?.objective && !caseDescription?.trim()) setMissionObjective(playbook.objective)
                        }} required className={CONTROL_CLASS}>
                          {playbooks.map((playbook) => <option key={playbook.id} value={playbook.id}>{playbook.name}</option>)}
                        </select>
                      </Field>
                      <Field label="Nombre de la misión" wide>
                        <input value={missionTitle} onChange={(event) => setMissionTitle(event.target.value)} minLength={3} maxLength={160} required className={CONTROL_CLASS} />
                      </Field>
                      <Field label="Objetivo verificable" wide>
                        <textarea value={missionObjective} onChange={(event) => setMissionObjective(event.target.value)} rows={3} maxLength={3000} className={`${CONTROL_CLASS} py-3`} placeholder={selectedPlaybook?.objective || 'Qué debe quedar resuelto y demostrado.'} />
                      </Field>
                    </div>
                  </section>

                  <section className="rounded-2xl border bg-card p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <UserRoundCheck className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-black">2. Responsable y fechas</h3>
                        <p className="text-sm text-muted-foreground">La evidencia debe llegar antes o el mismo día del cierre de la misión.</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <Field label="Responsable">
                        <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} required className={CONTROL_CLASS}>
                          {members.map((member) => <option key={member.id} value={member.id}>{member.name} · {roleLabel(member.role)}</option>)}
                        </select>
                      </Field>
                      <Field label="Prioridad">
                        <select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)} className={CONTROL_CLASS}>
                          <option value="low">Baja</option>
                          <option value="medium">Media</option>
                          <option value="high">Alta</option>
                          <option value="critical">Crítica</option>
                        </select>
                      </Field>
                      <Field label="Cierre de misión">
                        <input
                          type="date"
                          value={missionDueDate}
                          onChange={(event) => {
                            const value = event.target.value
                            setMissionDueDate(value)
                            if (evidenceDueDate > value) setEvidenceDueDate(value)
                          }}
                          min={dateAfterDays(1)}
                          required
                          className={CONTROL_CLASS}
                        />
                      </Field>
                    </div>
                  </section>

                  <section className="rounded-2xl border bg-card p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <FileQuestion className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-black">3. Primera evidencia</h3>
                        <p className="text-sm text-muted-foreground">Pide un respaldo concreto y deja claro qué debe demostrar.</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <Field label="Qué necesitamos" wide>
                        <input value={evidenceTitle} onChange={(event) => setEvidenceTitle(event.target.value)} minLength={3} maxLength={180} required className={CONTROL_CLASS} />
                      </Field>
                      <Field label="Qué debe demostrar" wide>
                        <textarea value={evidenceDescription} onChange={(event) => setEvidenceDescription(event.target.value)} rows={3} maxLength={3000} className={`${CONTROL_CLASS} py-3`} />
                      </Field>
                      <Field label="Fecha de entrega">
                        <input type="date" value={evidenceDueDate} onChange={(event) => setEvidenceDueDate(event.target.value)} min={dateAfterDays(1)} max={missionDueDate} required className={CONTROL_CLASS} />
                      </Field>
                    </div>
                  </section>

                  {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => setOpen(false)} className="min-h-12 rounded-xl border px-5 py-3 text-sm font-bold hover:bg-muted">Cancelar</button>
                    <button type="submit" disabled={loading || !projectId || !playbookId || !ownerId} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardList className="mr-2 h-4 w-4" />}
                      Crear misión y solicitud
                    </button>
                  </div>
                </form>
              )}

              {complete && !result && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <p className="font-black">Este expediente ya tiene ejecución y evidencia solicitada.</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Continúa desde la misión o revisa la bandeja de evidencias. Volver a abrir este panel no crea duplicados.</p>
                </div>
              )}

              {!complete && !result && !canCreate && (
                <div className="rounded-2xl border bg-muted/40 p-5 text-sm text-muted-foreground">
                  Tu rol permite consultar este expediente, pero no crear ni asignar trabajo operativo.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={`space-y-2 text-sm font-bold ${wide ? 'sm:col-span-2' : ''}`}><span>{label}</span>{children}</label>
}

function StatusCard({
  icon: Icon,
  label,
  title,
  status,
  dueAt,
  owner,
  href,
}: {
  icon: typeof ClipboardList
  label: string
  title: string
  status: string
  dueAt: string | null
  owner: string | null
  href: string | null
}) {
  return (
    <article className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 text-primary"><Icon className="h-5 w-5" /><p className="text-xs font-black uppercase tracking-[0.14em]">{label}</p></div>
      <h3 className="mt-3 font-black">{title}</h3>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <p>{statusLabels[status] || status}</p>
        {owner && <p>Responsable: {owner}</p>}
        {dueAt && <p className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {new Date(dueAt).toLocaleDateString('es-CL')}</p>}
      </div>
      {href && <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-black text-primary hover:underline">Abrir <ArrowRight className="h-4 w-4" /></Link>}
    </article>
  )
}

function dateAfterDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateInputValue(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function roleLabel(role: string) {
  if (role === 'owner') return 'Propietario'
  if (role === 'admin') return 'Administrador'
  if (role === 'compliance') return 'Cumplimiento'
  if (role === 'reviewer') return 'Revisor'
  return 'Miembro'
}
