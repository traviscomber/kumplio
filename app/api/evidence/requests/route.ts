import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const createRequestSchema = z.object({
  projectId: z.string().uuid(),
  caseId: z.string().uuid().nullable().optional(),
  controlId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(3000).nullable().optional(),
  requestedFrom: z.string().uuid().nullable().optional(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
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

  const parsed = createRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid evidence request', code: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  if (parsed.data.dueAt && new Date(parsed.data.dueAt).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Due date must be in the future', code: 'invalid_due_date' }, { status: 400 })
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

  if (parsed.data.requestedFrom) {
    const { data: assignee } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('user_id', parsed.data.requestedFrom)
      .maybeSingle()

    if (!assignee) {
      return NextResponse.json({ error: 'Assignee must belong to the organization', code: 'assignee_not_found' }, { status: 404 })
    }
  }

  if (parsed.data.caseId) {
    const { data: complianceCase } = await supabase
      .from('compliance_cases')
      .select('id')
      .eq('id', parsed.data.caseId)
      .eq('organization_id', organizationId)
      .eq('project_id', parsed.data.projectId)
      .maybeSingle()

    if (!complianceCase) {
      return NextResponse.json({ error: 'Case not found in this project', code: 'case_not_found' }, { status: 404 })
    }
  }

  if (parsed.data.controlId) {
    const { data: control } = await supabase
      .from('controls')
      .select('id')
      .eq('id', parsed.data.controlId)
      .eq('organization_id', organizationId)
      .eq('project_id', parsed.data.projectId)
      .maybeSingle()

    if (!control) {
      return NextResponse.json({ error: 'Control not found in this project', code: 'control_not_found' }, { status: 404 })
    }
  }

  try {
    const admin = createAdminClient()
    const { data: requestId, error } = await admin.rpc('create_evidence_request_record', {
      p_actor_id: user.id,
      p_organization_id: organizationId,
      p_project_id: parsed.data.projectId,
      p_case_id: parsed.data.caseId || null,
      p_control_id: parsed.data.controlId || null,
      p_title: parsed.data.title,
      p_description: parsed.data.description || null,
      p_requested_from: parsed.data.requestedFrom || null,
      p_due_at: parsed.data.dueAt || null,
    })

    if (error || !requestId) {
      console.error('[evidence/requests/create]', error?.code)
      return NextResponse.json({ error: 'Unable to create evidence request', code: 'request_create_failed' }, { status: 500 })
    }

    return NextResponse.json({ requestId }, { status: 201 })
  } catch (error) {
    console.error('[evidence/requests/configuration]', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Evidence request service is not configured', code: 'request_service_unavailable' }, { status: 503 })
  }
}
