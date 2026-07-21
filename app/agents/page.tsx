import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AgentsWorkbench } from '@/components/agents-workbench'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Agentes especializados',
  description: 'Mesa de trabajo privada para ejecutar los agentes especializados de KUMPLIO.',
  robots: { index: false, follow: false },
}

export default async function AgentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/agents')

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">KUMPLIO Intelligence</p>
            <h1 className="mt-2 text-4xl font-bold">Mesa de agentes especializados</h1>
            <p className="mt-2 text-muted-foreground">GPT-5.6 con perfiles delimitados, evidencia explícita y revisión humana obligatoria.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link href="/agents/reviews">Revisiones</Link></Button>
            <Button variant="outline" asChild><Link href="/agents/workflows">Orquestación multiagente</Link></Button>
            <Button variant="outline" asChild><Link href="/dashboard">Volver al dashboard</Link></Button>
          </div>
        </header>
        <AgentsWorkbench />
      </div>
    </main>
  )
}
