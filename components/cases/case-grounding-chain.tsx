type JsonRecord = Record<string, unknown>

type GroundingItem = {
  label: string
  value: string
}

export function CaseGroundingChain({ content }: { content: unknown }) {
  const record = asRecord(content)
  const source = firstDisplay(record, ['source', 'fuente', 'sources', 'fuentes', 'sourceRefs', 'source_refs', 'citations', 'citas'])
  const fragment = firstDisplay(record, ['fragment', 'fragmento', 'excerpt', 'extracto', 'quote', 'citationText', 'cited_text'])
  const obligation = firstDisplay(record, ['obligation', 'obligacion', 'obligación', 'obligations', 'obligaciones', 'finding', 'hallazgo'])
  const requirement = firstDisplay(record, ['requirement', 'requisito', 'requirements', 'requisitos', 'action', 'accion', 'acción'])
  const applicability = firstDisplay(record, ['applicability', 'aplicabilidad', 'applies', 'scope', 'alcance'])

  const items: GroundingItem[] = [
    { label: 'Fuente', value: source || 'Sin fuente vinculada todavía' },
    { label: 'Fragmento', value: fragment || 'Pendiente de revisión' },
    { label: 'Obligación', value: obligation || 'Pendiente de revisión' },
    { label: 'Requisito', value: requirement || 'Pendiente de revisión' },
    { label: 'Aplicabilidad', value: applicability || 'Pendiente de revisión' },
  ]

  return (
    <section className="rounded-xl border bg-background p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Fundamento</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Kumplio separa la fuente, el fragmento citado, la interpretación y la acción operativa. La existencia de una fuente no demuestra por sí sola que un requisito esté cumplido.
      </p>
      <dl className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="grid gap-1 rounded-lg bg-muted/25 p-3 sm:grid-cols-[120px_1fr] sm:gap-4">
            <dt className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{item.label}</dt>
            <dd className="min-w-0 break-words text-sm leading-6">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function firstDisplay(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    const text = toDisplayText(value)
    if (text) return text
  }
  return null
}

function toDisplayText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    const first = value.map(toDisplayText).find(Boolean)
    return first || null
  }

  const record = asRecord(value)
  for (const key of ['title', 'name', 'label', 'summary', 'description', 'text', 'quote', 'source', 'obligation', 'requirement', 'action']) {
    const nested = record[key]
    if (typeof nested === 'string' && nested.trim()) return nested.trim()
  }
  return null
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}
