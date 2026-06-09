'use client'

import { useEffect, useRef, useState } from 'react'
import {
  FileSearch,
  Calculator,
  Map,
  Radar,
  ClipboardCheck,
  TrendingUp,
  ShieldCheck,
  Star,
} from 'lucide-react'

type Agent = {
  num: string
  name: string
  role: string
  metric: string
  highlight: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
}

const agents: Agent[] = [
  {
    num: '1',
    name: 'Is1dora',
    role: 'Extractora de Documentos',
    metric: '60 Segundos',
    highlight: 'Extrae 34 obligaciones automáticamente',
    desc: 'De contratos, políticas, RAT — sin intermediarios, sin esperar abogados',
    icon: FileSearch,
  },
  {
    num: '2',
    name: 'R0drigo',
    role: 'Evaluador de Riesgos (en UF reales)',
    metric: '20.000 UTM',
    highlight: 'Exposición máxima cuantificada',
    desc: '~$1.400M CLP en infracción gravísima. Exacto, en dinero real.',
    icon: Calculator,
  },
  {
    num: '3',
    name: 'Jav1er',
    role: 'Asesor de Cumplimiento',
    metric: '90 Días',
    highlight: 'Plan ejecutable, viabilidad real',
    desc: '3 fases, hitos mensuales, responsables, recursos — no un checklist',
    icon: Map,
  },
  {
    num: '4',
    name: 'Be4triz',
    role: 'Monitora Regulatoria',
    metric: '24/7',
    highlight: 'Cambios de ley notificados antes',
    desc: 'Ley 21.719, resoluciones APDP, reglamentos — sin sorpresas',
    icon: Radar,
  },
  {
    num: '5',
    name: 'Ver0nica',
    role: 'Auditora de Gap Analysis',
    metric: 'Gap Analysis',
    highlight: 'Sabes exactamente dónde estás',
    desc: 'Verificación independiente de cumplimiento real vs legal',
    icon: ClipboardCheck,
  },
  {
    num: '6',
    name: 'Andr3s',
    role: 'Optimizador de Sistema',
    metric: '+5% Mejora',
    highlight: 'Feedback continuo para mejorar el sistema',
    desc: 'Cada auditoría entrena al sistema. KUMPLIO mejora mensualmente.',
    icon: TrendingUp,
  },
]

const hero: Agent = {
  num: '7',
  name: 'Cat4lina',
  role: 'Validadora Legal (Jurisprudencia SERNAC)',
  metric: '100% Auditable',
  highlight: 'Cada decisión cita el artículo de ley + precedente SERNAC específico',
  desc: 'Validación legal completa. La palabra final antes de la APDP. Zero hallucinations, cadena de razonamiento explícita.',
  icon: ShieldCheck,
}

export function SpecialistsGrid() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref}>
      <h2 className="text-3xl font-bold mb-4 text-balance">Los 7 Especialistas IA del Sistema</h2>
      <p className="text-muted-foreground mb-16 max-w-2xl text-pretty">
        Cada agente es un experto en su dominio. Juntos forman un sistema de razonamiento ultra-inteligente que aprende de cada decisión.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {agents.map((agent, i) => {
          const Icon = agent.icon
          return (
            <div
              key={agent.name}
              className="group relative p-8 rounded-lg border border-border bg-card/40 overflow-hidden transition-all duration-500 hover:border-primary hover:-translate-y-1 hover:shadow-[0_0_30px_-10px_var(--color-primary)]"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s`,
              }}
            >
              {/* hover glow accent */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-primary transition-all duration-300 group-hover:scale-110 group-hover:border-primary/60">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold leading-tight">
                      <span className="text-muted-foreground">{agent.num}.</span> {agent.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
                {/* live pulsing status dot */}
                <span className="relative flex h-3 w-3 mt-1" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                </span>
              </div>

              <div className="text-3xl font-black text-primary mb-2">{agent.metric}</div>
              <p className="text-sm mb-1">{agent.highlight}</p>
              <p className="text-xs text-muted-foreground">{agent.desc}</p>
            </div>
          )
        })}

        {/* HERO AGENT - Catalina */}
        <div
          className="group relative md:col-span-2 p-8 rounded-lg border-2 border-primary bg-primary/5 overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_-10px_var(--color-primary)]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: `opacity 0.6s ease ${agents.length * 0.08}s, transform 0.6s ease ${agents.length * 0.08}s`,
          }}
        >
          {/* animated scan line */}
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute top-0 h-full w-24 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-flow" />
          </div>

          <div className="relative flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/50 bg-background text-primary transition-transform duration-300 group-hover:scale-110">
                <hero.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold leading-tight">
                  <span className="text-primary/70">{hero.num}.</span> {hero.name}
                </h3>
                <p className="text-sm text-muted-foreground">{hero.role}</p>
              </div>
            </div>
            <Star className="h-7 w-7 text-primary fill-primary animate-pulse" aria-hidden="true" />
          </div>

          <div className="relative text-3xl font-black text-primary mb-2">{hero.metric}</div>
          <p className="relative text-sm font-semibold mb-1">{hero.highlight}</p>
          <p className="relative text-xs text-muted-foreground">{hero.desc}</p>
        </div>
      </div>
    </div>
  )
}
