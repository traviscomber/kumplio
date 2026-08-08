import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  requestKey: z.string().uuid(),
  syntheticOnlyConfirmed: z.literal(true),
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

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return noStore({
      error: 'Confirma que el drill usa solo datos sintéticos y que sus límites están comprendidos.',
      code: 'controlled_deletion_confirmation_required',
      details: parsed.error.flatten(),
    }, 400)
  }

  const admin = createAdminClient()
  let access
  try {
    access = await getWorkspaceAccess(admin, user.id)
  } catch (error) {
    console.error('[controlled-deletion/access]', error instanceof Error ? error.message : 'unknown')
    return noStore({ error: 'No fue posible validar el workspace activo.', code: 'workspace_access_failed' }, 503)
  }

  if (!access) return noStore({ error: 'Organization required', code: 'organization_required' }, 403)
  if (!access.canAssignWork) {
    return noStore({ error: 'Tu rol no permite ejecutar este drill.', code: 'insufficient_role' }, 403)
  }

  const { data: processRow } = await admin.from('organization_processes')
    .select('id,attributes')
    .eq('id', processId)
    .eq('organization_id', access.organizationId)
    .eq('process_type', 'processing_activity')
    .eq('lifecycle_status', 'active')
    .maybeSingle()

  if (!processRow) return noStore({ error: 'Actividad no encontrada.', code: 'processing_activity_not_found' }, 404)
  const attributes = processRow.attributes && typeof processRow.attributes === 'object' && !Array.isArray(processRow.attributes)
    ? processRow.attributes as Record<string, unknown>
    : {}

  if (!['accepted_with_gaps', 'accepted_complete'].includes(String(attributes.privacyNoticeMappingStatus || ''))) {
    return noStore({
      error: 'Primero debe existir un mapeo del aviso aceptado.',
      code: 'notice_mapping_required',
    }, 409)
  }

  const { data, error } = await admin.rpc('run_processing_controlled_deletion_drill_v1', {
    p_actor_id: user.id,
    p_organization_id: access.organizationId,
    p_process_id: processId,
    p_request_key: parsed.data.requestKey,
  })

  if (error || !data) {
    console.error('[controlled-deletion/run]', error?.code, error?.message)
    return noStore({
      error: error?.message || 'No fue posible ejecutar el drill controlado.',
      code: 'controlled_deletion_drill_failed',
    }, error?.code === '42501' ? 403 : 500)
  }

  const result = data as Record<string, unknown>
  return noStore({
    drill: result,
    message: result.resumed
      ? 'El drill ya existía y se recuperó sin duplicarlo.'
      : 'Drill controlado aprobado técnicamente y evidencia entregada para revisión humana.',
  }, result.resumed ? 200 : 201)
}

function noStore(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
