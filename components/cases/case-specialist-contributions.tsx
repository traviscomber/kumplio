type JsonRecord = Record<string, unknown>

type Stage = {
  id: string
  agent_id: string
  status: string
  run_id: string | null
  output_artifact_id: string | null
}

type Artifact = {
  id: string
  run_id: string | null
  artifact_type?: string | null
  title: string
  content: unknown
  status: string
}

type Review = {
  run_id: string | null
  decision: string
  comment: string | null
}

type Props = {
  stages: Stage[]
  artifacts: Artifact[]
  reviews: Review[]
}

const coreByAgent: Record<string, 'Análisis' | 'Resolución' | 'Revisión' | null> = {
  isidora: 'Análisis',
  veronica: 'Resolución',
  catalina: 'Revisión',
  rodrigo: null,
  javier: null,
  beatriz: null,
  andres: null,
}

const supportByAgent: Record<string, string> = {
  beatriz: 'Cambio regulatorio',
  rodrigo: 'Análisis cuantitativo de riesgo',
  javier: 'Plan de ejecución',
  andres: 'Aprendizaje organizacional',
}

const coreOrder = ['Análisis', 'Resolución', 'Revisión'] as const

export function CaseSpecialistContributions({ stages, artifacts, reviews }: Props) {
  const stagedContributions = stages.map((stage) => {
    const artifact = artifacts.find((item) => item.id === stage.output_artifact_id)
      || artifacts.find((item) => item.run_id && item.run_id === stage.run_id)
      || null
    const review = stage.run_id
      ? reviews.find((item) => item.run_id === stage.run_id) || null
      : null
    return buildContribution({
      id: stage.id,
      agentId: stage.agent_id,
      stageStatus: stage.status,
      artifact,
      review,
    })
  })

  const stagedArtifactIds = new Set(stagedContributions.map((item) => item.artifactId).filter(Boolean))
  const stagedRunIds = new Set(stages.map((stage) => stage.run_id).filter(Boolean))
  const standaloneSupport = artifacts
    .filter((artifact) => supportByAgent[artifact.artifact_type || ''])
    .filter((artifact) => !stagedArtifactIds.has(artifact.id) && !stagedRunIds.has(artifact.run_id))
    .map((artifact) => buildContribution({
      id: `artifact-${artifact.id}`,
      agentId: artifact.artifact_type || '',
      stageStatus: artifact.status,
      artifact,
      review: artifact.run_id ? reviews.find((item) => item.run_id === artifact.run_id) || null : null,
    }))

  const contributions = [...stagedContributions, ...standaloneSupport]
  const support = contributions.filter((item) => item.supportLabel)

  return (
    <section className="border-t border-border/70 pt-7">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Contribuciones al expediente</p>
      <h2 className="mt-2 text-2xl font-black">Análisis, resolución y revisión</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        Kumplio organiza el caso en tres aportes comprensibles. Solo se muestran resultados persistidos; la decisión final permanece bajo Revisión humana.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {coreOrder.map((category) => {
          const items = contributions.filter((item) => item.coreLabel === category)
          return (
            <article key={category} className="rounded-2xl border bg-card p-5">
              <h3 className="font-black">{category}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{coreDescription(category)}</p>
              {items.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{coreEmpty(category)}</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {items.map((item) => <ContributionCard key={item.id} item={item} />)}
                </div>
              )}
            </article>
          )
        })}
      </div>

      {support.length > 0 && (
        <section className="mt-7 border-t border-border/60 pt-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Apoyo especializado</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Estos aportes aparecen solo cuando el caso necesita profundidad adicional. No forman parte obligatoria del flujo principal.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {support.map((item) => (
              <article key={item.id} className="rounded-2xl bg-muted/35 p-5">
                <h3 className="font-black">{item.supportLabel}</h3>
                <ContributionCard item={item} compact />
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  )
}

type Contribution = ReturnType<typeof buildContribution>

function ContributionCard({ item, compact = false }: { item: Contribution; compact?: boolean }) {
  return (
    <div className={compact ? 'mt-3' : 'rounded-xl bg-muted/25 p-4'}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="min-w-0 break-words font-semibold">{item.title}</p>
        <span className="rounded-full border px-3 py-1 text-xs font-semibold">{productStatus(item.stageStatus, item.reviewDecision)}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {item.conclusion || 'La conclusión aparecerá cuando exista un resultado persistido y resumible.'}
      </p>
      {item.source && <p className="mt-3 break-words text-xs leading-5 text-muted-foreground">Fuente: {item.source}</p>}
      {item.reviewComment && <p className="mt-2 text-xs leading-5 text-muted-foreground">Revisión humana: {item.reviewComment}</p>}
    </div>
  )
}

function buildContribution(input: {
  id: string
  agentId: string
  stageStatus: string
  artifact: Artifact | null
  review: Review | null
}) {
  const record = asRecord(input.artifact?.content)
  return {
    id: input.id,
    artifactId: input.artifact?.id || null,
    coreLabel: coreByAgent[input.agentId] ?? null,
    supportLabel: supportByAgent[input.agentId] || null,
    title: input.artifact?.title || 'Contribución en preparación',
    conclusion: firstText(record, ['summary', 'resumen', 'conclusion', 'resultado', 'result']),
    source: firstSource(record),
    stageStatus: input.stageStatus,
    reviewDecision: input.review?.decision || null,
    reviewComment: input.review?.comment || null,
  }
}

function coreDescription(category: typeof coreOrder[number]) {
  if (category === 'Análisis') return 'Fuentes, obligaciones, aplicabilidad y triage de riesgo.'
  if (category === 'Resolución') return 'Controles, evidencia, brechas y acciones correctivas.'
  return 'Sustento, contradicciones, reservas y decisión humana.'
}

function coreEmpty(category: typeof coreOrder[number]) {
  if (category === 'Análisis') return 'El análisis aparecerá cuando exista un resultado persistido.'
  if (category === 'Resolución') return 'La resolución aparecerá después de contar con una base suficiente para actuar.'
  return 'La revisión aparecerá cuando los aportes anteriores estén disponibles para contrastar.'
}

function productStatus(stageStatus: string, reviewDecision: string | null) {
  if (reviewDecision === 'approved' || stageStatus === 'approved') return 'Revisado y aprobado'
  if (reviewDecision === 'rejected') return 'Rechazado en revisión'
  if (stageStatus === 'pending_review' || stageStatus === 'completed') return 'Pendiente de revisión'
  if (stageStatus === 'changes_requested') return 'Requiere cambios'
  if (stageStatus === 'failed') return 'Sin resultado final'
  if (stageStatus === 'running') return 'En preparación'
  return 'Pendiente'
}

function firstSource(record: JsonRecord) {
  for (const key of ['source', 'fuente', 'sources', 'fuentes', 'citations', 'citas', 'sourceRefs', 'source_refs']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (Array.isArray(value)) {
      const first = value.map(toDisplayText).find(Boolean)
      if (first) return first
    }
  }
  return null
}

function firstText(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function toDisplayText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  const record = asRecord(value)
  for (const key of ['title', 'name', 'label', 'text', 'source', 'summary']) {
    const nested = record[key]
    if (typeof nested === 'string' && nested.trim()) return nested.trim()
  }
  return null
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}
