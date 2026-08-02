import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const createCaseSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(3000).optional().default(''),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  projectId: z.string().uuid().nullable().optional(),
})

export async function POST(req: NextRequest) {
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

  const parsed = createCaseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid case request', code: 'invalid_request', details: parsed.error.flatten() },
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
  const projectId = parsed.data.projectId || null

  if (projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (!project) {
      return NextResponse.json({ error: 'Project not found', code: 'project_not_found' }, { status: 404 })
    }
  }

  const { data: complianceCase, error } = await supabase
    .from('compliance_cases')
    .insert({
      organization_id: organizationId,
      project_id: projectId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: 'active',
      priority: parsed.data.priority,
      created_by: user.id,
      owner_id: user.id,
      metadata: { source: 'cases_workspace' },
    })
    .select('id, title, description, status, priority, project_id, created_at, updated_at')
    .single()

  if (error || !complianceCase) {
    console.error('[cases/create]', error?.code)
    return NextResponse.json({ error: 'Unable to create compliance case', code: 'case_create_failed' }, { status: 500 })
  }

  return NextResponse.json({ complianceCase }, { status: 201 })
}
