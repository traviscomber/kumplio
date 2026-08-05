import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { WorkspaceNav } from '@/components/workspace-nav'
import { CaseResolutionStudio } from '@/components/cases/case-resolution-studio'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Nuevo caso | Kumplio',
  description: 'Describe el resultado que necesitas y prepara un caso guiado con especialistas, prioridades y respaldo.',
  robots: { index: false, follow: false },
}

export default async function NewCasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/cases/new')

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <CaseResolutionStudio />
      </main>
    </>
  )
}
