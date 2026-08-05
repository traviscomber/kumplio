'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock3, FileSearch, ShieldCheck, Users } from 'lucide-react'
import { AGENT_CATALOG } from '@/lib/agents/catalog'
import { buildOrchestrationPlan, type UserAudience } from '@/lib/agents/orchestrator'

const EXAMPLES = [
  'Preparar mi empresa para la Ley 21.719',
  'Revisar un contrato antes de firmarlo',
  'Contratar correctamente a mi primer trabajador',
  'Preparar una auditoría con la evidencia disponible',
]

const AUDIENCES: Array<{ value: UserAudience; label: string }> = [
  { value: 'person', label: 'Persona' },
  { value: 'company', label: 'Empresa' },
  { value: 'professional', label: 'Profesional' },
  { value: 'industry', label: 'Industria' },
]

export function CaseResolutionStudio() {
  const [goal, setGoal] = useState('')
  const [audience, setAudience] = useState<UserAudience>('company')
  const [started, setStarted] = useState(false)

  const plan = useMemo(() => {
    if (!started || goal.trim().length < 8) return null
    return buildOrchestrationPlan({ goal, audience })
  }, [audience, goal, started])

  function startCase() {
    if (goal.trim().length < 8) return
    setStarted(true)
  }

  if (plan) {
    return (
      <div className="space-y-6">
        <header className="rounded-[28px] border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Nuevo caso</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">{plan.goal}</h1>
              <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
                Kumplio interpretó el objetivo y preparó el equipo de trabajo. Todavía no se han ejecutado análisis ni generado hallazgos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStarted(false)}
              className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-muted"
            >
              Cambiar objetivo
            </button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <SummaryItem icon={<Users className="h-5 w-5" />} label="Especialistas asignados" value={String(plan.tasks.length)} />
            <SummaryItem icon={<Clock3 className="h-5 w-5" />} label="Estado" value="Listo para ejecutar" />
            <SummaryItem icon={<ShieldCheck className="h-5 w-5" />} label="Revisión final" value="Julieta" />
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[28px] border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Equipo preparado</p>
                <h2 className="mt-2 text-2xl font-black">Trabajo propuesto para este caso</h2>
              </div>
              <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">Sin ejecución simulada</span>
            </div>

            <div className="mt-7 space-y-4">
              {plan.tasks.map((task) => {
                const agent = AGENT_CATALOG.find((item) => item.id === task.agentId)
                return (
                  <article key={`${task.agentId}-${task.order}`} className="rounded-2xl border bg-background/50 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-black text-primary">
                        {task.order}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-black">{agent?.name ?? task.agentId}</p>
                            <p className="text-sm text-muted-foreground">{task.title}</p>
                          </div>
                          <span className="mt-2 inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground sm:mt-0">Preparado</span>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-muted-foreground">{task.description}</p>
                        <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span><strong>Resultado esperado:</strong> {task.visibleOutcome}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] border bg-card p-6 shadow-sm">
              <FileSearch className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-xl font-black">Contexto que falta</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Antes de ejecutar, Kumplio debe pedir únicamente la información necesaria.</p>
              <ul className="mt-5 space-y-3">
                {plan.missingContext.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[28px] border border-primary/20 bg-primary/5 p-6">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-xl font-black">Lo que recibirás</h2>
              <div className="mt-5 space-y-3 text-sm">
                <Outcome label="Prioridades claras" />
                <Outcome label="Plan guiado" />
                <Outcome label="Fuentes y supuestos visibles" />
                <Outcome label="Revisión humana requerida" />
              </div>
              <button type="button" disabled className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground opacity-60">
                Ejecutar caso <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">La ejecución se habilitará cuando este flujo se conecte al motor persistente de casos y workflows.</p>
            </section>
          </aside>
        </div>
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-[32px] border bg-card shadow-sm">
      <div className="bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_44%)] px-6 py-12 sm:px-10 sm:py-16">
        <p className="text-sm font-bold text-primary">Nuevo caso</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Sal con un plan claro.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          Describe el resultado que necesitas. Kumplio preparará el equipo adecuado, pedirá el contexto mínimo y estructurará el trabajo antes de ejecutar.
        </p>

        <div className="mt-9 grid gap-3 sm:grid-cols-4">
          {AUDIENCES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setAudience(item.value)}
              className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${audience === item.value ? 'border-primary bg-primary/10 text-foreground' : 'bg-background/60 text-muted-foreground hover:border-primary/40'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border bg-background/80 p-4 shadow-sm sm:p-5">
          <label htmlFor="case-goal" className="text-sm font-bold">¿Qué quieres conseguir?</label>
          <textarea
            id="case-goal"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            rows={4}
            placeholder="Describe el resultado que necesitas, no la herramienta que quieres usar..."
            className="mt-3 w-full resize-none bg-transparent text-lg leading-8 outline-none placeholder:text-muted-foreground/70"
          />
          <div className="mt-4 flex justify-end border-t pt-4">
            <button
              type="button"
              onClick={startCase}
              disabled={goal.trim().length < 8}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Preparar el caso <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button key={example} type="button" onClick={() => setGoal(example)} className="rounded-full border bg-background/50 px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 border-t px-6 py-8 sm:grid-cols-4 sm:px-10">
        <Benefit title="Ahorra tiempo" description="Evita partir revisando fuentes y documentos sin orden." />
        <Benefit title="Reduce errores" description="Separa hechos, supuestos y preguntas abiertas." />
        <Benefit title="Sigue un plan" description="Recibe pasos priorizados y criterios de cierre." />
        <Benefit title="Conserva respaldo" description="Mantiene fuentes, evidencia y decisiones trazables." />
      </div>
    </section>
  )
}

function SummaryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border bg-background/50 p-4"><div className="text-primary">{icon}</div><p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-1 font-black">{value}</p></div>
}

function Outcome({ label }: { label: string }) {
  return <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /><span>{label}</span></div>
}

function Benefit({ title, description }: { title: string; description: string }) {
  return <div><p className="font-black">{title}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>
}
