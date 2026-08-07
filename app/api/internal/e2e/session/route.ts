import { randomBytes } from 'node:crypto'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyGithubActionsE2ERequest } from '@/lib/security/github-actions-oidc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SERVICE_EMAIL = 'e2e-golden-path@kumplio.invalid'
const requestSchema = z.object({ caseId: z.string().uuid() })

type CookieWrite = { name: string; value: string; options?: any }

function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('supabase_public_configuration_missing')
  return { url, key }
}

async function findOrCreateServiceUser(admin: ReturnType<typeof createAdminClient>, password: string) {
  const { data: listing, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) throw new Error('e2e_user_lookup_failed')

  let user = listing.users.find((candidate) => candidate.email?.toLowerCase() === SERVICE_EMAIL)
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: SERVICE_EMAIL,
      password,
      email_confirm: true,
      app_metadata: { kumplio_service_account: 'golden_path_e2e' },
      user_metadata: { display_name: 'Kumplio Golden Path E2E' },
    })
    if (error || !data.user) throw new Error('e2e_user_creation_failed')
    user = data.user
  } else {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      app_metadata: { ...user.app_metadata, kumplio_service_account: 'golden_path_e2e' },
      user_metadata: { ...user.user_metadata, display_name: 'Kumplio Golden Path E2E' },
    })
    if (error || !data.user) throw new Error('e2e_user_rotation_failed')
    user = data.user
  }
  return user
}

export async function POST(request: NextRequest) {
  try {
    const machine = await verifyGithubActionsE2ERequest(request)
    const body = requestSchema.safeParse(await request.json().catch(() => null))
    if (!body.success) return NextResponse.json({ error: 'Invalid E2E session request', code: 'invalid_request' }, { status: 400 })

    const admin = createAdminClient()
    const { data: complianceCase, error: caseError } = await admin
      .from('compliance_cases')
      .select('id, organization_id, metadata')
      .eq('id', body.data.caseId)
      .maybeSingle()
    if (caseError || !complianceCase) return NextResponse.json({ error: 'Golden-path case not found', code: 'case_not_found' }, { status: 404 })

    const metadata = (complianceCase.metadata || {}) as Record<string, unknown>
    const guidedKey = typeof metadata.guided_start_key === 'string' ? metadata.guided_start_key : ''
    if (!guidedKey.startsWith('golden-')) return NextResponse.json({ error: 'Case is not authorized for programmatic E2E', code: 'case_not_authorized' }, { status: 403 })

    const password = `E2E-${randomBytes(32).toString('base64url')}aA1!`
    const user = await findOrCreateServiceUser(admin, password)

    const { error: profileError } = await admin.from('profiles').upsert({
      id: user.id,
      email: SERVICE_EMAIL,
      first_name: 'Kumplio',
      last_name: 'E2E',
      company_name: 'Kumplio',
      organization_id: complianceCase.organization_id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    if (profileError) throw new Error('e2e_profile_upsert_failed')

    const { error: membershipError } = await admin.from('organization_members').upsert({
      organization_id: complianceCase.organization_id,
      user_id: user.id,
      role: 'reviewer',
    }, { onConflict: 'organization_id,user_id' })
    if (membershipError) throw new Error('e2e_membership_upsert_failed')

    const { url, key } = getSupabasePublicConfig()
    let cookiesToWrite: CookieWrite[] = []
    const sessionClient = createServerClient(url, key, {
      cookies: {
        getAll() { return cookiesToWrite.map(({ name, value }) => ({ name, value })) },
        setAll(values) { cookiesToWrite = values },
      },
    })

    const { data: sessionData, error: sessionError } = await sessionClient.auth.signInWithPassword({ email: SERVICE_EMAIL, password })
    if (sessionError || !sessionData.session) throw new Error('e2e_session_creation_failed')

    const response = NextResponse.json({
      ok: true,
      caseId: complianceCase.id,
      organizationId: complianceCase.organization_id,
      serviceUserId: user.id,
      sourceSha: machine.sha,
    })
    response.headers.set('Cache-Control', 'no-store')
    for (const cookie of cookiesToWrite) response.cookies.set(cookie.name, cookie.value, cookie.options)
    return response
  } catch (error) {
    const code = error instanceof Error ? error.message : 'e2e_session_failed'
    console.error('[internal/e2e/session]', code)
    const authFailure = code.startsWith('github_oidc_') || code.startsWith('e2e_marker_')
    return NextResponse.json({ error: 'E2E session request rejected', code }, { status: authFailure ? 401 : 500 })
  }
}
