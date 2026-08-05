import { AlertTriangle, CheckCircle2, FileText, Link2 } from 'lucide-react'
import { CaseActionPlan } from '@/components/cases/case-action-plan'

type JsonRecord = Record<string, unknown>

export function ArtifactResultPreview({ content }: { content: unknown }) {
  const record = asRecord(content)
  const summary = firstText(record, ['summary', 'resumen', 'conclusion', 'result', 'resultado'])
  const findings = firstList(record, ['findings', 'hallazgos', 'obligations', 'obligaciones', 'risks', 'riesgos', 'actions', 'acciones'])
  const sources = firstList(record, ['sources', 'fuentes', 'citations', 'citas', 'sourceRefs', 'source_refs'])
  const caveats = firstList(record, ['caveats', 'reservations', 'reservas', 'limitations', 'limitaciones', 'assumptions', 'supuestos', 'openQuestions', 'preguntas_abiertas'])
  const hasRecognizedSummary = Boolean(summary || findings.length || sources.length || caveats.length)

  return (
    <div className="mt-4 space-y-4">
      <CaseActionPlan content={content} />

      {!hasRecognizedSummary && (
        <p className="text-sm leading-6 text-muted-foreground">
          El artefacto existe, pero su contenido no tiene todavía un formato reconocido para el resumen. Puede revisarse desde el expediente técnico.
        </p>
      )}

      {summary && (
        <div className="rounded-xl bg-primary/5 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Resultado</p>
          <p className="mt-2 text-sm leading-6">{summary}</p>
        </div>
      )}

      {findings.length > 0 && (
        <PreviewSection icon={<CheckCircle2 className="h-4 w-4" />} title="Hallazgos">
          {findings.slice(0, 6).map((item, index) => <PreviewItem key={`finding-${index}`} value={item} />)}
        </PreviewSection>
      )}

      {caveats.length > 0 && (
        <PreviewSection icon={<AlertTriangle className="h-4 w-4" />} title="Reservas y pendientes">
          {caveats.slice(0, 6).map((item, index) => <PreviewItem key={`caveat-${index}`} value={item} />)}
        </PreviewSection>
      )}

      {sources.length > 0 && (
        <PreviewSection icon={<Link2 className="h-4 w-4" />} title="Fuentes utilizadas">
          {sources.slice(0, 6).map((item, index) => <PreviewItem key={`source-${index}`} value={item} />)}
        </PreviewSection>
      )}
    </div>
  )
}

function PreviewSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-black">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  )
}

function PreviewItem({ value }: { value: unknown }) {
  const text = toDisplayText(value)
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-background p-3 text-sm leading-5">
      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <span>{text}</span>
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
