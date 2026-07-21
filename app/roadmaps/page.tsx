import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function RoadmapsPage() {
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
  const { data: actions } = projectIds.length
    ? await supabase
        .from('roadmaps')
        .select('id, phase, action, owner, target_date, status, project_id')
        .in('project_id', projectIds)
        .order('target_date', { ascending: true })
        .limit(100)
    : { data: [] }

  const projectNames = new Map((projects || []).map((project) => [project.id, project.name]))

  return (
    <main className="container mx-auto px-6 py-8">
      <div>
        <p className="text-sm font-medium text-primary">Corrección y seguimiento</p>
        <h1 className="mt-1 text-3xl font-bold">Planes de acción</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Acciones generadas desde riesgos y obligaciones prioritarias, con responsable y fecha objetivo.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
        {!actions?.length ? (
          <div className="p-12 text-center">
            <p className="font-semibold">No hay acciones abiertas.</p>
            <p className="mt-2 text-sm text-muted-foreground">Las acciones aparecerán cuando se detecten brechas prioritarias.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {actions.map((item) => (
              <article key={item.id} className="p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2.5 py-1">{projectNames.get(item.project_id) || 'Ámbito'}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1">{item.phase || 'sin fase'}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1">{item.status || 'pendiente'}</span>
                </div>
                <h2 className="mt-3 font-semibold">{item.action}</h2>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span>Responsable: {item.owner || 'por asignar'}</span>
                  <span>
                    Fecha objetivo: {item.target_date ? new Date(item.target_date).toLocaleDateString('es-CL') : 'sin definir'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
