import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ShieldCheck, Users } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess, type WorkspaceRole } from '@/lib/compliance/accountability/workspace-access'
import { listTeamMembers, updateMemberRole } from '@/lib/compliance/accountability/team'

export const dynamic = 'force-dynamic'

const roles: WorkspaceRole[] = ['owner', 'admin', 'compliance', 'reviewer', 'member']

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/team')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  async function changeRole(formData: FormData) {
    'use server'
    const serverSupabase = await createClient()
    const { data: { user: currentUser } } = await serverSupabase.auth.getUser()
    if (!currentUser) redirect('/sign-in?next=/team')

    const serverAdmin = createAdminClient()
    const currentAccess = await getWorkspaceAccess(serverAdmin, currentUser.id)
    if (!currentAccess) redirect('/onboarding')

    await updateMemberRole(
      serverAdmin,
      currentAccess,
      String(formData.get('membershipId') || ''),
      String(formData.get('role') || 'member') as WorkspaceRole,
    )
    revalidatePath('/team')
  }

  const members = await listTeamMembers(admin, access.organizationId)
  const canManage = access.role === 'owner' || access.role === 'admin'

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Equipo y responsabilidades</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{members.length} personas con acceso.</h1>
              <p className="mt-4 max-w-3xl text-muted-foreground">
                Los roles determinan quién puede resolver decisiones, asignar trabajo y administrar el equipo.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-4">
          {members.map((member) => (
            <article key={member.membershipId} className="rounded-2xl border bg-card p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Usuario {shortId(member.userId)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Se incorporó {new Date(member.joinedAt).toLocaleDateString('es-CL')}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    <ShieldCheck className="h-4 w-4" /> {roleLabel(member.role)}
                  </p>
                </div>

                {canManage && member.userId !== access.userId ? (
                  <form action={changeRole} className="flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="membershipId" value={member.membershipId} />
                    <select name="role" defaultValue={member.role} className="rounded-xl border bg-background px-4 py-3 text-sm">
                      {roles.map((role) => (
                        <option key={role} value={role}>{roleLabel(role)}</option>
                      ))}
                    </select>
                    <button className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Guardar rol</button>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {member.userId === access.userId ? 'Tu acceso actual' : 'Solo lectura'}
                  </p>
                )}
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  )
}

function roleLabel(role: WorkspaceRole) {
  if (role === 'owner') return 'Propietario'
  if (role === 'admin') return 'Administrador'
  if (role === 'compliance') return 'Cumplimiento'
  if (role === 'reviewer') return 'Revisor'
  return 'Miembro'
}

function shortId(value: string) {
  return `${value.slice(0, 8)}…${value.slice(-4)}`
}
