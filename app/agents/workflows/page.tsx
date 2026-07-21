import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AgentWorkflowConsole } from '@/components/agent-workflow-console'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Orquestación multiagente',
  description: 'Consola privada de workflows coordinados de KUMPLIO.',
  robots: { index: false, follow: false },
}

export default async function AgentWorkflowsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/agents/workflows')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const { data: cases } = membership?.organization_id
    ? await supabase
        .from('compliance_cases')
        .select('id, title, status, priority')
        .eq('organization_id', membership.organization_id)
        .in('status', ['draft', 'active', 'pending_review'])
        .order('updated_at', { ascending: false })
        .limit(100)
    : { data: [] }

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">KUMPLIO Intelligence</p>
            <h1 className="mt-2 text-4xl font-bold">Orquestación multiagente</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">Isidora, Rodrigo, Verónica, Javier y Catalina trabajan sobre un mismo caso mediante artefactos estructurados, dependencias y revisión humana.</p>
          </div>
          <Button variant="outline" asChild><Link href="/agents">Mesa de agentes</Link></Button>
        </header>
        <AgentWorkflowConsole cases={cases || []} />
      </div>
    </main>
  )
}
