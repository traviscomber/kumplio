import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AgentReviewInbox } from '@/components/agent-review-inbox'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Bandeja de revisión',
  description: 'Revisión humana consolidada de ejecuciones y etapas de agentes KUMPLIO.',
  robots: { index: false, follow: false },
}

export default async function AgentReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/agents/reviews')

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">KUMPLIO Intelligence</p>
            <h1 className="mt-2 text-4xl font-bold">Bandeja de revisión humana</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">Centraliza resultados pendientes, comentarios, aprobaciones y rechazos antes de avanzar decisiones o workflows.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link href="/agents/workflows">Workflows</Link></Button>
            <Button variant="outline" asChild><Link href="/agents">Mesa de agentes</Link></Button>
          </div>
        </header>
        <AgentReviewInbox />
      </div>
    </main>
  )
}
