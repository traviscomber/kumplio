'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { buildOrchestrationPlan, workflowTypeForIntent, type UserAudience } from '@/lib/agents/orchestrator'

const EXAMPLES: Record<UserAudience, string[]> = {
  person: ['Voy a firmar un contrato', 'Me llegó una carta y no sé qué hacer', 'Quiero iniciar actividades correctamente'],
  company: ['Debo prepararme para una auditoría', 'Quiero revisar una obligación nueva', 'Necesito ordenar mi cumplimiento'],
  professional: ['Necesito preparar un informe para un cliente', 'Quiero revisar un contrato antes de entregarlo', 'Debo respaldar una recomendación'],
  industry: ['Necesito evaluar una exigencia sectorial', 'Quiero revisar controles críticos', 'Debo preparar evidencia para una fiscalización'],
}

const AUDIENCES: Array<{ value: UserAudience; label: string }> = [
  { value: 'person', label: 'Persona' },
  { value: 'company', label: 'Empresa' },
  { value: 'professional', label: 'Profesional' },
  { value: 'industry', label: 'Industria' },
]

type Step = 'idle' | 'case' | 'workflow' | 'execution' | 'opening'

const STEP_COPY: Record<Step, string> = {
  idle: 'Empezar',
  case: 'Creando el caso...',
  workflow: 'Preparando el equipo...',
  execution: 'Iniciando el trabajo...',
  opening: 'Abriendo tu caso...',
}

export function BetaCaseEntry() {
  const router = useRouter()
  const [goal, setGoal] = useState('')
  const [audience, setAudience] = useState<UserAudience>('company')
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState('')
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null)
  const busy = step !== 'idle'

  async function start() {
    if (busy || goal.trim().length < 8) return
    setError('')
    setCreatedCaseId(null)

    try {
      const plan = buildOrchestrationPlan({ goal: goal.trim(), audience })
      setStep('case')

      const caseResponse = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: plan.goal.slice(0, 160),
          description: [
            `Objetivo declarado: ${plan.goal}`,
            `Audiencia: ${plan.audience}`,
            `Intención interpretada: ${plan.intent}`,
          ].join('\n'),
          priority: 'medium',
        }),
      })
      const casePayload = await caseResponse.json()
      if (!caseResponse.ok) throw new Error(casePayload.error || 'No fue posible crear el caso')

      const caseId = casePayload.complianceCase?.id as string | undefined
      if (!caseId) throw new Error('El caso fue creado sin un identificador válido')
      setCreatedCaseId(caseId)
      setStep('workflow')

      const workflowResponse = await fetch('/api/agents/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          workflowType: workflowTypeForIntent(plan.intent),
          instructions: plan.goal,
        }),
      })
      const workflowPayload = await workflowResponse.json()
      if (!workflowResponse.ok) throw new Error(workflowPayload.error || 'El caso se creó, pero no fue posible preparar el equipo')

      const workflowId = workflowPayload.workflow?.id as string | undefined
      if (!workflowId) throw new Error('El workflow fue creado sin un identificador válido')
      setStep('execution')

      const advanceResponse = await fetch(`/api/agents/workflows/${workflowId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const advancePayload = await advanceResponse.json().catch(() => ({}))
      if (!advanceResponse.ok) throw new Error(advancePayload.error || 'El caso está listo, pero no fue posible iniciar la primera etapa')

      setStep('opening')
      router.push(`/cases/${caseId}/live`)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible iniciar el caso')
      setStep('idle')
    }
  }

  return (
    <section className="mx-auto max-w-5xl py-8 sm:py-16">
      <div className="text-center">
        <p className="text-sm font-bold text-primary">Kumplio</p>
        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
          Convierte una obligación compleja en un plan claro.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          Describe lo que necesitas. Kumplio prepara el caso, organiza el trabajo y conserva el respaldo de cada decisión.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-[28px] border bg-card p-5 shadow-sm sm:p-7">
        <div className="grid gap-2 sm:grid-cols-4">
          {AUDIENCES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setAudience(item.value)}
              disabled={busy}
              className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${audience === item.value ? 'border-primary bg-primary/10' : 'bg-background text-muted-foreground hover:border-primary/40'} disabled:opacity-60`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label htmlFor="case-goal" className="mt-6 block text-sm font-bold">¿Qué necesitas resolver?</label>
        <textarea
          id="case-goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          disabled={busy}
          rows={5}
          placeholder="Ej.: Necesito preparar mi empresa para la Ley 21.719"
          className="mt-3 w-full resize-none rounded-2xl border bg-background px-4 py-4 text-lg leading-8 outline-none transition focus:border-primary disabled:opacity-60"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES[audience].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setGoal(example)}
              disabled={busy}
              className="rounded-full border bg-background px-3 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-60"
            >
              {example}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-semibold">No se pudo completar el inicio.</p>
            <p className="mt-1">{error}</p>
            {createdCaseId && (
              <button
                type="button"
                onClick={() => router.push(`/cases/${createdCaseId}/live`)}
                className="mt-3 font-semibold underline underline-offset-4"
              >
                Abrir el caso creado
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={start}
          disabled={busy || goal.trim().length < 8}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {STEP_COPY[step]}
          {!busy ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
        </button>

        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          Los estados y resultados que verás provienen del trabajo persistido en el expediente.
        </p>
      </div>
    </section>
  )
}
