import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AgentWorkflowConsole } from '@/components/agent-workflow-console'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Resolver siguiente paso',
  description: 'Completa lo que falta y deja evidencia verificable del resultado en Kumplio.',
  robots: { index: false, follow: false },
}

export default async function VerifiedClosurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/app/casos/${caseId}/cierre`)

  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')
  const organizationId = membership.organization_id

  const [{ data: complianceCase }, { data: workflow }] = await Promise.all([
    supabase.from('compliance_cases').select('id,title,status,priority').eq('id', caseId).eq('organization_id', organizationId).maybeSingle(),
    supabase.from('agent_workflows').select('id').eq('case_id', caseId).eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  if (!complianceCase) notFound()

  return (
    <main className="container mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <Link href={`/app/casos/${caseId}`} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver al resultado
      </Link>
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Tu siguiente paso</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{complianceCase.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Resuelve sólo lo que necesita tu intervención. Kumplio conserva el contexto, organiza la evidencia y continúa el cierre sin pedirte que navegues sus procesos internos.
        </p>
      </header>
      <section className="mb-6 rounded-[4px] border bg-card p-5">
        <p className="text-sm font-semibold">Cómo funciona</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Completa la acción que aparece a continuación. Kumplio no marcará el resultado como cerrado hasta que exista evidencia aceptada, integridad verificada y la revisión humana requerida.
        </p>
      </section>
      <AgentWorkflowConsole cases={[complianceCase]} initialWorkflowId={workflow?.id || ''} />
    </main>
  )
}
