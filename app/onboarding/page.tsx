import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { WorkspaceOnboardingForm } from '@/components/onboarding/workspace-onboarding-form'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Configura tu workspace',
  description: 'Crea tu organización, primer ámbito y expediente de cumplimiento en Kumplio.',
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
    .select('first_name, last_name, company_name')
    .eq('id', user.id)
    .maybeSingle()

  const selectedPlanId = typeof user.user_metadata?.selected_plan === 'string'
    ? user.user_metadata.selected_plan
    : ''
  const selectedPlan = planDetails[selectedPlanId]

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Primer workspace</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Prepara el primer objetivo de tu organización.</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Configura la empresa, selecciona el contexto inicial y crea el primer caso de trabajo. Kumplio organizará internamente la trazabilidad necesaria para fuentes, controles, evidencia y revisiones.
          </p>
        </div>

        {selectedPlan && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Interés comercial conservado</p>
              <p className="mt-1 font-bold">Plan {selectedPlan.name} · {selectedPlan.price}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Configurar el workspace no inicia un cobro. La activación comercial y la facturación se confirman por separado.</p>
            </div>
          </div>
        )}

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
