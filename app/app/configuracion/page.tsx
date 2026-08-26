import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/app/configuracion')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id,role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')
  const organizationId = String(membership.organization_id)

  const [{ data: organization }, { data: profile }] = await Promise.all([
    supabase.from('organizations').select('id,name').eq('id', organizationId).maybeSingle(),
    supabase.from('profiles').select('first_name,last_name,email').eq('id', user.id).maybeSingle(),
  ])
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.email || user.email || 'Cuenta de Kumplio'

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <div className="flex items-center gap-3 text-primary"><Settings className="h-5 w-5" aria-hidden="true" /><p className="text-sm font-semibold">Workspace y cuenta</p></div>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Configuración</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Identidad básica del workspace y de tu cuenta. Solo mostramos capacidades que ya forman parte del producto.</p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Workspace actual</p>
          <h2 className="mt-3 text-xl font-black">{organization?.name || 'Organización'}</h2>
          <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Rol</dt><dd className="font-semibold capitalize">{String(membership.role || 'member')}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Identificador</dt><dd className="max-w-[16rem] truncate font-mono text-xs">{organizationId}</dd></div></dl>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Tu cuenta</p>
          <h2 className="mt-3 text-xl font-black">{displayName}</h2>
          <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Correo</dt><dd className="truncate font-semibold">{profile?.email || user.email || 'No disponible'}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Estado</dt><dd className="font-semibold">Autenticada</dd></div></dl>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-muted/30 p-6">
        <h2 className="font-black">Administración avanzada</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Los cambios sensibles de acceso, seguridad y contratación permanecen en sus flujos canónicos. Esta pantalla no duplica controles que todavía no forman parte de la experiencia autenticada validada.</p>
      </section>
    </main>
  )
}
