import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(_req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params
  if (!z.string().uuid().safeParse(caseId).success) {
    return NextResponse.json({ error: 'Invalid case id', code: 'invalid_case_id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })

  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle()
  if (!membership?.organization_id) return NextResponse.json({ error: 'Organization required', code: 'organization_required' }, { status: 403 })

  const organizationId = membership.organization_id
  const { data: complianceCase } = await supabase
    .from('compliance_cases')
    .select('id, status')
    .eq('id', caseId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!complianceCase) return NextResponse.json({ error: 'Compliance case not found', code: 'case_not_found' }, { status: 404 })
  if (complianceCase.status === 'archived') return NextResponse.json({ caseId, status: 'archived', alreadyArchived: true })
  if (complianceCase.status !== 'approved') {
    return NextResponse.json({ error: 'Only resolved cases can be archived', code: 'case_not_resolved' }, { status: 409 })
  }

  const archivedAt = new Date().toISOString()
  const { data: updatedCase, error } = await supabase
    .from('compliance_cases')
    .update({ status: 'archived', updated_at: archivedAt })
    .eq('id', caseId)
    .eq('organization_id', organizationId)
    .select('id, status, updated_at')
    .single()

  if (error || !updatedCase) return NextResponse.json({ error: 'Unable to archive the case', code: 'case_archive_failed' }, { status: 500 })

  await supabase.from('compliance_case_events').insert({
    organization_id: organizationId,
    case_id: caseId,
    actor_id: user.id,
    event_type: 'case_archived',
    summary: 'Caso archivado después de su resolución',
    changes: { previous_status: 'approved', status: 'archived', archived_at: archivedAt },
  })

  return NextResponse.json({ case: updatedCase })
}
