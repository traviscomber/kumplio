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

const categoryByAgent: Record<string, string> = {
  isidora: 'Análisis normativo',
  beatriz: 'Análisis normativo',
  rodrigo: 'Evaluación de riesgo',
  veronica: 'Controles y evidencia',
  javier: 'Plan de acción',
  catalina: 'Revisión jurídica/calidad',
  andres: 'Revisión jurídica/calidad',
}

const categoryOrder = [
  'Análisis normativo',
  'Evaluación de riesgo',
  'Controles y evidencia',
  'Plan de acción',
  'Revisión jurídica/calidad',
]

export function CaseSpecialistContributions({ stages, artifacts, reviews }: Props) {
  const contributions = stages.map((stage) => {
    const artifact = artifacts.find((item) => item.id === stage.output_artifact_id)
      || artifacts.find((item) => item.run_id && item.run_id === stage.run_id)
      || null
    const review = stage.run_id
      ? reviews.find((item) => item.run_id === stage.run_id) || null
      : null
    const record = asRecord(artifact?.content)

    return {
      id: stage.id,
      category: categoryByAgent[stage.agent_id] || 'Revisión jurídica/calidad',
      title: artifact?.title || 'Contribución en preparación',
      conclusion: firstText(record, ['summary', 'resumen', 'conclusion', 'resultado', 'result']),
      source: firstSource(record),
      stageStatus: stage.status,
      reviewDecision: review?.decision || null,
      reviewComment: review?.comment || null,
    }
  })

  return (
    <section className="rounded-[28px] border bg-card p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Contribuciones al expediente</p>
      <h2 className="mt-2 text-2xl font-black">Qué aportó cada especialidad</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        Se muestran conclusiones y respaldo ya persistidos. La decisión final permanece bajo Revisión humana y no se exponen detalles internos de ejecución.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {categoryOrder.map((category) => {
          const items = contributions.filter((item) => item.category === category)
          return (
            <article key={category} className="rounded-2xl border bg-background/55 p-5">
              <h3 className="font-black">{category}</h3>
              {items.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">Sin una contribución persistida en esta categoría todavía.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-xl border bg-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="font-semibold">{item.title}</p>
                        <span className="rounded-full border px-3 py-1 text-xs font-semibold">{productStatus(item.stageStatus, item.reviewDecision)}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {item.conclusion || 'La conclusión aparecerá cuando exista un resultado persistido y resumible.'}
                      </p>
                      {item.source && <p className="mt-3 text-xs leading-5 text-muted-foreground">Fuente: {item.source}</p>}
                      {item.reviewComment && <p className="mt-2 text-xs leading-5 text-muted-foreground">Revisión humana: {item.reviewComment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
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
