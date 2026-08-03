'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type DecisionResolution = 'approved' | 'rejected' | 'changes_requested'

async function getAuthorizedContext(missionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Debes iniciar sesión para continuar.')

  const { data: mission } = await supabase.from('missions').select('id,organization_id,status').eq('id', missionId).maybeSingle()
  if (!mission) throw new Error('No encontramos la misión o no tienes acceso.')

  const { data: membership } = await supabase.from('organization_members').select('role').eq('organization_id', mission.organization_id).eq('user_id', user.id).maybeSingle()
  if (!membership) throw new Error('No perteneces a la organización de esta misión.')
  return { user, mission, membership }
}

function refreshMission(missionId: string) {
  revalidatePath(`/missions/${missionId}`)
  revalidatePath('/missions')
  revalidatePath('/dashboard')
}

export async function startMissionAction(missionId: string) {
  const { user, mission } = await getAuthorizedContext(missionId)
  if (!['ready', 'blocked'].includes(mission.status)) throw new Error('Esta misión no puede iniciarse desde su estado actual.')
  const admin = createAdminClient()
  const { error } = await admin.rpc('start_and_assign_mission', { p_mission_id: missionId, p_actor_user_id: user.id })
  if (error) throw new Error('No fue posible iniciar la misión. Revisa la configuración del equipo IA.')
  refreshMission(missionId)
}

export async function startCapabilityAction(missionId: string, capabilityRunId: string) {
  const { user, mission } = await getAuthorizedContext(missionId)
  if (mission.status !== 'active') throw new Error('La misión debe estar activa para iniciar este trabajo.')
  const admin = createAdminClient()
  const { data: run } = await admin.from('mission_capability_runs').select('id,mission_id,status').eq('id', capabilityRunId).eq('mission_id', missionId).maybeSingle()
  if (!run) throw new Error('La capacidad no pertenece a esta misión.')

  const { error } = await admin.rpc('enqueue_mission_capability', { p_capability_run_id: capabilityRunId, p_actor_user_id: user.id })
  if (error) {
    console.error('[missions] enqueue_mission_capability:', error)
    if (error.message.includes('previous_capabilities')) throw new Error('Primero deben completarse las capacidades anteriores.')
    if (error.message.includes('already_queued')) throw new Error('Esta capacidad ya está en la cola de ejecución.')
    if (error.message.includes('no_active_worker')) throw new Error('El agente asignado todavía no tiene un worker activo.')
    throw new Error('No fue posible enviar esta capacidad a la cola.')
  }
  refreshMission(missionId)
}

export async function resolveDecisionAction(missionId: string, decisionId: string, resolution: DecisionResolution, notes: string) {
  const { user } = await getAuthorizedContext(missionId)
  if (!notes.trim()) throw new Error('Registra el fundamento antes de resolver la decisión.')
  const admin = createAdminClient()
  const { data: decision } = await admin.from('mission_decisions').select('id,mission_id,status').eq('id', decisionId).eq('mission_id', missionId).maybeSingle()
  if (!decision || decision.status !== 'pending') throw new Error('La decisión ya fue resuelta o no pertenece a esta misión.')
  const { error } = await admin.rpc('resolve_mission_decision', { p_decision_id: decisionId, p_actor_user_id: user.id, p_resolution: resolution, p_notes: notes.trim() })
  if (error) throw new Error('No fue posible registrar la decisión.')
  refreshMission(missionId)
}
