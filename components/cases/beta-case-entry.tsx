'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@vercel/analytics'
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import type { UserAudience } from '@/lib/agents/orchestrator'

const DRAFT_STORAGE_KEY = 'kumplio:case-draft'
const START_KEY_STORAGE_KEY = 'kumplio:case-start-key'
const FUNNEL_STARTED_AT_KEY = 'kumplio:funnel-started-at'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const EXAMPLES: Record<UserAudience, string[]> = {
  person: [
    'Quiero saber qué datos personales tienen sobre mí y cómo ejercer mis derechos',
    'Creo que compartieron mis datos sin autorización',
    'Necesito entender una solicitud relacionada con mis datos personales',
  ],
  company: [
    'Quiero preparar mi empresa para la Ley 21.719 y ordenar los datos que tratamos',
    'Un cliente me exige demostrar cómo protegemos sus datos',
    'Necesito revisar proveedores que acceden a datos personales',
  ],
  professional: [
    'Necesito evaluar el tratamiento de datos de un cliente y proponer un plan',
    'Quiero revisar una política de privacidad antes de entregarla',
    'Debo respaldar una recomendación sobre protección de datos',
  ],
  industry: [
    'Necesito mapear datos personales y controles en una operación regulada',
    'Quiero revisar terceros y transferencias de datos en mi operación',
    'Debo preparar evidencia de privacidad para una fiscalización',
  ],
}

const AUDIENCES: Array<{ value: UserAudience; label: string }> = [
  { value: 'person', label: 'Persona' },
  { value: 'company', label: 'Empresa' },
  { value: 'professional', label: 'Profesional' },
  { value: 'industry', label: 'Industria' },
]

type Step = 'idle' | 'preparing' | 'execution' | 'opening'

const STEP_COPY: Record<Step, string> = {
  idle: 'Preparar mi caso',
  preparing: 'Creando un expediente seguro...',
  execution: 'Iniciando la guía experta...',
  opening: 'Abriendo tu caso...',
}

const RECOVERABLE_ADVANCE_CODES = new Set([
  'stage_already_running',
  'stage_already_completed',
  'review_required',
  'workflow_already_completed',
])

function isAudience(value: unknown): value is UserAudience {
  return ['person', 'company', 'professional', 'industry'].includes(String(value))
}

function persistDraft(goal: string, audience: UserAudience) {
  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ goal, audience }))
  } catch {
    // Storage is a continuity enhancement; the form remains usable without it.
  }
}

function clearStartKey() {
  try {
    window.sessionStorage.removeItem(START_KEY_STORAGE_KEY)
  } catch {
    // Ignore storage failures and keep the current in-memory flow usable.
  }
}

function funnelElapsedSeconds() {
  try {
    const startedAt = Number(window.sessionStorage.getItem(FUNNEL_STARTED_AT_KEY))
    if (!Number.isFinite(startedAt) || startedAt <= 0 || startedAt > Date.now()) return null
    return Math.max(0, Math.round((Date.now() - startedAt) / 1000))
  } catch {
    return null
  }
}

export function BetaCaseEntry() {
  const router = useRouter()
  const [goal, setGoal] = useState('')
  const [audience, setAudience] = useState<UserAudience>('company')
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState('')
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null)
  const busy = step !== 'idle'

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(DRAFT_STORAGE_KEY)
      if (stored) {
        const draft = JSON.parse(stored) as { goal?: unknown; audience?: unknown }
        if (typeof draft.goal === 'string' && draft.goal.trim().length >= 8) setGoal(draft.goal.trim())
        if (isAudience(draft.audience)) setAudience(draft.audience)
      }

      const storedStartKey = window.sessionStorage.getItem(START_KEY_STORAGE_KEY)
      if (storedStartKey && UUID_PATTERN.test(storedStartKey)) {
        setIdempotencyKey(storedStartKey)
      } else if (storedStartKey) {
        window.sessionStorage.removeItem(START_KEY_STORAGE_KEY)
      }
    } catch {
      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY)
      window.sessionStorage.removeItem(START_KEY_STORAGE_KEY)
    }
  }, [])

  function updateGoal(value: string) {
    if (value !== goal) {
      setIdempotencyKey(null)
      clearStartKey()
    }
    setGoal(value)
    persistDraft(value, audience)
  }

  function updateAudience(value: UserAudience) {
    if (value !== audience) {
      setIdempotencyKey(null)
      clearStartKey()
    }
    setAudience(value)
    persistDraft(goal, value)
  }

  async function start() {
    const normalizedGoal = goal.trim()
    if (busy || normalizedGoal.length < 8) return
    setError('')
    setCreatedCaseId(null)

    const startKey = idempotencyKey || crypto.randomUUID()
    if (!idempotencyKey) {
      setIdempotencyKey(startKey)
      try {
        window.sessionStorage.setItem(START_KEY_STORAGE_KEY, startKey)
      } catch {
        // In-memory idempotency still protects retries during this render lifecycle.
      }
    }
    persistDraft(normalizedGoal, audience)

    try {
      setStep('preparing')
      const startResponse = await fetch('/api/cases/start-guided', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: normalizedGoal,
          audience,
          idempotencyKey: startKey,
        }),
      })
      const startPayload = await startResponse.json().catch(() => ({}))
      if (!startResponse.ok) throw new Error(startPayload.error || 'No fue posible preparar el caso')

      const caseId = startPayload.caseId as string | undefined
      const workflowId = startPayload.workflowId as string | undefined
      if (!caseId || !workflowId) throw new Error('El caso quedó incompleto y no puede abrirse todavía')

      const elapsedToCase = funnelElapsedSeconds()
      track('Funnel Guided Case Created', {
        audience,
        resumed: Boolean(startPayload.resumed),
        ...(elapsedToCase === null ? {} : { elapsed_seconds: elapsedToCase }),
      })

      setCreatedCaseId(caseId)
      setStep('execution')

      const advanceResponse = await fetch(`/api/agents/workflows/${workflowId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const advancePayload = await advanceResponse.json().catch(() => ({}))
      const recoverable = advanceResponse.status === 409 && RECOVERABLE_ADVANCE_CODES.has(String(advancePayload.code || ''))
      if (!advanceResponse.ok && !recoverable) {
        throw new Error(advancePayload.error || 'El expediente está listo, pero no fue posible iniciar la primera etapa')
      }

      const elapsedToExecution = funnelElapsedSeconds()
      track('Funnel First Stage Queued', {
        audience,
        recovered: recoverable,
        ...(elapsedToExecution === null ? {} : { elapsed_seconds: elapsedToExecution }),
      })

      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY)
      window.sessionStorage.removeItem(START_KEY_STORAGE_KEY)
      window.sessionStorage.removeItem(FUNNEL_STARTED_AT_KEY)
      setIdempotencyKey(null)
      setStep('opening')
      router.push(`/cases/${caseId}`)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible iniciar el caso')
      setStep('idle')
    }
  }

  return (
    <section className="mx-auto max-w-5xl py-8 sm:py-16">
      <div className="text-center">
        <p className="text-sm font-bold text-primary">Protección de datos con guía experta</p>
        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
          Cuéntanos qué necesitas proteger o resolver.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          Kumplio crea un expediente único, ordena el contexto y activa especialistas para llevarte desde la situación inicial hasta una decisión respaldada.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-[28px] border bg-card p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm leading-6 text-muted-foreground">
            <strong className="text-foreground">Un inicio, un expediente.</strong> Si la conexión se corta, recargas la página o vuelves a intentar, Kumplio reutiliza la misma clave de inicio para evitar duplicados.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-4">
          {AUDIENCES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => updateAudience(item.value)}
              disabled={busy}
              className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${audience === item.value ? 'border-primary bg-primary/10' : 'bg-background text-muted-foreground hover:border-primary/40'} disabled:opacity-60`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label htmlFor="case-goal" className="mt-6 block text-sm font-bold">¿Qué necesitas proteger o resolver?</label>
        <textarea
          id="case-goal"
          value={goal}
          onChange={(event) => updateGoal(event.target.value)}
          disabled={busy}
          rows={5}
          placeholder="Ej.: Quiero preparar mi empresa para la Ley 21.719 y saber qué datos tratamos, dónde están y qué debemos priorizar"
          className="mt-3 w-full resize-none rounded-2xl border bg-background px-4 py-4 text-lg leading-8 outline-none transition focus:border-primary disabled:opacity-60"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES[audience].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => updateGoal(example)}
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
                onClick={() => router.push(`/cases/${createdCaseId}`)}
                className="mt-3 font-semibold underline underline-offset-4"
              >
                Abrir el expediente ya creado
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
          Los resultados se guardan en el expediente y las decisiones sensibles mantienen revisión humana.
        </p>
      </div>
    </section>
  )
}
