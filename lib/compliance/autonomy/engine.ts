import type { SupabaseClient } from '@supabase/supabase-js'

type ComplianceEvent = {
  id: string
  organization_id: string
  event_type: string
  source_type: string
  source_id: string | null
  subject_type: string | null
  subject_id: string | null
  payload: Record<string, unknown>
}

type AutomationCondition = {
  path: string
  operator: 'eq' | 'neq' | 'exists'
  value?: unknown
}

type AutomationAction = {
  type: 'create_situation'
  situation_type: string
  title: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

type AutomationRule = {
  id: string
  rule_key: string
  conditions: AutomationCondition[]
  actions: AutomationAction[]
}

export async function publishComplianceEvent(
  admin: SupabaseClient,
  input: {
    organizationId: string
    eventType: string
    sourceType: string
    sourceId?: string | null
    subjectType?: string | null
    subjectId?: string | null
    payload?: Record<string, unknown>
  },
) {
  // Tables are introduced by the autonomy migration and may not yet exist in generated client types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data, error } = await db
    .from('compliance_events')
    .insert({
      organization_id: input.organizationId,
      event_type: input.eventType,
      source_type: input.sourceType,
      source_id: input.sourceId ?? null,
      subject_type: input.subjectType ?? null,
      subject_id: input.subjectId ?? null,
      payload: input.payload ?? {},
    })
    .select('id')
    .single()

  if (error) throw new Error(`No fue posible publicar el evento: ${error.message}`)
  return String(data.id)
}

export async function processPendingComplianceEvents(admin: SupabaseClient, limit = 25) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data: events, error } = await db
    .from('compliance_events')
    .select('id,organization_id,event_type,source_type,source_id,subject_type,subject_id,payload')
    .eq('status', 'pending')
    .order('occurred_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error(`No fue posible cargar la cola de eventos: ${error.message}`)

  let processed = 0
  let failed = 0
  for (const event of (events || []) as ComplianceEvent[]) {
    const claimed = await claimEvent(db, event.id)
    if (!claimed) continue

    try {
      await evaluateEvent(db, event)
      await db.from('compliance_events').update({ status: 'processed', processed_at: new Date().toISOString(), error_message: null }).eq('id', event.id)
      processed += 1
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Error desconocido'
      await db.from('compliance_events').update({ status: 'failed', processed_at: new Date().toISOString(), error_message: message }).eq('id', event.id)
      failed += 1
    }
  }

  return { processed, failed, total: (events || []).length }
}

async function claimEvent(db: any, eventId: string) {
  const { data } = await db
    .from('compliance_events')
    .update({ status: 'processing' })
    .eq('id', eventId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()
  return Boolean(data)
}

async function evaluateEvent(db: any, event: ComplianceEvent) {
  const { data: rules, error } = await db
    .from('automation_rules')
    .select('id,rule_key,conditions,actions')
    .eq('event_type', event.event_type)
    .eq('enabled', true)
    .or(`organization_id.is.null,organization_id.eq.${event.organization_id}`)
    .order('priority', { ascending: true })

  if (error) throw new Error(`No fue posible evaluar reglas: ${error.message}`)

  for (const rule of (rules || []) as AutomationRule[]) {
    if (!matchesConditions(event, rule.conditions || [])) continue
    for (const action of rule.actions || []) {
      if (action.type === 'create_situation') await createSituation(db, event, rule, action)
    }
  }
}

function matchesConditions(event: ComplianceEvent, conditions: AutomationCondition[]) {
  return conditions.every((condition) => {
    const actual = readPath(event, condition.path)
    if (condition.operator === 'exists') return actual !== undefined && actual !== null
    if (condition.operator === 'neq') return actual !== condition.value
    return actual === condition.value
  })
}

function readPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[key]
  }, value)
}

async function createSituation(db: any, event: ComplianceEvent, rule: AutomationRule, action: AutomationAction) {
  const { data: existing } = await db
    .from('compliance_situations')
    .select('id')
    .eq('event_id', event.id)
    .eq('situation_type', action.situation_type)
    .maybeSingle()
  if (existing) return

  const { error } = await db.from('compliance_situations').insert({
    organization_id: event.organization_id,
    event_id: event.id,
    situation_type: action.situation_type,
    title: action.title,
    summary: `Generada automáticamente por la regla ${rule.rule_key}.`,
    severity: action.severity ?? 'medium',
    context: {
      event_type: event.event_type,
      source_type: event.source_type,
      source_id: event.source_id,
      subject_type: event.subject_type,
      subject_id: event.subject_id,
      payload: event.payload,
      rule_key: rule.rule_key,
    },
  })
  if (error) throw new Error(`No fue posible crear la situación: ${error.message}`)
}
