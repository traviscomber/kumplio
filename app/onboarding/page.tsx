import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { WorkspaceOnboardingForm } from '@/components/onboarding/workspace-onboarding-form'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Configura tu workspace',
  description: 'Crea tu organización, primer ámbito y expediente de cumplimiento en KUMPLIO.',
  robots: { index: false, follow: false },
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) redirect('/sign-in')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (membership?.organization_id) redirect('/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, company_name')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Primer workspace</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Convierte tu cuenta en un sistema operativo de cumplimiento.</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Configura la empresa, selecciona la industria y crea el primer expediente. Kumplio dejará preparada la trazabilidad para fuentes, obligaciones, controles, evidencia, agentes y revisiones.
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/5 md:p-10">
          <WorkspaceOnboardingForm
            initialEmail={user.email || ''}
            initialOrganizationName={profile?.company_name || (user.user_metadata?.company_name as string | undefined) || null}
            initialFirstName={profile?.first_name}
            initialLastName={profile?.last_name}
          />
        </section>
      </div>
    </main>
  )
}
