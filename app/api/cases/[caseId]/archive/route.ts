import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function archiveError(error: { message?: string } | null) {
  const message = error?.message || ''
  if (message.includes('Compliance case not found')) return { status: 404, code: 'case_not_found', error: 'Compliance case not found' }
  if (message.includes('Only resolved cases can be archived')) return { status: 409, code: 'case_not_resolved', error: 'Only resolved cases can be archived' }
  return { status: 500, code: 'case_archive_failed', error: 'Unable to archive the case' }
}

export async function POST(_req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params
  if (!z.string().uuid().safeParse(caseId).success) {
    return NextResponse.json({ error: 'Invalid case id', code: 'invalid_case_id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })

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
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('archive_compliance_case_record', {
    p_actor_id: user.id,
    p_organization_id: organizationId,
    p_case_id: caseId,
  })

  if (error || !data) {
    const mapped = archiveError(error)
    console.error('[cases/archive]', error?.code || mapped.code)
    return NextResponse.json({ error: mapped.error, code: mapped.code }, { status: mapped.status })
  }

  return NextResponse.json(data)
}
