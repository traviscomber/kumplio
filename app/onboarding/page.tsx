import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { WorkspaceOnboardingForm } from '@/components/onboarding/workspace-onboarding-form'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Conoce tu organización | Kumplio',
  description: 'Configuración guiada para preparar el primer diagnóstico de cumplimiento.',
  robots: { index: false, follow: false },
}

const planDetails: Record<string, { name: string; price: string }> = {
  esencial: { name: 'Esencial', price: '$79.990 al mes + IVA' },
  profesional: { name: 'Profesional', price: '$249.990 al mes + IVA' },
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/sign-in?next=/onboarding')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (membership?.organization_id) redirect('/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name,last_name,company_name')
    .eq('id', user.id)
    .maybeSingle()

  const selectedPlanId = typeof user.user_metadata?.selected_plan === 'string' ? user.user_metadata.selected_plan : ''
  const selectedPlan = planDetails[selectedPlanId]

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground md:py-16">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Primeros minutos</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Quiero entender tu organización antes de pedirte trabajo.</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Responde una pregunta a la vez. Kumplio preparará internamente el primer ámbito, el expediente inicial y la trazabilidad necesaria.
          </p>
        </header>

        {selectedPlan && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Interés comercial conservado</p>
              <p className="mt-1 font-bold">Plan {selectedPlan.name} · {selectedPlan.price}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Esta configuración no inicia un cobro.</p>
            </div>
          </div>
        )}

        <section className="rounded-3xl border bg-card p-6 shadow-xl shadow-black/5 md:p-10">
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
