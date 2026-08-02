import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ControlsWorkspace, type ControlListItem } from '@/components/controls/controls-workspace'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Controles',
  description: 'Catálogo operacional y evaluable de controles KUMPLIO.',
  robots: { index: false, follow: false },
}

export default async function ControlsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/controls')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')
  const organizationId = membership.organization_id

  const [projectsResult, obligationsResult, membersResult, controlsResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(100),
    supabase
      .from('obligations')
      .select('id, project_id, obligation_text')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: true }),
    supabase
      .from('controls')
      .select('id, project_id, name, description, control_objective, control_nature, execution_mode, frequency, lifecycle_status, design_effectiveness, operating_effectiveness, owner_id, next_evaluation_at, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const migrationPending = controlsResult.error?.code === '42P01' || controlsResult.error?.message?.includes('controls')
  const projects = projectsResult.data || []
  const projectIds = new Set(projects.map((project) => project.id))
  const projectNames = new Map(projects.map((project) => [project.id, project.name]))
  const memberIds = (membersResult.data || []).map((member) => member.user_id)

  const { data: profileRows } = memberIds.length
    ? await supabase.from('profiles').select('id, first_name, last_name, email').in('id', memberIds)
    : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null; email: string }> }

  const profileMap = new Map((profileRows || []).map((profile) => {
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || profile.email
    return [profile.id, name]
  }))

  const members = memberIds.map((id) => ({
    id,
    name: profileMap.get(id) || (id === user.id ? user.email || 'Mi cuenta' : `Miembro ${id.slice(0, 8)}`),
  }))

  const obligations = (obligationsResult.data || [])
    .filter((obligation) => projectIds.has(obligation.project_id))
    .map((obligation) => ({
      id: obligation.id,
      projectId: obligation.project_id,
      title: obligation.obligation_text.length > 150 ? `${obligation.obligation_text.slice(0, 149)}…` : obligation.obligation_text,
    }))

  const controls: ControlListItem[] = (controlsResult.data || []).map((control) => ({
    id: control.id,
    projectId: control.project_id,
    projectName: projectNames.get(control.project_id) || 'Ámbito sin nombre',
    name: control.name,
    description: control.description,
    objective: control.control_objective,
    nature: control.control_nature,
    mode: control.execution_mode,
    frequency: control.frequency,
    lifecycleStatus: control.lifecycle_status,
    designEffectiveness: control.design_effectiveness,
    operatingEffectiveness: control.operating_effectiveness,
    ownerName: control.owner_id ? profileMap.get(control.owner_id) || `Miembro ${control.owner_id.slice(0, 8)}` : null,
    nextEvaluationAt: control.next_evaluation_at,
  }))

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <p className="text-sm font-medium text-primary">Ejecución del cumplimiento</p>
        <h1 className="mt-1 text-3xl font-bold">Controles</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Convierte obligaciones en actividades verificables, asigna responsables y separa la evaluación de diseño de la efectividad operacional.
        </p>

        <div className="mt-8">
          {migrationPending ? <SetupNotice /> : !projects.length ? <NoProjectNotice /> : (
            <ControlsWorkspace projects={projects} obligations={obligations} members={members} controls={controls} />
          )}
        </div>
      </main>
    </>
  )
}

function SetupNotice() {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-10 text-center">
      <p className="font-semibold">El módulo está listo para activarse.</p>
      <p className="mt-2 text-sm text-muted-foreground">Aplica las migraciones de Controls & Evidence Foundation en Supabase.</p>
    </div>
  )
}

function NoProjectNotice() {
  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center">
      <p className="font-semibold">Crea un ámbito antes de registrar controles.</p>
      <p className="mt-2 text-sm text-muted-foreground">El onboarding crea automáticamente el primer proyecto de cumplimiento.</p>
    </div>
  )
}
