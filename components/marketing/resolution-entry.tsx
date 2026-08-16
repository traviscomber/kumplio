'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { trackFunnelIntentStarted } from '@/lib/analytics/funnel-client'
import type { PublicLocale } from '@/lib/i18n/public-routing'

type Audience = 'person' | 'company' | 'professional'

type ResolutionCopy = {
  audiences: Record<Audience, string>
  examples: Record<Audience, string[]>
  question: string
  placeholder: string
  action: string
  note: string
}

const audienceOrder: Audience[] = ['company', 'professional', 'person']

const COPY: Record<PublicLocale, ResolutionCopy> = {
  es: {
    audiences: {
      company: 'Empresa',
      professional: 'Profesional',
      person: 'Persona',
    },
    examples: {
      company: [
        'Necesito prepararme para la Ley 21.719',
        'No tengo claro dónde están nuestros datos personales',
        'Debo responder una solicitud o posible incidente de privacidad',
      ],
      professional: [
        'Debo levantar tratamientos y brechas de un cliente',
        'Necesito revisar un contrato con un proveedor que trata datos',
        'Quiero preparar un plan de implementación con evidencia',
      ],
      person: [
        'Quiero entender cómo están usando mis datos',
        'Necesito saber qué puedo pedir sobre mis datos personales',
        'Tengo una situación de privacidad y no sé cómo abordarla',
      ],
    },
    question: '¿Qué necesitas proteger o resolver?',
    placeholder: 'Describe la situación, los datos involucrados o lo que necesitas implementar...',
    action: 'Empezar con guía experta',
    note: 'Kumplio centraliza los antecedentes, activa los especialistas adecuados y conserva el respaldo de cada decisión.',
  },
  en: {
    audiences: {
      company: 'Company',
      professional: 'Professional',
      person: 'Individual',
    },
    examples: {
      company: [
        'I need to prepare for Chilean Law 21.719',
        'I do not have a clear map of where our personal data is',
        'I need to respond to a privacy request or possible incident',
      ],
      professional: [
        'I need to map a client’s processing activities and gaps',
        'I need to review a vendor contract involving personal data',
        'I want to build an evidence-backed implementation plan',
      ],
      person: [
        'I want to understand how my personal data is being used',
        'I need to know what I can request about my personal data',
        'I have a privacy situation and do not know how to approach it',
      ],
    },
    question: 'What do you need to protect or resolve?',
    placeholder: 'Describe the situation, the data involved or what you need to implement...',
    action: 'Start with expert guidance',
    note: 'Kumplio centralizes the context, activates the right specialists and preserves the evidence behind each decision.',
  },
}

export function ResolutionEntry({ locale = 'es' }: { locale?: PublicLocale }) {
  const router = useRouter()
  const [audience, setAudience] = useState<Audience>('company')
  const [goal, setGoal] = useState('')
  const copy = COPY[locale]

  function start() {
    const normalizedGoal = goal.trim()
    if (normalizedGoal.length < 8) return

    window.sessionStorage.setItem(
      'kumplio:case-draft',
      JSON.stringify({ goal: normalizedGoal, audience }),
    )
    trackFunnelIntentStarted({ audience, locale })
    router.push('/sign-up?next=/cases/new')
  }

  return (
    <div className="rounded-[28px] border border-white/12 bg-[#151c28] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:p-7">
      <div className="flex flex-wrap gap-2">
        {audienceOrder.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAudience(value)}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
              audience === value
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-white/10 text-white/55 hover:border-white/25 hover:text-white'
            }`}
          >
            {copy.audiences[value]}
          </button>
        ))}
      </div>

      <label htmlFor="resolution-goal" className="mt-6 block text-sm font-bold text-white">
        {copy.question}
      </label>
      <textarea
        id="resolution-goal"
        value={goal}
        onChange={(event) => setGoal(event.target.value)}
        rows={5}
        placeholder={copy.placeholder}
        className="mt-3 w-full resize-none rounded-2xl border border-white/12 bg-[#0f1520] px-4 py-4 text-base leading-7 text-white outline-none transition placeholder:text-white/28 focus:border-primary/60"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {copy.examples[audience].map((example) => (
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
        {copy.action} <ArrowRight className="ml-2 h-4 w-4" />
      </button>

      <p className="mt-4 text-center text-xs leading-5 text-white/38">
        {copy.note}
      </p>
    </div>
  )
}
