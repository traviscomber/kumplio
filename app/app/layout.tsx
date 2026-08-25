import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppNavigation } from '@/components/app-navigation'
import { TopNav } from '@/components/layout/top-nav'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { resolveAuthenticatedAppAccess } from '@/lib/product/authenticated-app-access'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: 'Inicio', template: '%s | Kumplio' },
  robots: { index: false, follow: false },
}

export default async function AuthenticatedAppLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers()
  const nextPath = requestHeaders.get('x-kumplio-authenticated-path') || '/app'
  const supabase = await createClient()
  const admin = createAdminClient()
  const decision = await resolveAuthenticatedAppAccess({
    nextPath,
    getUser: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      return { userId: user?.id || null, failed: Boolean(error) }
    },
    getWorkspace: async (userId) => {
      const access = await getWorkspaceAccess(admin, userId)
      return access ? { organizationId: access.organizationId } : null
    },
  })

  if (decision.kind === 'redirect') redirect(decision.href)

  return (
    <div className="min-h-screen bg-background">
      <TopNav compact />
      <div className="pt-20">
        <AppNavigation />
        {children}
      </div>
    </div>
  )
}
