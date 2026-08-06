import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, CheckCircle2, Clock3, Plus, ShieldCheck } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { getDailyAdvisorSummary } from '@/lib/compliance/advisor/daily-advisor'

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
  const reviewedItems = summary.openSituations + summary.pendingDecisions + summary.recentMemories.length

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="overflow-hidden rounded-[28px] border bg-card shadow-sm">
          <div className="border-b bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_42%)] px-6 py-10 sm:px-10 sm:py-14">
            <p className="text-sm font-bold text-primary">Hoy</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Esto necesita tu atención.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Kumplio reunió el contexto disponible y separó lo que requiere una decisión de lo que puede esperar.
            </p>

            <div className="mt-10 space-y-4">
              <BriefLine icon={<CheckCircle2 className="h-5 w-5" />} label="Contexto considerado" value={`${reviewedItems} elementos`} />
              <BriefLine icon={<ShieldCheck className="h-5 w-5" />} label="Casos abiertos" value={`${summary.openSituations}`} />
              <BriefLine icon={<CheckCircle2 className="h-5 w-5" />} label="Decisiones preparadas" value={`${summary.pendingDecisions}`} />
              <BriefLine icon={<Clock3 className="h-5 w-5" />} label="Tiempo para ponerte al día" value={`${summary.estimatedMinutes} minutos`} />
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {primary ? (
                <Link href={primary.href} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:opacity-90">
                  Resolver esta situación <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 font-semibold text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> No hay una decisión pendiente ahora.
                </div>
              )}
              <Link href="/cases/new" className="inline-flex min-h-12 items-center justify-center rounded-xl border bg-background/70 px-6 py-3 font-bold transition hover:border-primary/40 hover:bg-muted/50">
                <Plus className="mr-2 h-4 w-4" /> Describir otra situación
              </Link>
            </div>
          </div>

          <div className="grid gap-8 px-6 py-8 sm:px-10 lg:grid-cols-[1fr_0.8fr]">
            <section>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Qué resolver primero</p>
              <div className="mt-4 space-y-3">
                {summary.priorities.length === 0 ? (
                  <p className="rounded-2xl border bg-background/50 p-5 text-sm text-muted-foreground">No encontré asuntos que requieran una decisión inmediata.</p>
                ) : summary.priorities.slice(0, 3).map((item, index) => (
                  <Link key={`${item.href}-${item.id}`} href={item.href} className="block rounded-2xl border bg-background/50 p-5 transition hover:border-primary/30 hover:bg-muted/40">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-primary">Prioridad {index + 1}</p>
                        <h2 className="mt-2 font-bold">{item.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.reasoning.nextAction}</p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Riesgo {riskLabel(item.reasoning.risk)} · respaldo {confidenceLabel(item.reasoning.confidence)}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <aside className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-xl font-black">Lo demás puede esperar.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Kumplio organizó las situaciones y decisiones disponibles para que no tengas que revisar cada documento o alerta por separado.
              </p>
              <div className="mt-6 space-y-3 text-sm">
                <StatusLine label="Situaciones priorizadas" value={summary.openSituations} />
                <StatusLine label="Decisiones pendientes" value={summary.pendingDecisions} />
                <StatusLine label="Precedentes considerados" value={summary.recentMemories.length} />
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  )
}

function BriefLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-3 text-primary">{icon}<span className="text-sm font-semibold text-foreground">{label}</span></div>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  )
}

function StatusLine({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="font-bold">{value}</span></div>
}

function riskLabel(risk: 'low' | 'medium' | 'high' | 'critical') {
  if (risk === 'critical') return 'crítico'
  if (risk === 'high') return 'alto'
  if (risk === 'low') return 'bajo'
  return 'medio'
}

function confidenceLabel(confidence: number) {
  if (confidence >= 85) return 'alto'
  if (confidence >= 60) return 'medio'
  return 'limitado'
}
