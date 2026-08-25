import { AlertTriangle, CheckCircle2, ChevronDown, FileText, Link2 } from 'lucide-react'
import { CaseActionPlan } from '@/components/cases/case-action-plan'
import { CaseGroundingChain } from '@/components/cases/case-grounding-chain'

type JsonRecord = Record<string, unknown>

export function ArtifactResultPreview({ content }: { content: unknown }) {
  const record = asRecord(content)
  const summary = firstText(record, ['summary', 'resumen', 'conclusion', 'result', 'resultado'])
  const findings = firstList(record, ['findings', 'hallazgos', 'obligations', 'obligaciones', 'risks', 'riesgos', 'actions', 'acciones'])
  const sources = firstList(record, ['sources', 'fuentes', 'citations', 'citas', 'sourceRefs', 'source_refs'])
  const caveats = firstList(record, ['caveats', 'reservations', 'reservas', 'limitations', 'limitaciones', 'assumptions', 'supuestos', 'openQuestions', 'preguntas_abiertas'])
  const hasRecognizedSummary = Boolean(summary || findings.length || sources.length || caveats.length)

  return (
    <div className="mt-4 space-y-3 sm:space-y-4">
      <CaseActionPlan content={content} />
      <CaseGroundingChain content={content} />

      {!hasRecognizedSummary && (
        <p className="rounded-xl border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
          El resultado está guardado, pero todavía no tiene un formato resumible. La información pendiente permanece disponible para revisión.
        </p>
      )}

      {summary && (
        <div className="rounded-xl bg-primary/5 p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Conclusión principal</p>
          <p className="mt-2 text-sm leading-6 sm:text-[15px] sm:leading-7">{summary}</p>
        </div>
      )}

      {findings.length > 0 && (
        <PreviewSection icon={<CheckCircle2 className="h-4 w-4" />} title={`Hallazgos (${findings.length})`} defaultOpen>
          {findings.slice(0, 6).map((item, index) => <PreviewItem key={`finding-${index}`} value={item} />)}
        </PreviewSection>
      )}

      {caveats.length > 0 && (
        <PreviewSection icon={<AlertTriangle className="h-4 w-4" />} title={`Reservas y pendientes (${caveats.length})`}>
          {caveats.slice(0, 6).map((item, index) => <PreviewItem key={`caveat-${index}`} value={item} />)}
        </PreviewSection>
      )}

      {sources.length > 0 && (
        <PreviewSection icon={<Link2 className="h-4 w-4" />} title={`Fuentes utilizadas (${sources.length})`}>
          {sources.slice(0, 6).map((item, index) => <PreviewItem key={`source-${index}`} value={item} />)}
        </PreviewSection>
      )}
    </div>
  )
}

function PreviewSection({ icon, title, children, defaultOpen = false }: { icon: React.ReactNode; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-xl border bg-background">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          {title}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
      </summary>
      <div className="space-y-2 border-t px-3 py-3 sm:px-4">{children}</div>
    </details>
  )
}

function PreviewItem({ value }: { value: unknown }) {
  const text = toDisplayText(value)
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted/25 p-3 text-sm leading-6">
      <FileText className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 break-words">{text}</span>
    </div>
  )
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function firstText(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function firstList(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value) && value.length > 0) return value
  }
  return [] as unknown[]
}

function toDisplayText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  const record = asRecord(value)
  const preferred = ['title', 'name', 'label', 'summary', 'description', 'message', 'text', 'finding', 'obligation', 'risk', 'action', 'source']
    .map((key) => record[key])
    .find((item) => typeof item === 'string' && item.trim())

  if (typeof preferred === 'string') return preferred

  const scalarParts = Object.entries(record)
    .filter(([, item]) => ['string', 'number', 'boolean'].includes(typeof item))
    .slice(0, 3)
    .map(([key, item]) => `${humanize(key)}: ${String(item)}`)

  return scalarParts.length > 0 ? scalarParts.join(' · ') : 'Contenido estructurado disponible'
}

function humanize(value: string) {
  return value.replaceAll('_', ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLocaleLowerCase('es-CL')
}
