import type { SupabaseClient } from '@supabase/supabase-js'

export type RuleRecord = {
  id: string
  ruleKey: string
  eventType: string
  enabled: boolean
  priority: number
  conditions: unknown[]
  actions: unknown[]
  updatedAt: string
}

export async function listRules(admin: SupabaseClient, organizationId: string): Promise<RuleRecord[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data, error } = await db
    .from('automation_rules')
    .select('id,rule_key,event_type,enabled,priority,conditions,actions,updated_at')
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .order('priority', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) throw new Error(`No fue posible cargar las reglas: ${error.message}`)

  return (data || []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    ruleKey: String(row.rule_key),
    eventType: String(row.event_type),
    enabled: Boolean(row.enabled),
    priority: Number(row.priority || 100),
    conditions: Array.isArray(row.conditions) ? row.conditions : [],
    actions: Array.isArray(row.actions) ? row.actions : [],
    updatedAt: String(row.updated_at || new Date().toISOString()),
  }))
}

export async function setRuleEnabled(
  admin: SupabaseClient,
  organizationId: string,
  ruleId: string,
  enabled: boolean,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { error } = await db
    .from('automation_rules')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('id', ruleId)
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)

  if (error) throw new Error(`No fue posible actualizar la regla: ${error.message}`)
}

export async function setRulePriority(
  admin: SupabaseClient,
  organizationId: string,
  ruleId: string,
  priority: number,
): Promise<void> {
  if (!Number.isInteger(priority) || priority < 1 || priority > 9999) {
    throw new Error('La prioridad debe ser un número entero entre 1 y 9999.')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { error } = await db
    .from('automation_rules')
    .update({ priority, updated_at: new Date().toISOString() })
    .eq('id', ruleId)
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)

  if (error) throw new Error(`No fue posible actualizar la prioridad: ${error.message}`)
}
