import { redirect } from 'next/navigation'
import { CheckCircle2, Circle, Network, PlayCircle } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { startGuidedOnboardingAction } from '@/app/actions/experience'

export const dynamic = 'force-dynamic'

type Session = { id: string; status: string; current_stage: string; progress_pct: number; mode: string }
type Step = { id: string; step_key: string; title: string; sequence: number; status: string; required: boolean }

export default async function TwinOnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/onboarding/twin')

  const admin = createAdminClient()
  const { data: membership } = await admin.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')

  const { data: sessionData } = await admin.from('onboarding_sessions')
    .select('id,status,current_stage,progress_pct,mode')
    .eq('organization_id', membership.organization_id)
    .in('status', ['draft','in_progress','review_required'])
    .order('created_at', { ascending: false }).limit(1).maybeSingle()

  const session = sessionData as Session | null
  let steps: Step[] = []
  if (session) {
    const { data } = await admin.from('onboarding_steps').select('id,step_key,title,sequence,status,required')
      .eq('onboarding_session_id', session.id).order('sequence')
    steps = (data || []) as Step[]
  }

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
        <header className="rounded-3xl border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-primary"><Network className="h-5 w-5" /><p className="text-sm font-bold">Onboarding del Gemelo Digital</p></div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Construye la realidad operacional de tu empresa</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">Avanza por empresa, procesos, activos, datos, proveedores, controles y políticas. Cada dato queda pendiente de revisión antes de convertirse en verdad empresarial.</p>
        </header>

        {!session ? (
          <section className="rounded-3xl border border-dashed bg-card p-10 text-center">
            <PlayCircle className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-xl font-bold">Inicia una sesión guiada</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">La sesión es reanudable e idempotente. No crea procesos, activos o proveedores por sí sola.</p>
            <form action={startGuidedOnboardingAction}><button className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Comenzar onboarding</button></form>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">Progreso general</p><p className="mt-1 text-2xl font-extrabold">{Math.round(Number(session.progress_pct))}%</p></div><span className="rounded-full border px-3 py-1 text-xs font-semibold">{session.status}</span></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Number(session.progress_pct)}%` }} /></div>
            </section>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {steps.map((step) => {
                const complete = step.status === 'completed'
                return <article key={step.id} className="rounded-2xl border bg-card p-5"><div className="flex items-start gap-3">{complete ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}<div><p className="text-xs font-bold text-primary">Paso {step.sequence}</p><h2 className="mt-1 font-bold">{step.title}</h2><p className="mt-2 text-xs text-muted-foreground">{step.required ? 'Requerido' : 'Opcional'} · {step.status}</p></div></div></article>
              })}
            </section>
          </>
        )}
      </main>
    </>
  )
}
