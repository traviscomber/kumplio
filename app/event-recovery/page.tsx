import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { listFailedEvents, retryAllFailedEvents, retryFailedEvent } from '@/lib/compliance/autonomy/recovery'

export const dynamic = 'force-dynamic'

export default async function EventRecoveryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/event-recovery')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  async function retryOne(formData: FormData) {
    'use server'
    const serverSupabase = await createClient()
    const { data: { user: currentUser } } = await serverSupabase.auth.getUser()
    if (!currentUser) redirect('/sign-in?next=/event-recovery')
    const serverAdmin = createAdminClient()
    const currentAccess = await getWorkspaceAccess(serverAdmin, currentUser.id)
    if (!currentAccess || !currentAccess.canAssignWork) throw new Error('Tu rol no permite reintentar eventos.')
    await retryFailedEvent(serverAdmin, currentAccess.organizationId, String(formData.get('eventId') || ''))
    revalidatePath('/event-recovery')
  }

  async function retryAll() {
    'use server'
    const serverSupabase = await createClient()
    const { data: { user: currentUser } } = await serverSupabase.auth.getUser()
    if (!currentUser) redirect('/sign-in?next=/event-recovery')
    const serverAdmin = createAdminClient()
    const currentAccess = await getWorkspaceAccess(serverAdmin, currentUser.id)
    if (!currentAccess || !currentAccess.canAssignWork) throw new Error('Tu rol no permite reintentar eventos.')
    await retryAllFailedEvents(serverAdmin, currentAccess.organizationId)
    revalidatePath('/event-recovery')
  }

  const events = await listFailedEvents(admin, access.organizationId)

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Recuperación de eventos</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {events.length === 0 ? 'No hay eventos fallidos.' : `${events.length} eventos requieren reintento.`}
              </h1>
              <p className="mt-4 max-w-3xl text-muted-foreground">
                Reprocesa eventos fallidos sin perder su historial ni duplicar situaciones existentes.
              </p>
            </div>
            {events.length > 0 && (
              <form action={retryAll}>
                <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
                  <RefreshCw className="h-4 w-4" /> Reintentar todos
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="mt-8 space-y-4">
          {events.map((event) => (
            <article key={event.id} className="rounded-2xl border bg-card p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{event.sourceType}</p>
                    <h2 className="mt-1 text-xl font-bold">{event.eventType}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{event.errorMessage || 'Error sin detalle disponible.'}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Ocurrió {new Date(event.occurredAt).toLocaleString('es-CL')}</p>
                  </div>
                </div>
                <form action={retryOne}>
                  <input type="hidden" name="eventId" value={event.id} />
                  <button className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold">
                    <RefreshCw className="h-4 w-4" /> Reintentar
                  </button>
                </form>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  )
}
