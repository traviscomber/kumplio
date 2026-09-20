import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { AgentWorkflowConsole } from '@/components/agent-workflow-console'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Cierre verificable',
  description: 'Ejecuta, demuestra y revisa el cierre de un outcome aprobado en Kumplio.',
  robots: { index: false, follow: false },
}

export default async function VerifiedClosurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/app/casos/${caseId}/cierre`)

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')
  const organizationId = membership.organization_id

  const [{ data: complianceCase }, { data: workflow }] = await Promise.all([
    supabase
      .from('compliance_cases')
      .select('id,title,status,priority')
      .eq('id', caseId)
      .eq('organization_id', organizationId)
      .maybeSingle(),
    supabase
      .from('agent_workflows')
      .select('id')
      .eq('case_id', caseId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!complianceCase) notFound()

  return (
    <main className="container mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Cierre verificable</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{complianceCase.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Kumplio mantiene un solo resultado del caso y te guía hasta demostrar el cierre. Una acción no queda verificada sin evidencia aceptada, integridad verificada y revisión humana.
        </p>
      </header>
      <AgentWorkflowConsole cases={[complianceCase]} initialWorkflowId={workflow?.id || ''} />
    </main>
  )
}
