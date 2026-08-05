import type { SupabaseClient } from '@supabase/supabase-js'

export type WorkspaceRole = 'owner' | 'admin' | 'compliance' | 'reviewer' | 'member'

export type WorkspaceAccess = {
  organizationId: string
  userId: string
  role: WorkspaceRole
  canResolveDecisions: boolean
  canAssignWork: boolean
}

export type DecisionItem = {
  id: string
  missionId: string
  title: string
  description: string | null
  recommendation: string | null
  priority: string
  status: string
  assignedTo: string | null
  requestedAt: string
  resolvedAt: string | null
  resolutionNotes: string | null
  missionTitle: string
}

export async function getWorkspaceAccess(
  admin: SupabaseClient,
  userId: string,
): Promise<WorkspaceAccess | null> {
  const { data, error } = await admin
    .from('organization_members')
    .select('organization_id,user_id,role')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`No fue posible validar el acceso: ${error.message}`)
  if (!data) return null

  const role = normalizeRole(data.role)
  return {
    organizationId: String(data.organization_id),
    userId: String(data.user_id),
    role,
    canResolveDecisions: ['owner', 'admin', 'compliance', 'reviewer'].includes(role),
    canAssignWork: ['owner', 'admin', 'compliance'].includes(role),
  }
}

export async function listOrganizationDecisions(
  admin: SupabaseClient,
  organizationId: string,
): Promise<DecisionItem[]> {
  const { data, error } = await admin
    .from('mission_decisions')
    .select('id,mission_id,title,description,recommendation,priority,status,assigned_to,requested_at,resolved_at,resolution_notes,missions(title)')
    .eq('organization_id', organizationId)
    .order('requested_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(`No fue posible cargar las decisiones: ${error.message}`)

  return (data || []).map((row) => {
    const mission = Array.isArray(row.missions) ? row.missions[0] : row.missions
    return {
      id: String(row.id),
      missionId: String(row.mission_id),
      title: String(row.title || 'Decisión pendiente'),
      description: typeof row.description === 'string' ? row.description : null,
      recommendation: typeof row.recommendation === 'string' ? row.recommendation : null,
      priority: String(row.priority || 'medium'),
      status: String(row.status || 'pending'),
      assignedTo: row.assigned_to ? String(row.assigned_to) : null,
      requestedAt: String(row.requested_at || new Date().toISOString()),
      resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
      resolutionNotes: typeof row.resolution_notes === 'string' ? row.resolution_notes : null,
      missionTitle: mission && typeof mission === 'object' && 'title' in mission
        ? String(mission.title || 'Trabajo de cumplimiento')
        : 'Trabajo de cumplimiento',
    }
  })
}

export async function resolveDecision(
  admin: SupabaseClient,
  access: WorkspaceAccess,
  decisionId: string,
  resolutionNotes: string,
): Promise<void> {
  if (!access.canResolveDecisions) throw new Error('Tu rol no permite resolver decisiones.')
  const notes = resolutionNotes.trim()
  if (notes.length < 3) throw new Error('Registra una justificación breve para mantener la trazabilidad.')

  const { data, error } = await admin
    .from('mission_decisions')
    .update({
      status: 'resolved',
      resolved_by: access.userId,
      resolution_notes: notes,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', decisionId)
    .eq('organization_id', access.organizationId)
    .neq('status', 'resolved')
    .select('id')
    .maybeSingle()

  if (error) throw new Error(`No fue posible registrar la decisión: ${error.message}`)
  if (!data) throw new Error('La decisión no existe, ya fue resuelta o no pertenece a tu organización.')
}

function normalizeRole(value: unknown): WorkspaceRole {
  if (value === 'owner' || value === 'admin' || value === 'compliance' || value === 'reviewer') return value
  return 'member'
}
