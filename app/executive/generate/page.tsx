import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BarChart3, Gauge, ShieldAlert } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateExecutiveSnapshotAction } from '@/app/actions/experience'

export const dynamic = 'force-dynamic'

export default async function ExecutiveGeneratePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/executive/generate')

  const admin = createAdminClient()
  const { data: membership } = await admin.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')

  const organizationId = membership.organization_id
  const [controls, evidence, risks, impacts, actions] = await Promise.all([
    admin.from('controls').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    admin.from('evidence').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    admin.from('dynamic_risk_scores').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    admin.from('regulatory_impact_targets').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    admin.from('compliance_action_plans').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
  ])

  const signals = [
    ['Controles', controls.count || 0], ['Evidencias', evidence.count || 0], ['Riesgos calculados', risks.count || 0],
    ['Impactos', impacts.count || 0], ['Planes de acción', actions.count || 0],
  ] as const
  const totalSignals = signals.reduce((sum, [, value]) => sum + value, 0)

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
        <header className="rounded-3xl border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-primary"><Gauge className="h-5 w-5" /><p className="text-sm font-bold">Generador ejecutivo</p></div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Preparar el primer snapshot revisable</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">Kumplio consolidará únicamente métricas observadas. Los valores faltantes quedarán vacíos y el resultado nacerá como revisión requerida.</p>
          <Link href="/executive" className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline">Volver al Command Center</Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {signals.map(([label, value]) => <article key={label} className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-extrabold">{value}</p></article>)}
        </section>

        <section className="rounded-3xl border bg-card p-8 text-center">
          {totalSignals > 0 ? <BarChart3 className="mx-auto h-10 w-10 text-primary" /> : <ShieldAlert className="mx-auto h-10 w-10 text-amber-600" />}
          <h2 className="mt-4 text-xl font-bold">{totalSignals > 0 ? 'Las señales están listas para consolidarse' : 'La señal todavía es limitada'}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">El snapshot no se publicará. Quedará en estado <strong>review_required</strong> para revisión ejecutiva y humana.</p>
          <form action={generateExecutiveSnapshotAction}><button className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Generar snapshot para revisión</button></form>
        </section>
      </main>
    </>
  )
}
