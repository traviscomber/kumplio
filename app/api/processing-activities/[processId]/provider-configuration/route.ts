import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const sourceSchema = z.object({
  type: z.enum(['management_api', 'provider_dashboard', 'provider_contract']),
  label: z.string().trim().min(3).max(180),
  reference: z.string().trim().min(3).max(1000),
  capturedAt: z.string().datetime({ offset: true }),
})

const commonSchema = z.object({
  action: z.literal('submit'),
  requestKey: z.string().uuid(),
  configurationAsOf: z.string().datetime({ offset: true }),
  effectiveConfigurationObserved: z.literal(true),
  sourceRefs: z.array(sourceSchema).min(1).max(12),
  limitations: z.array(z.string().trim().min(3).max(1000)).max(20),
  reviewNote: z.string().trim().min(30).max(1800),
})

const submitSchema = z.discriminatedUnion('configurationKind', [
  commonSchema.extend({
    configurationKind: z.literal('supabase_backup_pitr'),
    projectReference: z.string().trim().min(3).max(120),
    backupModeObserved: z.enum(['daily', 'pitr']),
    pitrState: z.enum(['enabled', 'disabled']),
    effectiveRecoveryWindowDays: z.number().int().min(0).max(90),
  }).superRefine((value, ctx) => {
    if (value.pitrState === 'enabled' && value.backupModeObserved !== 'pitr') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['backupModeObserved'], message: 'PITR habilitado requiere backupModeObserved=pitr.' })
    }
    if (value.pitrState === 'disabled' && value.backupModeObserved !== 'daily') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['backupModeObserved'], message: 'PITR deshabilitado requiere backupModeObserved=daily.' })
    }
  }),
  commonSchema.extend({
    configurationKind: z.literal('openai_data_retention'),
    organizationReference: z.string().trim().min(3).max(160),
    projectReference: z.string().trim().min(3).max(160),
    projectBindingObserved: z.literal(true),
    dataRetentionMode: z.enum(['standard', 'modified_abuse_monitoring', 'zero_data_retention']),
  }),
])

const reviewSchema = z.object({
  action: z.literal('review'),
  decision: z.enum(['accepted', 'rejected', 'changes_requested']),
  comment: z.string().trim().min(20).max(2000),
})

const requestSchema = z.union([submitSchema, reviewSchema])

export async function POST(request: NextRequest, context: { params: Promise<{ processId: string }> }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return noStore({ error: 'Authentication required', code: 'authentication_required' }, 401)

  const { processId } = await context.params
  if (!z.string().uuid().safeParse(processId).success) return noStore({ error: 'Actividad inválida.', code: 'invalid_process_id' }, 400)

  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) return noStore({ error: 'La evidencia de configuración está incompleta.', code: 'invalid_provider_configuration', details: parsed.error.flatten() }, 400)

  const admin = createAdminClient()
  let access
  try {
    access = await getWorkspaceAccess(admin, user.id)
  } catch (error) {
    console.error('[provider-configuration/access]', error instanceof Error ? error.message : 'unknown')
    return noStore({ error: 'No fue posible validar el workspace activo.', code: 'workspace_access_failed' }, 503)
  }
  if (!access) return noStore({ error: 'Organization required', code: 'organization_required' }, 403)
  if (!access.canAssignWork) return noStore({ error: 'Tu rol no permite revisar configuración del proveedor.', code: 'insufficient_role' }, 403)

  const { data: processRow, error: processError } = await admin.from('organization_processes')
    .select('id,attributes')
    .eq('id', processId)
    .eq('organization_id', access.organizationId)
    .eq('process_type', 'processing_activity')
    .neq('lifecycle_status', 'retired')
    .maybeSingle()
  if (processError) return noStore({ error: 'No fue posible cargar la actividad.', code: 'processing_activity_load_failed' }, 503)
  if (!processRow) return noStore({ error: 'Actividad no encontrada.', code: 'processing_activity_not_found' }, 404)

  const attributes = asObject(processRow.attributes)
  const vendor = text(attributes.providerTenantConfigurationVendor)?.toLowerCase()
  if (!text(attributes.providerTenantConfigurationEvidenceRequestId)) {
    return noStore({ error: 'La actividad no tiene una solicitud tenant-specific preparada.', code: 'provider_configuration_request_missing' }, 409)
  }

  if (parsed.data.action === 'submit') {
    if (vendor === 'supabase' && parsed.data.configurationKind !== 'supabase_backup_pitr') return noStore({ error: 'Esta actividad requiere evidencia Supabase.', code: 'provider_configuration_kind_mismatch' }, 409)
    if (vendor === 'openai' && parsed.data.configurationKind !== 'openai_data_retention') return noStore({ error: 'Esta actividad requiere evidencia OpenAI.', code: 'provider_configuration_kind_mismatch' }, 409)
    if (new Date(parsed.data.configurationAsOf).getTime() > Date.now() + 5 * 60_000) return noStore({ error: 'La configuración informada todavía no ha sido observada.', code: 'future_configuration_observation' }, 400)

    const { data, error } = await admin.rpc('submit_processing_provider_tenant_configuration_evidence_v1', {
      p_actor_id: user.id,
      p_organization_id: access.organizationId,
      p_process_id: processId,
      p_request_key: parsed.data.requestKey,
      p_payload: parsed.data,
    })
    if (error || !data) {
      console.error('[provider-configuration/submit]', error?.code, error?.message)
      return noStore({ error: error?.code === '23514' ? 'La evidencia entra en conflicto con el estado o el proveedor observado.' : 'No fue posible entregar la configuración.', code: 'provider_configuration_submit_failed' }, error?.code === '23514' ? 409 : 500)
    }
    return noStore({ providerConfiguration: data, message: 'Configuración entregada para revisión humana.' }, 201)
  }

  const { data, error } = await admin.rpc('review_processing_provider_tenant_configuration_evidence_v1', {
    p_actor_id: user.id,
    p_organization_id: access.organizationId,
    p_process_id: processId,
    p_decision: parsed.data.decision,
    p_comment: parsed.data.comment,
  })
  if (error || !data) {
    console.error('[provider-configuration/review]', error?.code, error?.message)
    return noStore({ error: error?.code === '23514' ? 'La evidencia no satisface el contrato tenant-specific.' : 'No fue posible registrar la revisión.', code: 'provider_configuration_review_failed' }, error?.code === '23514' ? 409 : 500)
  }
  return noStore({ providerConfigurationReview: data, message: parsed.data.decision === 'accepted' ? 'Configuración tenant verificada con evidencia aceptada.' : 'Revisión registrada sin promover el gate.' }, 200)
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function text(value: unknown) { return typeof value === 'string' && value.trim() ? value.trim() : null }
function noStore(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } })
}
