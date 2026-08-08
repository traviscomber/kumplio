import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const sourceSchema = z.object({
  type: z.enum(['backup_purga_programada', 'backup_purga_confirmada', 'provider_log', 'system_log', 'operator_attestation']),
  label: z.string().trim().min(3).max(180),
  reference: z.string().trim().min(3).max(500),
})

const requestSchema = z.object({
  requestKey: z.string().uuid(),
  method: z.enum(['deletion', 'anonymization']),
  executedAt: z.string().datetime({ offset: true }),
  provider: z.string().trim().min(2).max(180),
  assetOrDataset: z.string().trim().min(3).max(240),
  scope: z.string().trim().min(20).max(1800),
  executor: z.string().trim().min(3).max(240),
  result: z.string().trim().min(20).max(1800),
  backupPurgaProgramada: z.string().trim().min(3).max(500),
  backupPurgaConfirmada: z.string().trim().min(3).max(500),
  sourceRefs: z.array(sourceSchema).min(2).max(12),
  reviewNote: z.string().trim().min(30).max(1800),
  deletionReviewed: z.literal(true),
  noPersonalDataConfirmed: z.literal(true),
}).superRefine((value, ctx) => {
  if (value.backupPurgaProgramada === value.backupPurgaConfirmada) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['backupPurgaConfirmada'],
      message: 'La referencia de confirmación debe ser distinta de la programación.',
    })
  }

  const sourceTypes = new Set(value.sourceRefs.map((source) => source.type))
  if (!sourceTypes.has('backup_purga_programada')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sourceRefs'],
      message: 'Falta la fuente backup_purga_programada.',
    })
  }
  if (!sourceTypes.has('backup_purga_confirmada')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sourceRefs'],
      message: 'Falta la fuente backup_purga_confirmada.',
    })
  }
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
      error: 'La prueba de eliminación o anonimización está incompleta.',
      code: 'invalid_deletion_evidence',
      details: parsed.error.flatten(),
    }, 400)
  }

  const admin = createAdminClient()
  let access
  try {
    access = await getWorkspaceAccess(admin, user.id)
  } catch (error) {
    console.error('[deletion-evidence/access]', error instanceof Error ? error.message : 'unknown')
    return noStore({ error: 'No fue posible validar el workspace activo.', code: 'workspace_access_failed' }, 503)
  }

  if (!access) return noStore({ error: 'Organization required', code: 'organization_required' }, 403)
  if (!access.canAssignWork) {
    return noStore({ error: 'Tu rol no permite aceptar evidencia de eliminación.', code: 'insufficient_role' }, 403)
  }

  const { data: processRow, error: processError } = await admin.from('organization_processes')
    .select('id,owner_user_id,attributes')
    .eq('id', processId)
    .eq('organization_id', access.organizationId)
    .eq('process_type', 'processing_activity')
    .neq('lifecycle_status', 'retired')
    .maybeSingle()

  if (processError) {
    console.error('[deletion-evidence/process]', processError.code, processError.message)
    return noStore({ error: 'No fue posible cargar la actividad.', code: 'processing_activity_load_failed' }, 503)
  }
  if (!processRow) return noStore({ error: 'Actividad no encontrada.', code: 'processing_activity_not_found' }, 404)
  if (!processRow.owner_user_id) {
    return noStore({ error: 'La actividad necesita una persona responsable.', code: 'processing_activity_owner_required' }, 409)
  }

  const attributes = asObject(processRow.attributes)
  if (!text(attributes.deletionEvidenceRequestId) || !text(attributes.privacyRemediationMissionId)) {
    return noStore({
      error: 'La actividad todavía no tiene una solicitud de evidencia de eliminación trazable.',
      code: 'deletion_evidence_request_missing',
    }, 409)
  }

  const executedAt = new Date(parsed.data.executedAt)
  if (executedAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return noStore({ error: 'La ejecución informada todavía no ha ocurrido.', code: 'future_deletion_execution' }, 400)
  }

  const { data, error } = await admin.rpc('accept_processing_deletion_evidence_v1', {
    p_actor_id: user.id,
    p_organization_id: access.organizationId,
    p_process_id: processId,
    p_request_key: parsed.data.requestKey,
    p_payload: parsed.data,
  })

  if (error || !data) {
    console.error('[deletion-evidence/accept]', error?.code, error?.message)
    const conflict = error?.code === '23514'
    const forbidden = error?.code === '42501'
    return noStore({
      error: forbidden
        ? 'Tu rol no permite aceptar esta evidencia.'
        : conflict
          ? 'La evidencia entra en conflicto con el estado actual de la actividad. Actualiza los datos antes de reintentar.'
          : 'No fue posible aceptar la evidencia de eliminación.',
      code: forbidden ? 'insufficient_role' : conflict ? 'deletion_evidence_conflict' : 'deletion_evidence_failed',
    }, forbidden ? 403 : conflict ? 409 : 500)
  }

  const result = data as Record<string, unknown>
  return noStore({
    deletionEvidence: result,
    message: result.resumed
      ? 'La prueba ya estaba aceptada y se recuperó sin duplicarla.'
      : 'Prueba de eliminación o anonimización aceptada con evidencia trazable.',
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
