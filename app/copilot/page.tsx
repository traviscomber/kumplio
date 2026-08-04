import { redirect } from 'next/navigation'
import { Bot, ShieldCheck } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { CopilotClient } from './copilot-client'

export const dynamic = 'force-dynamic'

export default async function CopilotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/copilot')

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Bot className="h-5 w-5" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Compliance Copilot</p>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Pregunta. Comprende. Actúa.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              El Copilot consulta el grafo, impactos, planes y evidencia para entregar respuestas explicables y acciones seguras.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" /> Sin mutaciones automáticas
          </div>
        </header>
        <CopilotClient />
      </main>
    </>
  )
}
