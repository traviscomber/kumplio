'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createActionPlan(formData: FormData) {
  const runId = String(formData.get('runId') || '')
  if (!runId) throw new Error('Falta el impacto regulatorio.')

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Debes iniciar sesión para crear un plan.')

  const admin = createAdminClient()
  const { data, error: rpcError } = await admin.rpc('create_compliance_action_plan_v1', {
    p_impact_run_id: runId,
    p_created_by: user.id,
    p_title: null,
  })

  if (rpcError) throw new Error(rpcError.message)
  redirect(`/action-plans/${String(data)}`)
}
