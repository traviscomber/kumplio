'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { BrainCircuit, FileSearch, Calculator, Map, Radar, ClipboardCheck, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react'
import { AGENT_CATALOG, type AgentId } from '@/lib/agents/catalog'
import { Button } from '@/components/ui/button'

const iconMap: Record<AgentId, React.ComponentType<{ className?: string }>> = {
  isidora: FileSearch,
  rodrigo: Calculator,
  javier: Map,
  beatriz: Radar,
  veronica: ClipboardCheck,
  andres: TrendingUp,
  catalina: ShieldCheck,
}

export function SpecialistsGrid() {
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.12 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setActive((value) => (value + 1) % AGENT_CATALOG.length), 2200)
    return () => clearInterval(id)
  }, [visible])

  return (
    <div ref={ref}>
      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <BrainCircuit className="h-4 w-4" /> GPT-5.6 · razonamiento especializado
          </div>
          <h2 className="text-3xl font-bold text-balance md:text-4xl">Siete agentes con perfiles, skills y límites explícitos.</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground text-pretty">Cada agente opera con una misión delimitada, exige evidencia y entrega resultados trazables. Ninguno reemplaza la decisión profesional.</p>
        </div>
        <Button asChild variant="outline"><Link href="/agents">Abrir mesa de agentes <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {AGENT_CATALOG.map((agent, index) => {
          const Icon = iconMap[agent.id]
          const isActive = active === index
          const isReviewer = agent.id === 'catalina'
          return (
            <article
              key={agent.id}
              className={`relative overflow-hidden rounded-xl border bg-card p-6 transition-all duration-500 ${isReviewer ? 'md:col-span-2 border-primary/50' : ''} ${isActive ? 'border-primary shadow-[0_0_28px_-14px_var(--color-primary)] -translate-y-0.5' : 'border-border'}`}
              style={{ opacity: visible ? 1 : 0, transform: visible ? undefined : 'translateY(20px)', transitionDelay: `${index * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                  <div><h3 className="text-xl font-bold">{index + 1}. {agent.name}</h3><p className="mt-1 text-sm text-muted-foreground">{agent.role}</p></div>
                </div>
                <span className={`mt-1 h-2.5 w-2.5 rounded-full ${isActive ? 'bg-primary animate-pulse' : 'bg-primary/30'}`} />
              </div>

              <p className="mt-5 text-sm leading-6 text-foreground/90">{agent.mission}</p>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Skills principales</p>
                <div className="mt-2 flex flex-wrap gap-2">{agent.skills.map((skill) => <span key={skill} className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">{skill}</span>)}</div>
              </div>

              <div className="mt-5 rounded-lg border border-border bg-background/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Entrega</p>
                <p className="mt-2 text-sm leading-6">{agent.delivers.slice(0, 3).join(' · ')}</p>
              </div>

              <p className="mt-4 text-xs leading-5 text-muted-foreground"><span className="font-semibold text-foreground">Revisión:</span> {agent.reviewRequired}</p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
