import { ChevronDown, Info, ShieldCheck } from 'lucide-react'

type WhyDetailsProps = {
  reasons: string[]
  facts?: string[]
  confidence?: number | null
  nextAction?: string | null
  sourceLabel?: string | null
  compact?: boolean
}

export function WhyDetails({
  reasons,
  facts = [],
  confidence = null,
  nextAction = null,
  sourceLabel = null,
  compact = false,
}: WhyDetailsProps) {
  const cleanReasons = reasons.filter(Boolean)
  const cleanFacts = facts.filter(Boolean)

  return (
    <details className="group rounded-xl border border-border/80 bg-background/60">
      <summary className={`flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-foreground ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'}`}>
        <span className="inline-flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" aria-hidden="true" />
          ¿Por qué aparece esto?
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className={`border-t border-border/80 ${compact ? 'p-3' : 'p-4'}`}>
        {sourceLabel && (
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{sourceLabel}</p>
        )}

        {cleanReasons.length > 0 && (
          <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
            {cleanReasons.map((reason) => (
              <li key={reason} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        )}

        {cleanFacts.length > 0 && (
          <div className="mt-4 rounded-lg border border-primary/15 bg-primary/5 p-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Hechos considerados</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
              {cleanFacts.map((fact) => <li key={fact}>• {fact}</li>)}
            </ul>
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Respaldo
            </div>
            <p className="mt-1 text-sm font-bold">
              {typeof confidence === 'number' ? `${Math.round(confidence)}%` : 'Sin base suficiente'}
            </p>
          </div>
          {nextAction && (
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs font-semibold text-muted-foreground">Siguiente paso</p>
              <p className="mt-1 text-sm font-bold">{nextAction}</p>
            </div>
          )}
        </div>
      </div>
    </details>
  )
}
