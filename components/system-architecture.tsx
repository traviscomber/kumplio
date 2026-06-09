'use client'

import { useEffect, useRef, useState } from 'react'
import { FileSearch, Calculator, Route, ArrowRight, Sparkles } from 'lucide-react'

type Agent = {
  name: string
  role: string
  value: string
  numericTarget: number
  suffix: string
  prefix: string
  icon: typeof FileSearch
}

const AGENTS: Agent[] = [
  { name: 'Is1dora', role: 'Extrae Obligaciones', value: '34', numericTarget: 34, prefix: '', suffix: '', icon: FileSearch },
  { name: 'R0drigo', role: 'Cuantifica Riesgos', value: '20K UTM', numericTarget: 20, prefix: '', suffix: 'K UTM', icon: Calculator },
  { name: 'Jav1er', role: 'Genera Roadmap', value: '90 D', numericTarget: 90, prefix: '', suffix: ' D', icon: Route },
]

const LINKS = [
  { from: '1. Isidora', to: '2. Rodrigo', desc: 'Confidence scores de obligaciones informan cálculo de riesgos' },
  { from: '2. Rodrigo', to: '3. Javier', desc: 'Riesgos priorizan qué obligaciones atacar primero' },
  { from: '3. Javier', to: '5. Verónica', desc: 'Plan de acción genera checklist para auditoría independiente' },
  { from: '5. Verónica', to: '7. Catalina', desc: 'Gaps identificados se validan con jurisprudencia SERNAC' },
]

function CountUp({ target, prefix, suffix, start }: { target: number; prefix: string; suffix: string; start: boolean }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!start) return
    let raf = 0
    const duration = 1200
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(eased * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, target])
  return (
    <span>
      {prefix}
      {n}
      {suffix}
    </span>
  )
}

export function SystemArchitecture() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Cycle the active/highlighted agent in sequence once visible
  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => {
      setActive((a) => (a + 1) % AGENTS.length)
    }, 1800)
    return () => clearInterval(id)
  }, [visible])

  return (
    <div ref={ref} className="space-y-12">
      <div
        className={`text-center space-y-4 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Orquesta de 7 agentes IA
        </div>
        <h2 className="text-4xl font-bold text-balance">Sistema Integral de IA First</h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-pretty">
          7 agentes especializados trabajando en orquesta. Cada uno alimenta al siguiente. Razonamiento avanzado más
          validación cruzada igual cumplimiento garantizado.
        </p>
      </div>

      {/* SYSTEM FLOW */}
      <div className="space-y-4">
        <div className="grid md:grid-cols-5 gap-3 items-stretch">
          {AGENTS.map((agent, i) => {
            const Icon = agent.icon
            const isActive = active === i
            return (
              <div key={agent.name} className="contents">
                <div
                  className={`group relative overflow-hidden rounded-xl border p-6 text-center transition-all duration-500 ${
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  } ${
                    isActive
                      ? 'border-primary bg-primary/10 shadow-[0_0_30px_-8px] shadow-primary/40 scale-[1.03]'
                      : 'border-border bg-card/40 hover:border-primary/50'
                  }`}
                  style={{ transitionDelay: visible ? `${i * 150}ms` : '0ms' }}
                >
                  {/* sweep glow when active */}
                  <div
                    className={`pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-1000 ${
                      isActive ? 'translate-x-full' : ''
                    }`}
                  />
                  <div className="relative flex flex-col items-center gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-500 ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="font-bold text-primary">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                    <p className="mt-2 text-2xl font-black text-primary tabular-nums">
                      <CountUp target={agent.numericTarget} prefix={agent.prefix} suffix={agent.suffix} start={visible} />
                    </p>
                  </div>
                </div>

                {/* Connector with flowing pulse (not after last card) */}
                {i < AGENTS.length - 1 && (
                  <div className="relative hidden md:flex items-center justify-center">
                    <div className="relative h-px w-full bg-border">
                      <div
                        className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_2px] shadow-primary/60 ${
                          visible ? 'animate-flow' : 'opacity-0'
                        }`}
                        style={{ animationDelay: `${i * 0.9}s` }}
                      />
                    </div>
                    <ArrowRight className="absolute right-0 h-4 w-4 text-primary/60" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* CROSS-AGENT LEARNING */}
        <div
          className={`rounded-xl border border-primary/30 bg-primary/5 p-6 transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: visible ? '600ms' : '0ms' }}
        >
          <p className="mb-5 text-center text-sm font-semibold">
            Cross-Agent Learning: Cada agente alimenta al siguiente con insights, validación cruzada y mejora continua
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {LINKS.map((link, i) => (
              <div
                key={link.from}
                className={`group rounded-lg border border-border/60 bg-card/40 p-4 transition-all duration-500 hover:border-primary/50 hover:bg-primary/5 ${
                  visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}
                style={{ transitionDelay: visible ? `${700 + i * 120}ms` : '0ms' }}
              >
                <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <span>{link.from}</span>
                  <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  <span>{link.to}</span>
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">{link.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
