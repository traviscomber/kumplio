import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CasesWorkspace } from '@/components/cases-workspace'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tus casos',
  description: 'Situaciones en resolución, decisiones, acciones y evidencia en Kumplio.',
  robots: { index: false, follow: false },
}

export default function LegacyCasesPage() {
  redirect('/app/casos')
}

export async function CasesPageContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/cases')

  const access = await getWorkspaceAccess(createAdminClient(), user.id)
  const organizationId = access?.organizationId
  const [{ data: organization }, { data: projects }, { data: cases, error: casesError }, { data: workflows }] = organizationId
    ? await Promise.all([
        supabase.from('organizations').select('id, name').eq('id', organizationId).maybeSingle(),
        supabase.from('projects').select('id, name').eq('organization_id', organizationId).order('updated_at', { ascending: false }).limit(100),
        supabase.from('compliance_cases').select('id, title, description, status, priority, project_id, created_at, updated_at').eq('organization_id', organizationId).neq('status', 'archived').order('updated_at', { ascending: false }).limit(100),
        supabase.from('agent_workflows').select('id, case_id, status, current_stage, total_stages, updated_at').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(300),
      ])
    : [{ data: null }, { data: [] }, { data: [], error: null }, { data: [] }]

  const migrationPending = casesError?.code === '42P01' || casesError?.message?.includes('compliance_cases')
  const latestWorkflowByCase = new Map<string, { id: string; status: string; current_stage: number; total_stages: number; updated_at: string }>()
  for (const workflow of workflows || []) {
    if (workflow.case_id && workflow.status !== 'cancelled' && !latestWorkflowByCase.has(workflow.case_id)) latestWorkflowByCase.set(workflow.case_id, workflow)
  }

  const casesWithWorkflow = (cases || []).map((item) => ({ ...item, workflow: latestWorkflowByCase.get(item.id) || null }))

  return (
    <main className="container mx-auto px-5 py-12 sm:px-8 md:py-16">
      <div className="mb-14 border-b border-border pb-9 md:mb-20">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">{organization?.name || 'Tu espacio de trabajo'}</p>
        <h1 className="font-heading mt-4 text-4xl font-normal leading-[1.1] tracking-[-0.025em] sm:text-5xl">Tus casos</h1>
        <p className="mt-4 max-w-3xl leading-8 text-muted-foreground">Cada caso reúne lo que necesitas resolver, el trabajo de Kumplio, las decisiones humanas, el plan y la evidencia necesaria para cerrar.</p>
      </div>

      {!organizationId ? (
        <div className="border-y border-amber-500/30 bg-amber-500/10 px-0 py-10 text-center">
          <p className="font-medium">Tu cuenta todavía no está vinculada a un espacio de trabajo.</p>
          <p className="mt-2 text-sm text-muted-foreground">Completa el onboarding para iniciar tu primer caso.</p>
        </div>
      ) : migrationPending ? (
        <div className="border-y border-amber-500/30 bg-amber-500/10 px-0 py-10 text-center">
          <p className="font-medium">Tus casos están listos para activarse.</p>
          <p className="mt-2 text-sm text-muted-foreground">La plataforma todavía necesita completar su configuración de datos.</p>
        </div>
      ) : (
        <CasesWorkspace cases={casesWithWorkflow as any} projects={(projects || []) as any} />
      )}
    </main>
  )
}
