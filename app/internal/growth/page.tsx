import { redirect } from 'next/navigation'
import { ArrowUpRight, BriefcaseBusiness, CircleAlert, RefreshCw, Sparkles, UserRoundCheck } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { refreshGrowthOpportunitiesAction, updateGrowthOpportunityAction } from './actions'

export const dynamic = 'force-dynamic'

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const typeLabels: Record<string, string> = {
  upgrade: 'Upgrade',
  assisted: 'Acompañamiento',
  fullstack: 'Fullstack',
  renewal_risk: 'Riesgo de renovación',
}

const statusLabels: Record<string, string> = {
  new: 'Nueva',
  reviewing: 'En revisión',
  contacted: 'Contactado',
  won: 'Ganada',
  dismissed: 'Descartada',
}

export default async function GrowthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const admin = createAdminClient()
  const { data: authorized } = await admin.rpc('is_kumplio_internal_user', { p_user_id: user.id, p_roles: null })
  if (!authorized) redirect('/dashboard')

  const { data: rows } = await admin
    .from('growth_opportunities')
    .select('id,organization_id,opportunity_type,status,score,title,summary,reasons,recommended_action,estimated_value_clp,last_seen_at,organizations(name)')
    .order('score', { ascending: false })
    .order('last_seen_at', { ascending: false })

  const opportunities = rows || []
  const open = opportunities.filter((row) => !['won', 'dismissed'].includes(row.status))
  const totalPotential = open.reduce((sum, row) => sum + Number(row.estimated_value_clp || 0), 0)
  const fullstack = open.filter((row) => row.opportunity_type === 'fullstack').length
  const risks = open.filter((row) => row.opportunity_type === 'renewal_risk').length

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-primary">Kumplio HQ</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Growth OS</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">Oportunidades comerciales y riesgos explicados con señales reales de uso. Cada recomendación muestra por qué existe.</p>
          </div>
          <form action={refreshGrowthOpportunitiesAction}>
            <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
              <RefreshCw className="h-4 w-4" /> Actualizar señales
            </button>
          </form>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Sparkles} label="Oportunidades abiertas" value={String(open.length)} detail="requieren decisión comercial" />
          <Metric icon={BriefcaseBusiness} label="Valor potencial" value={clp.format(totalPotential)} detail="referencial, sin IVA" />
          <Metric icon={ArrowUpRight} label="Candidatos Fullstack" value={String(fullstack)} detail="desde $5.000.000 + IVA" />
          <Metric icon={CircleAlert} label="Riesgos por inactividad" value={String(risks)} detail="señales observables, no predicción" />
        </section>

        <section className="space-y-4">
          {opportunities.map((opportunity) => {
            const org = opportunity.organizations as { name?: string } | null
            const reasons = Array.isArray(opportunity.reasons) ? opportunity.reasons : []
            const closed = ['won', 'dismissed'].includes(opportunity.status)
            return (
              <article key={opportunity.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{typeLabels[opportunity.opportunity_type] || opportunity.opportunity_type}</span>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{statusLabels[opportunity.status] || opportunity.status}</span>
                      <span className="text-xs font-semibold text-muted-foreground">Score explicable: {opportunity.score}/100</span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-muted-foreground">{org?.name || 'Organización'}</p>
                    <h2 className="mt-1 text-xl font-extrabold">{opportunity.title}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{opportunity.summary}</p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {reasons.map((reason: { signal?: string; value?: string | number }, index: number) => (
                        <div key={`${reason.signal}-${index}`} className="rounded-xl border border-border bg-background p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{String(reason.signal || 'Señal').replaceAll('_', ' ')}</p>
                          <p className="mt-2 text-lg font-extrabold">{String(reason.value ?? '—')}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-xl bg-muted/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acción recomendada</p>
                      <p className="mt-2 text-sm font-semibold">{opportunity.recommended_action}</p>
                    </div>
                  </div>

                  <div className="w-full shrink-0 space-y-4 xl:w-72">
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valor referencial</p>
                      <p className="mt-2 text-2xl font-extrabold">{opportunity.estimated_value_clp == null ? 'Por definir' : clp.format(Number(opportunity.estimated_value_clp))}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Neto, sin IVA</p>
                    </div>

                    {!closed && (
                      <form action={updateGrowthOpportunityAction} className="space-y-3 rounded-xl border border-border bg-background p-4">
                        <input type="hidden" name="opportunityId" value={opportunity.id} />
                        <label className="block text-sm">
                          <span className="font-semibold">Estado</span>
                          <select name="status" defaultValue={opportunity.status} className="mt-1 w-full rounded-lg border border-border bg-background p-3">
                            <option value="new">Nueva</option>
                            <option value="reviewing">En revisión</option>
                            <option value="contacted">Contactado</option>
                            <option value="won">Ganada</option>
                            <option value="dismissed">Descartada</option>
                          </select>
                        </label>
                        <label className="block text-sm">
                          <span className="font-semibold">Fundamento</span>
                          <textarea name="note" rows={3} className="mt-1 w-full rounded-lg border border-border bg-background p-3" placeholder="Obligatorio al cerrar o descartar" />
                        </label>
                        <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
                          <UserRoundCheck className="h-4 w-4" /> Guardar decisión
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </article>
            )
          })}

          {!opportunities.length && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-primary" />
              <h2 className="mt-4 text-xl font-extrabold">Todavía no hay oportunidades detectadas</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Actualiza las señales. Growth OS solo creará oportunidades cuando existan datos reales suficientes.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Sparkles; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><Icon className="h-5 w-5 text-primary" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-xl font-extrabold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
}
