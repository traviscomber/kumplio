import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyGithubActionsE2ERequest } from '@/lib/security/github-actions-oidc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SERVICE_EMAIL = 'e2e-golden-path@kumplio.invalid'
const requestSchema = z.object({ caseId: z.string().uuid() })

export async function POST(request: NextRequest) {
  try {
    const machine = await verifyGithubActionsE2ERequest(request)
    const body = requestSchema.safeParse(await request.json().catch(() => null))
    if (!body.success) return NextResponse.json({ error: 'Invalid E2E revoke request', code: 'invalid_request' }, { status: 400 })

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

    const { data: listing, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listError) throw new Error('e2e_user_lookup_failed')
    const user = listing.users.find((candidate) => candidate.email?.toLowerCase() === SERVICE_EMAIL)

    if (user) {
      const { error: membershipError } = await admin
        .from('organization_members')
        .delete()
        .eq('organization_id', complianceCase.organization_id)
        .eq('user_id', user.id)
      if (membershipError) throw new Error('e2e_membership_revoke_failed')

      const { error: profileError } = await admin
        .from('profiles')
        .update({ organization_id: null, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .eq('organization_id', complianceCase.organization_id)
      if (profileError) throw new Error('e2e_profile_revoke_failed')
    }

    return NextResponse.json({
      ok: true,
      caseId: complianceCase.id,
      membershipRevoked: Boolean(user),
      sourceSha: machine.sha,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'e2e_revoke_failed'
    console.error('[internal/e2e/revoke]', code)
    const authFailure = code.startsWith('github_oidc_') || code.startsWith('e2e_marker_')
    return NextResponse.json({ error: 'E2E revoke request rejected', code }, { status: authFailure ? 401 : 500 })
  }
}
