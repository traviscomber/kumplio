'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Truck, Mountain, ArrowRight, TrendingUp, ShieldCheck } from 'lucide-react'

const companies = [
  {
    name: 'Labbe Logística',
    logo: '/logos/labbe-logistics.png',
    description: 'Empresa de transporte',
    result: '52% → 100% en 3 meses',
    icon: Truck,
  },
  {
    name: 'Goldcorp Chile',
    logo: '/logos/goldcorp-chile.png',
    description: 'Minería',
    result: '180+ obligaciones mapeadas',
    icon: Mountain,
  },
]

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}

function CountUp({ target, start }: { target: number; start: boolean }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    let raf = 0
    const duration = 1400
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(eased * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, target])
  return <span>{value}</span>
}

export function SocialProof() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2)

  return (
    <section ref={ref} className="py-20 bg-muted/30 border-y border-border overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div
          className="text-center mb-14"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-semibold tracking-wide text-primary uppercase">Casos de éxito</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Empresas que confían en KUMPLIO
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Casos reales de empresas chilenas cumpliendo normativas con nuestro sistema
          </p>
        </div>

        {/* cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {companies.map((company, idx) => {
            const Icon = company.icon
            return (
              <div
                key={idx}
                className="group relative bg-card border border-border rounded-xl p-8 overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:border-primary hover:shadow-[0_0_40px_-12px_var(--color-primary)]"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? 'translateY(0)' : 'translateY(28px)',
                  transition: `opacity 0.6s ease ${0.15 + idx * 0.15}s, transform 0.6s ease ${0.15 + idx * 0.15}s`,
                }}
              >
                {/* top accent */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* industry badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">{company.description}</span>
                  </div>
                  <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  </span>
                </div>

                {/* logo */}
                <div className="h-24 w-full mb-6 relative flex items-center justify-center rounded-lg bg-muted/50 transition-colors duration-500 group-hover:bg-muted">
                  <Image
                    src={company.logo || '/placeholder.svg'}
                    alt={company.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-contain p-5 transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* name */}
                <h3 className="font-bold text-lg text-foreground mb-1">{company.name}</h3>

                {/* result */}
                <div className="mt-5 pt-5 border-t border-border flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="text-sm font-semibold text-primary">{company.result}</p>
                </div>

                {/* corner glow */}
                <div className="pointer-events-none absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            )
          })}
        </div>

        {/* footer stat */}
        <div
          className="mt-14 flex flex-col items-center justify-center gap-3"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s',
          }}
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-6 py-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="text-sm md:text-base text-foreground">
              Más de{' '}
              <span className="font-black text-primary text-lg">
                +<CountUp target={50} start={inView} />
              </span>{' '}
              empresas chilenas están mejorando su compliance con KUMPLIO
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
