import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const schema = z.object({
  organizationName: z.string().trim().min(2).max(160),
  industry: z.enum(['general', 'transport', 'agriculture', 'mining', 'health', 'finance', 'construction', 'other']),
  organizationSize: z.enum(['micro', 'small', 'medium', 'large', 'enterprise']),
  firstName: z.string().trim().max(80).optional().default(''),
  lastName: z.string().trim().max(80).optional().default(''),
  projectName: z.string().trim().min(3).max(160),
  firstCaseTitle: z.string().trim().min(3).max(160),
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

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid onboarding data', code: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data, error } = await supabase.rpc('initialize_workspace', {
    organization_name: parsed.data.organizationName,
    industry_code: parsed.data.industry,
    organization_size: parsed.data.organizationSize,
    first_name: parsed.data.firstName || null,
    last_name: parsed.data.lastName || null,
    project_name: parsed.data.projectName,
    first_case_title: parsed.data.firstCaseTitle,
  })

  if (error) {
    console.error('[onboarding/initialize]', error.code)
    const conflict = error.code === '23505'
    return NextResponse.json(
      {
        error: conflict ? 'El workspace ya fue inicializado.' : 'No fue posible crear el workspace.',
        code: conflict ? 'workspace_already_exists' : 'workspace_initialization_failed',
      },
      { status: conflict ? 409 : 500 },
    )
  }

  const workspace = Array.isArray(data) ? data[0] : data
  if (!workspace?.organization_id) {
    return NextResponse.json({ error: 'Workspace initialization returned no organization', code: 'invalid_workspace_result' }, { status: 500 })
  }

  return NextResponse.json({
    workspace: {
      organizationId: workspace.organization_id,
      projectId: workspace.project_id,
      caseId: workspace.case_id,
      initialized: workspace.initialized,
    },
  })
}
