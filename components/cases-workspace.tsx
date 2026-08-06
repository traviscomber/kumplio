'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Activity, ArrowRight, BriefcaseBusiness, History, Loader2, Plus, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

type WorkflowSummary = {
  id: string
  status: string
  current_stage: number
  total_stages: number
  updated_at: string
}

type CaseItem = {
  id: string
  title: string
  description: string | null
  status: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  project_id: string | null
  created_at: string
  updated_at: string
  workflow: WorkflowSummary | null
}

type ProjectOption = { id: string; name: string }
type CasesWorkspaceProps = { cases: CaseItem[]; projects: ProjectOption[] }
type Filter = 'all' | 'working' | 'review' | 'blocked' | 'resolved'

const priorityLabels = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' } as const
const statusLabels: Record<string, string> = {
  draft: 'Preparado',
  active: 'En curso',
  pending_review: 'Necesita revisión',
  approved: 'Resuelto',
  rejected: 'Rechazado',
  archived: 'Archivado',
}
const workflowLabels: Record<string, string> = {
  draft: 'Preparado',
  queued: 'En cola',
  running: 'Trabajando',
  pending_review: 'Necesita tu decisión',
  paused: 'Esperando cambios',
  completed: 'Listo para cerrar',
  failed: 'Requiere reintento',
}

export function CasesWorkspace({ cases, projects }: CasesWorkspaceProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(cases.length === 0)
  const [filter, setFilter] = useState<Filter>('all')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<CaseItem['priority']>('medium')
  const [projectId, setProjectId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const projectsById = useMemo(() => new Map(projects.map((project) => [project.id, project.name])), [projects])
  const filteredCases = useMemo(() => cases.filter((item) => {
    if (filter === 'resolved') return item.status === 'approved'
    if (filter === 'review') return item.status === 'pending_review' || item.workflow?.status === 'pending_review'
    if (filter === 'blocked') return Boolean(item.workflow && ['failed', 'paused'].includes(item.workflow.status))
    if (filter === 'working') return Boolean(item.workflow && ['draft', 'queued', 'running'].includes(item.workflow.status))
    return true
  }), [cases, filter])

  const counts = useMemo(() => ({
    all: cases.length,
    working: cases.filter((item) => item.workflow && ['draft', 'queued', 'running'].includes(item.workflow.status)).length,
    review: cases.filter((item) => item.status === 'pending_review' || item.workflow?.status === 'pending_review').length,
    blocked: cases.filter((item) => item.workflow && ['failed', 'paused'].includes(item.workflow.status)).length,
    resolved: cases.filter((item) => item.status === 'approved').length,
  }), [cases])

  async function createCase() {
    if (title.trim().length < 3) return
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority, projectId: projectId || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible crear el caso')
      router.push(`/cases/${data.complianceCase.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <BriefcaseBusiness className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-[0.16em]">Tus casos</p>
          </div>
          <h2 className="mt-2 text-2xl font-black">Problemas en resolución, decisiones y cierres</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Ve qué está avanzando, qué necesita una decisión tuya, dónde hubo un bloqueo y qué ya quedó resuelto con respaldo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/cases/new"><Activity className="mr-2 h-4 w-4" />Resolver una situación</Link>
          </Button>
          <Button variant="outline" onClick={() => setShowForm((current) => !current)}>
            <Plus className="mr-2 h-4 w-4" />Crear expediente manual
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ['all', 'Todos'],
          ['working', 'Trabajando'],
          ['review', 'Necesitan decisión'],
          ['blocked', 'Con bloqueo'],
          ['resolved', 'Resueltos'],
        ] as Array<[Filter, string]>).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${filter === value ? 'border-primary bg-primary/10 text-foreground' : 'text-muted-foreground hover:border-primary/40'}`}
          >
            {label} · {counts[value]}
          </button>
        ))}
      </div>

      {showForm && (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="space-y-2 lg:col-span-2">
              <span className="text-sm font-semibold">Qué necesitas resolver</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej.: Preparar respuesta a una exigencia de un cliente"
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="space-y-2 lg:col-span-2">
              <span className="text-sm font-semibold">Contexto disponible</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Ámbito asociado</span>
              <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="w-full rounded-xl border bg-background px-4 py-3 text-sm">
                <option value="">Sin ámbito específico</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Prioridad</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value as CaseItem['priority'])} className="w-full rounded-xl border bg-background px-4 py-3 text-sm">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </label>
          </div>
          {error && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={() => void createCase()} disabled={submitting || title.trim().length < 3}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear expediente
            </Button>
          </div>
        </section>
      )}

      {filteredCases.length === 0 ? (
        <section className="rounded-2xl border border-dashed bg-card p-12 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
          <h3 className="mt-4 text-xl font-bold">No hay casos en esta vista</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Cambia el filtro o describe una nueva situación para resolver.</p>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredCases.map((item) => {
            const stageNumber = item.workflow ? Math.min(item.workflow.current_stage + 1, item.workflow.total_stages) : null
            return (
              <article key={item.id} className="rounded-2xl border bg-card p-6 transition hover:border-primary/40 hover:shadow-sm">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">{statusLabels[item.status] || item.status}</span>
                  {item.workflow && (
                    <span className="rounded-full border px-2.5 py-1 font-medium">
                      {workflowLabels[item.workflow.status] || item.workflow.status}{stageNumber ? ` · paso ${stageNumber}/${item.workflow.total_stages}` : ''}
                    </span>
                  )}
                  <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">Prioridad {priorityLabels[item.priority]}</span>
                </div>
                <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description || 'Este caso todavía no tiene contexto adicional.'}</p>
                <p className="mt-4 rounded-xl border bg-background/60 px-4 py-3 text-sm font-semibold">{caseMessage(item)}</p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
                  <span>{item.project_id ? projectsById.get(item.project_id) || 'Ámbito asociado' : 'Caso transversal'}</span>
                  <span>Actualizado {new Date(item.updated_at || item.created_at).toLocaleDateString('es-CL')}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href={`/cases/${item.id}`}>{primaryAction(item)}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                  {item.workflow && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/cases/${item.id}/live`}><History className="mr-2 h-4 w-4" />Trazabilidad</Link>
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function caseMessage(item: CaseItem) {
  if (item.status === 'approved') return 'El caso está resuelto y conserva su resultado, decisiones y evidencia.'
  if (!item.workflow) return 'Todavía no has iniciado el trabajo guiado para este expediente.'
  if (item.workflow.status === 'pending_review') return 'Existe un resultado esperando tu revisión antes de continuar.'
  if (item.workflow.status === 'failed') return 'Una etapa no pudo terminar. Puedes reintentarla sin perder lo ya validado.'
  if (item.workflow.status === 'paused') return 'Kumplio está esperando instrucciones para incorporar los cambios solicitados.'
  if (item.workflow.status === 'completed') return 'El análisis terminó y está listo para confirmar el cierre.'
  if (['draft', 'queued', 'running'].includes(item.workflow.status)) return 'Kumplio está organizando y ejecutando el trabajo de este caso.'
  return 'Abre el caso para revisar su estado y el siguiente paso.'
}

function primaryAction(item: CaseItem) {
  if (item.status === 'approved') return 'Ver resultado'
  if (!item.workflow) return 'Iniciar resolución'
  if (item.workflow.status === 'pending_review') return 'Revisar y decidir'
  if (['failed', 'paused'].includes(item.workflow.status)) return 'Resolver bloqueo'
  if (item.workflow.status === 'completed') return 'Confirmar cierre'
  return 'Continuar resolución'
}
