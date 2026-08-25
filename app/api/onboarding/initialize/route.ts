import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildInitialDiagnosis } from '@/lib/product/onboarding/contextual-diagnosis'

export const runtime = 'nodejs'

const base = z.object({
  userType: z.enum(['persona', 'profesional', 'empresa']),
  problem: z.string().trim().min(3).max(500),
  intent: z.string().trim().max(160).optional().default(''),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  documentsAvailable: z.enum(['none', 'some', 'most']),
  region: z.string().trim().max(100).optional().default(''),
  targetDate: z.string().trim().max(10).optional().nullable(),
  firstName: z.string().trim().max(80).optional().default(''),
  lastName: z.string().trim().max(80).optional().default(''),
})

const schema = z.discriminatedUnion('userType', [
  base.extend({ userType: z.literal('persona') }),
  base.extend({
    userType: z.literal('profesional'),
    professionalActivity: z.string().trim().min(2).max(160),
    industry: z.string().trim().max(80).optional().default('general'),
    activeClients: z.number().int().min(0).max(100000).optional().nullable(),
  }),
  base.extend({
    userType: z.literal('empresa'),
    organizationName: z.string().trim().min(2).max(160),
  industry: z.enum(['general', 'transport', 'agriculture', 'mining', 'health', 'finance', 'construction', 'other']),
  organizationSize: z.enum(['micro', 'small', 'medium', 'large', 'enterprise']),
    workerCount: z.number().int().min(0).max(1000000).optional().nullable(),
  }),
])

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

  const diagnosis = buildInitialDiagnosis(parsed.data)
  const admin = createAdminClient()
  let { data, error } = await admin.rpc('initialize_contextual_workspace_v2', {
    p_actor_user_id: user.id,
    p_user_type: parsed.data.userType,
    p_problem: parsed.data.problem,
    p_intent: parsed.data.intent || null,
    p_urgency: parsed.data.urgency,
    p_documents_available: parsed.data.documentsAvailable,
    p_context: parsed.data,
    p_diagnosis: diagnosis,
    p_first_name: parsed.data.firstName || null,
    p_last_name: parsed.data.lastName || null,
  })

  const legacyWorkspaceFallback = error?.code === 'PGRST202' || error?.code === '42883'
  if (legacyWorkspaceFallback) {
    const organizationName = parsed.data.userType === 'empresa'
      ? parsed.data.organizationName
      : parsed.data.userType === 'profesional' ? 'Espacio profesional' : 'Espacio personal'
    const legacy = await supabase.rpc('initialize_workspace', {
      organization_name: organizationName,
      industry_code: 'industry' in parsed.data ? parsed.data.industry : 'general',
      organization_size: 'organizationSize' in parsed.data ? parsed.data.organizationSize : 'micro',
      first_name: parsed.data.firstName || null,
      last_name: parsed.data.lastName || null,
      project_name: 'Primer diagnóstico Kumplio',
      first_case_title: diagnosis.caseTitle,
    })
    data = legacy.data
    error = legacy.error
  }

  if (error) {
    console.error('[onboarding/initialize]', error.code)
    return NextResponse.json(
      {
        error: 'No fue posible preparar tu espacio.',
        code: 'workspace_initialization_failed',
      },
      { status: 500 },
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
      diagnosis,
    },
  })
}
