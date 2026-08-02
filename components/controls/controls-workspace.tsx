'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, CheckCircle2, Loader2, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Project = { id: string; name: string }
type Obligation = { id: string; projectId: string; title: string }
type Member = { id: string; name: string }

export type ControlListItem = {
  id: string
  projectId: string
  projectName: string
  name: string
  description: string | null
  objective: string | null
  nature: string
  mode: string
  frequency: string | null
  lifecycleStatus: string
  designEffectiveness: string
  operatingEffectiveness: string
  ownerName: string | null
  nextEvaluationAt: string | null
}

type Props = {
  projects: Project[]
  obligations: Obligation[]
  members: Member[]
  controls: ControlListItem[]
}

const effectivenessLabels: Record<string, string> = {
  not_evaluated: 'No evaluado',
  effective: 'Efectivo',
  partial: 'Parcial',
  ineffective: 'Inefectivo',
  not_applicable: 'No aplica',
}

const natureLabels: Record<string, string> = {
  preventive: 'Preventivo',
  detective: 'Detectivo',
  corrective: 'Correctivo',
}

const modeLabels: Record<string, string> = {
  manual: 'Manual',
  automated: 'Automatizado',
  hybrid: 'Híbrido',
}

export function ControlsWorkspace({ projects, obligations, members, controls }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(!controls.length)
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [objective, setObjective] = useState('')
  const [controlNature, setControlNature] = useState<'preventive' | 'detective' | 'corrective'>('preventive')
  const [executionMode, setExecutionMode] = useState<'manual' | 'automated' | 'hybrid'>('manual')
  const [frequency, setFrequency] = useState('monthly')
  const [ownerId, setOwnerId] = useState('')
  const [obligationId, setObligationId] = useState('')
  const [nextEvaluationDate, setNextEvaluationDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const projectObligations = useMemo(
    () => obligations.filter((obligation) => obligation.projectId === projectId),
    [obligations, projectId],
  )

  async function submitControl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)

    try {
      const response = await fetch('/api/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name,
          description: description || null,
          objective: objective || null,
          controlNature,
          executionMode,
          frequency: frequency || null,
          ownerId: ownerId || null,
          nextEvaluationAt: nextEvaluationDate ? `${nextEvaluationDate}T12:00:00.000Z` : null,
          obligationId: obligationId || null,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No fue posible crear el control.')

      setName('')
      setDescription('')
      setObjective('')
      setObligationId('')
      setNextEvaluationDate('')
      setFeedback({ type: 'success', message: 'Control creado y disponible para evaluación.' })
      setShowForm(false)
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible crear el control.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Catálogo operacional</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cada control conserva responsable, frecuencia y efectividad de diseño y operación.</p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)} className="gap-2">
          <Plus className="h-4 w-4" /> {showForm ? 'Cerrar formulario' : 'Crear control'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submitControl} className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Ámbito
              <select value={projectId} onChange={(event) => { setProjectId(event.target.value); setObligationId('') }} className="w-full rounded-lg border border-border bg-background px-3 py-2" required>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Obligación principal
              <select value={obligationId} onChange={(event) => setObligationId(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                <option value="">Sin obligación vinculada</option>
                {projectObligations.map((obligation) => <option key={obligation.id} value={obligation.id}>{obligation.title}</option>)}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium md:col-span-2">
              Nombre del control
              <input value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={180} className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Ej.: Revisión trimestral de accesos privilegiados" required />
            </label>

            <label className="space-y-2 text-sm font-medium md:col-span-2">
              Descripción
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Qué actividad se ejecuta, sobre qué población y qué registro deja." />
            </label>

            <label className="space-y-2 text-sm font-medium md:col-span-2">
              Objetivo de control
              <textarea value={objective} onChange={(event) => setObjective(event.target.value)} maxLength={2000} rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Qué riesgo u obligación busca cubrir." />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Naturaleza
              <select value={controlNature} onChange={(event) => setControlNature(event.target.value as typeof controlNature)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                <option value="preventive">Preventivo</option>
                <option value="detective">Detectivo</option>
                <option value="corrective">Correctivo</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Ejecución
              <select value={executionMode} onChange={(event) => setExecutionMode(event.target.value as typeof executionMode)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                <option value="manual">Manual</option>
                <option value="automated">Automatizado</option>
                <option value="hybrid">Híbrido</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Frecuencia
              <select value={frequency} onChange={(event) => setFrequency(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                <option value="continuous">Continua</option>
                <option value="event_driven">Por evento</option>
                <option value="daily">Diaria</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="semiannual">Semestral</option>
                <option value="annual">Anual</option>
                <option value="ad_hoc">Ad hoc</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Responsable
              <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                <option value="">Sin asignar</option>
                {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Próxima evaluación
              <input type="date" value={nextEvaluationDate} onChange={(event) => setNextEvaluationDate(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
          </div>

          {feedback && <div className={`mt-5 rounded-lg border p-3 text-sm ${feedback.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>{feedback.message}</div>}

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={loading || !projectId} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Guardar control
            </Button>
          </div>
        </form>
      )}

      {!controls.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <ShieldCheck className="mx-auto h-9 w-9 text-primary" />
          <p className="mt-4 font-semibold">Aún no hay controles.</p>
          <p className="mt-2 text-sm text-muted-foreground">Crea el primer control y vincúlalo con una obligación aplicable.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {controls.map((control) => (
            <article key={control.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{natureLabels[control.nature] || control.nature}</span>
                <span className="rounded-full bg-muted px-2.5 py-1">{modeLabels[control.mode] || control.mode}</span>
                <span className="rounded-full bg-muted px-2.5 py-1">{control.lifecycleStatus}</span>
              </div>
              <h3 className="mt-3 text-lg font-bold">{control.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{control.projectName}</p>
              {control.description && <p className="mt-3 text-sm leading-6 text-muted-foreground">{control.description}</p>}
              {control.objective && <p className="mt-3 rounded-lg bg-muted/50 p-3 text-xs leading-5"><strong>Objetivo:</strong> {control.objective}</p>}

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted-foreground">Diseño</dt><dd className="mt-1 font-semibold">{effectivenessLabels[control.designEffectiveness] || control.designEffectiveness}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Operación</dt><dd className="mt-1 font-semibold">{effectivenessLabels[control.operatingEffectiveness] || control.operatingEffectiveness}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Responsable</dt><dd className="mt-1 font-semibold">{control.ownerName || 'Sin asignar'}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Frecuencia</dt><dd className="mt-1 font-semibold">{control.frequency || 'Sin definir'}</dd></div>
              </dl>

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                {control.nextEvaluationAt ? <CalendarClock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                {control.nextEvaluationAt ? `Próxima evaluación: ${new Date(control.nextEvaluationAt).toLocaleDateString('es-CL')}` : 'Evaluación aún no programada'}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
