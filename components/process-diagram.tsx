'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, Cpu, ShieldCheck, TrendingUp, Target, Calendar, FileCheck, ScanLine, Sparkles } from 'lucide-react'

type Phase = 'idle' | 'upload' | 'scanning' | 'results'

const AGENTS = [
  { name: 'Extractor', task: 'Identifica obligaciones', icon: FileCheck },
  { name: 'Clasificador', task: 'Categoriza por área', icon: Cpu },
  { name: 'Evaluador', task: 'Mide brechas (gap)', icon: ScanLine },
  { name: 'Cuantificador', task: 'Calcula exposición UF/CLP', icon: TrendingUp },
  { name: 'Priorizador', task: 'Ordena por criticidad', icon: Target },
  { name: 'Planificador', task: 'Arma roadmap 90 días', icon: Calendar },
  { name: 'Validador', task: 'Verifica Ley 21.719', icon: ShieldCheck },
]

const RESULTS = [
  { label: '34 obligaciones identificadas', icon: FileCheck },
  { label: 'Exposición: 2.400 UF en riesgo', icon: TrendingUp },
  { label: 'Top 5 prioridades críticas', icon: Target },
  { label: 'Roadmap de 90 días listo', icon: Calendar },
]

export function ProcessDiagram() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [activeAgents, setActiveAgents] = useState<number>(0)
  const [visibleResults, setVisibleResults] = useState<number>(0)
  const [scanProgress, setScanProgress] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const run = () => {
      // reset
      setActiveAgents(0)
      setVisibleResults(0)
      setScanProgress(0)
      setPhase('upload')

      const t: ReturnType<typeof setTimeout>[] = []

      // Phase: scanning
      t.push(setTimeout(() => setPhase('scanning'), 1400))

      // Activate agents one by one
      AGENTS.forEach((_, i) => {
        t.push(setTimeout(() => setActiveAgents(i + 1), 1400 + 500 + i * 480))
      })

      // Scan progress bar
      let scanStart = 1900
      for (let p = 1; p <= 100; p++) {
        t.push(setTimeout(() => setScanProgress(p), scanStart + p * 33))
      }

      // Phase: results
      const resultsStart = 1900 + AGENTS.length * 480 + 600
      t.push(setTimeout(() => setPhase('results'), resultsStart))
      RESULTS.forEach((_, i) => {
        t.push(setTimeout(() => setVisibleResults(i + 1), resultsStart + 300 + i * 450))
      })

      // Loop restart
      const total = resultsStart + 300 + RESULTS.length * 450 + 2600
      t.push(setTimeout(() => run(), total))

      timers.current = t
    }

    run()
    return () => {
      timers.current.forEach(clearTimeout)
    }
  }, [])

  const stepLabel =
    phase === 'upload'
      ? 'Subiendo documento...'
      : phase === 'scanning'
        ? `Analizando · ${activeAgents}/7 agentes activos`
        : phase === 'results'
          ? 'Diagnóstico completo'
          : 'Iniciando...'

  return (
    <div className="space-y-12">
      {/* HEADER */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          DEMOSTRACIÓN EN VIVO
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-balance">¿Cómo funciona en 60 segundos?</h2>
        <p className="text-lg text-muted-foreground text-pretty">
          Observa a nuestros 7 agentes IA analizar un documento de cumplimiento en tiempo real
        </p>
      </div>

      {/* LIVE DIAGRAM */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Top status bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/50">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <span className="text-sm font-medium">{stepLabel}</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {phase === 'results' ? '00:58' : phase === 'scanning' ? `00:${String(Math.min(57, Math.floor(scanProgress / 2))).padStart(2, '0')}` : '00:00'}
          </span>
        </div>

        {/* 3 columns flow */}
        <div className="grid lg:grid-cols-[1fr_1.4fr_1fr] gap-px bg-border">
          {/* COLUMN 1: Document upload */}
          <div className="bg-card p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-muted-foreground tracking-widest">01 · ENTRADA</span>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-[280px]">
              <div
                className={`relative w-40 transition-all duration-700 ${
                  phase === 'idle' ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
                }`}
              >
                {/* Document card */}
                <div className="rounded-lg border border-primary/40 bg-background p-5 shadow-lg">
                  <FileText className="w-10 h-10 text-primary mb-3" />
                  <div className="space-y-1.5">
                    <div className="h-1.5 rounded bg-muted-foreground/30 w-full" />
                    <div className="h-1.5 rounded bg-muted-foreground/20 w-4/5" />
                    <div className="h-1.5 rounded bg-muted-foreground/20 w-full" />
                    <div className="h-1.5 rounded bg-muted-foreground/20 w-3/5" />
                  </div>
                  <p className="mt-3 text-[10px] text-muted-foreground font-mono truncate">contrato_RAT.pdf</p>

                  {/* Scan line overlay */}
                  {phase === 'scanning' && (
                    <div
                      className="absolute left-0 right-0 h-8 bg-gradient-to-b from-primary/0 via-primary/40 to-primary/0 pointer-events-none"
                      style={{ top: `${scanProgress}%`, transition: 'top 0.1s linear' }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Agents grid */}
          <div className="bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-muted-foreground tracking-widest">02 · 7 AGENTES IA</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 min-h-[280px] content-start">
              {AGENTS.map((agent, i) => {
                const Icon = agent.icon
                const isActive = i < activeAgents
                return (
                  <div
                    key={agent.name}
                    className={`rounded-lg border p-3 transition-all duration-500 ${
                      isActive
                        ? 'border-primary/50 bg-primary/10 scale-100'
                        : 'border-border bg-background/40 opacity-40 scale-95'
                    } ${i === 6 ? 'col-span-2' : ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                          isActive ? 'bg-primary/20' : 'bg-muted'
                        }`}
                      >
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {agent.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{agent.task}</p>
                      </div>
                      {isActive && (
                        <span className="ml-auto shrink-0 flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-1.5 w-1.5 rounded-full bg-primary opacity-75 animate-ping" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* COLUMN 3: Results */}
          <div className="bg-card p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-muted-foreground tracking-widest">03 · RESULTADOS</span>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-2.5 min-h-[280px]">
              {RESULTS.map((result, i) => {
                const Icon = result.icon
                const isVisible = i < visibleResults
                return (
                  <div
                    key={result.label}
                    className={`rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3 transition-all duration-500 ${
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
                    }`}
                  >
                    <div className="shrink-0 w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs font-medium text-pretty">{result.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: '60', label: 'SEGUNDOS' },
          { value: '7', label: 'AGENTES IA' },
          { value: '34', label: 'OBLIGACIONES' },
          { value: '$0', label: 'COSTO' },
        ].map((stat) => (
          <div key={stat.label} className="text-center rounded-xl border border-border bg-card p-5">
            <div className="text-3xl md:text-4xl font-black text-primary mb-1 tabular-nums">{stat.value}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground font-semibold tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
