import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/workspace-nav'

export const dynamic = 'force-dynamic'

export default async function FindingsPage() {
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
  const findingsResult = organizationId
    ? await supabase
        .from('findings')
        .select('id, title, description, severity, status, due_at, resolved_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [], error: null }

  const migrationPending = findingsResult.error?.code === '42P01' || findingsResult.error?.message?.includes('findings')

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <p className="text-sm font-medium text-primary">Brechas y desviaciones</p>
        <h1 className="mt-1 text-3xl font-bold">Hallazgos</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Registra incumplimientos, evidencia faltante y desviaciones detectadas durante evaluaciones o auditorías.
        </p>

        <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
          {migrationPending ? (
            <div className="p-12 text-center">
              <p className="font-semibold">El módulo está listo para activarse.</p>
              <p className="mt-2 text-sm text-muted-foreground">Aplica las migraciones 04 y 05 para habilitar hallazgos y acciones correctivas.</p>
            </div>
          ) : !findingsResult.data?.length ? (
            <div className="p-12 text-center">
              <p className="font-semibold">No hay hallazgos abiertos.</p>
              <p className="mt-2 text-sm text-muted-foreground">Los hallazgos aparecerán cuando un control falle o falte evidencia.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {findingsResult.data.map((finding) => (
                <article key={finding.id} className="p-5">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2.5 py-1">Severidad: {finding.severity}</span>
                    <span className="rounded-full bg-muted px-2.5 py-1">Estado: {finding.status}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold">{finding.title}</h2>
                  {finding.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{finding.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <span>Fecha límite: {finding.due_at ? new Date(finding.due_at).toLocaleDateString('es-CL') : 'sin definir'}</span>
                    {finding.resolved_at && <span>Resuelto: {new Date(finding.resolved_at).toLocaleDateString('es-CL')}</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
