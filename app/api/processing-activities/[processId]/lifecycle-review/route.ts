import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const dimensionStatus = z.enum(['validated', 'needs_changes', 'pending_evidence', 'not_applicable'])

const lifecycleReviewSchema = z.object({
  requestKey: z.string().uuid(),
  decision: z.enum(['approved', 'changes_requested', 'rejected']),
  basis: z.object({
    status: dimensionStatus,
    type: z.string().trim().max(120).nullable().optional(),
    summary: z.string().trim().max(2000).nullable().optional(),
  }),
  retention: z.object({
    status: dimensionStatus,
    rule: z.string().trim().max(2000).nullable().optional(),
    trigger: z.string().trim().max(500).nullable().optional(),
    period: z.string().trim().max(500).nullable().optional(),
  }),
  recipientsReview: z.object({ status: dimensionStatus }),
  subprocessorsReview: z.object({ status: dimensionStatus }),
  transfersReview: z.object({ status: dimensionStatus }),
  recipients: z.array(z.object({
    name: z.string().trim().min(2).max(180),
    role: z.string().trim().min(2).max(180),
    country: z.string().trim().max(120).nullable().optional(),
    evidenceStatus: z.string().trim().max(180).nullable().optional(),
  })).max(50),
  subprocessors: z.array(z.object({
    name: z.string().trim().min(2).max(180),
    service: z.string().trim().min(2).max(180),
    country: z.string().trim().max(120).nullable().optional(),
    contractStatus: z.string().trim().max(180).nullable().optional(),
  })).max(50),
  transfers: z.array(z.object({
    destination: z.string().trim().min(2).max(180),
    mechanism: z.string().trim().max(500).nullable().optional(),
    safeguardStatus: z.string().trim().max(500).nullable().optional(),
    dataScope: z.string().trim().max(500).nullable().optional(),
  })).max(50),
  sourceRefs: z.array(z.object({
    label: z.string().trim().min(3).max(300),
    reference: z.string().trim().min(2).max(1000),
    type: z.enum(['document', 'system', 'code', 'code_and_database', 'interview', 'contract', 'other']),
  })).min(1).max(30),
  unknowns: z.array(z.string().trim().min(3).max(500)).max(50),
  reviewNote: z.string().trim().min(20).max(5000),
  scopeConfirmed: z.literal(true),
  legalDecisionConfirmed: z.literal(true),
}).superRefine((value, context) => {
  const final = (status: z.infer<typeof dimensionStatus>) => status === 'validated' || status === 'not_applicable'
  const statuses = [
    value.basis.status,
    value.retention.status,
    value.recipientsReview.status,
    value.subprocessorsReview.status,
    value.transfersReview.status,
  ]

  if (value.basis.status === 'validated' && (!value.basis.type || !value.basis.summary || value.basis.summary.length < 10)) {
    context.addIssue({ code: 'custom', path: ['basis'], message: 'Una base validada requiere tipo y fundamento revisado.' })
  }
  if (value.retention.status === 'validated' && (!value.retention.rule || !value.retention.trigger || !value.retention.period)) {
    context.addIssue({ code: 'custom', path: ['retention'], message: 'Una retención validada requiere regla, inicio del cómputo y período.' })
  }
  if (value.recipientsReview.status === 'validated' && value.recipients.length === 0) {
    context.addIssue({ code: 'custom', path: ['recipients'], message: 'Destinatarios validados requieren al menos un registro.' })
  }
  if (value.subprocessorsReview.status === 'validated' && value.subprocessors.length === 0) {
    context.addIssue({ code: 'custom', path: ['subprocessors'], message: 'Subencargados validados requieren al menos un registro.' })
  }
  if (value.transfersReview.status === 'validated' && value.transfers.length === 0) {
    context.addIssue({ code: 'custom', path: ['transfers'], message: 'Transferencias validadas requieren destino y salvaguardas.' })
  }
  if (value.decision === 'approved' && (!statuses.every(final) || value.unknowns.length > 0)) {
    context.addIssue({ code: 'custom', path: ['decision'], message: 'No se puede aprobar mientras existan dimensiones o desconocidos abiertos.' })
  }
  if (value.decision === 'changes_requested' && statuses.every(final) && value.unknowns.length === 0) {
    context.addIssue({ code: 'custom', path: ['decision'], message: 'Solicitar cambios requiere conservar una dimensión o desconocido abierto.' })
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

  const parsed = lifecycleReviewSchema.safeParse(body)
  if (!parsed.success) {
    return noStore({
      error: 'Revisa la base, retención, destinatarios, subencargados, transferencias y confirmaciones.',
      code: 'invalid_lifecycle_review',
      details: parsed.error.flatten(),
    }, 400)
  }

  const admin = createAdminClient()
  let access
  try {
    access = await getWorkspaceAccess(admin, user.id)
  } catch (error) {
    console.error('[processing-lifecycle/access]', error instanceof Error ? error.message : 'unknown')
    return noStore({ error: 'No fue posible validar el workspace activo.', code: 'workspace_access_failed' }, 503)
  }

  if (!access) return noStore({ error: 'Organization required', code: 'organization_required' }, 403)
  if (!access.canAssignWork) {
    return noStore({ error: 'Tu rol no permite aprobar revisiones de ciclo de vida.', code: 'insufficient_role' }, 403)
  }

  const { data: processRow } = await admin.from('organization_processes')
    .select('id')
    .eq('id', processId)
    .eq('organization_id', access.organizationId)
    .eq('process_type', 'processing_activity')
    .neq('lifecycle_status', 'retired')
    .maybeSingle()

  if (!processRow) return noStore({ error: 'Actividad no encontrada.', code: 'processing_activity_not_found' }, 404)

  const payload = {
    decision: parsed.data.decision,
    basis: cleanObject(parsed.data.basis),
    retention: cleanObject(parsed.data.retention),
    recipientsReview: parsed.data.recipientsReview,
    subprocessorsReview: parsed.data.subprocessorsReview,
    transfersReview: parsed.data.transfersReview,
    recipients: uniqueObjects(parsed.data.recipients, (item) => `${item.name}|${item.role}|${item.country || ''}`),
    subprocessors: uniqueObjects(parsed.data.subprocessors, (item) => `${item.name}|${item.service}|${item.country || ''}`),
    transfers: uniqueObjects(parsed.data.transfers, (item) => `${item.destination}|${item.mechanism || ''}`),
    sourceRefs: uniqueObjects(parsed.data.sourceRefs, (item) => `${item.type}|${item.reference}`),
    unknowns: normalized(parsed.data.unknowns),
    reviewNote: parsed.data.reviewNote,
  }

  const { data, error } = await admin.rpc('review_processing_activity_lifecycle_v1', {
    p_actor_id: user.id,
    p_organization_id: access.organizationId,
    p_process_id: processId,
    p_request_key: parsed.data.requestKey,
    p_payload: payload,
  })

  if (error || !data) {
    const conflict = error?.code === '23514' && error.message?.includes('request key already exists')
    console.error('[processing-lifecycle/review]', error?.code, error?.message)
    return noStore({
      error: conflict
        ? 'Esta revisión ya fue usada con otro contenido. Recarga e intenta nuevamente.'
        : 'No fue posible guardar la revisión de base y ciclo de vida.',
      code: conflict ? 'request_key_conflict' : 'lifecycle_review_failed',
    }, conflict ? 409 : 500)
  }

  const result = data as Record<string, unknown>
  return noStore({
    review: result,
    message: result.resumed
      ? 'La revisión ya existía y se recuperó sin duplicarla.'
      : result.decision === 'approved'
        ? 'Base y ciclo de vida aprobados para el alcance revisado.'
        : 'Revisión registrada con cambios y evidencia pendientes.',
  }, result.resumed ? 200 : 201)
}

function normalized(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'es'))
}

function uniqueObjects<T>(values: T[], key: (value: T) => string) {
  const seen = new Set<string>()
  return values.filter((value) => {
    const normalizedKey = key(value).toLocaleLowerCase('es')
    if (seen.has(normalizedKey)) return false
    seen.add(normalizedKey)
    return true
  })
}

function cleanObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item || null]))
}

function noStore(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
