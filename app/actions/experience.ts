'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveContext(nextPath: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`)
  const admin = createAdminClient()
  const { data: membership } = await admin.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')
  return { admin, user, organizationId: membership.organization_id as string }
}

const text = (formData: FormData, key: string) => String(formData.get(key) || '').trim()
const checked = (formData: FormData, key: string) => formData.get(key) === 'on'
const codeFor = (prefix: string, name: string) => `${prefix}-${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 36)}-${Date.now().toString(36)}`

export async function startGuidedOnboardingAction() {
  const { admin, user, organizationId } = await resolveContext('/onboarding/twin')
  const { data, error } = await admin.rpc('start_guided_onboarding_v1', { p_organization_id: organizationId, p_actor_user_id: user.id })
  if (error) throw new Error(`No fue posible iniciar el onboarding: ${error.message}`)
  revalidatePath('/onboarding/twin'); revalidatePath('/digital-twin')
  redirect(`/onboarding/twin?session=${data}`)
}

export async function installLibraryItemAction(formData: FormData) {
  const itemType = text(formData, 'itemType'); const versionId = text(formData, 'versionId')
  if (!['control', 'policy'].includes(itemType) || !versionId) throw new Error('Solicitud de instalación inválida')
  const { admin, user, organizationId } = await resolveContext('/libraries')
  const { error } = await admin.rpc('install_library_item_v1', { p_organization_id: organizationId, p_actor_user_id: user.id, p_item_type: itemType, p_version_id: versionId })
  if (error) throw new Error(`No fue posible crear el borrador: ${error.message}`)
  revalidatePath('/libraries'); revalidatePath('/review-center'); redirect('/libraries?installed=1')
}

export async function generateExecutiveSnapshotAction() {
  const { admin, user, organizationId } = await resolveContext('/executive')
  const { error } = await admin.rpc('generate_executive_snapshot_v1', { p_organization_id: organizationId, p_actor_user_id: user.id })
  if (error) throw new Error(`No fue posible generar el snapshot: ${error.message}`)
  revalidatePath('/executive'); revalidatePath('/review-center'); redirect('/executive?generated=1')
}

export async function createTwinEntityAction(formData: FormData) {
  const entityType = text(formData, 'entityType'); const name = text(formData, 'name')
  if (!name || !['process','asset','dataset','vendor'].includes(entityType)) throw new Error('Datos incompletos')
  const { admin, user, organizationId } = await resolveContext('/digital-twin/manage')
  let error: { message: string } | null = null
  if (entityType === 'process') ({ error } = await admin.from('organization_processes').insert({ organization_id: organizationId, code: codeFor('PROC', name), name, description: text(formData,'description') || null, process_type: text(formData,'processType') || 'operational', criticality: text(formData,'criticality') || 'medium', lifecycle_status: 'draft', attributes: {}, created_by: user.id }))
  if (entityType === 'asset') ({ error } = await admin.from('organization_assets').insert({ organization_id: organizationId, code: codeFor('ASSET', name), name, asset_type: text(formData,'assetType') || 'system', description: text(formData,'description') || null, criticality: text(formData,'criticality') || 'medium', provider_name: text(formData,'providerName') || null, hosting_country: text(formData,'country') || null, contains_personal_data: checked(formData,'personalData'), contains_sensitive_data: checked(formData,'sensitiveData'), lifecycle_status: 'draft', attributes: {}, created_by: user.id }))
  if (entityType === 'dataset') ({ error } = await admin.from('organization_datasets').insert({ organization_id: organizationId, code: codeFor('DATA', name), name, data_subjects: text(formData,'dataSubjects').split(',').map(v=>v.trim()).filter(Boolean), data_categories: text(formData,'dataCategories').split(',').map(v=>v.trim()).filter(Boolean), sensitivity: text(formData,'sensitivity') || 'internal', legal_basis: text(formData,'legalBasis') || null, retention_rule: text(formData,'retentionRule') || null, cross_border_transfer: checked(formData,'crossBorder'), lifecycle_status: 'draft', attributes: {}, created_by: user.id }))
  if (entityType === 'vendor') ({ error } = await admin.from('organization_vendors').insert({ organization_id: organizationId, code: codeFor('VEND', name), name, service_category: text(formData,'serviceCategory') || null, country: text(formData,'country') || null, processes_personal_data: checked(formData,'personalData'), cross_border_transfer: checked(formData,'crossBorder'), risk_tier: text(formData,'riskTier') || 'medium', lifecycle_status: 'draft', attributes: {}, created_by: user.id }))
  if (error) throw new Error(`No fue posible crear el registro: ${error.message}`)
  revalidatePath('/digital-twin'); revalidatePath('/digital-twin/manage'); redirect('/digital-twin/manage?created=1')
}

export async function reviewItemAction(formData: FormData) {
  const type = text(formData,'type'); const id = text(formData,'id'); const decision = text(formData,'decision')
  const { admin, user, organizationId } = await resolveContext('/review-center')
  let error: { message: string } | null = null
  if (type === 'control') ({ error } = await admin.from('controls').update({ lifecycle_status: decision === 'approve' ? 'active' : 'retired', status: decision === 'approve' ? 'approved' : 'rejected', updated_at: new Date().toISOString() }).eq('id', id).eq('organization_id', organizationId))
  else if (type === 'policy') ({ error } = await admin.from('organization_policy_instances').update({ status: decision === 'approve' ? 'approved' : 'retired', approved_by: decision === 'approve' ? user.id : null, approved_at: decision === 'approve' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('id', id).eq('organization_id', organizationId))
  else if (type === 'snapshot') ({ error } = await admin.rpc('transition_executive_snapshot_v1', { p_snapshot_id: id, p_actor_user_id: user.id, p_action: decision === 'approve' ? 'approve' : 'reject', p_notes: text(formData,'notes') || null }))
  else throw new Error('Tipo de revisión inválido')
  if (error) throw new Error(`No fue posible registrar la revisión: ${error.message}`)
  revalidatePath('/review-center'); revalidatePath('/executive'); redirect('/review-center?reviewed=1')
}

export async function transitionSnapshotAction(formData: FormData) {
  const id = text(formData,'id'); const action = text(formData,'action')
  if (!['submit','approve','publish','archive','reject'].includes(action)) throw new Error('Transición inválida')
  const { admin, user } = await resolveContext('/executive/history')
  const { error } = await admin.rpc('transition_executive_snapshot_v1', { p_snapshot_id: id, p_actor_user_id: user.id, p_action: action, p_notes: text(formData,'notes') || null })
  if (error) throw new Error(`No fue posible cambiar el estado: ${error.message}`)
  revalidatePath('/executive'); revalidatePath('/executive/history'); revalidatePath('/review-center'); redirect('/executive/history?updated=1')
}
