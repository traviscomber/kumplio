'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const priorities = new Set(['low', 'medium', 'high', 'critical'])

function clean(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function createMissionAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const playbookId = clean(formData.get('playbook_id'))
  const title = clean(formData.get('title'))
  const objective = clean(formData.get('objective'))
  const priorityInput = clean(formData.get('priority'))
  const ownerId = clean(formData.get('owner_id')) || user.id
  const dueDate = clean(formData.get('due_at'))

  if (!playbookId || !title) {
    redirect(`/missions/new?playbookId=${encodeURIComponent(playbookId)}&error=missing_fields`)
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) {
    redirect('/missions/new?error=organization_missing')
  }

  const admin = createAdminClient()
  const { data: missionId, error } = await admin.rpc('create_mission_from_playbook', {
    p_organization_id: membership.organization_id,
    p_playbook_id: playbookId,
    p_created_by: user.id,
    p_title: title,
    p_objective: objective || null,
    p_case_id: null,
    p_priority: priorities.has(priorityInput) ? priorityInput : 'medium',
    p_owner_id: ownerId || null,
    p_due_at: dueDate ? new Date(`${dueDate}T23:59:59-04:00`).toISOString() : null,
    p_metadata: { source: 'mission_creation_ui', locale: 'es-CL' },
  })

  if (error || !missionId) {
    console.error('[missions] Create mission error:', error)
    redirect(`/missions/new?playbookId=${encodeURIComponent(playbookId)}&error=create_failed`)
  }

  redirect(`/missions/${missionId}`)
}
