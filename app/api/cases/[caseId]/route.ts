import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const caseIdSchema = z.string().uuid()
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const updateCaseSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(3000).nullable().optional(),
  status: z.enum(['draft', 'active', 'pending_review', 'approved', 'rejected', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  projectId: z.string().uuid().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  dueAt: z.union([dateOnlySchema, z.string().datetime({ offset: true })]).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
})

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await context.params
  if (!caseIdSchema.safeParse(caseId).success) {
    return NextResponse.json({ error: 'Invalid case id', code: 'invalid_case_id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request', code: 'invalid_json' }, { status: 400 })
  }

  const parsed = updateCaseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid case update', code: 'invalid_request', details: parsed.error.flatten() },
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
  const { data: existingCase } = await supabase
    .from('compliance_cases')
    .select('id')
    .eq('id', caseId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!existingCase) {
    return NextResponse.json({ error: 'Compliance case not found', code: 'case_not_found' }, { status: 404 })
  }

  if (parsed.data.projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', parsed.data.projectId)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (!project) {
      return NextResponse.json({ error: 'Project not found', code: 'project_not_found' }, { status: 404 })
    }
  }

  if (parsed.data.ownerId) {
    const { data: ownerMembership } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('user_id', parsed.data.ownerId)
      .maybeSingle()

    if (!ownerMembership) {
      return NextResponse.json({ error: 'Owner is not an organization member', code: 'owner_not_member' }, { status: 400 })
    }
  }

  const patch: Record<string, string | null> = {}
  if (parsed.data.title !== undefined) patch.title = parsed.data.title
  if (parsed.data.description !== undefined) patch.description = parsed.data.description || null
  if (parsed.data.status !== undefined) patch.status = parsed.data.status
  if (parsed.data.priority !== undefined) patch.priority = parsed.data.priority
  if (parsed.data.projectId !== undefined) patch.project_id = parsed.data.projectId
  if (parsed.data.ownerId !== undefined) patch.owner_id = parsed.data.ownerId
  if (parsed.data.dueAt !== undefined) {
    patch.due_at = parsed.data.dueAt && /^\d{4}-\d{2}-\d{2}$/.test(parsed.data.dueAt)
      ? `${parsed.data.dueAt}T12:00:00.000Z`
      : parsed.data.dueAt
  }

  const { data: complianceCase, error } = await supabase
    .from('compliance_cases')
    .update(patch)
    .eq('id', caseId)
    .eq('organization_id', organizationId)
    .select('id, title, description, status, priority, project_id, owner_id, due_at, updated_at')
    .single()

  if (error || !complianceCase) {
    console.error('[cases/update]', error?.code)
    return NextResponse.json({ error: 'Unable to update compliance case', code: 'case_update_failed' }, { status: 500 })
  }

  return NextResponse.json({ complianceCase })
}
