import type { SupabaseClient } from '@supabase/supabase-js'
import type { WorkspaceAccess, WorkspaceRole } from './workspace-access'

export type TeamMember = {
  membershipId: string
  userId: string
  role: WorkspaceRole
  joinedAt: string
  firstName: string | null
  lastName: string | null
  email: string | null
  displayName: string
}

export async function listTeamMembers(
  admin: SupabaseClient,
  organizationId: string,
): Promise<TeamMember[]> {
  const { data: memberships, error: membershipError } = await admin
    .from('organization_members')
    .select('id,user_id,role,joined_at')
    .eq('organization_id', organizationId)
    .order('joined_at', { ascending: true })

  if (membershipError) throw new Error(`No fue posible cargar el equipo: ${membershipError.message}`)

  const userIds = [...new Set((memberships || []).map((row) => String(row.user_id)).filter(Boolean))]
  const profilesResult = userIds.length
    ? await admin
      .from('profiles')
      .select('id,first_name,last_name,email')
      .in('id', userIds)
    : { data: [], error: null }

  if (profilesResult.error) throw new Error(`No fue posible cargar los perfiles del equipo: ${profilesResult.error.message}`)

  const profileByUserId = new Map(
    (profilesResult.data || []).map((profile) => [String(profile.id), profile]),
  )

  return (memberships || []).map((row) => {
    const profile = profileByUserId.get(String(row.user_id))
    const firstName = profile && typeof profile.first_name === 'string'
      ? profile.first_name.trim() || null
      : null
    const lastName = profile && typeof profile.last_name === 'string'
      ? profile.last_name.trim() || null
      : null
    const email = profile && typeof profile.email === 'string'
      ? profile.email.trim() || null
      : null
    const fullName = [firstName, lastName].filter(Boolean).join(' ')

    return {
      membershipId: String(row.id),
      userId: String(row.user_id),
      role: normalizeRole(row.role),
      joinedAt: String(row.joined_at || new Date().toISOString()),
      firstName,
      lastName,
      email,
      displayName: fullName || email || 'Persona del equipo',
    }
  })
}

export async function inviteTeamMember(
  admin: SupabaseClient,
  access: WorkspaceAccess,
  email: string,
  role: WorkspaceRole,
  redirectTo?: string,
): Promise<void> {
  if (!['owner', 'admin'].includes(access.role)) {
    throw new Error('Tu rol no permite invitar personas al equipo.')
  }
  if (role === 'owner' && access.role !== 'owner') {
    throw new Error('Solo el propietario puede invitar a otro propietario.')
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Ingresa un correo válido.')
  }

  const { data: existingProfile, error: profileError } = await admin
    .from('profiles')
    .select('id,email')
    .ilike('email', normalizedEmail)
    .limit(1)
    .maybeSingle()

  if (profileError) throw new Error(`No fue posible validar el correo: ${profileError.message}`)

  let userId = existingProfile?.id ? String(existingProfile.id) : null

  if (!userId) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
      ...(redirectTo ? { redirectTo } : {}),
      data: {
        invited_to_organization_id: access.organizationId,
        invited_role: role,
      },
    })
    if (error || !data.user) {
      throw new Error(`No fue posible enviar la invitación: ${error?.message || 'usuario no creado'}`)
    }
    userId = data.user.id

    await admin.from('profiles').upsert({
      id: userId,
      email: normalizedEmail,
      organization_id: access.organizationId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  const { data: existingMembership, error: membershipLookupError } = await admin
    .from('organization_members')
    .select('id')
    .eq('organization_id', access.organizationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (membershipLookupError) throw new Error(`No fue posible validar la membresía: ${membershipLookupError.message}`)
  if (existingMembership) throw new Error('Esta persona ya pertenece a la organización.')

  const { error: membershipError } = await admin.from('organization_members').insert({
    organization_id: access.organizationId,
    user_id: userId,
    role,
  })
  if (membershipError) throw new Error(`La invitación fue creada, pero no se pudo asignar el acceso: ${membershipError.message}`)
}

export async function revokeTeamMember(
  admin: SupabaseClient,
  access: WorkspaceAccess,
  membershipId: string,
): Promise<void> {
  if (!['owner', 'admin'].includes(access.role)) {
    throw new Error('Tu rol no permite revocar accesos.')
  }

  const { data: membership, error: lookupError } = await admin
    .from('organization_members')
    .select('id,user_id,role')
    .eq('id', membershipId)
    .eq('organization_id', access.organizationId)
    .maybeSingle()

  if (lookupError) throw new Error(`No fue posible validar el acceso: ${lookupError.message}`)
  if (!membership) throw new Error('La membresía no existe o no pertenece a tu organización.')
  if (String(membership.user_id) === access.userId) throw new Error('No puedes revocar tu propio acceso desde esta pantalla.')
  if (membership.role === 'owner' && access.role !== 'owner') throw new Error('Solo el propietario puede revocar a otro propietario.')

  const { error } = await admin
    .from('organization_members')
    .delete()
    .eq('id', membershipId)
    .eq('organization_id', access.organizationId)

  if (error) throw new Error(`No fue posible revocar el acceso: ${error.message}`)
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
  if (
    value === 'owner'
    || value === 'admin'
    || value === 'compliance'
    || value === 'reviewer'
    || value === 'viewer'
  ) return value
  return 'member'
}
