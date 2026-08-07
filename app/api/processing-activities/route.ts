import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const optionalUuid = z.string().uuid().nullable().optional()

const processingActivitySchema = z.object({
  requestKey: z.string().uuid(),
  projectId: z.string().uuid(),
  caseId: optionalUuid,
  controlId: optionalUuid,
  name: z.string().trim().min(3).max(180),
  description: z.string().trim().max(3000).nullable().optional(),
  purpose: z.string().trim().min(10).max(2000),
  proposedLegalBasis: z.string().trim().min(3).max(1000),
  ownerId: z.string().uuid(),
  criticality: z.enum(['low', 'medium', 'high', 'critical']),
  dataSubjects: z.array(z.string().trim().min(2).max(120)).min(1).max(30),
  dataCategories: z.array(z.string().trim().min(2).max(160)).min(1).max(40),
  sensitivity: z.enum(['public', 'internal', 'confidential', 'restricted']),
  retentionRule: z.string().trim().min(3).max(1000),
  crossBorderTransfer: z.boolean(),
  containsSensitiveData: z.boolean(),
  asset: z.object({
    name: z.string().trim().min(2).max(180),
    type: z.string().trim().min(2).max(120),
    hostingCountry: z.string().trim().max(120).nullable().optional(),
    providerName: z.string().trim().max(180).nullable().optional(),
  }),
  vendor: z.object({
    name: z.string().trim().min(2).max(180),
    serviceCategory: z.string().trim().max(180).nullable().optional(),
    country: z.string().trim().max(120).nullable().optional(),
    processesPersonalData: z.boolean(),
    crossBorderTransfer: z.boolean(),
    riskTier: z.enum(['low', 'medium', 'high', 'critical']),
  }).nullable().optional(),
  source: z.object({
    type: z.enum(['document', 'system', 'code', 'code_and_database', 'interview', 'contract', 'other']),
    label: z.string().trim().min(3).max(300),
    reference: z.string().trim().max(1000).nullable().optional(),
  }),
  review: z.object({
    decision: z.literal('approved'),
    completeness: z.enum(['partial', 'complete']),
    note: z.string().trim().min(10).max(4000),
    unknowns: z.array(z.string().trim().min(3).max(500)).max(40),
    scopeConfirmed: z.literal(true),
    legalBasisIsProposed: z.literal(true),
  }),
}).superRefine((value, context) => {
  if (value.review.completeness === 'partial' && value.review.unknowns.length === 0) {
    context.addIssue({
      code: 'custom',
      path: ['review', 'unknowns'],
      message: 'Una actividad parcial debe conservar al menos un desconocido.',
    })
  }
  if (value.review.completeness === 'complete' && value.review.unknowns.length > 0) {
    context.addIssue({
      code: 'custom',
      path: ['review', 'unknowns'],
      message: 'Una actividad completa no puede conservar desconocidos abiertos.',
    })
  }
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return noStore({ error: 'Authentication required', code: 'authentication_required' }, 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return noStore({ error: 'Invalid JSON request', code: 'invalid_json' }, 400)
  }

  const parsed = processingActivitySchema.safeParse(body)
  if (!parsed.success) {
    return noStore({
      error: 'Revisa la actividad, su fuente y la confirmación humana.',
      code: 'invalid_processing_activity',
      details: parsed.error.flatten(),
    }, 400)
  }

  const admin = createAdminClient()
  let access
  try {
    access = await getWorkspaceAccess(admin, user.id)
  } catch (error) {
    console.error('[processing-inventory/access]', error instanceof Error ? error.message : 'unknown')
    return noStore({ error: 'No fue posible validar el workspace activo.', code: 'workspace_access_failed' }, 503)
  }

  if (!access) return noStore({ error: 'Organization required', code: 'organization_required' }, 403)
  if (!access.canAssignWork) {
    return noStore({ error: 'Tu rol no permite aprobar inventario organizacional.', code: 'insufficient_role' }, 403)
  }

  const organizationId = access.organizationId
  const [projectResult, ownerResult] = await Promise.all([
    admin.from('projects')
      .select('id')
      .eq('id', parsed.data.projectId)
      .eq('organization_id', organizationId)
      .maybeSingle(),
    admin.from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('user_id', parsed.data.ownerId)
      .maybeSingle(),
  ])

  if (!projectResult.data) return noStore({ error: 'Ámbito no encontrado.', code: 'project_not_found' }, 404)
  if (!ownerResult.data) return noStore({ error: 'El responsable no pertenece a la organización.', code: 'owner_not_found' }, 404)

  if (parsed.data.caseId) {
    const { data: caseRow } = await admin.from('compliance_cases')
      .select('id')
      .eq('id', parsed.data.caseId)
      .eq('organization_id', organizationId)
      .eq('project_id', parsed.data.projectId)
      .maybeSingle()
    if (!caseRow) return noStore({ error: 'El expediente no pertenece al ámbito seleccionado.', code: 'case_not_found' }, 404)
  }

  if (parsed.data.controlId) {
    const { data: controlRow } = await admin.from('controls')
      .select('id')
      .eq('id', parsed.data.controlId)
      .eq('organization_id', organizationId)
      .eq('project_id', parsed.data.projectId)
      .maybeSingle()
    if (!controlRow) return noStore({ error: 'El control no pertenece al ámbito seleccionado.', code: 'control_not_found' }, 404)
  }

  const payload = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    purpose: parsed.data.purpose,
    proposedLegalBasis: parsed.data.proposedLegalBasis,
    ownerId: parsed.data.ownerId,
    criticality: parsed.data.criticality,
    dataSubjects: normalized(parsed.data.dataSubjects),
    dataCategories: normalized(parsed.data.dataCategories),
    sensitivity: parsed.data.sensitivity,
    retentionRule: parsed.data.retentionRule,
    crossBorderTransfer: parsed.data.crossBorderTransfer,
    containsSensitiveData: parsed.data.containsSensitiveData,
    asset: {
      name: parsed.data.asset.name,
      type: parsed.data.asset.type,
      hostingCountry: parsed.data.asset.hostingCountry || null,
      providerName: parsed.data.asset.providerName || null,
    },
    vendor: parsed.data.vendor ? {
      name: parsed.data.vendor.name,
      serviceCategory: parsed.data.vendor.serviceCategory || null,
      country: parsed.data.vendor.country || null,
      processesPersonalData: parsed.data.vendor.processesPersonalData,
      crossBorderTransfer: parsed.data.vendor.crossBorderTransfer,
      riskTier: parsed.data.vendor.riskTier,
    } : null,
    source: {
      type: parsed.data.source.type,
      label: parsed.data.source.label,
      reference: parsed.data.source.reference || null,
    },
    review: {
      decision: parsed.data.review.decision,
      completeness: parsed.data.review.completeness,
      note: parsed.data.review.note,
      unknowns: normalized(parsed.data.review.unknowns),
    },
  }

  const { data, error } = await admin.rpc('create_processing_activity_inventory_v1', {
    p_actor_id: user.id,
    p_organization_id: organizationId,
    p_project_id: parsed.data.projectId,
    p_request_key: parsed.data.requestKey,
    p_payload: payload,
    p_case_id: parsed.data.caseId || null,
    p_control_id: parsed.data.controlId || null,
  })

  if (error || !data) {
    const conflict = error?.code === '23514' && error.message?.includes('different reviewed snapshot')
    console.error('[processing-inventory/create]', error?.code, error?.message)
    return noStore({
      error: conflict
        ? 'Esta solicitud ya fue usada con otro contenido. Recarga el formulario e intenta nuevamente.'
        : 'No fue posible registrar y revisar la actividad de tratamiento.',
      code: conflict ? 'request_key_conflict' : 'processing_activity_create_failed',
    }, conflict ? 409 : 500)
  }

  const result = data as Record<string, unknown>
  return noStore({
    activity: result,
    message: result.resumed
      ? 'La actividad ya estaba registrada; se recuperó sin duplicarla.'
      : 'Actividad registrada con sistema, datos, tercero, evidencia y revisión humana.',
  }, result.resumed ? 200 : 201)
}

function normalized(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right, 'es'))
}

function noStore(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
