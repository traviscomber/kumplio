import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function RisksPage() {
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
  const { data: risks } = projectIds.length
    ? await supabase
        .from('risks')
        .select('id, risk_name, risk_description, impact, likelihood, priority, status, mitigation, project_id')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [] }

  const projectNames = new Map((projects || []).map((project) => [project.id, project.name]))

  return (
    <main className="container mx-auto px-6 py-8">
      <div>
        <p className="text-sm font-medium text-primary">Exposición y priorización</p>
        <h1 className="mt-1 text-3xl font-bold">Registro de riesgos</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Riesgos derivados de obligaciones críticas. Las estimaciones requieren validación humana y contexto operacional.
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        {!risks?.length ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="font-semibold">No hay riesgos registrados.</p>
            <p className="mt-2 text-sm text-muted-foreground">Los riesgos aparecerán al procesar obligaciones prioritarias.</p>
          </div>
        ) : (
          risks.map((risk) => (
            <article key={risk.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2.5 py-1">{projectNames.get(risk.project_id) || 'Ámbito'}</span>
                <span className="rounded-full bg-muted px-2.5 py-1">Prioridad: {risk.priority || 'sin definir'}</span>
                <span className="rounded-full bg-muted px-2.5 py-1">Estado: {risk.status || 'abierto'}</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold">{risk.risk_name}</h2>
              {risk.risk_description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{risk.risk_description}</p>}
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div><span className="text-muted-foreground">Impacto:</span> {risk.impact || 'pendiente'}</div>
                <div><span className="text-muted-foreground">Probabilidad:</span> {risk.likelihood || 'pendiente'}</div>
                <div><span className="text-muted-foreground">Mitigación:</span> {risk.mitigation || 'sin acción definida'}</div>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  )
}
