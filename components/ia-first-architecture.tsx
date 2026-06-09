'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Sparkles,
  GitCompareArrows,
  Workflow,
  ShieldQuestion,
  Layers,
  Gauge,
  RefreshCw,
  FileSearch,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react'

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

const reasoning = [
  { icon: Sparkles, title: 'Few-Shot Learning', desc: 'Cada agente aprende de ejemplos similares a tu caso, no de reglas genéricas.' },
  { icon: GitCompareArrows, title: 'Analogical Reasoning', desc: 'Is1dora compara tu situación con 1000+ casos históricos extrayendo lecciones aplicables.' },
  { icon: Workflow, title: 'Causal Reasoning', desc: 'R0drigo entiende causas raíz del incumplimiento, no solo calcula multas.' },
  { icon: ShieldQuestion, title: 'Metacognitive Validation', desc: 'El sistema cuestiona sus propias conclusiones e identifica asunciones débiles.' },
]

const intelligence = [
  { icon: Layers, title: 'Multi-Method Validation', desc: 'Ninguna conclusión depende de un solo agente. Todo se valida por consenso.' },
  { icon: Gauge, title: 'Uncertainty Quantification', desc: 'Cada métrica incluye rangos de confianza y evidencia de apoyo completa.' },
]

const pipeline = [
  { icon: FileSearch, agent: 'Is1dora', task: 'extrae obligaciones' },
  { icon: AlertTriangle, agent: 'R0drigo', task: 'cuantifica riesgos' },
  { icon: CheckCircle2, agent: 'Cat4lina', task: 'valida con SERNAC' },
  { icon: FileText, agent: 'Todos', task: 'reporte ejecutivo' },
]

const results = [
  { value: 95, suffix: '%', label: 'Accuracy en análisis de cumplimiento' },
  { value: 5, suffix: ' meses', label: 'ROI promedio desde activación' },
  { value: 40, suffix: '%', label: 'Menos hallucinating que sistemas estándar' },
]

function CountUp({ end, suffix, run }: { end: number; suffix: string; run: boolean }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!run) return
    let raf = 0
    const start = performance.now()
    const dur = 1400
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * end))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, end])
  return (
    <span>
      {val}
      {suffix}
    </span>
  )
}

function PipelineFlow() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    if (!inView) return
    let i = 0
    setActive(0)
    const id = setInterval(() => {
      i = (i + 1) % pipeline.length
      setActive(i)
    }, 1400)
    return () => clearInterval(id)
  }, [inView])

  return (
    <div ref={ref} className="rounded-lg border border-border/60 bg-background/40 p-4">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Pipeline en tiempo real
      </p>
      <div className="space-y-0">
        {pipeline.map((step, i) => {
          const Icon = step.icon
          const isActive = i === active
          return (
            <div key={step.agent}>
              <div
                className={`flex items-center gap-3 rounded-md p-2.5 transition-all duration-500 ${
                  isActive ? 'bg-primary/15 ring-1 ring-primary/40' : 'bg-transparent'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-all duration-500 ${
                    isActive ? 'scale-110 bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold transition-colors duration-500 ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {step.agent}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{step.task}</p>
                </div>
                {isActive && (
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                )}
              </div>
              {i < pipeline.length - 1 && (
                <div className="ml-[2.05rem] h-4 w-px overflow-hidden bg-border/60">
                  <div className={`h-full w-full origin-top bg-primary transition-transform duration-500 ${active > i ? 'scale-y-100' : 'scale-y-0'}`} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeatureItem({ icon: Icon, title, desc, delay, show }: { icon: typeof Sparkles; title: string; desc: string; delay: number; show: boolean }) {
  return (
    <div
      className={`group flex gap-3 rounded-lg p-3 transition-all duration-700 hover:bg-primary/5 ${show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-primary">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

export function IaFirstArchitecture() {
  const reasoningView = useInView<HTMLDivElement>(0.2)
  const intelView = useInView<HTMLDivElement>(0.2)
  const resultsView = useInView<HTMLDivElement>(0.4)

  return (
    <div className="space-y-12">
      <div className="space-y-4 text-center">
        <h2 className="text-balance text-4xl font-bold">IA First: La Tecnología Detrás del Sistema</h2>
        <p className="mx-auto max-w-3xl text-pretty text-lg text-muted-foreground">
          KUMPLIO no es software que usa IA. Es un sistema architected desde cero con IA como su fundamento.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div ref={reasoningView.ref} className="rounded-lg border border-border p-6 transition-colors duration-300 hover:border-primary/40">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-primary" />
            <h3 className="text-xl font-bold">Razonamiento Avanzado</h3>
          </div>
          <div className="space-y-1">
            {reasoning.map((r, i) => (
              <FeatureItem key={r.title} icon={r.icon} title={r.title} desc={r.desc} delay={i * 120} show={reasoningView.inView} />
            ))}
          </div>
        </div>

        <div ref={intelView.ref} className="rounded-lg border border-border p-6 transition-colors duration-300 hover:border-primary/40">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-primary" />
            <h3 className="text-xl font-bold">Inteligencia de Sistema</h3>
          </div>
          <div className="space-y-1">
            {intelligence.map((r, i) => (
              <FeatureItem key={r.title} icon={r.icon} title={r.title} desc={r.desc} delay={i * 120} show={intelView.inView} />
            ))}
            <div className="px-3 py-2">
              <PipelineFlow />
            </div>
            <FeatureItem
              icon={RefreshCw}
              title="Continuous Learning"
              desc="Andr3s recolecta feedback de auditorías y alimenta el sistema. KUMPLIO mejora mensualmente."
              delay={360}
              show={intelView.inView}
            />
          </div>
        </div>
      </div>

      <div ref={resultsView.ref} className="rounded-lg border border-primary/30 bg-primary/5 p-8">
        <div className="grid gap-6 text-center md:grid-cols-3">
          {results.map((r) => (
            <div key={r.label} className="space-y-2">
              <div className="text-3xl font-black text-primary">
                <CountUp end={r.value} suffix={r.suffix} run={resultsView.inView} />
              </div>
              <p className="text-sm text-muted-foreground">{r.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
