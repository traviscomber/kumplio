'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function requireInternalUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('authentication_required')

  const admin = createAdminClient()
  const { data: authorized, error } = await admin.rpc('is_kumplio_internal_user', {
    p_user_id: user.id,
    p_roles: null,
  })
  if (error || !authorized) throw new Error('internal_access_required')
  return { user, admin }
}

export async function refreshGrowthOpportunitiesAction() {
  const { admin } = await requireInternalUser()
  const { error } = await admin.rpc('refresh_growth_opportunities')
  if (error) throw new Error(error.message)
  revalidatePath('/internal/growth')
}

export async function updateGrowthOpportunityAction(formData: FormData) {
  const { user, admin } = await requireInternalUser()
  const opportunityId = String(formData.get('opportunityId') || '')
  const status = String(formData.get('status') || '')
  const note = String(formData.get('note') || '')
  if (!opportunityId || !status) throw new Error('missing_fields')

  const { error } = await admin.rpc('update_growth_opportunity', {
    p_opportunity_id: opportunityId,
    p_status: status,
    p_actor: user.id,
    p_note: note || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/internal/growth')
}
