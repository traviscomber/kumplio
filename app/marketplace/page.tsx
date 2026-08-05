import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Box, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getMarketplace,
  installMarketplacePack,
} from '@/lib/compliance/operations/vendor-audit-marketplace'

export const dynamic = 'force-dynamic'

export default async function MarketplacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/marketplace')

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')

  async function installPack(formData: FormData) {
    'use server'

    const versionId = String(formData.get('versionId') || '')
    if (!versionId) throw new Error('No se recibió una versión válida del pack.')

    const serverSupabase = await createClient()
    const { data: { user: currentUser } } = await serverSupabase.auth.getUser()
    if (!currentUser) redirect('/sign-in?next=/marketplace')

    const serverAdmin = createAdminClient()
    const { data: currentMembership } = await serverAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', currentUser.id)
      .limit(1)
      .maybeSingle()
    if (!currentMembership?.organization_id) redirect('/onboarding')

    await installMarketplacePack(
      serverAdmin,
      currentMembership.organization_id,
      versionId,
      currentUser.id,
    )
    revalidatePath('/marketplace')
  }

  const items = await getMarketplace(admin, membership.organization_id)

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Marketplace regulatorio</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Activa capacidades sin reconstruir tu sistema.</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Cada pack declara versión, permisos, dependencias y recursos instalados. La instalación nunca reemplaza revisión humana.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 md:col-span-2 xl:col-span-3">
              <Box className="h-8 w-8 text-primary" />
              <h2 className="mt-4 text-xl font-bold">No hay packs publicados todavía.</h2>
            </div>
          ) : items.map((item) => (
            <article key={item.id} className="flex flex-col rounded-2xl border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                {item.installed && (
                  <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Instalado
                  </span>
                )}
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">{item.domain || item.item_type}</p>
              <h2 className="mt-2 text-xl font-bold">{item.name}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{item.summary}</p>
              <div className="mt-5 space-y-2 text-sm">
                <p><span className="font-semibold">Versión:</span> {item.current_version}</p>
                <p><span className="font-semibold">Publicador:</span> {item.publisher_name}</p>
                <p><span className="font-semibold">Modelo:</span> {item.pricing_model}</p>
              </div>
              {item.requiredPermissions.length > 0 && (
                <details className="mt-5 rounded-xl border p-4">
                  <summary className="cursor-pointer text-sm font-semibold">Permisos requeridos</summary>
                  <div className="mt-3 space-y-2">
                    {item.requiredPermissions.map((permission: string) => (
                      <p key={permission} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <LockKeyhole className="h-3.5 w-3.5" /> {permission}
                      </p>
                    ))}
                  </div>
                </details>
              )}
              <form action={installPack} className="mt-5">
                <input type="hidden" name="versionId" value={item.versionId || ''} />
                <button
                  type="submit"
                  disabled={item.installed || !item.versionId}
                  className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {item.installed ? 'Ya instalado' : item.versionId ? 'Instalar pack' : 'Versión no disponible'}
                </button>
              </form>
            </article>
          ))}
        </section>
      </main>
    </>
  )
}
