import { redirect } from 'next/navigation'
import { BadgeDollarSign, CircleAlert, Landmark, Percent, ReceiptText, Sparkles } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { recordCommercialTermAction, recordFxRateAction } from './actions'

export const dynamic = 'force-dynamic'

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const usd = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 6 })

export default async function EconomicsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const admin = createAdminClient()
  const { data: authorized } = await admin.rpc('is_kumplio_internal_user', { p_user_id: user.id, p_roles: null })
  if (!authorized) redirect('/dashboard')

  const [orgsResult, economicsResult, fxResult] = await Promise.all([
    admin.from('organizations').select('id,name').order('name'),
    admin.from('internal_organization_unit_economics').select('*').order('monthly_recurring_revenue_clp', { ascending: false }),
    admin.from('fx_rates').select('rate_date,rate,source_name,source_reference,recorded_at').order('rate_date', { ascending: false }).order('recorded_at', { ascending: false }).limit(1),
  ])

  const organizations = orgsResult.data || []
  const rows = economicsResult.data || []
  const fx = fxResult.data?.[0] || null
  const totalRevenue = rows.reduce((sum, row) => sum + Number(row.monthly_recurring_revenue_clp || 0), 0)
  const totalCostClp = rows.some((row) => row.cost_clp == null) ? null : rows.reduce((sum, row) => sum + Number(row.cost_clp || 0), 0)
  const totalCostMicrousd = rows.reduce((sum, row) => sum + Number(row.cost_microusd || 0), 0)
  const marginClp = totalCostClp == null ? null : totalRevenue - totalCostClp
  const marginPercent = marginClp == null || totalRevenue === 0 ? null : (marginClp / totalRevenue) * 100

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-bold text-primary">Operación interna</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Unit Economics</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">Costos reales de IA, conversión a pesos chilenos e ingresos comerciales. Esta información nunca se muestra a clientes.</p>
        </header>

        {!fx && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div><p className="font-bold">Falta el tipo de cambio USD/CLP.</p><p className="mt-1 text-muted-foreground">Los costos en CLP y el margen permanecerán pendientes hasta registrar una tasa con fuente identificable.</p></div>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Metric icon={Landmark} label="Ingreso recurrente" value={clp.format(totalRevenue)} detail="mensual equivalente" />
          <Metric icon={BadgeDollarSign} label="Costo IA" value={totalCostClp == null ? 'Pendiente' : clp.format(totalCostClp)} detail={usd.format(totalCostMicrousd / 1_000_000)} />
          <Metric icon={ReceiptText} label="Margen bruto" value={marginClp == null ? 'Pendiente' : clp.format(marginClp)} detail="antes de costos fijos" />
          <Metric icon={Percent} label="Margen" value={marginPercent == null ? 'Pendiente' : `${marginPercent.toFixed(2)}%`} detail="sobre ingreso recurrente" />
          <Metric icon={Sparkles} label="Misiones" value={String(rows.reduce((sum, row) => sum + Number(row.mission_count || 0), 0))} detail="con consumo registrado" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border p-5"><h2 className="font-bold">Rentabilidad por organización</h2><p className="mt-1 text-sm text-muted-foreground">Ingreso mensual equivalente versus costo acumulado de IA.</p></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Organización</th><th className="px-5 py-3">Ingreso CLP</th><th className="px-5 py-3">Costo CLP</th><th className="px-5 py-3">Margen</th><th className="px-5 py-3">Misiones</th><th className="px-5 py-3">Estado</th></tr></thead>
                <tbody>
                  {rows.map((row) => {
                    const margin = row.gross_margin_percent == null ? null : Number(row.gross_margin_percent)
                    return <tr key={row.organization_id} className="border-t border-border"><td className="px-5 py-4 font-semibold">{row.organization_name}</td><td className="px-5 py-4">{clp.format(Number(row.monthly_recurring_revenue_clp || 0))}</td><td className="px-5 py-4">{row.cost_clp == null ? 'Pendiente' : clp.format(Number(row.cost_clp))}</td><td className="px-5 py-4">{margin == null ? '—' : `${margin.toFixed(2)}%`}</td><td className="px-5 py-4">{row.mission_count}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${margin == null ? 'bg-muted' : margin >= 80 ? 'bg-emerald-500/10 text-emerald-700' : margin >= 60 ? 'bg-amber-500/10 text-amber-700' : 'bg-red-500/10 text-red-700'}`}>{margin == null ? 'Sin cálculo' : margin >= 80 ? 'Saludable' : margin >= 60 ? 'Revisar' : 'Crítico'}</span></td></tr>
                  })}
                  {!rows.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Todavía no hay datos operativos suficientes.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <form action={recordFxRateAction} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-bold">Registrar USD/CLP</h2>
              <p className="mt-1 text-sm text-muted-foreground">Usa una fuente verificable. No se completa automáticamente con valores supuestos.</p>
              <div className="mt-4 space-y-3">
                <Field name="rateDate" label="Fecha" type="date" required />
                <Field name="rate" label="Pesos por US$1" type="number" step="0.000001" min="0.000001" required />
                <Field name="sourceName" label="Fuente" placeholder="Ej. Banco Central de Chile" required />
                <Field name="sourceReference" label="Referencia" placeholder="URL o identificador" />
              </div>
              <button className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Guardar tipo de cambio</button>
              {fx && <p className="mt-3 text-xs text-muted-foreground">Último: {Number(fx.rate).toLocaleString('es-CL')} CLP · {fx.rate_date} · {fx.source_name}</p>}
            </form>

            <form action={recordCommercialTermAction} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-bold">Registrar ingreso</h2>
              <div className="mt-4 space-y-3">
                <label className="block text-sm"><span className="font-semibold">Organización</span><select name="organizationId" required className="mt-1 w-full rounded-lg border border-border bg-background p-3"><option value="">Seleccionar</option>{organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
                <label className="block text-sm"><span className="font-semibold">Tipo</span><select name="revenueType" required className="mt-1 w-full rounded-lg border border-border bg-background p-3"><option value="subscription">Suscripción</option><option value="managed_service">Acompañamiento</option><option value="fullstack_project">Proyecto fullstack</option><option value="other">Otro</option></select></label>
                <label className="block text-sm"><span className="font-semibold">Periodo</span><select name="billingPeriod" required className="mt-1 w-full rounded-lg border border-border bg-background p-3"><option value="monthly">Mensual</option><option value="quarterly">Trimestral</option><option value="annual">Anual</option><option value="one_time">Una vez</option></select></label>
                <Field name="amountClp" label="Monto CLP, sin IVA" type="number" min="0" step="1" required />
                <Field name="validFrom" label="Vigente desde" type="date" required />
                <Field name="planKey" label="Plan o proyecto" placeholder="Profesional, Acompañado, Fullstack…" />
                <Field name="notes" label="Notas" />
              </div>
              <button className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Guardar ingreso</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Landmark; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><Icon className="h-5 w-5 text-primary" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-xl font-extrabold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props
  return <label className="block text-sm"><span className="font-semibold">{label}</span><input {...inputProps} className="mt-1 w-full rounded-lg border border-border bg-background p-3" /></label>
}
