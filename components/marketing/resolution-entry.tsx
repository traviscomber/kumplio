'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import type { PublicLocale } from '@/lib/i18n/public-routing'
import { buildGuidedOnboardingSignUpPath, GUIDED_ONBOARDING_DRAFT_KEY } from '@/lib/product/onboarding/guided-entry'

type Audience = 'person' | 'company' | 'professional'

type ResolutionCopy = {
  audiences: Record<Audience, string>
  examples: Record<Audience, string[]>
  question: string
  placeholder: string
  action: string
  note: string
  guidance: string
  ready: string
  error: string
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
    guidance: 'Escribe al menos 8 caracteres o elige una situación de ejemplo.',
    ready: 'Situación lista. Puedes continuar.',
    error: 'Cuéntanos un poco más para poder preparar tu guía.',
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
    guidance: 'Write at least 8 characters or choose an example situation.',
    ready: 'Your situation is ready. You can continue.',
    error: 'Tell us a little more so we can prepare your guidance.',
  },
}

export function ResolutionEntry({ locale = 'es' }: { locale?: PublicLocale }) {
  const router = useRouter()
  const [audience, setAudience] = useState<Audience>('company')
  const [goal, setGoal] = useState('')
  const [showError, setShowError] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const copy = COPY[locale]
  const isReady = goal.trim().length >= 8

  function start() {
    const normalizedGoal = goal.trim()
    if (normalizedGoal.length < 8) {
      setShowError(true)
      textareaRef.current?.focus()
      return
    }

    window.sessionStorage.setItem(
      GUIDED_ONBOARDING_DRAFT_KEY,
      JSON.stringify({ goal: normalizedGoal, audience }),
    )
    router.push(buildGuidedOnboardingSignUpPath())
  }

  return (
    <div className="rounded-[28px] border border-[#B17A4D]/35 bg-[#211F1B] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.5)] sm:p-7">
      <div className="flex flex-wrap gap-2">
        {audienceOrder.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAudience(value)}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
              audience === value
                ? 'border-[#A7C63A] bg-[#A7C63A]/15 text-[#C5E052] shadow-[inset_0_0_0_1px_rgba(167,198,58,0.12)]'
                : 'border-[#C2A887]/20 bg-[#151513]/45 text-[#C2A887] hover:border-[#B17A4D]/60 hover:bg-[#B17A4D]/10 hover:text-[#E0C5A1]'
            }`}
          >
            {copy.audiences[value]}
          </button>
        ))}
      </div>

      <label htmlFor="resolution-goal" className="mt-6 block text-sm font-bold text-[#E0C5A1]">
        {copy.question}
      </label>
      <textarea
        ref={textareaRef}
        id="resolution-goal"
        value={goal}
        onChange={(event) => {
          setGoal(event.target.value)
          if (event.target.value.trim().length >= 8) setShowError(false)
        }}
        rows={5}
        placeholder={copy.placeholder}
        aria-invalid={showError}
        aria-describedby="resolution-guidance"
        className={`mt-3 w-full resize-none rounded-2xl border bg-[#151513] px-4 py-4 text-base leading-7 text-[#F0E2CE] outline-none transition placeholder:text-[#8F8678] focus:ring-2 ${showError ? 'border-[#D58A62] focus:border-[#D58A62] focus:ring-[#D58A62]/15' : 'border-[#C2A887]/22 focus:border-[#A7C63A]/75 focus:ring-[#A7C63A]/15'}`}
      />
      <p id="resolution-guidance" className={`mt-2 text-xs ${showError ? 'text-[#E2A37E]' : isReady ? 'text-[#C5E052]' : 'text-[#8F8678]'}`} aria-live="polite">
        {showError ? copy.error : isReady ? copy.ready : copy.guidance}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {copy.examples[audience].map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => { setGoal(example); setShowError(false) }}
            aria-pressed={goal === example}
            className={`rounded-full border px-3 py-2 text-left text-xs transition ${goal === example ? 'border-[#A7C63A]/70 bg-[#A7C63A]/12 text-[#D5EA7C]' : 'border-[#C2A887]/18 bg-[#151513]/35 text-[#AAA08F] hover:border-[#A7C63A]/55 hover:bg-[#A7C63A]/8 hover:text-[#E0C5A1]'}`}
          >
            {example}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={start}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#B7D83C] bg-[#A7C63A] px-6 py-3 font-black text-[#12140B] shadow-[0_10px_30px_rgba(167,198,58,0.16)] transition hover:bg-[#B7D83C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5EA7C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#211F1B]"
      >
        {copy.action} <ArrowRight className="ml-2 h-4 w-4" />
      </button>

      <p className="mt-4 text-center text-xs leading-5 text-[#8F8678]">
        {copy.note}
      </p>
    </div>
  )
}
