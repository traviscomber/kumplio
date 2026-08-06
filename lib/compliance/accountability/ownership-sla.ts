import type { SupabaseClient } from '@supabase/supabase-js'

export type WorkspaceMember = {
  userId: string
  role: string
  label: string
}

export type AccountableMission = {
  id: string
  title: string
  status: string
  priority: string
  ownerId: string | null
  dueAt: string | null
  createdAt: string
  ownerLabel: string
  sla: 'overdue' | 'due_soon' | 'on_track' | 'unscheduled'
}

export type AuditEvent = {
  id: string
  missionId: string
  missionTitle: string
  eventType: string
  actorType: string
  fromStatus: string | null
  toStatus: string | null
  createdAt: string
  payload: Record<string, unknown>
}

export async function listWorkspaceMembers(admin: SupabaseClient, organizationId: string): Promise<WorkspaceMember[]> {
  const { data, error } = await admin
    .from('organization_members')
    .select('user_id,role')
    .eq('organization_id', organizationId)
    .order('joined_at')
  if (error) throw new Error(`No fue posible cargar responsables: ${error.message}`)

  return (data || []).map((member) => ({
    userId: String(member.user_id),
    role: String(member.role || 'member'),
    label: `${roleLabel(String(member.role || 'member'))} · ${String(member.user_id).slice(0, 8)}`,
  }))
}

export async function listAccountableMissions(admin: SupabaseClient, organizationId: string): Promise<AccountableMission[]> {
  const [{ data: missions, error }, members] = await Promise.all([
    admin
      .from('missions')
      .select('id,title,status,priority,owner_id,due_at,created_at')
      .eq('organization_id', organizationId)
      .not('status', 'in', '(completed,cancelled)')
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(100),
    listWorkspaceMembers(admin, organizationId),
  ])
  if (error) throw new Error(`No fue posible cargar el trabajo asignado: ${error.message}`)

  const labels = new Map(members.map((member) => [member.userId, member.label]))
  return (missions || []).map((mission) => ({
    id: String(mission.id),
    title: String(mission.title || 'Misión de cumplimiento'),
    status: String(mission.status || 'draft'),
    priority: String(mission.priority || 'medium'),
    ownerId: mission.owner_id ? String(mission.owner_id) : null,
    dueAt: mission.due_at ? String(mission.due_at) : null,
    createdAt: String(mission.created_at),
    ownerLabel: mission.owner_id ? labels.get(String(mission.owner_id)) || 'Responsable asignado' : 'Sin responsable',
    sla: calculateSla(mission.due_at ? String(mission.due_at) : null),
  }))
}

export async function assignMissionOwner(
  admin: SupabaseClient,
  organizationId: string,
  missionId: string,
  ownerId: string | null,
  dueAt: string | null,
  actorUserId: string,
): Promise<void> {
  const { error } = await admin.rpc('update_mission_accountability', {
    p_actor_id: actorUserId,
    p_organization_id: organizationId,
    p_mission_id: missionId,
    p_owner_id: ownerId,
    p_due_at: dueAt,
  })

  if (!error) return

  const message = error.message || ''
  if (message.includes('mission_assignment_forbidden')) {
    throw new Error('Tu rol no permite asignar responsables ni vencimientos.')
  }
  if (message.includes('mission_owner_not_member')) {
    throw new Error('El responsable seleccionado no pertenece a esta organización.')
  }
  if (message.includes('mission_terminal')) {
    throw new Error('La misión ya está cerrada y no admite cambios.')
  }
  if (message.includes('mission_not_found')) {
    throw new Error('La misión no existe o no pertenece a esta organización.')
  }
  throw new Error(`No fue posible actualizar la responsabilidad: ${error.message}`)
}

export async function listAuditEvents(admin: SupabaseClient, organizationId: string): Promise<AuditEvent[]> {
  const { data: events, error } = await admin
    .from('mission_events')
    .select('id,mission_id,event_type,actor_type,from_status,to_status,payload,created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(`No fue posible cargar la bitácora: ${error.message}`)

  const missionIds = [...new Set((events || []).map((event) => String(event.mission_id)))]
  const { data: missions, error: missionError } = missionIds.length
    ? await admin.from('missions').select('id,title').in('id', missionIds)
    : { data: [], error: null }
  if (missionError) throw new Error(`No fue posible relacionar la bitácora: ${missionError.message}`)
  const titles = new Map((missions || []).map((mission) => [String(mission.id), String(mission.title)]))

  return (events || []).map((event) => ({
    id: String(event.id),
    missionId: String(event.mission_id),
    missionTitle: titles.get(String(event.mission_id)) || 'Misión',
    eventType: String(event.event_type || 'updated'),
    actorType: String(event.actor_type || 'system'),
    fromStatus: event.from_status ? String(event.from_status) : null,
    toStatus: event.to_status ? String(event.to_status) : null,
    createdAt: String(event.created_at),
    payload: event.payload && typeof event.payload === 'object' ? event.payload as Record<string, unknown> : {},
  }))
}

function calculateSla(dueAt: string | null): AccountableMission['sla'] {
  if (!dueAt) return 'unscheduled'
  const milliseconds = new Date(dueAt).getTime() - Date.now()
  if (milliseconds < 0) return 'overdue'
  if (milliseconds <= 3 * 24 * 60 * 60 * 1000) return 'due_soon'
  return 'on_track'
}

function roleLabel(role: string) {
  if (role === 'owner') return 'Propietario'
  if (role === 'admin') return 'Administrador'
  if (role === 'compliance') return 'Cumplimiento'
  if (role === 'reviewer') return 'Revisor'
  if (role === 'viewer') return 'Observador'
  return 'Miembro'
}
