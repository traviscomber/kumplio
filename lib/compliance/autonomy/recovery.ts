import type { SupabaseClient } from '@supabase/supabase-js'

export type FailedEvent = {
  id: string
  eventType: string
  sourceType: string
  errorMessage: string | null
  occurredAt: string
  processedAt: string | null
}

export async function listFailedEvents(admin: SupabaseClient, organizationId: string): Promise<FailedEvent[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data, error } = await db
    .from('compliance_events')
    .select('id,event_type,source_type,error_message,occurred_at,processed_at')
    .eq('organization_id', organizationId)
    .eq('status', 'failed')
    .order('processed_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(`No fue posible cargar los eventos fallidos: ${error.message}`)

  return (data || []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    eventType: String(row.event_type),
    sourceType: String(row.source_type),
    errorMessage: typeof row.error_message === 'string' ? row.error_message : null,
    occurredAt: String(row.occurred_at),
    processedAt: row.processed_at ? String(row.processed_at) : null,
  }))
}

export async function retryFailedEvent(
  admin: SupabaseClient,
  organizationId: string,
  eventId: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data, error } = await db
    .from('compliance_events')
    .update({ status: 'pending', processed_at: null, error_message: null })
    .eq('id', eventId)
    .eq('organization_id', organizationId)
    .eq('status', 'failed')
    .select('id')
    .maybeSingle()

  if (error) throw new Error(`No fue posible reintentar el evento: ${error.message}`)
  if (!data) throw new Error('El evento no existe, ya fue reintentado o no pertenece a la organización.')
}

export async function retryAllFailedEvents(
  admin: SupabaseClient,
  organizationId: string,
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data, error } = await db
    .from('compliance_events')
    .update({ status: 'pending', processed_at: null, error_message: null })
    .eq('organization_id', organizationId)
    .eq('status', 'failed')
    .select('id')

  if (error) throw new Error(`No fue posible reintentar los eventos: ${error.message}`)
  return (data || []).length
}
