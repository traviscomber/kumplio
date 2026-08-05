import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { WorkspaceNav } from '@/components/workspace-nav'
import { BetaCaseEntry } from '@/components/cases/beta-case-entry'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Nuevo caso | Kumplio',
  description: 'Describe lo que necesitas resolver y entra directamente a un caso guiado con plan y respaldo.',
  robots: { index: false, follow: false },
}

export default async function NewCasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/cases/new')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <BetaCaseEntry />
      </main>
    </>
  )
}
