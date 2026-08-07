import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { findReuseCandidates } from '@/lib/compliance/reuse'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const createControlSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().trim().min(3).max(180),
  description: z.string().trim().max(3000).nullable().optional(),
  objective: z.string().trim().max(2000).nullable().optional(),
  controlNature: z.enum(['preventive', 'detective', 'corrective']),
  executionMode: z.enum(['manual', 'automated', 'hybrid']),
  frequency: z.enum(['continuous', 'event_driven', 'daily', 'weekly', 'monthly', 'quarterly', 'semiannual', 'annual', 'ad_hoc']).nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  nextEvaluationAt: z.string().datetime({ offset: true }).nullable().optional(),
  obligationId: z.string().uuid().nullable().optional(),
  allowSimilar: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request', code: 'invalid_json' }, { status: 400 })
  }

  const parsed = createControlSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid control request', code: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'Organization required', code: 'organization_required' }, { status: 403 })
  }

  const organizationId = membership.organization_id
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', parsed.data.projectId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!project) {
    return NextResponse.json({ error: 'Project not found', code: 'project_not_found' }, { status: 404 })
  }

  if (parsed.data.ownerId) {
    const { data: owner } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('user_id', parsed.data.ownerId)
      .maybeSingle()

    if (!owner) {
      return NextResponse.json({ error: 'Owner must belong to the organization', code: 'owner_not_found' }, { status: 404 })
    }
  }

  if (parsed.data.obligationId) {
    const { data: obligation } = await supabase
      .from('obligations')
      .select('id')
      .eq('id', parsed.data.obligationId)
      .eq('project_id', parsed.data.projectId)
      .maybeSingle()

    if (!obligation) {
      return NextResponse.json({ error: 'Obligation not found in this project', code: 'obligation_not_found' }, { status: 404 })
    }
  }

  if (!parsed.data.allowSimilar) {
    const { data: existingControls } = await supabase
      .from('controls')
      .select('id, name, control_objective')
      .eq('organization_id', organizationId)
      .eq('project_id', parsed.data.projectId)
      .neq('lifecycle_status', 'retired')
      .limit(300)

    const reuseCandidates = findReuseCandidates(
      { name: parsed.data.name, objective: parsed.data.objective },
      existingControls || [],
    )

    if (reuseCandidates.length) {
      return NextResponse.json(
        {
          error: 'Encontramos controles parecidos. Revisa si puedes reutilizar uno antes de crear otro.',
          code: 'reuse_candidate_found',
          reuseCandidates,
        },
        { status: 409 },
      )
    }
  }

  try {
    const admin = createAdminClient()
    const { data: controlId, error } = await admin.rpc('create_control_record', {
      p_actor_id: user.id,
      p_organization_id: organizationId,
      p_project_id: parsed.data.projectId,
      p_name: parsed.data.name,
      p_description: parsed.data.description || null,
      p_control_objective: parsed.data.objective || null,
      p_control_nature: parsed.data.controlNature,
      p_execution_mode: parsed.data.executionMode,
      p_frequency: parsed.data.frequency || null,
      p_owner_id: parsed.data.ownerId || null,
      p_next_evaluation_at: parsed.data.nextEvaluationAt || null,
      p_obligation_id: parsed.data.obligationId || null,
    })

    if (error || !controlId) {
      console.error('[controls/create]', error?.code)
      return NextResponse.json({ error: 'Unable to create control', code: 'control_create_failed' }, { status: 500 })
    }

    return NextResponse.json({ controlId }, { status: 201 })
  } catch (error) {
    console.error('[controls/create/configuration]', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Control service is not configured', code: 'control_service_unavailable' }, { status: 503 })
  }
}
