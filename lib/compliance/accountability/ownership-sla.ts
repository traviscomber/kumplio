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
    status: String(mission.status || 'queued'),
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
  ownerId: string,
  dueAt: string | null,
  actorUserId: string,
): Promise<void> {
  const { data: member, error: memberError } = await admin
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('user_id', ownerId)
    .maybeSingle()
  if (memberError) throw new Error(`No fue posible validar al responsable: ${memberError.message}`)
  if (!member) throw new Error('El responsable no pertenece a esta organización.')

  const { data: mission, error: missionError } = await admin
    .from('missions')
    .select('id,owner_id,due_at,status')
    .eq('id', missionId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (missionError) throw new Error(`No fue posible validar la misión: ${missionError.message}`)
  if (!mission) throw new Error('La misión no pertenece a esta organización.')

  const { error: updateError } = await admin
    .from('missions')
    .update({ owner_id: ownerId, due_at: dueAt, updated_at: new Date().toISOString() })
    .eq('id', missionId)
    .eq('organization_id', organizationId)
  if (updateError) throw new Error(`No fue posible asignar la misión: ${updateError.message}`)

  const { error: eventError } = await admin.from('mission_events').insert({
    organization_id: organizationId,
    mission_id: missionId,
    event_type: 'ownership_updated',
    actor_type: 'user',
    actor_user_id: actorUserId,
    from_status: mission.status,
    to_status: mission.status,
    payload: {
      previous_owner_id: mission.owner_id,
      owner_id: ownerId,
      previous_due_at: mission.due_at,
      due_at: dueAt,
    },
  })
  if (eventError) throw new Error(`La asignación se guardó, pero falló la bitácora: ${eventError.message}`)
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
  if (role === 'compliance') return 'Compliance'
  if (role === 'reviewer') return 'Revisor'
  return 'Miembro'
}
