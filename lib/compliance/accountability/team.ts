import type { SupabaseClient } from '@supabase/supabase-js'
import type { WorkspaceAccess, WorkspaceRole } from './workspace-access'

export type TeamMember = {
  membershipId: string
  userId: string
  role: WorkspaceRole
  joinedAt: string
}

export async function listTeamMembers(
  admin: SupabaseClient,
  organizationId: string,
): Promise<TeamMember[]> {
  const { data, error } = await admin
    .from('organization_members')
    .select('id,user_id,role,joined_at')
    .eq('organization_id', organizationId)
    .order('joined_at', { ascending: true })

  if (error) throw new Error(`No fue posible cargar el equipo: ${error.message}`)

  return (data || []).map((row) => ({
    membershipId: String(row.id),
    userId: String(row.user_id),
    role: normalizeRole(row.role),
    joinedAt: String(row.joined_at || new Date().toISOString()),
  }))
}

export async function updateMemberRole(
  admin: SupabaseClient,
  access: WorkspaceAccess,
  membershipId: string,
  role: WorkspaceRole,
): Promise<void> {
  if (!['owner', 'admin'].includes(access.role)) {
    throw new Error('Tu rol no permite administrar el equipo.')
  }
  if (role === 'owner' && access.role !== 'owner') {
    throw new Error('Solo el propietario puede asignar el rol de propietario.')
  }

  const { data: membership, error: membershipError } = await admin
    .from('organization_members')
    .select('id,user_id,role')
    .eq('id', membershipId)
    .eq('organization_id', access.organizationId)
    .maybeSingle()

  if (membershipError) throw new Error(`No fue posible validar el miembro: ${membershipError.message}`)
  if (!membership) throw new Error('El miembro no pertenece a tu organización.')
  if (String(membership.user_id) === access.userId && role !== access.role) {
    throw new Error('No puedes cambiar tu propio rol desde esta pantalla.')
  }

  const { error } = await admin
    .from('organization_members')
    .update({ role })
    .eq('id', membershipId)
    .eq('organization_id', access.organizationId)

  if (error) throw new Error(`No fue posible actualizar el rol: ${error.message}`)
}

export async function assignDecision(
  admin: SupabaseClient,
  access: WorkspaceAccess,
  decisionId: string,
  assigneeUserId: string,
): Promise<void> {
  if (!access.canAssignWork) throw new Error('Tu rol no permite asignar decisiones.')

  const { data: member, error: memberError } = await admin
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', access.organizationId)
    .eq('user_id', assigneeUserId)
    .maybeSingle()

  if (memberError) throw new Error(`No fue posible validar al responsable: ${memberError.message}`)
  if (!member) throw new Error('El responsable seleccionado no pertenece a la organización.')

  const { data, error } = await admin
    .from('mission_decisions')
    .update({ assigned_to: assigneeUserId })
    .eq('id', decisionId)
    .eq('organization_id', access.organizationId)
    .neq('status', 'resolved')
    .select('id')
    .maybeSingle()

  if (error) throw new Error(`No fue posible asignar la decisión: ${error.message}`)
  if (!data) throw new Error('La decisión no existe, ya fue resuelta o no pertenece a tu organización.')
}

function normalizeRole(value: unknown): WorkspaceRole {
  if (value === 'owner' || value === 'admin' || value === 'compliance' || value === 'reviewer') return value
  return 'member'
}
