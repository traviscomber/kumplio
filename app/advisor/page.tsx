import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, History, ShieldAlert } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { CalmState, FocusPanel, PrimaryAction } from '@/components/product/focus-panel'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { getDailyAdvisorSummary } from '@/lib/compliance/advisor/daily-advisor'
import { PRODUCT_LANGUAGE } from '@/lib/product/language'

export const dynamic = 'force-dynamic'

export default async function AdvisorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/advisor')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  const summary = await getDailyAdvisorSummary(admin, access.organizationId, user.id)
  const primary = summary.priorities[0]

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <FocusPanel
          eyebrow="Hoy"
          title={headline(summary.status)}
          description={description(summary.status, summary.pendingDecisions, summary.openSituations)}
        >
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Metric label="Decisiones" value={summary.pendingDecisions} />
            <Metric label="Situaciones" value={summary.openSituations} />
            <Metric label="Tiempo estimado" value={`${summary.estimatedMinutes} min`} />
          </div>

          <div className="mt-8">
            {primary ? <PrimaryAction href={primary.href}>{PRODUCT_LANGUAGE.actions.start}</PrimaryAction> : <CalmState>{PRODUCT_LANGUAGE.empty.noAction}</CalmState>}
          </div>
        </FocusPanel>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Lo que requiere atención</h2>
            </div>
            <div className="mt-5 space-y-3">
              {summary.priorities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No encontré asuntos que requieran intervención.</p>
              ) : summary.priorities.map((item) => (
                <Link key={`${item.href}-${item.id}`} href={item.href} className="block rounded-xl border p-4 transition-colors hover:bg-muted/60">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                        <span>Riesgo {riskLabel(item.reasoning.risk)}</span>
                        <span>Confianza {item.reasoning.confidence}%</span>
                      </div>
                      <p className="mt-2 font-bold">{item.title}</p>
                      {item.summary && <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.summary}</p>}
                      <p className="mt-3 text-sm font-semibold text-primary">{item.reasoning.nextAction}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.reasoning.explanation[1]}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Precedentes recientes</h2>
            </div>
            <div className="mt-5 space-y-4">
              {summary.recentMemories.length === 0 ? (
                <p className="text-sm text-muted-foreground">{PRODUCT_LANGUAGE.empty.noPrecedent}</p>
              ) : summary.recentMemories.map((memory) => (
                <article key={memory.id} className="border-l-2 border-primary/30 pl-4">
                  <p className="font-semibold">{memory.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{memory.summary}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(memory.occurredAt).toLocaleDateString('es-CL', { dateStyle: 'medium' })}</p>
                </article>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </>
  )
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border bg-background/50 p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  )
}

function headline(status: 'stable' | 'attention' | 'critical') {
  if (status === 'critical') return 'Hay un asunto crítico que requiere tu atención.'
  if (status === 'attention') return 'Preparé lo que necesitas revisar hoy.'
  return 'La organización está estable.'
}

function description(status: 'stable' | 'attention' | 'critical', decisions: number, situations: number) {
  if (status === 'stable') return 'Revisé las situaciones, decisiones y precedentes disponibles. No encontré una acción prioritaria para ti.'
  return `Encontré ${situations} situaciones abiertas y ${decisions} decisiones pendientes. Las ordené para que comiences por lo más importante.`
}

function riskLabel(risk: 'low' | 'medium' | 'high' | 'critical') {
  if (risk === 'critical') return 'crítico'
  if (risk === 'high') return 'alto'
  if (risk === 'low') return 'bajo'
  return 'medio'
}
