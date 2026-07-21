'use client'

import { useEffect, useState } from 'react'
import { BrainCircuit, Check, History, Loader2, Play, RotateCcw, ShieldCheck, X } from 'lucide-react'
import { AGENT_CATALOG, type AgentId } from '@/lib/agents/catalog'
import { Button } from '@/components/ui/button'

type RunSummary = {
  id: string
  agent_id: AgentId
  status: string
  task: string
  output_payload: unknown
  output_text: string | null
  model: string | null
  prompt_version: string | null
  schema_version: string | null
  total_tokens: number | null
  elapsed_ms: number | null
  error_code: string | null
  created_at: string
}

type ResultMeta = {
  runId?: string
  model?: string
  elapsedMs?: number
  totalTokens?: number
  status?: string
}

export function AgentsWorkbench() {
  const [agentId, setAgentId] = useState<AgentId>('isidora')
  const [task, setTask] = useState('')
  const [context, setContext] = useState('')
  const [output, setOutput] = useState('')
  const [meta, setMeta] = useState<ResultMeta | null>(null)
  const [history, setHistory] = useState<RunSummary[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [reviewing, setReviewing] = useState(false)

  const selected = AGENT_CATALOG.find((agent) => agent.id === agentId)!

  async function loadHistory() {
    setHistoryLoading(true)
    try {
      const response = await fetch('/api/agents/runs?limit=30', { cache: 'no-store' })
      const data = await response.json()
      if (response.ok) setHistory(data.runs || [])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    void loadHistory()
  }, [])

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
      setOutput(data.result.outputText)
      setMeta({
        runId: data.runId,
        model: data.result.model,
        elapsedMs: data.elapsedMs,
        totalTokens: data.result.usage?.totalTokens,
        status: data.status,
      })
      await loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  function openRun(run: RunSummary) {
    setAgentId(run.agent_id)
    setTask(run.task)
    setContext('')
    setOutput(run.output_text || JSON.stringify(run.output_payload, null, 2))
    setMeta({
      runId: run.id,
      model: run.model || undefined,
      elapsedMs: run.elapsed_ms || undefined,
      totalTokens: run.total_tokens || undefined,
      status: run.status,
    })
    setError('')
  }

  async function reviewRun(decision: 'approved' | 'rejected' | 'changes_requested') {
    if (!meta?.runId) return
    setReviewing(true)
    setError('')
    try {
      const response = await fetch(`/api/agents/runs/${meta.runId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible guardar la revisión')
      setMeta((current) => current ? { ...current, status: data.status } : current)
      await loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setReviewing(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-6">
        <div className="space-y-3">
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
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><History className="h-4 w-4 text-primary" /><p className="font-semibold">Historial</p></div>
            <button type="button" onClick={() => void loadHistory()} aria-label="Actualizar historial"><RotateCcw className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto">
            {historyLoading ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Cargando ejecuciones…</p>
            ) : history.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No hay ejecuciones persistidas.</p>
            ) : history.map((run) => (
              <button key={run.id} type="button" onClick={() => openRun(run)} className="w-full rounded-lg border border-border bg-background p-3 text-left hover:border-primary/40">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">{AGENT_CATALOG.find((agent) => agent.id === run.agent_id)?.name || run.agent_id}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{run.status}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{run.task}</p>
                <p className="mt-2 text-[10px] text-muted-foreground">{new Date(run.created_at).toLocaleString('es-CL')}</p>
              </button>
            ))}
          </div>
        </div>
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="font-semibold">Resultado de {selected.name}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {meta?.model}{meta?.elapsedMs ? ` · ${(meta.elapsedMs / 1000).toFixed(1)} s` : ''}{meta?.totalTokens ? ` · ${meta.totalTokens} tokens` : ''}
                </p>
              </div>
              {meta?.status && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{meta.status}</span>}
            </div>
            <pre className="max-h-[720px] overflow-auto whitespace-pre-wrap text-xs leading-6 text-foreground">{output}</pre>
            {meta?.runId && ['pending_review', 'completed', 'approved', 'rejected'].includes(meta.status || '') && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                <Button size="sm" onClick={() => void reviewRun('approved')} disabled={reviewing}><Check className="mr-2 h-4 w-4" />Aprobar</Button>
                <Button size="sm" variant="outline" onClick={() => void reviewRun('changes_requested')} disabled={reviewing}><RotateCcw className="mr-2 h-4 w-4" />Solicitar cambios</Button>
                <Button size="sm" variant="destructive" onClick={() => void reviewRun('rejected')} disabled={reviewing}><X className="mr-2 h-4 w-4" />Rechazar</Button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
