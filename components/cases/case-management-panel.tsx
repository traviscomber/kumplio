'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Loader2, Pencil, Save, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CaseStatus = 'draft' | 'active' | 'pending_review' | 'approved' | 'rejected' | 'archived'
type CasePriority = 'low' | 'medium' | 'high' | 'critical'

type ProjectOption = {
  id: string
  name: string
}

type MemberOption = {
  id: string
  name: string
  email: string
  role: string | null
}

type CaseManagementPanelProps = {
  complianceCase: {
    id: string
    title: string
    description: string | null
    status: CaseStatus
    priority: CasePriority
    projectId: string | null
    ownerId: string | null
    dueAt: string | null
  }
  projects: ProjectOption[]
  members: MemberOption[]
}

const statusOptions: Array<{ value: CaseStatus; label: string }> = [
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activo' },
  { value: 'pending_review', label: 'En revisión' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'archived', label: 'Archivado' },
]

const priorityOptions: Array<{ value: CasePriority; label: string }> = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
]

export function CaseManagementPanel({ complianceCase, projects, members }: CaseManagementPanelProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState(complianceCase.title)
  const [description, setDescription] = useState(complianceCase.description || '')
  const [status, setStatus] = useState<CaseStatus>(complianceCase.status)
  const [priority, setPriority] = useState<CasePriority>(complianceCase.priority)
  const [projectId, setProjectId] = useState(complianceCase.projectId || '')
  const [ownerId, setOwnerId] = useState(complianceCase.ownerId || '')
  const [dueAt, setDueAt] = useState(complianceCase.dueAt ? complianceCase.dueAt.slice(0, 10) : '')

  function reset() {
    setTitle(complianceCase.title)
    setDescription(complianceCase.description || '')
    setStatus(complianceCase.status)
    setPriority(complianceCase.priority)
    setProjectId(complianceCase.projectId || '')
    setOwnerId(complianceCase.ownerId || '')
    setDueAt(complianceCase.dueAt ? complianceCase.dueAt.slice(0, 10) : '')
    setError('')
    setEditing(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (title.trim().length < 3) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/cases/${complianceCase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          projectId: projectId || null,
          ownerId: ownerId || null,
          dueAt: dueAt || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible actualizar el expediente')

      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    const owner = members.find((member) => member.id === complianceCase.ownerId)
    const project = projects.find((item) => item.id === complianceCase.projectId)

    return (
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Gestión del expediente</p>
            <p className="mt-1 text-sm text-muted-foreground">Responsable, fecha objetivo y clasificación operacional.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-4">
            <dt className="flex items-center gap-2 text-muted-foreground"><UserRound className="h-4 w-4" />Responsable</dt>
            <dd className="mt-2 font-semibold">{owner?.name || 'Sin responsable asignado'}</dd>
            {owner?.email && <p className="mt-1 text-xs text-muted-foreground">{owner.email}</p>}
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <dt className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" />Fecha objetivo</dt>
            <dd className="mt-2 font-semibold">
              {complianceCase.dueAt ? new Date(complianceCase.dueAt).toLocaleDateString('es-CL') : 'Sin fecha definida'}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <dt className="text-muted-foreground">Ámbito</dt>
            <dd className="mt-2 font-semibold">{project?.name || 'Transversal'}</dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <dt className="text-muted-foreground">Estado operacional</dt>
            <dd className="mt-2 font-semibold">{statusOptions.find((item) => item.value === complianceCase.status)?.label}</dd>
          </div>
        </dl>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-primary/30 bg-card p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">Editar expediente</p>
            <p className="mt-1 text-sm text-muted-foreground">Los cambios quedarán registrados en la línea de tiempo.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={saving}>
            <X className="mr-2 h-4 w-4" />Cancelar
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold">Título</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              maxLength={160}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold">Alcance</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={3000}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold">Estado</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as CaseStatus)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold">Prioridad</span>
            <select value={priority} onChange={(event) => setPriority(event.target.value as CasePriority)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">
              {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold">Responsable</span>
            <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <option value="">Sin responsable</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.email}</option>)}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold">Fecha objetivo</span>
            <input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold">Ámbito</span>
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <option value="">Transversal</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
        </div>

        {error && <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving || title.trim().length < 3}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </section>
  )
}
