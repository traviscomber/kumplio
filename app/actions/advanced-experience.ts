'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const value = (formData: FormData, key: string) => String(formData.get(key) || '').trim()

async function context(nextPath: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`)
  const admin = createAdminClient()
  const { data: membership } = await admin.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')
  return { admin, user, organizationId: String(membership.organization_id) }
}

const tables = {
  process: 'organization_processes',
  asset: 'organization_assets',
  dataset: 'organization_datasets',
  vendor: 'organization_vendors',
} as const

type TwinType = keyof typeof tables

export async function updateTwinEntityAction(formData: FormData) {
  const type = value(formData, 'type') as TwinType
  const id = value(formData, 'id')
  const name = value(formData, 'name')
  const criticality = value(formData, 'criticality')
  if (!tables[type] || !id || !name) throw new Error('Datos de edición inválidos')
  const { admin, organizationId } = await context('/digital-twin/relations')
  const payload: Record<string, unknown> = { name, updated_at: new Date().toISOString() }
  if (criticality && type !== 'dataset' && type !== 'vendor') payload.criticality = criticality
  if (type === 'dataset' && criticality) payload.sensitivity = criticality
  if (type === 'vendor' && criticality) payload.risk_tier = criticality
  const { error } = await admin.from(tables[type]).update(payload).eq('id', id).eq('organization_id', organizationId)
  if (error) throw new Error(`No fue posible editar el registro: ${error.message}`)
  revalidatePath('/digital-twin'); revalidatePath('/digital-twin/relations')
  redirect('/digital-twin/relations?updated=1')
}

export async function createTwinRelationAction(formData: FormData) {
  const sourceType = value(formData, 'sourceType') as TwinType
  const targetType = value(formData, 'targetType') as TwinType
  const sourceId = value(formData, 'sourceId')
  const targetId = value(formData, 'targetId')
  const relationType = value(formData, 'relationType')
  if (!tables[sourceType] || !tables[targetType] || !sourceId || !targetId || sourceId === targetId) throw new Error('Relación inválida')
  const { admin, user, organizationId } = await context('/digital-twin/relations')
  const { error } = await admin.from('digital_twin_relations').upsert({ organization_id: organizationId, source_type: sourceType, source_id: sourceId, relation_type: relationType, target_type: targetType, target_id: targetId, status: 'draft', created_by: user.id }, { onConflict: 'organization_id,source_type,source_id,relation_type,target_type,target_id' })
  if (error) throw new Error(`No fue posible crear la relación: ${error.message}`)
  revalidatePath('/digital-twin/relations')
  redirect('/digital-twin/relations?related=1')
}

export async function addReviewCommentAction(formData: FormData) {
  const entityType = value(formData, 'entityType')
  const entityId = value(formData, 'entityId')
  const commentType = value(formData, 'commentType') || 'comment'
  const body = value(formData, 'body')
  if (!entityId || !body) throw new Error('El comentario está vacío')
  const { admin, user, organizationId } = await context('/review-center/compare')
  const { error } = await admin.rpc('add_review_comment_v1', { p_organization_id: organizationId, p_entity_type: entityType, p_entity_id: entityId, p_comment_type: commentType, p_body: body, p_actor_user_id: user.id })
  if (error) throw new Error(`No fue posible guardar el comentario: ${error.message}`)
  revalidatePath('/review-center'); revalidatePath('/review-center/compare')
  redirect('/review-center/compare?commented=1')
}
