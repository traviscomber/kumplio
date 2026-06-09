'use client'

import { useEffect, useRef, useState } from 'react'
import { Shield, BarChart3, Users, Award, Zap, Headphones } from 'lucide-react'

type Signal = {
  icon: typeof Shield
  label: string
  description: string
}

const signals: Signal[] = [
  {
    icon: Shield,
    label: 'Análisis Automatizado',
    description: 'Procesa PDFs, DOCX, TXT en segundos sin manual review',
  },
  {
    icon: BarChart3,
    label: 'Identifica Obligaciones',
    description: 'Extrae requisitos legales directamente del documento',
  },
  {
    icon: Users,
    label: 'Equipo Chileno',
    description: 'Expertos locales en Ley 21.719 y cumplimiento regulatorio',
  },
  {
    icon: Award,
    label: 'Sin Tarjeta Requerida',
    description: 'Diagnóstico gratuito antes de cualquier compromiso',
  },
  {
    icon: Zap,
    label: 'Resultados en 60 Seg',
    description: 'Análisis rápido para decisiones inmediatas',
  },
  {
    icon: Headphones,
    label: 'Soporte Directo',
    description: 'Acceso a especialistas en cumplimiento normativo',
  },
]

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function SignalCard({ signal, index, show }: { signal: Signal; index: number; show: boolean }) {
  const Icon = signal.icon
  return (
    <div
      className={`bg-card border border-border rounded-lg p-6 hover:shadow-lg transition ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0 text-primary h-12 w-12 flex items-center justify-center">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-foreground mb-1">{signal.label}</h3>
          <p className="text-sm text-muted-foreground">{signal.description}</p>
        </div>
      </div>
    </div>
  )
}

export function TrustSignals() {
  const { ref, inView } = useInView<HTMLDivElement>(0.15)

  return (
    <section className="py-16 bg-muted border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground text-center mb-12">Por Qué Confiar en KUMPLIO</h2>
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {signals.map((signal, idx) => (
            <SignalCard key={signal.label} signal={signal} index={idx} show={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}
