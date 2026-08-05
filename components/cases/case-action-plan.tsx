import { CheckCircle2, Clock3, FileCheck2, Flag, ListTodo } from 'lucide-react'

type JsonRecord = Record<string, unknown>

type PlanGroup = {
  title: string
  description: string
  icon: React.ReactNode
  items: unknown[]
}

export function CaseActionPlan({ content }: { content: unknown }) {
  const record = asRecord(content)
  const planRoot = firstRecord(record, ['plan', 'roadmap', 'actionPlan', 'action_plan', 'plan_de_accion']) || record

  const now = firstList(planRoot, ['urgent', 'urgente', 'now', 'ahora', 'immediate', 'inmediato', 'priorities', 'prioridades'])
  const next = firstList(planRoot, ['important', 'importante', 'next', 'despues', 'later', 'siguiente', 'phases', 'fases'])
  const wait = firstList(planRoot, ['canWait', 'puede_esperar', 'puedeEsperar', 'deferred', 'postergable', 'backlog'])
  const closure = firstList(planRoot, ['evidence', 'evidencia', 'closureEvidence', 'evidenceOfClosure', 'criterios_de_cierre', 'acceptanceCriteria', 'criterios'])

  const actions = firstList(planRoot, ['actions', 'acciones', 'tasks', 'tareas', 'steps', 'pasos', 'roadmap'])
  const classified = classifyActions(actions)

  const groups: PlanGroup[] = [
    {
      title: 'Empieza por esto',
      description: 'Acciones que el artefacto identifica como inmediatas o prioritarias.',
      icon: <Flag className="h-5 w-5" />,
      items: now.length ? now : classified.now,
    },
    {
      title: 'Haz esto después',
      description: 'Trabajo importante que depende de las primeras acciones o puede seguir a continuación.',
      icon: <ListTodo className="h-5 w-5" />,
      items: next.length ? next : classified.next,
    },
    {
      title: 'Puede programarse',
      description: 'Acciones que el artefacto permite postergar o calendarizar.',
      icon: <Clock3 className="h-5 w-5" />,
      items: wait.length ? wait : classified.wait,
    },
    {
      title: 'Cómo demostrar el cierre',
      description: 'Evidencia o criterios persistidos para verificar que el trabajo quedó terminado.',
      icon: <FileCheck2 className="h-5 w-5" />,
      items: closure,
    },
  ].filter((group) => group.items.length > 0)

  if (groups.length === 0) return null

  return (
    <section className="border-b bg-background/40 px-6 py-8 sm:px-9">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Plan guiado</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Qué hacer desde ahora</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Esta vista reorganiza únicamente acciones y criterios presentes en el artefacto persistido. No agrega prioridades ni evidencia nuevas.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <article key={group.title} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">{group.icon}</div>
              <div>
                <h3 className="font-black">{group.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{group.description}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {group.items.slice(0, 8).map((item, index) => (
                <PlanItem key={`${group.title}-${index}`} value={item} index={index + 1} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function PlanItem({ value, index }: { value: unknown; index: number }) {
  const record = asRecord(value)
  const title = firstText(record, ['title', 'name', 'action', 'accion', 'task', 'tarea', 'step', 'paso', 'description', 'descripcion']) || toText(value)
  const owner = firstText(record, ['owner', 'responsible', 'responsable', 'area', 'role', 'rol'])
  const deadline = firstText(record, ['deadline', 'dueDate', 'due_date', 'plazo', 'fecha', 'timing', 'tiempo'])
  const criterion = firstText(record, ['acceptanceCriteria', 'acceptance_criteria', 'closure', 'criterio', 'criterio_de_cierre', 'evidence', 'evidencia'])

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{index}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-6">{title}</p>
          {(owner || deadline) && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {owner && <span className="rounded-full border px-2 py-1">Responsable sugerido: {owner}</span>}
              {deadline && <span className="rounded-full border px-2 py-1">Plazo: {deadline}</span>}
            </div>
          )}
          {criterion && (
            <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span><strong className="text-foreground">Cierre:</strong> {criterion}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function classifyActions(actions: unknown[]) {
  const result = { now: [] as unknown[], next: [] as unknown[], wait: [] as unknown[] }
  for (const action of actions) {
    const record = asRecord(action)
    const priority = (firstText(record, ['priority', 'prioridad', 'urgency', 'urgencia', 'timing', 'momento']) || '').toLocaleLowerCase('es-CL')
    if (/(urgent|urgente|critical|critica|inmediato|ahora|alta)/.test(priority)) result.now.push(action)
    else if (/(low|baja|later|despues|posterg|wait)/.test(priority)) result.wait.push(action)
    else result.next.push(action)
  }
  return result
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function firstRecord(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as JsonRecord
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

function firstText(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number') return String(value)
  }
  return null
}

function toText(value: unknown) {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  const record = asRecord(value)
  const scalar = Object.values(record).find((item) => typeof item === 'string' && item.trim())
  return typeof scalar === 'string' ? scalar : 'Acción estructurada disponible'
}
