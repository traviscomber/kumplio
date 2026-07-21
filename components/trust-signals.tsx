'use client'

import { useEffect, useRef, useState } from 'react'
import { FileCheck2, GitBranch, ListChecks, SearchCheck, ShieldCheck, UserCheck } from 'lucide-react'

type Signal = {
  icon: typeof ShieldCheck
  label: string
  description: string
}

const signals: Signal[] = [
  {
    icon: SearchCheck,
    label: 'Fuentes trazables',
    description: 'Cada obligación conserva su documento, referencia y contexto de origen.',
  },
  {
    icon: ListChecks,
    label: 'Controles ejecutables',
    description: 'Las obligaciones se traducen en responsables, frecuencia y criterios de evaluación.',
  },
  {
    icon: FileCheck2,
    label: 'Evidencia verificable',
    description: 'Documentos y registros se vinculan a controles, entidades y períodos concretos.',
  },
  {
    icon: GitBranch,
    label: 'Historial de decisiones',
    description: 'Cambios, revisiones y aprobaciones quedan disponibles para auditoría.',
  },
  {
    icon: UserCheck,
    label: 'Revisión humana',
    description: 'La IA propone y estructura; las decisiones críticas requieren validación autorizada.',
  },
  {
    icon: ShieldCheck,
    label: 'Diseño multiempresa',
    description: 'La información se organiza por organización, roles y permisos de acceso.',
  },
]

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

function SignalCard({ signal, index, show }: { signal: Signal; index: number; show: boolean }) {
  const Icon = signal.icon

  return (
    <article
      className={`rounded-xl border border-border bg-card p-6 transition duration-500 hover:border-primary/40 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="mb-1 font-bold text-foreground">{signal.label}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{signal.description}</p>
        </div>
      </div>
    </article>
  )
}

export function TrustSignals() {
  const { ref, inView } = useInView<HTMLDivElement>(0.15)

  return (
    <section className="border-y border-border bg-muted/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Confianza operacional</p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">Cumplimiento explicable, no una caja negra</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Kumplio conserva la relación entre norma, control, evidencia, evaluación y acción correctiva.
          </p>
        </div>
        <div ref={ref} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {signals.map((signal, index) => (
            <SignalCard key={signal.label} signal={signal} index={index} show={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}
