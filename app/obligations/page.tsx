import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ObligationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const { data: projects } = membership?.organization_id
    ? await supabase.from('projects').select('id, name').eq('organization_id', membership.organization_id)
    : { data: [] }

  const projectIds = (projects || []).map((project) => project.id)
  const { data: obligations } = projectIds.length
    ? await supabase
        .from('obligations')
        .select('id, obligation_text, type, severity, priority, status, responsible_party, project_id')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [] }

  const projectNames = new Map((projects || []).map((project) => [project.id, project.name]))

  return (
    <main className="container mx-auto px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Mapa regulatorio</p>
          <h1 className="mt-1 text-3xl font-bold">Obligaciones</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Revisa las obligaciones extraídas y valida su aplicabilidad antes de convertirlas en controles.
          </p>
        </div>
        <Link href="/documents" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Analizar documento
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
        {!obligations?.length ? (
          <div className="p-12 text-center">
            <p className="font-semibold">No hay obligaciones registradas.</p>
            <p className="mt-2 text-sm text-muted-foreground">Carga una ley, contrato o política para comenzar.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {obligations.map((obligation) => (
              <article key={obligation.id} className="p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2.5 py-1">{projectNames.get(obligation.project_id) || 'Ámbito'}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1">{obligation.severity || obligation.priority || 'sin clasificar'}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1">{obligation.status || 'pendiente'}</span>
                </div>
                <p className="mt-3 font-medium leading-7">{obligation.obligation_text}</p>
                {obligation.responsible_party && (
                  <p className="mt-2 text-sm text-muted-foreground">Responsable sugerido: {obligation.responsible_party}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
