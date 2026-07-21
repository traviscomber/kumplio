import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/workspace-nav'

export const dynamic = 'force-dynamic'

export default async function ControlsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const organizationId = membership?.organization_id
  const result = organizationId
    ? await supabase
        .from('controls')
        .select('id, name, description, control_type, frequency, status, next_evaluation_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [], error: null }

  const migrationPending = result.error?.code === '42P01' || result.error?.message?.includes('controls')

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <p className="text-sm font-medium text-primary">Ejecución del cumplimiento</p>
        <h1 className="mt-1 text-3xl font-bold">Controles</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Convierte cada obligación aplicable en una actividad verificable, con responsable, frecuencia y resultado.
        </p>

        <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
          {migrationPending ? (
            <SetupNotice />
          ) : !result.data?.length ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-border">
              {result.data.map((control) => (
                <article key={control.id} className="p-5">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2.5 py-1">{control.control_type}</span>
                    <span className="rounded-full bg-muted px-2.5 py-1">{control.status}</span>
                    {control.frequency && <span className="rounded-full bg-muted px-2.5 py-1">{control.frequency}</span>}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold">{control.name}</h2>
                  {control.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{control.description}</p>}
                  <p className="mt-3 text-sm text-muted-foreground">
                    Próxima evaluación: {control.next_evaluation_at ? new Date(control.next_evaluation_at).toLocaleDateString('es-CL') : 'sin programar'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}

function EmptyState() {
  return <div className="p-12 text-center"><p className="font-semibold">Aún no hay controles.</p><p className="mt-2 text-sm text-muted-foreground">Valida una obligación y crea el control que demostrará su cumplimiento.</p></div>
}

function SetupNotice() {
  return <div className="p-12 text-center"><p className="font-semibold">El módulo está listo para activarse.</p><p className="mt-2 text-sm text-muted-foreground">Aplica las migraciones 04 y 05 en Supabase para habilitar controles y sus políticas de acceso.</p></div>
}
