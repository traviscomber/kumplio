'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Check, ArrowRight } from 'lucide-react'

const rows = [
  { problema: 'Vencimientos que se pasan', kumplio: 'Alertas 30/15/5 días automáticas' },
  { problema: 'Cambios legales que no ves', kumplio: 'Monitoreo 24/7 en tiempo real' },
  { problema: 'Riesgos sin cuantificar', kumplio: 'Exposición en dinero (UF, $/día)' },
  { problema: 'Recomendaciones vagas', kumplio: 'Plan ejecutable mes a mes' },
  { problema: 'Sin auditoría independiente', kumplio: 'Verificación objetiva de Ver0nica' },
  { problema: 'Reportes manuales para reguladores', kumplio: 'PDF listo en 1 click' },
]

export function ComparisonRows() {
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
      <div className="mb-16 max-w-2xl">
        <h2 className="text-4xl font-bold text-balance">Cumplimiento Manual vs KUMPLIO</h2>
        <p className="mt-4 text-muted-foreground">
          Lo que pierdes haciéndolo a mano, KUMPLIO lo resuelve automáticamente.
        </p>
      </div>

      {/* Column headers */}
      <div
        className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 mb-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        <div className="flex items-center gap-2 px-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10 text-destructive">
            <X className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold uppercase tracking-wider text-destructive/80">
            Manual
          </span>
        </div>
        <div className="hidden md:block w-10" aria-hidden="true" />
        <div className="flex items-center gap-2 px-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
            <Check className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold uppercase tracking-wider text-primary">KUMPLIO</span>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((item, i) => (
          <div
            key={i}
            className="group grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-4 md:gap-8"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(-20px)',
              transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
            }}
          >
            {/* Manual / problem side */}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-5 transition-colors duration-300 group-hover:border-destructive/40">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
                <X className="h-4 w-4" />
              </span>
              <p className="text-sm font-medium text-muted-foreground line-through decoration-destructive/40 decoration-1">
                {item.problema}
              </p>
            </div>

            {/* Connector */}
            <div className="hidden md:flex items-center justify-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-300 group-hover:border-primary group-hover:text-primary group-hover:translate-x-1">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>

            {/* KUMPLIO / solution side */}
            <div className="relative flex items-center gap-3 overflow-hidden rounded-lg border border-primary/30 bg-primary/[0.07] p-5 transition-all duration-300 group-hover:border-primary group-hover:shadow-[0_0_24px_-12px_var(--color-primary)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-primary">
                <Check className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-foreground">{item.kumplio}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
