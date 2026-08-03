import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { PriceSimulator } from '../price-simulator'
import { recordOperatingCostAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function PricingSimulatorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const admin = createAdminClient()
  const { data: authorized } = await admin.rpc('is_kumplio_internal_user', { p_user_id: user.id, p_roles: null })
  if (!authorized) redirect('/dashboard')

  const [plansResult, organizationsResult, playbooksResult, costsResult] = await Promise.all([
    admin.from('internal_plan_unit_economics').select('*').order('monthly_revenue_clp', { ascending: false }),
    admin.from('organizations').select('id,name').order('name'),
    admin.from('mission_playbooks').select('id,name,version').order('name'),
    admin.from('operating_cost_entries').select('id,cost_category,allocation_scope,amount_clp,billing_period,description,occurred_on').order('created_at', { ascending: false }).limit(12),
  ])

  const plans = plansResult.data || []
  const organizations = organizationsResult.data || []
  const playbooks = playbooksResult.data || []
  const costs = costsResult.data || []
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

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <form action={recordOperatingCostAction} className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold">Registrar costo real</h2>
            <p className="mt-1 text-sm text-muted-foreground">Todos los montos son netos, sin IVA. La fuente o respaldo permite auditar el costo.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Select name="costCategory" label="Categoría" options={[
                ['infrastructure','Infraestructura'],['software','Software y herramientas'],['human_support','Soporte humano'],['implementation','Implementación'],['payment_fee','Medios de pago'],['sales_commission','Comisión comercial'],['other','Otro'],
              ]} />
              <Select name="allocationScope" label="Asignación" options={[["global","Toda Kumplio"],["organization","Organización"],["playbook","Playbook"]]} />
              <label className="block text-sm"><span className="font-semibold">Organización</span><select name="organizationId" className="mt-1 w-full rounded-lg border border-border bg-background p-3"><option value="">No aplica</option>{organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
              <label className="block text-sm"><span className="font-semibold">Playbook</span><select name="playbookId" className="mt-1 w-full rounded-lg border border-border bg-background p-3"><option value="">No aplica</option>{playbooks.map((playbook) => <option key={playbook.id} value={playbook.id}>{playbook.name} v{playbook.version}</option>)}</select></label>
              <Field name="amountClp" label="Monto CLP, sin IVA" type="number" min="0" step="1" required />
              <Select name="billingPeriod" label="Periodicidad" options={[["monthly","Mensual"],["quarterly","Trimestral"],["annual","Anual"],["one_time","Una vez"]]} />
              <Field name="occurredOn" label="Vigente desde" type="date" required />
              <Field name="sourceReference" label="Fuente o respaldo" placeholder="Factura, contrato o URL" />
              <div className="sm:col-span-2"><Field name="description" label="Descripción" placeholder="Ej. Vercel Pro, soporte mensual, comisión de cierre" required /></div>
            </div>
            <button className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Guardar costo</button>
          </form>

          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border p-5"><h2 className="font-bold">Costos registrados recientemente</h2><p className="mt-1 text-sm text-muted-foreground">Solo información real ingresada por el equipo interno.</p></div>
            <div className="divide-y divide-border">
              {costs.map((cost) => <div key={cost.id} className="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center"><div><p className="font-semibold">{cost.description}</p><p className="text-xs text-muted-foreground">{cost.cost_category} · {cost.allocation_scope} · {cost.billing_period} · {cost.occurred_on}</p></div><p className="font-extrabold">{clp.format(Number(cost.amount_clp))}</p></div>)}
              {!costs.length && <p className="p-8 text-center text-sm text-muted-foreground">Todavía no hay costos operativos registrados.</p>}
            </div>
          </section>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-5"><h2 className="font-bold">Resultado real por plan</h2><p className="mt-1 text-sm text-muted-foreground">Usa únicamente costos e ingresos registrados. Los costos globales se distribuyen entre los planes activos.</p></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Clientes</th><th className="px-5 py-3">Ingreso</th><th className="px-5 py-3">IA</th><th className="px-5 py-3">Operación</th><th className="px-5 py-3">Costo total</th><th className="px-5 py-3">Margen</th></tr></thead>
              <tbody>
                {plans.map((plan) => {
                  const margin = plan.gross_margin_percent == null ? null : Number(plan.gross_margin_percent)
                  return <tr key={plan.plan_key} className="border-t border-border"><td className="px-5 py-4 font-semibold">{plan.plan_key}</td><td className="px-5 py-4">{plan.organizations}</td><td className="px-5 py-4">{clp.format(Number(plan.monthly_revenue_clp || 0))}</td><td className="px-5 py-4">{clp.format(Number(plan.ai_cost_clp || 0))}</td><td className="px-5 py-4">{clp.format(Number(plan.direct_operating_cost_clp || 0) + Number(plan.allocated_global_cost_clp || 0))}</td><td className="px-5 py-4 font-semibold">{clp.format(Number(plan.total_cost_clp || 0))}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${margin == null ? 'bg-muted' : margin >= 80 ? 'bg-emerald-500/10 text-emerald-700' : margin >= 60 ? 'bg-amber-500/10 text-amber-700' : 'bg-red-500/10 text-red-700'}`}>{margin == null ? 'Sin cálculo' : `${margin.toFixed(2)}%`}</span></td></tr>
                })}
                {!plans.length && <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">Todavía no hay términos comerciales y costos suficientes para comparar planes.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props
  return <label className="block text-sm"><span className="font-semibold">{label}</span><input {...inputProps} className="mt-1 w-full rounded-lg border border-border bg-background p-3" /></label>
}

function Select({ name, label, options }: { name: string; label: string; options: string[][] }) {
  return <label className="block text-sm"><span className="font-semibold">{label}</span><select name={name} required className="mt-1 w-full rounded-lg border border-border bg-background p-3">{options.map(([value,text]) => <option key={value} value={value}>{text}</option>)}</select></label>
}
