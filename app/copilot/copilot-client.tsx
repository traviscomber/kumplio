'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { ArrowRight, Bot, GitBranch, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import type { CopilotResponse } from '@/lib/compliance-copilot/engine'

const prompts = [
  '¿Qué cambió?',
  '¿Qué debo hacer ahora?',
  '¿Cuál es el mayor riesgo?',
  'Muéstrame evidencia vencida',
]

export function CopilotClient() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState<CopilotResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function ask(query: string) {
    const value = query.trim()
    if (!value) return
    setLoading(true)
    setError(null)
    try {
      const request = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: value }),
      })
      const data = await request.json()
      if (!request.ok) throw new Error(data.error || 'No fue posible consultar el Copilot.')
      setResponse(data as CopilotResponse)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible consultar el Copilot.')
    } finally {
      setLoading(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void ask(message)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr_0.72fr]">
      <aside className="rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <h2 className="font-bold">Consultas rápidas</h2>
        </div>
        <div className="mt-5 space-y-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => { setMessage(prompt); void ask(prompt) }}
              className="w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition hover:border-primary/40 hover:bg-primary/5"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/10 p-4 text-xs leading-5 text-primary">
          El Copilot consulta datos reales y no cambia estados, tareas ni cumplimiento automáticamente.
        </div>
      </aside>

      <section className="rounded-2xl border bg-card">
        <div className="border-b p-5">
          <form onSubmit={submit} className="flex gap-3">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Pregunta por impactos, riesgos, planes o evidencia..."
              className="min-w-0 flex-1 rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-primary/30 focus:ring-2"
            />
            <button
              type="submit"
              disabled={loading || message.trim().length < 3}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              Consultar
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>

        <div className="min-h-[480px] p-6">
          {!response ? (
            <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bot className="h-7 w-7" /></div>
              <h2 className="mt-5 text-xl font-extrabold">Pregunta sobre la operación de cumplimiento</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">La respuesta combinará impactos, grafo, planes y evidencia con trazabilidad y acciones disponibles.</p>
            </div>
          ) : (
            <div className="space-y-7">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {response.intent.replaceAll('_', ' ')}</span>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] tracking-normal">
                    {response.generation?.mode === 'llm_grounded' ? 'Redacción IA grounded' : 'Respuesta determinística'}
                  </span>
                </div>
                <p className="mt-4 text-xl font-semibold leading-8">{response.answer}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {response.facts.map((fact) => (
                  <article key={fact.label} className="rounded-xl border bg-background p-4">
                    <p className="text-xs font-semibold text-muted-foreground">{fact.label}</p>
                    <p className="mt-2 text-2xl font-extrabold">{fact.value}</p>
                  </article>
                ))}
              </div>

              {response.caveats && response.caveats.length > 0 && (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
                  <h3 className="text-sm font-bold text-amber-100">Límites y revisión</h3>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-amber-100/75">
                    {response.caveats.map((caveat) => <li key={caveat}>• {caveat}</li>)}
                  </ul>
                </div>
              )}

              {response.sources.length > 0 && (
                <div>
                  <h3 className="font-bold">Trazabilidad</h3>
                  <div className="mt-3 space-y-2">
                    {response.sources.map((source) => (
                      <div key={`${source.type}-${source.id}`} className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                        <GitBranch className="h-4 w-4 text-primary" />
                        <div className="min-w-0"><p className="font-semibold">{source.label}</p><p className="truncate text-xs text-muted-foreground">{source.type} · {source.id}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-bold">Acciones</h2>
          <div className="mt-4 space-y-2">
            {(response?.actions || []).map((action) => (
              <Link key={`${action.label}-${action.href}`} href={action.href} className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold hover:border-primary/40 hover:bg-primary/5">
                {action.label}<ArrowRight className="h-4 w-4" />
              </Link>
            ))}
            {response && response.actions.length === 0 && <p className="text-sm text-muted-foreground">No hay acciones disponibles para esta consulta.</p>}
            {!response && <p className="text-sm text-muted-foreground">Las acciones aparecerán después de una consulta.</p>}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-bold">Plan de ejecución</h2>
          <div className="mt-4 space-y-3">
            {(response?.plan || []).map((step, index) => (
              <div key={`${step.tool}-${index}`} className="flex gap-3 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                <div><p className="font-semibold">{step.tool}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{step.purpose}</p></div>
              </div>
            ))}
            {!response && <p className="text-sm text-muted-foreground">Aquí se mostrará qué herramientas consultó Kumplio.</p>}
          </div>
        </div>
      </aside>
    </div>
  )
}
