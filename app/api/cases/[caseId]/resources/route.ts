import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const resourceTypeSchema = z.enum(['document', 'obligation', 'finding', 'risk', 'action'])

const linkResourceSchema = z.object({
  resourceType: resourceTypeSchema,
  resourceId: z.string().uuid(),
  note: z.string().trim().max(500).nullable().optional(),
})

const unlinkResourceSchema = z.object({
  linkId: z.string().uuid(),
})

const resourceTables: Record<z.infer<typeof resourceTypeSchema>, string> = {
  document: 'documents',
  obligation: 'obligations',
  finding: 'audit_findings',
  risk: 'risks',
  action: 'roadmaps',
}

async function resolveContext(caseId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { response: NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 }) }
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) {
    return { response: NextResponse.json({ error: 'Organization required', code: 'organization_required' }, { status: 403 }) }
  }

  const { data: complianceCase } = await supabase
    .from('compliance_cases')
    .select('id, organization_id, project_id')
    .eq('id', caseId)
    .eq('organization_id', membership.organization_id)
    .maybeSingle()

  if (!complianceCase) {
    return { response: NextResponse.json({ error: 'Compliance case not found', code: 'case_not_found' }, { status: 404 }) }
  }

  if (!complianceCase.project_id) {
    return { response: NextResponse.json({ error: 'A project is required before linking resources', code: 'case_project_required' }, { status: 409 }) }
  }

  return {
    supabase,
    user,
    organizationId: membership.organization_id,
    projectId: complianceCase.project_id,
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params
  const context = await resolveContext(caseId)
  if ('response' in context) return context.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request', code: 'invalid_json' }, { status: 400 })
  }

  const parsed = linkResourceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid resource link request', code: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const table = resourceTables[parsed.data.resourceType]
  const { data: resource } = await context.supabase
    .from(table)
    .select('id, project_id')
    .eq('id', parsed.data.resourceId)
    .eq('project_id', context.projectId)
    .maybeSingle()

  if (!resource) {
    return NextResponse.json({ error: 'Resource not found in this project', code: 'resource_not_found' }, { status: 404 })
  }

  const { data: link, error } = await context.supabase
    .from('compliance_case_resource_links')
    .insert({
      organization_id: context.organizationId,
      case_id: caseId,
      project_id: context.projectId,
      resource_type: parsed.data.resourceType,
      resource_id: parsed.data.resourceId,
      note: parsed.data.note || null,
      created_by: context.user.id,
    })
    .select('id, resource_type, resource_id, note, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Resource is already linked', code: 'resource_already_linked' }, { status: 409 })
    }
    console.error('[cases/resources/link]', error.code)
    return NextResponse.json({ error: 'Unable to link resource', code: 'resource_link_failed' }, { status: 500 })
  }

  return NextResponse.json({ link }, { status: 201 })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params
  const context = await resolveContext(caseId)
  if ('response' in context) return context.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request', code: 'invalid_json' }, { status: 400 })
  }

  const parsed = unlinkResourceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid unlink request', code: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data: deletedLink, error } = await context.supabase
    .from('compliance_case_resource_links')
    .delete()
    .eq('id', parsed.data.linkId)
    .eq('case_id', caseId)
    .eq('organization_id', context.organizationId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[cases/resources/unlink]', error.code)
    return NextResponse.json({ error: 'Unable to unlink resource', code: 'resource_unlink_failed' }, { status: 500 })
  }

  if (!deletedLink) {
    return NextResponse.json({ error: 'Resource link not found', code: 'resource_link_not_found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
