import { CheckCircle2, FileCheck2, ShieldCheck, TriangleAlert } from 'lucide-react'

type JsonRecord = Record<string, unknown>

type Props = {
  workflowStatus: string
  finalStageStatus: string | null
  finalAgentName: string | null
  artifactTitle: string | null
  artifactContent: unknown
  reviewDecision: string | null
  reviewComment: string | null
  reviewedAt: string | null
}

export function FinalCaseSummary({
  workflowStatus,
  finalStageStatus,
  finalAgentName,
  artifactTitle,
  artifactContent,
  reviewDecision,
  reviewComment,
  reviewedAt,
}: Props) {
  const isReady = workflowStatus === 'completed' && finalStageStatus === 'approved' && reviewDecision === 'approved'
  const record = asRecord(artifactContent)
  const summary = firstText(record, ['executive_summary', 'executiveSummary', 'summary', 'resumen', 'conclusion', 'resultado'])
  const nextStep = firstText(record, ['next_step', 'nextStep', 'recommended_next_step', 'recommendedNextStep', 'siguiente_paso'])
  const evidence = firstList(record, ['closure_evidence', 'closureEvidence', 'evidence', 'evidencia', 'deliverables', 'entregables'])
  const reservations = firstList(record, ['caveats', 'reservations', 'reservas', 'limitations', 'limitaciones', 'openQuestions', 'preguntas_abiertas'])

  if (!isReady && !reviewDecision) return null

  return (
    <section className={`rounded-[24px] border p-6 sm:p-7 ${isReady ? 'border-primary/25 bg-primary/5' : 'border-amber-500/25 bg-amber-500/5'}`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {isReady ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <TriangleAlert className="h-6 w-6 text-amber-600" />}
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Resultado del caso</p>
          </div>
          <h2 className="mt-3 text-3xl font-black">{isReady ? 'Ya puedes actuar.' : 'El resultado todavía necesita revisión.'}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {isReady
              ? `${finalAgentName || 'La revisión final'} verificó que el resultado aprobado tiene respaldo suficiente para avanzar.`
              : 'Existe una decisión registrada, pero aún faltan condiciones para presentar este caso como listo para actuar.'}
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border bg-background px-3 py-1 text-xs font-semibold">
          {reviewDecision === 'approved' ? 'Resultado aprobado' : humanize(reviewDecision || 'pendiente')}
        </span>
      </div>

      {summary && (
        <div className="mt-6 rounded-2xl border bg-background/75 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Qué resolvió este caso</p>
          <p className="mt-3 text-sm leading-7">{summary}</p>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <SummaryBlock icon={<ShieldCheck className="h-5 w-5" />} title="Qué hacer ahora">
          <p className="text-sm leading-6 text-muted-foreground">
            {nextStep || 'El resultado final no contiene todavía un siguiente paso explícito.'}
          </p>
        </SummaryBlock>

        <SummaryBlock icon={<FileCheck2 className="h-5 w-5" />} title="Cómo demostrarlo">
          {evidence.length > 0 ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {evidence.slice(0, 5).map((item, index) => <li key={index}>• {toText(item)}</li>)}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">No se declaró evidencia de cierre en un campo reconocido.</p>
          )}
        </SummaryBlock>
      </div>

      {reservations.length > 0 && (
        <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-sm font-black">Lo que todavía debes considerar</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {reservations.slice(0, 5).map((item, index) => <li key={index}>• {toText(item)}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {artifactTitle && <span>Resultado: {artifactTitle}</span>}
        {reviewedAt && <span>Revisado: {new Date(reviewedAt).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}</span>}
        {reviewComment && <span>Comentario de revisión: {reviewComment}</span>}
      </div>
    </section>
  )
}

function SummaryBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-background/75 p-5">
      <div className="flex items-center gap-2 text-primary">{icon}<h3 className="font-black text-foreground">{title}</h3></div>
      <div className="mt-3">{children}</div>
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

function toText(value: unknown) {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  const record = asRecord(value)
  const preferred = ['title', 'name', 'label', 'description', 'summary', 'evidence', 'criterion']
    .map((key) => record[key])
    .find((item) => typeof item === 'string' && item.trim())
  return typeof preferred === 'string' ? preferred : 'Contenido estructurado disponible'
}

function humanize(value: string) {
  return value.replaceAll('_', ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLocaleLowerCase('es-CL')
}
