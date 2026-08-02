'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ArrowRight, BriefcaseBusiness, Loader2, Plus, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CaseItem = {
  id: string
  title: string
  description: string | null
  status: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  project_id: string | null
  created_at: string
  updated_at: string
}

type ProjectOption = {
  id: string
  name: string
}

type CasesWorkspaceProps = {
  cases: CaseItem[]
  projects: ProjectOption[]
}

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
} as const

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  pending_review: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  archived: 'Archivado',
}

export function CasesWorkspace({ cases, projects }: CasesWorkspaceProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(cases.length === 0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<CaseItem['priority']>('medium')
  const [projectId, setProjectId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  )

  async function createCase() {
    if (title.trim().length < 3) return
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priority,
          projectId: projectId || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible crear el caso')

      setTitle('')
      setDescription('')
      setPriority('medium')
      setProjectId('')
      setShowForm(false)
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
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <BriefcaseBusiness className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-[0.16em]">Expedientes activos</p>
          </div>
          <h2 className="mt-2 text-2xl font-bold">Casos de cumplimiento</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cada caso reúne fuentes, obligaciones, agentes, revisiones y decisiones en un solo expediente trazable.
          </p>
        </div>
        <Button onClick={() => setShowForm((current) => !current)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo caso
        </Button>
      </div>

      {showForm && (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2 lg:col-span-2">
              <label htmlFor="case-title" className="text-sm font-semibold">Nombre del caso</label>
              <input
                id="case-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej.: Preparación Ley 21.719 — área comercial"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label htmlFor="case-description" className="text-sm font-semibold">Objetivo y alcance</label>
              <textarea
                id="case-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Describe qué se evaluará, qué unidades participan y cuál es la decisión esperada."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="case-project" className="text-sm font-semibold">Ámbito asociado</label>
              <select
                id="case-project"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sin ámbito específico</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="case-priority" className="text-sm font-semibold">Prioridad</label>
              <select
                id="case-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as CaseItem['priority'])}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
          </div>

          {error && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={() => void createCase()} disabled={submitting || title.trim().length < 3}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear expediente
            </Button>
          </div>
        </section>
      )}

      {cases.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
          <h3 className="mt-4 text-xl font-bold">Todavía no hay casos</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Crea el primer expediente para ordenar el análisis, las fuentes y la revisión humana alrededor de un objetivo concreto.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {cases.map((item) => (
            <Link
              key={item.id}
              href={`/cases/${item.id}`}
              className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                      {statusLabels[item.status] || item.status}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                      Prioridad {priorityLabels[item.priority]}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold group-hover:text-primary">{item.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {item.description || 'Expediente sin descripción de alcance.'}
                  </p>
                </div>
                <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
                <span>{item.project_id ? projectsById.get(item.project_id) || 'Ámbito asociado' : 'Caso transversal'}</span>
                <span>Actualizado {new Date(item.updated_at || item.created_at).toLocaleDateString('es-CL')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
