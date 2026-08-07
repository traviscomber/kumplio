import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const operationalPlanSchema = z.object({
  projectId: z.string().uuid(),
  playbookId: z.string().uuid(),
  ownerId: z.string().uuid(),
  missionTitle: z.string().trim().min(3).max(160),
  missionObjective: z.string().trim().max(3000),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  missionDueAt: z.string().datetime({ offset: true }),
  evidenceTitle: z.string().trim().min(3).max(180),
  evidenceDescription: z.string().trim().max(3000),
  evidenceDueAt: z.string().datetime({ offset: true }),
})

type RouteContext = { params: Promise<{ caseId: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const { caseId } = await context.params
  if (!z.string().uuid().safeParse(caseId).success) {
    return NextResponse.json({ error: 'Expediente inválido.', code: 'invalid_case_id' }, { status: 400 })
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

  const parsed = operationalPlanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Revisa los datos del plan operativo.', code: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const missionDueAt = new Date(parsed.data.missionDueAt)
  const evidenceDueAt = new Date(parsed.data.evidenceDueAt)
  if (missionDueAt.getTime() <= Date.now() || evidenceDueAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Las fechas deben estar en el futuro.', code: 'invalid_due_date' }, { status: 400 })
  }
  if (evidenceDueAt.getTime() > missionDueAt.getTime()) {
    return NextResponse.json(
      { error: 'La evidencia debe vencer antes o el mismo día que la misión.', code: 'invalid_due_sequence' },
      { status: 400 },
    )
  }

  try {
    const admin = createAdminClient()
    const access = await getWorkspaceAccess(admin, user.id)
    if (!access) {
      return NextResponse.json({ error: 'Necesitas un workspace activo.', code: 'organization_required' }, { status: 403 })
    }
    if (!access.canAssignWork) {
      return NextResponse.json(
        { error: 'Tu rol no permite crear ni asignar trabajo.', code: 'assignment_forbidden' },
        { status: 403 },
      )
    }

    // The migration may not yet be reflected in generated client types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any
    const { data, error } = await db.rpc('create_case_operational_plan_record', {
      p_actor_id: user.id,
      p_organization_id: access.organizationId,
      p_case_id: caseId,
      p_project_id: parsed.data.projectId,
      p_playbook_id: parsed.data.playbookId,
      p_mission_title: parsed.data.missionTitle,
      p_mission_objective: parsed.data.missionObjective || null,
      p_priority: parsed.data.priority,
      p_owner_id: parsed.data.ownerId,
      p_mission_due_at: parsed.data.missionDueAt,
      p_evidence_title: parsed.data.evidenceTitle,
      p_evidence_description: parsed.data.evidenceDescription || null,
      p_evidence_due_at: parsed.data.evidenceDueAt,
    })

    if (error || !data) {
      const message = String(error?.message || '')
      console.error('[cases/operational-plan]', error?.code, message)

      if (message.includes('Case not found')) {
        return NextResponse.json({ error: 'El expediente no existe en este workspace.', code: 'case_not_found' }, { status: 404 })
      }
      if (message.includes('not operationally available')) {
        return NextResponse.json({ error: 'El expediente ya no admite planificación operativa.', code: 'case_unavailable' }, { status: 409 })
      }
      if (message.includes('another project')) {
        return NextResponse.json({ error: 'El expediente ya pertenece a otro ámbito.', code: 'project_conflict' }, { status: 409 })
      }
      if (message.includes('must belong') || message.includes('Invalid') || message.includes('due date')) {
        return NextResponse.json({ error: 'La relación entre expediente, responsable y fechas no es válida.', code: 'invalid_relationship' }, { status: 400 })
      }

      return NextResponse.json({ error: 'No fue posible crear el plan operativo.', code: 'operational_plan_failed' }, { status: 500 })
    }

    return NextResponse.json(data, { status: data.resumed ? 200 : 201 })
  } catch (error) {
    console.error('[cases/operational-plan/configuration]', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json(
      { error: 'El servicio de planificación no está disponible.', code: 'operational_plan_unavailable' },
      { status: 503 },
    )
  }
}
