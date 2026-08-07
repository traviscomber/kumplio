import type { SupabaseClient } from '@supabase/supabase-js'

export type WorkspaceMember = {
  userId: string
  role: string
  label: string
  activeCount: number
  overdueCount: number
  completedCount: number
}

export type MissionSlaDetail = {
  hoursToDue: number | null
  escalationLevel: 'none' | 'owner' | 'compliance' | 'executive'
  followUpLabel: string
  nextAction: string
  shouldFollowUp: boolean
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
  slaDetail: MissionSlaDetail
  suggestedOwnerId: string | null
  suggestedOwnerLabel: string | null
  suggestionReasons: string[]
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
  const [membersResult, activeResult, completedResult] = await Promise.all([
    admin
      .from('organization_members')
      .select('user_id,role')
      .eq('organization_id', organizationId)
      .order('joined_at'),
    admin
      .from('missions')
      .select('id,owner_id,due_at,status')
      .eq('organization_id', organizationId)
      .not('status', 'in', '(completed,cancelled)')
      .limit(1000),
    admin
      .from('missions')
      .select('id,owner_id,title,completed_at')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1000),
  ])

  if (membersResult.error) throw new Error(`No fue posible cargar responsables: ${membersResult.error.message}`)
  if (activeResult.error) throw new Error(`No fue posible calcular carga activa: ${activeResult.error.message}`)
  if (completedResult.error) throw new Error(`No fue posible calcular experiencia histórica: ${completedResult.error.message}`)

  const memberIds = (membersResult.data || []).map((member) => String(member.user_id))
  const { data: profiles, error: profileError } = memberIds.length
    ? await admin.from('profiles').select('id,first_name,last_name,email').in('id', memberIds)
    : { data: [], error: null }
  if (profileError) throw new Error(`No fue posible cargar nombres del equipo: ${profileError.message}`)

  const profileLabels = new Map((profiles || []).map((profile) => [
    String(profile.id),
    [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || String(profile.email || 'Miembro'),
  ]))
  const now = Date.now()

  return (membersResult.data || []).map((member) => {
    const userId = String(member.user_id)
    const role = String(member.role || 'member')
    const active = (activeResult.data || []).filter((mission) => String(mission.owner_id || '') === userId)
    const overdueCount = active.filter((mission) => mission.due_at && new Date(String(mission.due_at)).getTime() < now).length
    const completedCount = (completedResult.data || []).filter((mission) => String(mission.owner_id || '') === userId).length
    const person = profileLabels.get(userId) || `Miembro ${userId.slice(0, 8)}`

    return {
      userId,
      role,
      label: `${person} · ${roleLabel(role)}`,
      activeCount: active.length,
      overdueCount,
      completedCount,
    }
  })
}

export async function listAccountableMissions(admin: SupabaseClient, organizationId: string): Promise<AccountableMission[]> {
  const [missionsResult, completedResult, members] = await Promise.all([
    admin
      .from('missions')
      .select('id,title,status,priority,owner_id,due_at,created_at')
      .eq('organization_id', organizationId)
      .not('status', 'in', '(completed,cancelled)')
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(200),
    admin
      .from('missions')
      .select('id,title,owner_id,completed_at')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1000),
    listWorkspaceMembers(admin, organizationId),
  ])
  if (missionsResult.error) throw new Error(`No fue posible cargar el trabajo asignado: ${missionsResult.error.message}`)
  if (completedResult.error) throw new Error(`No fue posible cargar experiencia previa: ${completedResult.error.message}`)

  const labels = new Map(members.map((member) => [member.userId, member.label]))
  const completed = completedResult.data || []

  return (missionsResult.data || []).map((mission) => {
    const dueAt = mission.due_at ? String(mission.due_at) : null
    const priority = String(mission.priority || 'medium')
    const status = String(mission.status || 'draft')
    const suggestion = mission.owner_id
      ? null
      : suggestMissionOwner(String(mission.title || ''), priority, members, completed)

    return {
      id: String(mission.id),
      title: String(mission.title || 'Misión de cumplimiento'),
      status,
      priority,
      ownerId: mission.owner_id ? String(mission.owner_id) : null,
      dueAt,
      createdAt: String(mission.created_at),
      ownerLabel: mission.owner_id ? labels.get(String(mission.owner_id)) || 'Responsable asignado' : 'Sin responsable',
      sla: calculateSla(dueAt),
      slaDetail: calculateSlaDetail(priority, status, dueAt),
      suggestedOwnerId: suggestion?.userId || null,
      suggestedOwnerLabel: suggestion?.label || null,
      suggestionReasons: suggestion?.reasons || [],
    }
  })
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

function suggestMissionOwner(
  title: string,
  priority: string,
  members: WorkspaceMember[],
  completed: Array<{ title: string | null; owner_id: string | null }>,
) {
  const eligible = members.filter((member) => !['viewer'].includes(member.role))
  if (eligible.length === 0) return null
  const missionTokens = tokenize(title)

  const ranked = eligible.map((member) => {
    const historicalTitles = completed
      .filter((mission) => String(mission.owner_id || '') === member.userId)
      .map((mission) => String(mission.title || ''))
    const similarity = historicalTitles.reduce((best, historicalTitle) => Math.max(best, tokenSimilarity(missionTokens, tokenize(historicalTitle))), 0)
    const roleBoost = ['owner', 'admin', 'compliance'].includes(member.role) ? 18 : member.role === 'reviewer' ? 10 : 4
    const criticalBoost = priority === 'critical' && ['owner', 'admin', 'compliance'].includes(member.role) ? 12 : 0
    const score = roleBoost + criticalBoost + similarity * 40 + Math.min(member.completedCount, 10) * 2 - member.activeCount * 5 - member.overdueCount * 9
    const reasons = [
      similarity >= 0.35 ? 'Tiene experiencia en misiones con contenido similar.' : '',
      member.completedCount > 0 ? `Ha cerrado ${member.completedCount} misión${member.completedCount === 1 ? '' : 'es'} previamente.` : '',
      member.activeCount === 0 ? 'No tiene misiones activas registradas.' : `Mantiene ${member.activeCount} misión${member.activeCount === 1 ? '' : 'es'} activa${member.activeCount === 1 ? '' : 's'}.`,
      member.overdueCount > 0 ? `${member.overdueCount} de sus misiones están vencidas; revisa capacidad antes de asignar.` : 'No presenta misiones vencidas.',
    ].filter(Boolean)
    return { ...member, score, reasons }
  }).sort((left, right) => right.score - left.score)

  const best = ranked[0]
  return { userId: best.userId, label: best.label, reasons: best.reasons }
}

function calculateSla(dueAt: string | null): AccountableMission['sla'] {
  if (!dueAt) return 'unscheduled'
  const milliseconds = new Date(dueAt).getTime() - Date.now()
  if (milliseconds < 0) return 'overdue'
  if (milliseconds <= 3 * 24 * 60 * 60 * 1000) return 'due_soon'
  return 'on_track'
}

function calculateSlaDetail(priority: string, status: string, dueAt: string | null): MissionSlaDetail {
  if (status === 'blocked') {
    return {
      hoursToDue: dueAt ? Math.round((new Date(dueAt).getTime() - Date.now()) / 3_600_000) : null,
      escalationLevel: priority === 'critical' ? 'compliance' : 'owner',
      followUpLabel: 'Bloqueo activo',
      nextAction: 'Documentar quién o qué bloquea la misión y fijar el próximo seguimiento.',
      shouldFollowUp: true,
    }
  }

  if (!dueAt) {
    return {
      hoursToDue: null,
      escalationLevel: 'owner',
      followUpLabel: 'Sin fecha objetivo',
      nextAction: 'Definir una fecha antes de que el trabajo pierda prioridad operativa.',
      shouldFollowUp: true,
    }
  }

  const hours = Math.round((new Date(dueAt).getTime() - Date.now()) / 3_600_000)
  if (hours < -48 && ['critical', 'high'].includes(priority)) {
    return {
      hoursToDue: hours,
      escalationLevel: 'executive',
      followUpLabel: 'Escalamiento ejecutivo',
      nextAction: 'Escalar al responsable ejecutivo y registrar una nueva fecha comprometida.',
      shouldFollowUp: true,
    }
  }
  if (hours < 0) {
    return {
      hoursToDue: hours,
      escalationLevel: ['critical', 'high'].includes(priority) ? 'compliance' : 'owner',
      followUpLabel: 'SLA vencido',
      nextAction: 'Solicitar actualización inmediata y documentar causa del atraso.',
      shouldFollowUp: true,
    }
  }
  if (hours <= 24) {
    return {
      hoursToDue: hours,
      escalationLevel: priority === 'critical' ? 'compliance' : 'owner',
      followUpLabel: 'Seguimiento hoy',
      nextAction: 'Confirmar avance y bloqueo antes del vencimiento.',
      shouldFollowUp: true,
    }
  }
  if (hours <= 72) {
    return {
      hoursToDue: hours,
      escalationLevel: 'owner',
      followUpLabel: 'Seguimiento preventivo',
      nextAction: 'Recordar el compromiso y confirmar que existe capacidad para cumplirlo.',
      shouldFollowUp: true,
    }
  }

  return {
    hoursToDue: hours,
    escalationLevel: 'none',
    followUpLabel: 'En plazo',
    nextAction: 'Mantener seguimiento normal.',
    shouldFollowUp: false,
  }
}

function tokenize(value: string) {
  return new Set(value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter((token) => token.length >= 4))
}

function tokenSimilarity(left: Set<string>, right: Set<string>) {
  if (left.size === 0 || right.size === 0) return 0
  const intersection = [...left].filter((token) => right.has(token)).length
  const union = new Set([...left, ...right]).size
  return union > 0 ? intersection / union : 0
}

function roleLabel(role: string) {
  if (role === 'owner') return 'Propietario'
  if (role === 'admin') return 'Administrador'
  if (role === 'compliance') return 'Cumplimiento'
  if (role === 'reviewer') return 'Revisor'
  if (role === 'viewer') return 'Observador'
  return 'Miembro'
}
