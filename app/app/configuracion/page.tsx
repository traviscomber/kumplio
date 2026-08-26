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
    <main className="container mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14">
      <header className="mb-10 max-w-3xl border-b border-[rgba(194,168,135,0.14)] pb-8">
        <div className="flex items-center gap-3 text-primary"><Settings className="h-5 w-5" aria-hidden="true" /><p className="text-xs font-medium uppercase tracking-[0.18em]">Workspace y cuenta</p></div>
        <h1 className="mt-4 font-heading text-3xl font-normal tracking-[-0.025em] sm:text-4xl">Configuración</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Identidad básica del workspace y de tu cuenta. Solo mostramos capacidades que ya forman parte del producto.</p>
      </header>

      <div className="grid gap-px overflow-hidden rounded-[4px] border border-[rgba(194,168,135,0.14)] bg-[rgba(194,168,135,0.12)] md:grid-cols-2">
        <section className="bg-background p-6 sm:p-7">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Workspace actual</p>
          <h2 className="mt-4 font-heading text-xl font-normal">{organization?.name || 'Organización'}</h2>
          <dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between gap-4 border-t border-[rgba(194,168,135,0.1)] pt-4"><dt className="text-muted-foreground">Rol</dt><dd className="font-medium capitalize">{String(membership.role || 'member')}</dd></div><div className="flex justify-between gap-4 border-t border-[rgba(194,168,135,0.1)] pt-4"><dt className="text-muted-foreground">Identificador</dt><dd className="max-w-[16rem] truncate font-mono text-xs">{organizationId}</dd></div></dl>
        </section>

        <section className="bg-background p-6 sm:p-7">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Tu cuenta</p>
          <h2 className="mt-4 font-heading text-xl font-normal">{displayName}</h2>
          <dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between gap-4 border-t border-[rgba(194,168,135,0.1)] pt-4"><dt className="text-muted-foreground">Correo</dt><dd className="truncate font-medium">{profile?.email || user.email || 'No disponible'}</dd></div><div className="flex justify-between gap-4 border-t border-[rgba(194,168,135,0.1)] pt-4"><dt className="text-muted-foreground">Estado</dt><dd className="font-medium text-primary">Autenticada</dd></div></dl>
        </section>
      </div>

      <section className="mt-6 rounded-[4px] border border-[rgba(194,168,135,0.14)] bg-card/35 p-6 sm:p-7">
        <h2 className="font-heading text-lg font-normal">Administración avanzada</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Los cambios sensibles de acceso, seguridad y contratación permanecen en sus flujos canónicos. Esta pantalla no duplica controles que todavía no forman parte de la experiencia autenticada validada.</p>
      </section>
    </main>
  )
}
