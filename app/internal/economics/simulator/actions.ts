'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function requireInternalFinanceUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const admin = createAdminClient()
  const { data: authorized } = await admin.rpc('is_kumplio_internal_user', {
    p_user_id: user.id,
    p_roles: ['finance_admin', 'platform_admin'],
  })
  if (!authorized) throw new Error('No autorizado')
  return { admin, user }
}

export async function recordOperatingCostAction(formData: FormData) {
  const { admin, user } = await requireInternalFinanceUser()
  const allocationScope = String(formData.get('allocationScope') || '')
  const organizationId = String(formData.get('organizationId') || '') || null
  const playbookId = String(formData.get('playbookId') || '') || null
  const amountClp = Number(formData.get('amountClp') || 0)
  const occurredOn = String(formData.get('occurredOn') || '')
  const description = String(formData.get('description') || '').trim()
  const costCategory = String(formData.get('costCategory') || '')
  const billingPeriod = String(formData.get('billingPeriod') || '')
  const sourceReference = String(formData.get('sourceReference') || '').trim() || null

  if (!['global', 'organization', 'playbook'].includes(allocationScope)) throw new Error('Alcance inválido')
  if (allocationScope === 'organization' && !organizationId) throw new Error('Selecciona una organización')
  if (allocationScope === 'playbook' && !playbookId) throw new Error('Selecciona un playbook')
  if (!Number.isInteger(amountClp) || amountClp < 0) throw new Error('Monto inválido')
  if (!occurredOn || !description) throw new Error('Completa los campos obligatorios')

  const { error } = await admin.from('operating_cost_entries').insert({
    organization_id: allocationScope === 'organization' ? organizationId : null,
    playbook_id: allocationScope === 'playbook' ? playbookId : null,
    mission_id: null,
    cost_category: costCategory,
    allocation_scope: allocationScope,
    amount_clp: amountClp,
    billing_period: billingPeriod,
    occurred_on: occurredOn,
    description,
    source_reference: sourceReference,
    created_by: user.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/internal/economics')
  revalidatePath('/internal/economics/simulator')
}
