import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { buildProcessingNoticeMappingSuggestion } from '@/lib/privacy/processing-notice-mapping'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  requestKey: z.string().uuid(),
  mappingReviewed: z.literal(true),
  limitationsConfirmed: z.literal(true),
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
      error: 'Revisa el mapeo y confirma expresamente sus límites antes de aceptarlo.',
      code: 'invalid_notice_mapping_confirmation',
      details: parsed.error.flatten(),
    }, 400)
  }

  const admin = createAdminClient()
  let access
  try {
    access = await getWorkspaceAccess(admin, user.id)
  } catch (error) {
    console.error('[notice-mapping/access]', error instanceof Error ? error.message : 'unknown')
    return noStore({ error: 'No fue posible validar el workspace activo.', code: 'workspace_access_failed' }, 503)
  }

  if (!access) return noStore({ error: 'Organization required', code: 'organization_required' }, 403)
  if (!access.canAssignWork) {
    return noStore({ error: 'Tu rol no permite aceptar evidencia de mapeo.', code: 'insufficient_role' }, 403)
  }

  const { data: processRow, error: processError } = await admin.from('organization_processes')
    .select('id,name,code,owner_user_id,attributes')
    .eq('id', processId)
    .eq('organization_id', access.organizationId)
    .eq('process_type', 'processing_activity')
    .neq('lifecycle_status', 'retired')
    .maybeSingle()

  if (processError) {
    console.error('[notice-mapping/process]', processError.code, processError.message)
    return noStore({ error: 'No fue posible cargar la actividad.', code: 'processing_activity_load_failed' }, 503)
  }
  if (!processRow) return noStore({ error: 'Actividad no encontrada.', code: 'processing_activity_not_found' }, 404)
  if (!processRow.owner_user_id) {
    return noStore({ error: 'La actividad necesita una persona responsable.', code: 'processing_activity_owner_required' }, 409)
  }

  const attributes = asObject(processRow.attributes)
  const suggestion = buildProcessingNoticeMappingSuggestion({
    processName: String(processRow.name || 'Actividad de tratamiento'),
    processCode: text(processRow.code),
    purpose: text(attributes.purpose),
    source: attributes.source,
    lifecycleUnknowns: attributes.lifecycleUnknowns,
    lifecycleReviewId: text(attributes.latestLifecycleReviewId),
    lifecycleSnapshotHash: text(attributes.latestSnapshotHash),
  })

  if (!suggestion.ready || !suggestion.primaryScope) {
    return noStore({
      error: 'No existe una sugerencia defendible para esta actividad. Completa fuente y revisión lifecycle antes de mapear el aviso.',
      code: 'notice_mapping_not_ready',
    }, 409)
  }

  const payload = {
    ...suggestion,
    mappingStatus: 'accepted_with_gaps',
    mappingReviewed: parsed.data.mappingReviewed,
    limitationsConfirmed: parsed.data.limitationsConfirmed,
  }

  const { data, error } = await admin.rpc('accept_processing_notice_mapping_v1', {
    p_actor_id: user.id,
    p_organization_id: access.organizationId,
    p_process_id: processId,
    p_request_key: parsed.data.requestKey,
    p_payload: payload,
  })

  if (error || !data) {
    console.error('[notice-mapping/accept]', error?.code, error?.message)
    const conflict = error?.code === '23514'
    return noStore({
      error: conflict
        ? 'El mapeo entra en conflicto con el estado actual de la actividad. Actualiza los datos y vuelve a revisarlo.'
        : 'No fue posible aceptar el mapeo del aviso.',
      code: conflict ? 'notice_mapping_conflict' : 'notice_mapping_failed',
    }, conflict ? 409 : 500)
  }

  const result = data as Record<string, unknown>
  return noStore({
    mapping: result,
    message: result.resumed
      ? 'El mapeo ya estaba aceptado y se recuperó sin duplicarlo.'
      : 'Mapeo aceptado con brechas explícitas y evidencia trazable.',
  }, result.resumed ? 200 : 201)
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function noStore(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
