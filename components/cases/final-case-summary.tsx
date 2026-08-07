import { CheckCircle2, FileCheck2, ShieldCheck, TriangleAlert, UserRoundCheck } from 'lucide-react'

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
  const explicitNextStep = firstText(record, ['next_step', 'nextStep', 'recommended_next_step', 'recommendedNextStep', 'siguiente_paso'])
  const decisionRecommendation = firstText(record, ['decisionRecommendation', 'decision_recommendation'])
  const nextStep = explicitNextStep || nextStepFromDecision(decisionRecommendation, isReady)
  const explicitEvidence = firstList(record, ['closure_evidence', 'closureEvidence', 'evidence', 'evidencia', 'deliverables', 'entregables'])
  const evidence = explicitEvidence.length > 0 ? explicitEvidence : evidenceFromAssertions(record)
  const reservations = firstList(record, ['caveats', 'reservations', 'reservas', 'limitations', 'limitaciones', 'openQuestions', 'preguntas_abiertas'])
  const approvers = firstList(record, ['requiredApprovers', 'required_approvers'])

  if (!isReady && !reviewDecision) return null

  return (
    <section className={`rounded-[24px] border p-6 sm:p-7 ${isReady ? 'border-primary/25 bg-primary/5' : 'border-amber-500/25 bg-amber-500/5'}`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {isReady ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <TriangleAlert className="h-6 w-6 text-amber-600" />}
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Resultado del caso</p>
          </div>
          <h2 className="mt-3 text-3xl font-black">{isReady ? 'Ya puedes pasar de análisis a acción.' : 'El resultado todavía necesita revisión.'}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {isReady
              ? `${finalAgentName || 'La revisión final'} verificó el resultado y la decisión humana quedó registrada. Kumplio traduce ese cierre en el siguiente paso y en el respaldo que debes conservar.`
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
            {nextStep || 'El resultado final no contiene todavía un siguiente paso suficientemente respaldado.'}
          </p>
        </SummaryBlock>

        <SummaryBlock icon={<FileCheck2 className="h-5 w-5" />} title="Qué respaldo debes conservar">
          {evidence.length > 0 ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {evidence.slice(0, 6).map((item, index) => <li key={index}>• {toText(item)}</li>)}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              No se identificó evidencia de cierre específica. Antes de cerrar la implementación, registra qué documento, control, aprobación o registro demostrará que la acción se ejecutó.
            </p>
          )}
        </SummaryBlock>
      </div>

      {approvers.length > 0 && (
        <div className="mt-5 rounded-2xl border bg-background/75 p-5">
          <div className="flex items-center gap-2 text-primary">
            <UserRoundCheck className="h-5 w-5" />
            <h3 className="font-black text-foreground">Quién debe quedar involucrado</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            La revisión final identificó estas funciones o aprobadores para la decisión: {approvers.slice(0, 5).map(toText).join(', ')}.
          </p>
        </div>
      )}

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
        {decisionRecommendation && <span>Recomendación final: {humanize(decisionRecommendation)}</span>}
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

function evidenceFromAssertions(record: JsonRecord) {
  const assertions = Array.isArray(record.assertions) ? record.assertions : []
  const items: unknown[] = []

  for (const assertion of assertions) {
    const assertionRecord = asRecord(assertion)
    const requiredEvidence = assertionRecord.requiredEvidence
    if (Array.isArray(requiredEvidence)) items.push(...requiredEvidence)
  }

  return [...new Map(items.map((item) => [toText(item), item])).values()]
}

function nextStepFromDecision(decision: string | null, isReady: boolean) {
  if (!decision) {
    return isReady
      ? 'Lleva el resultado aprobado a ejecución, asigna responsables y conserva evidencia de cada acción antes de considerar la implementación terminada.'
      : null
  }

  if (decision === 'approve') {
    return 'Ejecuta el plan aprobado, asigna responsables y conserva evidencia verificable de cada medida implementada.'
  }
  if (decision === 'approve_with_reservations') {
    return 'Puedes avanzar, pero trata primero las reservas identificadas y deja evidencia de cómo fueron resueltas antes del cierre operativo.'
  }
  if (decision === 'request_changes') {
    return 'Incorpora los cambios solicitados, genera una nueva versión del resultado y vuelve a someterla a revisión humana.'
  }
  if (decision === 'reject') {
    return 'No ejecutes esta propuesta como solución aprobada. Replantea el análisis con nuevos antecedentes y una nueva revisión.'
  }
  if (decision === 'insufficient_information') {
    return 'Completa la información y evidencia faltante antes de tomar una decisión o presentar el caso como resuelto.'
  }

  return isReady
    ? 'Convierte el resultado aprobado en acciones asignadas y conserva evidencia verificable de su implementación.'
    : null
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
