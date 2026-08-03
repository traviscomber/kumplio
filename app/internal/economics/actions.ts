'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function requireFinanceAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Debes iniciar sesión.')

  const admin = createAdminClient()
  const { data: authorized, error } = await admin.rpc('is_kumplio_internal_user', {
    p_user_id: user.id,
    p_roles: ['finance_admin', 'platform_admin'],
  })
  if (error || !authorized) throw new Error('No tienes acceso al panel financiero interno.')
  return { user, admin }
}

export async function recordFxRateAction(formData: FormData) {
  const { user, admin } = await requireFinanceAdmin()
  const rateDate = String(formData.get('rateDate') || '')
  const rate = Number(formData.get('rate'))
  const sourceName = String(formData.get('sourceName') || '').trim()
  const sourceReference = String(formData.get('sourceReference') || '').trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rateDate)) throw new Error('Fecha inválida.')
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('Tipo de cambio inválido.')
  if (!sourceName) throw new Error('Debes indicar la fuente.')

  const { error } = await admin.from('fx_rates').upsert({
    rate_date: rateDate,
    base_currency: 'USD',
    quote_currency: 'CLP',
    rate,
    source_name: sourceName,
    source_reference: sourceReference || null,
    recorded_by: user.id,
  }, { onConflict: 'rate_date,base_currency,quote_currency,source_name' })
  if (error) throw new Error('No fue posible registrar el tipo de cambio.')
  revalidatePath('/internal/economics')
}

export async function recordCommercialTermAction(formData: FormData) {
  const { user, admin } = await requireFinanceAdmin()
  const organizationId = String(formData.get('organizationId') || '')
  const revenueType = String(formData.get('revenueType') || '')
  const billingPeriod = String(formData.get('billingPeriod') || '')
  const amountClp = Number(formData.get('amountClp'))
  const validFrom = String(formData.get('validFrom') || '')
  const planKey = String(formData.get('planKey') || '').trim()
  const notes = String(formData.get('notes') || '').trim()

  if (!organizationId) throw new Error('Selecciona una organización.')
  if (!['subscription','managed_service','fullstack_project','other'].includes(revenueType)) throw new Error('Tipo de ingreso inválido.')
  if (!['one_time','monthly','quarterly','annual'].includes(billingPeriod)) throw new Error('Periodo inválido.')
  if (!Number.isInteger(amountClp) || amountClp < 0) throw new Error('Monto CLP inválido.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(validFrom)) throw new Error('Fecha de inicio inválida.')

  const { error } = await admin.from('organization_commercial_terms').insert({
    organization_id: organizationId,
    revenue_type: revenueType,
    plan_key: planKey || null,
    amount_clp: amountClp,
    billing_period: billingPeriod,
    valid_from: validFrom,
    notes: notes || null,
    status: 'active',
    created_by: user.id,
  })
  if (error) throw new Error('No fue posible registrar el ingreso comercial.')
  revalidatePath('/internal/economics')
}
