'use client'

import { useEffect, useRef, useState } from 'react'
import { Shield, BarChart3, Users, Award, Zap, Headphones } from 'lucide-react'

type Signal = {
  icon: typeof Shield
  label: string
  description: string
  /** numeric value to count up to, embedded in the label */
  count?: { to: number; prefix?: string; suffix?: string }
}

const signals: Signal[] = [
  {
    icon: Shield,
    label: 'Seguridad Certificada',
    description: 'ISO 27001 en progress + encriptación bancaria',
  },
  {
    icon: BarChart3,
    label: 'Empresas Protegidas',
    description: '$2.5B en riesgos identificados evitados',
    count: { to: 500, suffix: '+' },
  },
  {
    icon: Users,
    label: 'Equipo Experto',
    description: '15+ años en compliance y IA en Chile',
  },
  {
    icon: Award,
    label: 'Multas',
    description: 'Clientes KUMPLIO no han recibido multas',
    count: { to: 0 },
  },
  {
    icon: Zap,
    label: 'Análisis en Segundos',
    description: '7 agentes IA trabajando en paralelo',
    count: { to: 60, suffix: ' seg' },
  },
  {
    icon: Headphones,
    label: 'Soporte 24/7',
    description: 'Chat Vera + Email + Teléfono directo',
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

function CountUp({ to, prefix = '', suffix = '', run }: { to: number; prefix?: string; suffix?: string; run: boolean }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!run) return
    if (to === 0) {
      setVal(0)
      return
    }
    let raf = 0
    const start = performance.now()
    const dur = 1400
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * to))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, to])
  return (
    <span>
      {prefix}
      {val}
      {suffix}
    </span>
  )
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
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />
      <div className="flex items-start gap-4 relative">
        <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 flex items-center justify-center h-12 w-12">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-foreground mb-1 flex items-baseline gap-1.5">
            {signal.count && (
              <span className="text-primary">
                <CountUp to={signal.count.to} prefix={signal.count.prefix} suffix={signal.count.suffix} run={show} />
              </span>
            )}
            <span>{signal.label}</span>
          </h3>
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
