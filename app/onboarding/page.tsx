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
    <main className="min-h-screen bg-background px-5 py-16 text-foreground sm:px-8 md:py-24">
      <div className="mx-auto max-w-5xl">
        <header className="mb-14 max-w-3xl md:mb-20">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Primeros minutos</p>
          <h1 className="font-heading mt-4 text-4xl font-normal leading-[1.08] tracking-[-0.025em] md:text-6xl">Persona, profesional o empresa: empecemos por lo que necesitas resolver.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-[17px]">
            Responde una pregunta a la vez. Kumplio preparará internamente el primer ámbito, el expediente inicial y la trazabilidad necesaria.
          </p>
        </header>

        {selectedPlan && (
          <div className="mb-10 flex max-w-3xl items-start gap-4 border-y border-[rgba(194,168,135,0.14)] bg-primary/5 px-0 py-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Interés comercial conservado</p>
              <p className="mt-1 font-medium">Plan {selectedPlan.name} · {selectedPlan.price}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Esta configuración no inicia un cobro.</p>
            </div>
          </div>
        )}

        <section className="border-y border-[rgba(194,168,135,0.14)] bg-card/45 px-0 py-10 md:py-14">
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
