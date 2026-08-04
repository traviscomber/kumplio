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
  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')
  return { admin, user, organizationId: membership.organization_id as string }
}

export async function startGuidedOnboardingAction() {
  const { admin, user, organizationId } = await resolveContext('/onboarding/twin')
  const { data, error } = await admin.rpc('start_guided_onboarding_v1', {
    p_organization_id: organizationId,
    p_actor_user_id: user.id,
  })
  if (error) throw new Error(`No fue posible iniciar el onboarding: ${error.message}`)
  revalidatePath('/onboarding/twin')
  revalidatePath('/digital-twin')
  redirect(`/onboarding/twin?session=${data}`)
}

export async function installLibraryItemAction(formData: FormData) {
  const itemType = String(formData.get('itemType') || '')
  const versionId = String(formData.get('versionId') || '')
  if (!['control', 'policy'].includes(itemType) || !versionId) throw new Error('Solicitud de instalación inválida')

  const { admin, user, organizationId } = await resolveContext('/libraries')
  const { error } = await admin.rpc('install_library_item_v1', {
    p_organization_id: organizationId,
    p_actor_user_id: user.id,
    p_item_type: itemType,
    p_version_id: versionId,
  })
  if (error) throw new Error(`No fue posible crear el borrador: ${error.message}`)
  revalidatePath('/libraries')
  revalidatePath('/digital-twin')
  redirect('/libraries?installed=1')
}

export async function generateExecutiveSnapshotAction() {
  const { admin, user, organizationId } = await resolveContext('/executive')
  const { error } = await admin.rpc('generate_executive_snapshot_v1', {
    p_organization_id: organizationId,
    p_actor_user_id: user.id,
  })
  if (error) throw new Error(`No fue posible generar el snapshot: ${error.message}`)
  revalidatePath('/executive')
  redirect('/executive?generated=1')
}
