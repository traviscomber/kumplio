import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const bodySchema = z.object({
  missionId: z.string().uuid(),
  requestId: z.string().uuid(),
  reviewComment: z.string().trim().min(10).max(2000),
  completionNotes: z.string().trim().min(10).max(2000),
  acceptInitialScope: z.literal(true),
  acceptPartialOperation: z.literal(true),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params
  if (!z.string().uuid().safeParse(caseId).success) {
    return NextResponse.json({ error: 'Expediente inválido.', code: 'invalid_case' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Debes iniciar sesión.', code: 'authentication_required' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud JSON inválida.', code: 'invalid_json' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      error: 'Confirma el alcance, la operación parcial y las justificaciones.',
      code: 'invalid_request',
      details: parsed.error.flatten(),
    }, { status: 400 })
  }

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) {
    return NextResponse.json({ error: 'No existe un workspace activo.', code: 'workspace_required' }, { status: 403 })
  }
  if (!access.canAssignWork) {
    return NextResponse.json({ error: 'Tu rol no puede cerrar esta línea base.', code: 'forbidden' }, { status: 403 })
  }

  // Generated database types may lag behind the deployed RPC.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const [{ data: complianceCase }, { data: mission }, { data: evidenceRequest }] = await Promise.all([
    db.from('compliance_cases')
      .select('id,project_id')
      .eq('id', caseId)
      .eq('organization_id', access.organizationId)
      .maybeSingle(),
    db.from('missions')
      .select('id,case_id,owner_id,status')
      .eq('id', parsed.data.missionId)
      .eq('organization_id', access.organizationId)
      .eq('case_id', caseId)
      .maybeSingle(),
    db.from('evidence_requests')
      .select('id,case_id,status')
      .eq('id', parsed.data.requestId)
      .eq('organization_id', access.organizationId)
      .eq('case_id', caseId)
      .maybeSingle(),
  ])

  if (!complianceCase?.project_id || !mission || !evidenceRequest) {
    return NextResponse.json({
      error: 'El expediente todavía no tiene misión, ámbito y solicitud de evidencia compatibles.',
      code: 'operational_plan_incomplete',
    }, { status: 409 })
  }
  if (String(mission.owner_id || '') !== user.id) {
    return NextResponse.json({
      error: 'La persona responsable de la misión debe confirmar el cierre.',
      code: 'mission_owner_required',
    }, { status: 403 })
  }

  const { data, error } = await db.rpc('finalize_case_baseline_assurance', {
    p_actor_id: user.id,
    p_organization_id: access.organizationId,
    p_case_id: caseId,
    p_mission_id: parsed.data.missionId,
    p_request_id: parsed.data.requestId,
    p_review_comment: parsed.data.reviewComment,
    p_completion_notes: parsed.data.completionNotes,
  })

  if (error || !data) {
    console.error('[baseline-assurance]', error?.code, error?.message)
    const forbidden = error?.code === '42501'
    return NextResponse.json({
      error: forbidden ? 'No tienes permiso para cerrar esta línea base.' : 'No fue posible cerrar la línea base.',
      code: forbidden ? 'forbidden' : 'baseline_assurance_failed',
    }, { status: forbidden ? 403 : 500 })
  }

  return NextResponse.json(data)
}
