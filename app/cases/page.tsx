import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CasesWorkspace } from '@/components/cases-workspace'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tus casos',
  description: 'Situaciones en resolución, decisiones, acciones y evidencia en Kumplio.',
  robots: { index: false, follow: false },
}

export default async function CasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/cases')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const organizationId = membership?.organization_id
  const [{ data: organization }, { data: projects }, { data: cases, error: casesError }, { data: workflows }] = organizationId
    ? await Promise.all([
        supabase.from('organizations').select('id, name').eq('id', organizationId).maybeSingle(),
        supabase
          .from('projects')
          .select('id, name')
          .eq('organization_id', organizationId)
          .order('updated_at', { ascending: false })
          .limit(100),
        supabase
          .from('compliance_cases')
          .select('id, title, description, status, priority, project_id, created_at, updated_at')
          .eq('organization_id', organizationId)
          .neq('status', 'archived')
          .order('updated_at', { ascending: false })
          .limit(100),
        supabase
          .from('agent_workflows')
          .select('id, case_id, status, current_stage, total_stages, updated_at')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(300),
      ])
    : [{ data: null }, { data: [] }, { data: [], error: null }, { data: [] }]

  const migrationPending = casesError?.code === '42P01' || casesError?.message?.includes('compliance_cases')
  const latestWorkflowByCase = new Map<string, { id: string; status: string; current_stage: number; total_stages: number; updated_at: string }>()
  for (const workflow of workflows || []) {
    if (workflow.case_id && workflow.status !== 'cancelled' && !latestWorkflowByCase.has(workflow.case_id)) {
      latestWorkflowByCase.set(workflow.case_id, workflow)
    }
  }

  const casesWithWorkflow = (cases || []).map((item) => ({
    ...item,
    workflow: latestWorkflowByCase.get(item.id) || null,
  }))

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-4 py-8 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-bold text-primary">{organization?.name || 'Tu espacio de trabajo'}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Tus casos</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            Cada caso reúne lo que necesitas resolver, el trabajo de Kumplio, las decisiones humanas, el plan y la evidencia necesaria para cerrar.
          </p>
        </div>

        {!organizationId ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
            <p className="font-semibold">Tu cuenta todavía no está vinculada a un espacio de trabajo.</p>
            <p className="mt-2 text-sm text-muted-foreground">Completa el onboarding para iniciar tu primer caso.</p>
          </div>
        ) : migrationPending ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
            <p className="font-semibold">Tus casos están listos para activarse.</p>
            <p className="mt-2 text-sm text-muted-foreground">La plataforma todavía necesita completar su configuración de datos.</p>
          </div>
        ) : (
          <CasesWorkspace cases={casesWithWorkflow as any} projects={(projects || []) as any} />
        )}
      </main>
    </>
  )
}
