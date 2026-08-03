'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Bot, CheckCircle2, Clock3, LoaderCircle, Play, RotateCcw, Scale, XCircle } from 'lucide-react'
import { resolveDecisionAction, startCapabilityAction, startMissionAction } from './actions'

type Agent = {
  agent_id: string
  display_name: string
  role_name: string
  customer_promise: string
  review_boundary: string
}

type Decision = {
  id: string
  title: string
  description: string | null
  recommendation: string | null
  priority: string
  status: string
  requested_by_agent_id: string | null
  requested_at: string
}

type CapabilityAction = {
  id: string
  sequence: number
  status: string
  assigned_agent_id: string | null
  attempt_count: number
  error_message: string | null
  capability: { name: string; customer_outcome: string } | null
}

const agentNames: Record<string, string> = {
  isidora: 'Isidora', rodrigo: 'Rodrigo', javier: 'Javier', beatriz: 'Beatriz',
  veronica: 'Verónica', andres: 'Andrés', julieta: 'Julieta',
}

export function MissionControl({
  missionId,
  missionStatus,
  agents,
  decisions,
  capabilityActions,
}: {
  missionId: string
  missionStatus: string
  agents: Agent[]
  decisions: Decision[]
  capabilityActions: CapabilityAction[]
}) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const run = (operation: () => Promise<void>) => {
    setMessage(null)
    startTransition(async () => {
      try {
        await operation()
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Ocurrió un error inesperado.')
      }
    })
  }

  return (
    <div className="border-b border-border bg-muted/20">
      <div className="container mx-auto space-y-5 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Mission Control</p>
            <h2 className="mt-1 text-xl font-bold">Equipo IA, ejecución y decisiones humanas</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Kumplio coordina el trabajo por capacidades. Los workers entregan artefactos versionados y las decisiones críticas permanecen bajo control humano.
            </p>
          </div>
          {['ready', 'blocked'].includes(missionStatus) && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => startMissionAction(missionId))}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play className="mr-2 h-4 w-4" />
              {pending ? 'Iniciando misión…' : 'Iniciar misión y asignar equipo'}
            </button>
          )}
        </div>

        {message && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{message}</div>}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {agents.map((agent) => (
            <article key={agent.agent_id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-primary"><Bot className="h-4 w-4" /><p className="font-bold">{agent.display_name}</p></div>
              <p className="mt-2 text-xs font-semibold text-foreground">{agent.role_name}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{agent.customer_promise}</p>
            </article>
          ))}
        </div>

        {capabilityActions.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <LoaderCircle className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-bold">Ejecución de la misión</h3>
                <p className="text-sm text-muted-foreground">Inicia el siguiente trabajo disponible. La entrega será recibida desde un worker autorizado, no inventada por la interfaz.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {capabilityActions.map((runItem) => (
                <article key={runItem.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paso {runItem.sequence} · {agentNames[runItem.assigned_agent_id || ''] || runItem.assigned_agent_id || 'Sin asignar'}</p>
                      <h4 className="mt-1 font-bold">{runItem.capability?.name || 'Capacidad especializada'}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{runItem.capability?.customer_outcome}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                      {runItem.status === 'ready' ? 'Lista' : runItem.status === 'running' ? 'En ejecución' : runItem.status === 'review_required' ? 'En revisión' : 'Reintento disponible'}
                    </span>
                  </div>
                  {runItem.error_message && <p className="mt-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">{runItem.error_message}</p>}
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{runItem.attempt_count} intento{runItem.attempt_count === 1 ? '' : 's'}</span>
                    {['ready', 'failed'].includes(runItem.status) && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => startCapabilityAction(missionId, runItem.id))}
                        className="inline-flex items-center rounded-lg bg-primary px-3 py-2 font-bold text-primary-foreground disabled:opacity-50"
                      >
                        <Play className="mr-1.5 h-3.5 w-3.5" />{runItem.status === 'failed' ? 'Reintentar' : 'Iniciar trabajo'}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {decisions.length > 0 && (
          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-amber-600" />
              <div><h3 className="font-bold">Bandeja de decisiones</h3><p className="text-sm text-muted-foreground">Revisa el contexto y deja registrada la razón de tu decisión.</p></div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {decisions.map((decision) => (
                <article key={decision.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600"><AlertTriangle className="h-3.5 w-3.5" />Prioridad {decision.priority}</div>
                      <h4 className="mt-2 font-bold">{decision.title}</h4>
                    </div>
                    <span className="inline-flex items-center text-xs text-muted-foreground"><Clock3 className="mr-1 h-3.5 w-3.5" /> Pendiente</span>
                  </div>
                  {decision.description && <p className="mt-3 text-sm text-muted-foreground">{decision.description}</p>}
                  {decision.recommendation && <div className="mt-3 rounded-lg bg-muted/60 p-3 text-sm"><span className="font-semibold">Recomendación de {agentNames[decision.requested_by_agent_id || ''] || decision.requested_by_agent_id || 'Kumplio'}:</span>{' '}{decision.recommendation}</div>}
                  <textarea
                    value={notes[decision.id] || ''}
                    onChange={(event) => setNotes((current) => ({ ...current, [decision.id]: event.target.value }))}
                    placeholder="Fundamento obligatorio de la decisión"
                    className="mt-4 min-h-20 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                  />
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <DecisionButton disabled={pending} icon={CheckCircle2} label="Aprobar" onClick={() => run(() => resolveDecisionAction(missionId, decision.id, 'approved', notes[decision.id] || ''))} />
                    <DecisionButton disabled={pending} icon={RotateCcw} label="Pedir cambios" onClick={() => run(() => resolveDecisionAction(missionId, decision.id, 'changes_requested', notes[decision.id] || ''))} />
                    <DecisionButton disabled={pending} icon={XCircle} label="Rechazar" onClick={() => run(() => resolveDecisionAction(missionId, decision.id, 'rejected', notes[decision.id] || ''))} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function DecisionButton({ icon: Icon, label, disabled, onClick }: { icon: typeof CheckCircle2; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-bold transition hover:border-primary hover:bg-primary/5 disabled:opacity-50">
      <Icon className="mr-1.5 h-3.5 w-3.5" />{label}
    </button>
  )
}
