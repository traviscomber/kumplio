'use client'

import { useState } from 'react'
import { BrainCircuit, Loader2, Play, ShieldCheck } from 'lucide-react'
import { AGENT_CATALOG, type AgentId } from '@/lib/agents/catalog'
import { Button } from '@/components/ui/button'

export function AgentsWorkbench() {
  const [agentId, setAgentId] = useState<AgentId>('isidora')
  const [task, setTask] = useState('')
  const [context, setContext] = useState('')
  const [output, setOutput] = useState('')
  const [meta, setMeta] = useState<{ model?: string; elapsedMs?: number } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selected = AGENT_CATALOG.find((agent) => agent.id === agentId)!

  async function executeAgent() {
    if (task.trim().length < 10) return
    setLoading(true)
    setError('')
    setOutput('')
    setMeta(null)

    try {
      const response = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, task, context }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible ejecutar el agente')
      setOutput(data.result.output)
      setMeta({ model: data.result.model, elapsedMs: data.elapsedMs })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-3">
        {AGENT_CATALOG.map((agent) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => setAgentId(agent.id)}
            className={`w-full rounded-xl border p-4 text-left transition ${agent.id === agentId ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{agent.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{agent.role}</p>
              </div>
              <BrainCircuit className="h-5 w-5 shrink-0 text-primary" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {agent.skills.slice(0, 3).map((skill) => <span key={skill} className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">{skill}</span>)}
            </div>
          </button>
        ))}
      </aside>

      <section className="space-y-6 rounded-2xl border border-border bg-card p-6 md:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{selected.name}</p>
          <h1 className="mt-2 text-3xl font-bold">{selected.role}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{selected.mission}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm font-semibold">Skills</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{selected.skills.map((item) => <li key={item}>• {item}</li>)}</ul>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm font-semibold">Entregables</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{selected.delivers.map((item) => <li key={item}>• {item}</li>)}</ul>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="agent-task" className="text-sm font-semibold">Tarea</label>
          <textarea id="agent-task" value={task} onChange={(event) => setTask(event.target.value)} rows={5} placeholder="Describe la decisión, análisis o entregable que necesitas..." className="w-full rounded-xl border border-border bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div className="space-y-2">
          <label htmlFor="agent-context" className="text-sm font-semibold">Contexto y evidencia</label>
          <textarea id="agent-context" value={context} onChange={(event) => setContext(event.target.value)} rows={9} placeholder="Pega obligaciones, hallazgos, fuentes, cifras, políticas, contratos o supuestos. El agente marcará lo que no esté sustentado." className="w-full rounded-xl border border-border bg-background p-4 font-mono text-xs outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{selected.reviewRequired}</span></div>
          <Button onClick={executeAgent} disabled={loading || task.trim().length < 10} size="lg">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            {loading ? 'Razonando...' : 'Ejecutar agente'}
          </Button>
        </div>

        {error && <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        {output && (
          <div className="rounded-xl border border-primary/30 bg-background p-5 md:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
              <p className="font-semibold">Resultado de {selected.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{meta?.model}{meta?.elapsedMs ? ` · ${(meta.elapsedMs / 1000).toFixed(1)} s` : ''}</p>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">{output}</div>
          </div>
        )}
      </section>
    </div>
  )
}
