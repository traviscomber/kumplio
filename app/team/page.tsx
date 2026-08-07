import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { MailPlus, ShieldCheck, Trash2, Users } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess, type WorkspaceRole } from '@/lib/compliance/accountability/workspace-access'
import { inviteTeamMember, listTeamMembers, revokeTeamMember, updateMemberRole } from '@/lib/compliance/accountability/team'

export const dynamic = 'force-dynamic'

const roles: WorkspaceRole[] = ['owner', 'admin', 'compliance', 'reviewer', 'member', 'viewer']

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/team')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  async function inviteMember(formData: FormData) {
    'use server'
    const context = await getActionContext()
    const incomingHeaders = await headers()
    const origin = incomingHeaders.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://kumplio.app'
    await inviteTeamMember(
      context.admin,
      context.access,
      String(formData.get('email') || ''),
      String(formData.get('role') || 'member') as WorkspaceRole,
      `${origin}/auth/callback?next=/team`,
    )
    revalidatePath('/team')
  }

  async function changeRole(formData: FormData) {
    'use server'
    const context = await getActionContext()
    await updateMemberRole(
      context.admin,
      context.access,
      String(formData.get('membershipId') || ''),
      String(formData.get('role') || 'member') as WorkspaceRole,
    )
    revalidatePath('/team')
  }

  async function revokeMember(formData: FormData) {
    'use server'
    const context = await getActionContext()
    await revokeTeamMember(context.admin, context.access, String(formData.get('membershipId') || ''))
    revalidatePath('/team')
  }

  const members = await listTeamMembers(admin, access.organizationId)
  const canManage = access.role === 'owner' || access.role === 'admin'

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-3xl border bg-card p-5 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Equipo y responsabilidades</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{members.length} personas con acceso.</h1>
              <p className="mt-4 max-w-3xl text-muted-foreground">
                Administra quién puede entrar a este workspace, revisar resultados, resolver decisiones y asignar trabajo.
              </p>
            </div>
          </div>
        </section>

        {canManage && (
          <section className="mt-6 rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <MailPlus className="h-5 w-5 text-primary" />
              <h2 className="font-black">Invitar a una persona</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">El acceso queda asociado a esta organización y la persona recibe un enlace seguro para completar su cuenta.</p>
            <form action={inviteMember} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
              <input name="email" type="email" required placeholder="nombre@empresa.cl" className="min-h-11 rounded-xl border bg-background px-4 text-sm" />
              <select name="role" defaultValue="member" className="min-h-11 rounded-xl border bg-background px-4 text-sm">
                {roles.filter((role) => role !== 'owner' || access.role === 'owner').map((role) => (
                  <option key={role} value={role}>{roleLabel(role)}</option>
                ))}
              </select>
              <button type="submit" className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground">Enviar invitación</button>
            </form>
          </section>
        )}

        <section className="mt-8 space-y-4">
          {members.map((member) => (
            <article key={member.membershipId} className="rounded-2xl border bg-card p-5 sm:p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">{member.displayName}</p>
                  {member.email && <p className="mt-1 truncate text-sm text-muted-foreground">{member.email}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">Se incorporó {new Date(member.joinedAt).toLocaleDateString('es-CL')}</p>
                  <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    <ShieldCheck className="h-4 w-4" /> {roleLabel(member.role)}
                  </p>
                </div>

                {canManage && member.userId !== access.userId ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <form action={changeRole} className="flex min-w-0 gap-2">
                      <input type="hidden" name="membershipId" value={member.membershipId} />
                      <select name="role" defaultValue={member.role} className="min-h-11 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm">
                        {roles.filter((role) => role !== 'owner' || access.role === 'owner').map((role) => (
                          <option key={role} value={role}>{roleLabel(role)}</option>
                        ))}
                      </select>
                      <button type="submit" className="min-h-11 rounded-xl border px-4 text-sm font-bold hover:bg-muted">Guardar rol</button>
                    </form>
                    <form action={revokeMember}>
                      <input type="hidden" name="membershipId" value={member.membershipId} />
                      <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 text-sm font-bold text-destructive hover:bg-destructive/5">
                        <Trash2 className="h-4 w-4" /> Revocar
                      </button>
                    </form>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{member.userId === access.userId ? 'Tu acceso actual' : 'Solo lectura'}</p>
                )}
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  )
}

async function getActionContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/team')
  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')
  return { admin, access }
}

function roleLabel(role: WorkspaceRole) {
  if (role === 'owner') return 'Propietario'
  if (role === 'admin') return 'Administrador'
  if (role === 'compliance') return 'Cumplimiento'
  if (role === 'reviewer') return 'Revisor'
  if (role === 'viewer') return 'Observador'
  return 'Miembro'
}
