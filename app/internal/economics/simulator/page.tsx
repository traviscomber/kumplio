import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { PriceSimulator } from '../price-simulator'

export const dynamic = 'force-dynamic'

export default async function PricingSimulatorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const admin = createAdminClient()
  const { data: authorized } = await admin.rpc('is_kumplio_internal_user', { p_user_id: user.id, p_roles: null })
  if (!authorized) redirect('/dashboard')

  const { data: plans } = await admin
    .from('internal_plan_unit_economics')
    .select('*')
    .order('monthly_revenue_clp', { ascending: false })

  const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link href="/internal/economics" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Volver a Unit Economics</Link>
        <header>
          <p className="text-sm font-bold text-primary">Operación interna</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Precios y margen por plan</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">Valida la estructura comercial en pesos chilenos incorporando IA, infraestructura, herramientas, soporte, implementación y comisiones.</p>
        </header>

        <PriceSimulator />

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-5"><h2 className="font-bold">Resultado real por plan</h2><p className="mt-1 text-sm text-muted-foreground">Usa únicamente costos e ingresos registrados. Los costos globales se distribuyen entre los planes activos.</p></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Clientes</th><th className="px-5 py-3">Ingreso</th><th className="px-5 py-3">IA</th><th className="px-5 py-3">Operación</th><th className="px-5 py-3">Costo total</th><th className="px-5 py-3">Margen</th></tr></thead>
              <tbody>
                {(plans || []).map((plan) => {
                  const margin = plan.gross_margin_percent == null ? null : Number(plan.gross_margin_percent)
                  return <tr key={plan.plan_key} className="border-t border-border"><td className="px-5 py-4 font-semibold">{plan.plan_key}</td><td className="px-5 py-4">{plan.organizations}</td><td className="px-5 py-4">{clp.format(Number(plan.monthly_revenue_clp || 0))}</td><td className="px-5 py-4">{clp.format(Number(plan.ai_cost_clp || 0))}</td><td className="px-5 py-4">{clp.format(Number(plan.direct_operating_cost_clp || 0) + Number(plan.allocated_global_cost_clp || 0))}</td><td className="px-5 py-4 font-semibold">{clp.format(Number(plan.total_cost_clp || 0))}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${margin == null ? 'bg-muted' : margin >= 80 ? 'bg-emerald-500/10 text-emerald-700' : margin >= 60 ? 'bg-amber-500/10 text-amber-700' : 'bg-red-500/10 text-red-700'}`}>{margin == null ? 'Sin cálculo' : `${margin.toFixed(2)}%`}</span></td></tr>
                })}
                {!plans?.length && <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">Todavía no hay términos comerciales y costos suficientes para comparar planes.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
