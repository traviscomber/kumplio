import Link from 'next/link'
import { Bot, CheckCircle2, Clock3, GitBranch, History, PencilLine } from 'lucide-react'

export type CaseTimelineItem = {
  id: string
  type: 'case_created' | 'case_updated' | 'agent_run' | 'workflow' | 'review'
  title: string
  description?: string | null
  actor?: string | null
  createdAt: string
  href?: string | null
}

type CaseTimelineProps = {
  items: CaseTimelineItem[]
}

const iconByType = {
  case_created: CheckCircle2,
  case_updated: PencilLine,
  agent_run: Bot,
  workflow: GitBranch,
  review: History,
} as const

export function CaseTimeline({ items }: CaseTimelineProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Clock3 className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Línea de tiempo</h2>
          <p className="text-sm text-muted-foreground">Cambios, ejecuciones y decisiones del expediente en orden cronológico.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
          <p className="font-medium">Todavía no hay actividad registrada.</p>
          <p className="mt-2 text-sm text-muted-foreground">Los cambios del expediente y las ejecuciones de agentes aparecerán aquí.</p>
        </div>
      ) : (
        <ol className="mt-6 space-y-1">
          {items.map((item, index) => {
            const Icon = iconByType[item.type]
            const content = (
              <div className="rounded-xl border border-border bg-background p-4 transition hover:border-primary/30">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    {item.description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>}
                    {item.actor && <p className="mt-2 text-xs text-muted-foreground">Por {item.actor}</p>}
                  </div>
                  <time dateTime={item.createdAt} className="shrink-0 text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString('es-CL')}
                  </time>
                </div>
              </div>
            )

            return (
              <li key={`${item.type}-${item.id}`} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3">
                <div className="flex flex-col items-center">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  {index < items.length - 1 && <span className="my-1 h-full min-h-8 w-px bg-border" />}
                </div>
                <div className="pb-4">
                  {item.href ? <Link href={item.href}>{content}</Link> : content}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
