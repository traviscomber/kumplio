import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function PersonasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/app/personas')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')
  const organizationId = String(membership.organization_id)

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('id,user_id,role,joined_at')
    .eq('organization_id', organizationId)
    .order('joined_at', { ascending: true })

  const userIds = [...new Set((memberships || []).map((item) => String(item.user_id)).filter(Boolean))]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id,first_name,last_name,email').in('id', userIds)
    : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null; email: string | null }> }
  const profileById = new Map((profiles || []).map((profile) => [String(profile.id), profile]))

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <div className="flex items-center gap-3 text-primary"><Users className="h-5 w-5" aria-hidden="true" /><p className="text-sm font-semibold">Workspace</p></div>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Personas</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Quién participa en este workspace y con qué rol. Esta vista refleja las membresías existentes y no crea un directorio paralelo.</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        {(memberships || []).length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">Todavía no hay membresías visibles en este workspace.</div>
        ) : (
          <div className="divide-y divide-border">
            {(memberships || []).map((item) => {
              const profile = profileById.get(String(item.user_id))
              const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.email || 'Persona del equipo'
              return (
                <article key={String(item.id)} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-bold">{name}</p>{profile?.email && name !== profile.email ? <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p> : null}</div>
                  <div className="text-left sm:text-right"><p className="text-sm font-semibold capitalize">{String(item.role || 'member')}</p><p className="mt-1 text-xs text-muted-foreground">Miembro activo</p></div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
