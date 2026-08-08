import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { PRIVACY_NOTICE } from '@/lib/privacy/notice'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  requestKey: z.string().uuid(),
  scopeConfirmed: z.literal(true),
  ownerAndDatesConfirmed: z.literal(true),
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ processId: string }> },
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return noStore({ error: 'Authentication required', code: 'authentication_required' }, 401)

  const { processId } = await context.params
  if (!z.string().uuid().safeParse(processId).success) {
    return noStore({ error: 'Actividad inválida.', code: 'invalid_process_id' }, 400)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return noStore({ error: 'Invalid JSON request', code: 'invalid_json' }, 400)
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return noStore({
      error: 'Confirma el alcance, responsable y fechas antes de crear el plan.',
      code: 'invalid_privacy_remediation',
      details: parsed.error.flatten(),
    }, 400)
  }

  const admin = createAdminClient()
  let access
  try {
    access = await getWorkspaceAccess(admin, user.id)
  } catch (error) {
    console.error('[processing-privacy/access]', error instanceof Error ? error.message : 'unknown')
    return noStore({ error: 'No fue posible validar el workspace activo.', code: 'workspace_access_failed' }, 503)
  }

  if (!access) return noStore({ error: 'Organization required', code: 'organization_required' }, 403)
  if (!access.canAssignWork) {
    return noStore({ error: 'Tu rol no permite crear trabajo de remediación.', code: 'insufficient_role' }, 403)
  }

  const { data: processRow } = await admin.from('organization_processes')
    .select('id,owner_user_id')
    .eq('id', processId)
    .eq('organization_id', access.organizationId)
    .eq('process_type', 'processing_activity')
    .neq('lifecycle_status', 'retired')
    .maybeSingle()

  if (!processRow) return noStore({ error: 'Actividad no encontrada.', code: 'processing_activity_not_found' }, 404)
  if (!processRow.owner_user_id) {
    return noStore({ error: 'La actividad necesita una persona responsable.', code: 'processing_activity_owner_required' }, 409)
  }

  const now = new Date()
  const noticeDueAt = addUtcDays(now, 14).toISOString()
  const deletionDueAt = addUtcDays(now, 30).toISOString()
  const missionDueAt = addUtcDays(now, 35).toISOString()

  const { data, error } = await admin.rpc('prepare_processing_activity_privacy_remediation_v1', {
    p_actor_id: user.id,
    p_organization_id: access.organizationId,
    p_process_id: processId,
    p_request_key: parsed.data.requestKey,
    p_notice_snapshot: PRIVACY_NOTICE,
    p_notice_due_at: noticeDueAt,
    p_deletion_due_at: deletionDueAt,
    p_mission_due_at: missionDueAt,
  })

  if (error || !data) {
    const conflict = error?.code === '23514' && error.message?.includes('different snapshot')
    console.error('[processing-privacy/remediation]', error?.code, error?.message)
    return noStore({
      error: conflict
        ? 'La versión del aviso ya existe con otro contenido. Revisa su versionado antes de continuar.'
        : 'No fue posible crear el plan de aviso y eliminación.',
      code: conflict ? 'privacy_notice_version_conflict' : 'privacy_remediation_failed',
    }, conflict ? 409 : 500)
  }

  const result = data as Record<string, unknown>
  return noStore({
    remediation: result,
    message: result.resumed
      ? 'El plan ya existía y se recuperó sin duplicarlo.'
      : 'Aviso y eliminación quedaron convertidos en misión y solicitudes de evidencia.',
  }, result.resumed ? 200 : 201)
}

function addUtcDays(value: Date, days: number) {
  const result = new Date(value)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function noStore(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
