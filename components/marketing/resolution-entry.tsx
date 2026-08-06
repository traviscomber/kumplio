'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

type Audience = 'person' | 'company' | 'professional'

const audiences: Array<{ value: Audience; label: string }> = [
  { value: 'person', label: 'Persona' },
  { value: 'company', label: 'Empresa' },
  { value: 'professional', label: 'Profesional' },
]

const examples: Record<Audience, string[]> = {
  person: [
    'Me llegó una carta y no sé qué hacer',
    'Voy a firmar un contrato',
    'Quiero iniciar una actividad correctamente',
  ],
  company: [
    'Debo prepararme para una auditoría',
    'Necesito implementar una nueva ley',
    'Un cliente me está exigiendo evidencia',
  ],
  professional: [
    'Debo preparar un informe para un cliente',
    'Necesito revisar un contrato',
    'Quiero entregar una recomendación respaldada',
  ],
}

export function ResolutionEntry() {
  const router = useRouter()
  const [audience, setAudience] = useState<Audience>('company')
  const [goal, setGoal] = useState('')

  function start() {
    const normalizedGoal = goal.trim()
    if (normalizedGoal.length < 8) return

    window.sessionStorage.setItem(
      'kumplio:case-draft',
      JSON.stringify({ goal: normalizedGoal, audience }),
    )
    router.push('/sign-up?next=/cases/new')
  }

  return (
    <div className="rounded-[28px] border border-white/12 bg-[#151c28] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:p-7">
      <div className="flex flex-wrap gap-2">
        {audiences.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setAudience(item.value)}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
              audience === item.value
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-white/10 text-white/55 hover:border-white/25 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <label htmlFor="resolution-goal" className="mt-6 block text-sm font-bold text-white">
        ¿Qué necesitas resolver?
      </label>
      <textarea
        id="resolution-goal"
        value={goal}
        onChange={(event) => setGoal(event.target.value)}
        rows={5}
        placeholder="Describe la situación con tus propias palabras..."
        className="mt-3 w-full resize-none rounded-2xl border border-white/12 bg-[#0f1520] px-4 py-4 text-base leading-7 text-white outline-none transition placeholder:text-white/28 focus:border-primary/60"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {examples[audience].map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setGoal(example)}
            className="rounded-full border border-white/10 px-3 py-2 text-left text-xs text-white/48 transition hover:border-primary/35 hover:text-white/80"
          >
            {example}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={start}
        disabled={goal.trim().length < 8}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 font-black text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Empezar a resolver <ArrowRight className="ml-2 h-4 w-4" />
      </button>

      <p className="mt-4 text-center text-xs leading-5 text-white/38">
        Kumplio organiza el caso, selecciona el equipo adecuado y conserva el respaldo de cada decisión.
      </p>
    </div>
  )
}
