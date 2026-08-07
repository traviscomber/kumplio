import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Plus,
  Scale,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { WhyDetails } from '@/components/explainability/why-details'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { getDailyAdvisorSummary, type AdvisorCategory, type AdvisorItem } from '@/lib/compliance/advisor/daily-advisor'

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
      <main className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="overflow-hidden rounded-[30px] border bg-card shadow-sm">
          <div className="border-b bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.15),transparent_44%)] px-6 py-9 sm:px-10 sm:py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-bold text-primary">Escritorio</p>
                <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
                  {summary.status === 'stable' ? 'Tu cumplimiento está al día.' : 'Esto necesita tu atención hoy.'}
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                  Kumplio reunió decisiones, trabajo asignado, evidencia y especialistas en una sola prioridad operativa. Entra al detalle únicamente cuando aporte valor.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                {primary ? (
                  <Link href={primary.href} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:opacity-90">
                    Resolver prioridad principal <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : (
                  <div className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 font-semibold">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> Sin asuntos urgentes
                  </div>
                )}
                <Link href="/cases/new" className="inline-flex min-h-12 items-center justify-center rounded-xl border bg-background/70 px-6 py-3 font-bold transition hover:border-primary/40 hover:bg-muted/50">
                  <Plus className="mr-2 h-4 w-4" /> Describir otra situación
                </Link>
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <HeroMetric icon={AlertTriangle} label="Críticos" value={summary.criticalCount} tone={summary.criticalCount > 0 ? 'danger' : 'default'} />
              <HeroMetric icon={Scale} label="Por decidir" value={summary.pendingDecisions + summary.pendingReviews} />
              <HeroMetric icon={Users} label="Esperando a otros" value={summary.waitingOnOthers} />
              <HeroMetric icon={Bot} label="Especialistas activos" value={summary.agentWorking} />
              <HeroMetric
                icon={ShieldCheck}
                label="Confianza operativa"
                value={summary.confidence.value === null ? '—' : `${summary.confidence.value}%`}
              />
            </div>
          </div>

          <div className="grid gap-8 px-6 py-8 sm:px-10 xl:grid-cols-[minmax(0,1.35fr)_minmax(310px,0.65fr)]">
            <section>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Prioridades explicables</p>
                  <h2 className="mt-2 text-2xl font-black">Qué resolver primero</h2>
                </div>
                <p className="text-sm text-muted-foreground">Puesta al día estimada: {summary.estimatedMinutes} min</p>
              </div>

              <div className="mt-5 space-y-4">
                {summary.priorities.length === 0 ? (
                  <div className="rounded-2xl border bg-background/50 p-8 text-center">
                    <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
                    <h3 className="mt-4 text-xl font-black">No encontré una decisión inmediata.</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Puedes crear un caso nuevo o revisar el mapa de confianza.</p>
                  </div>
                ) : summary.priorities.map((item, index) => (
                  <PriorityCard key={`${item.source}-${item.id}`} item={item} index={index} />
                ))}
              </div>
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                <Activity className="h-6 w-6 text-primary" />
                <h2 className="mt-4 text-xl font-black">Estado operativo</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Este resumen separa lo que debes hacer, lo que está delegado y lo que Kumplio sigue procesando.
                </p>
                <div className="mt-6 space-y-3 text-sm">
                  <StatusLine label="Asignado a ti" value={summary.assignedWork} />
                  <StatusLine label="Esperando a otras personas" value={summary.waitingOnOthers} />
                  <StatusLine label="Resultados por revisar" value={summary.pendingReviews} />
                  <StatusLine label="Vencidos" value={summary.overdue} tone={summary.overdue > 0 ? 'danger' : 'default'} />
                  <StatusLine label="Vencen en 72 horas" value={summary.dueSoon} tone={summary.dueSoon > 0 ? 'warning' : 'default'} />
                </div>
                <Link href="/follow-up" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                  Abrir seguimiento <ArrowRight className="h-4 w-4" />
                </Link>
              </section>

              <section className="rounded-2xl border bg-card p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h2 className="font-black">Por qué esta confianza</h2>
                </div>
                <p className="mt-3 text-3xl font-black">{summary.confidence.value === null ? 'Sin base suficiente' : `${summary.confidence.value}%`}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  No es un número decorativo: se calcula desde cobertura, responsables, evaluaciones y evidencia real.
                </p>
                <div className="mt-4">
                  <WhyDetails
                    reasons={summary.confidence.basis}
                    confidence={summary.confidence.value}
                    nextAction={summary.confidence.value === null ? 'Registrar controles y evidencia reales.' : 'Abrir el mapa de confianza y cerrar la dimensión más débil.'}
                    sourceLabel="Confianza operativa"
                    compact
                  />
                </div>
                <Link href="/insights" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                  Ver mapa de confianza <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            </aside>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[26px] border bg-card p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">Briefing de las últimas 24 horas</p>
                <h2 className="mt-1 text-2xl font-black">Qué cambió desde ayer</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                <span className="rounded-full border px-3 py-1.5">{summary.resolved24h} resueltos</span>
                <span className="rounded-full border px-3 py-1.5">{summary.delegated24h} delegados</span>
                <span className="rounded-full border px-3 py-1.5">{summary.evidenceReceived24h} evidencias recibidas</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {summary.changes24h.length === 0 ? (
                <p className="rounded-xl border bg-background/50 p-5 text-sm text-muted-foreground">No se registraron movimientos relevantes durante las últimas 24 horas.</p>
              ) : summary.changes24h.map((change) => (
                <Link key={change.id} href={change.href} className="block rounded-xl border bg-background/50 p-4 transition hover:border-primary/30 hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">{change.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{change.detail}</p>
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">{new Date(change.occurredAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border bg-card p-6 sm:p-8">
            <Clock3 className="h-6 w-6 text-primary" />
            <p className="mt-4 text-sm font-semibold text-primary">Cierre y continuidad</p>
            <h2 className="mt-1 text-2xl font-black">Qué dejar preparado</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Kumplio conserva la continuidad entre jornadas para que el trabajo no dependa de memoria personal ni de revisar varias bandejas.
            </p>

            {summary.tomorrowFocus ? (
              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Próximo foco</p>
                <h3 className="mt-2 text-lg font-black">{summary.tomorrowFocus.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary.tomorrowFocus.reasoning.nextAction}</p>
                <Link href={summary.tomorrowFocus.href} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                  Dejar encaminado <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border bg-background/50 p-5 text-sm text-muted-foreground">
                No hay un asunto pendiente para preparar.
              </div>
            )}

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <SmallMetric icon={CheckCircle2} label="Resueltos" value={summary.resolved24h} />
              <SmallMetric icon={Users} label="Delegados" value={summary.delegated24h} />
              <SmallMetric icon={FileCheck2} label="Evidencias" value={summary.evidenceReceived24h} />
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function PriorityCard({ item, index }: { item: AdvisorItem; index: number }) {
  return (
    <article className="rounded-2xl border bg-background/50 p-5 transition hover:border-primary/30 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${categoryTone(item.category)}`}>
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className={`rounded-full border px-2.5 py-1 ${categoryTone(item.category)}`}>{categoryLabel(item.category)}</span>
            <span className="rounded-full border px-2.5 py-1 text-muted-foreground">{item.statusLabel}</span>
            <span className="rounded-full border px-2.5 py-1 text-muted-foreground">Riesgo {riskLabel(item.reasoning.risk)}</span>
          </div>
          <h3 className="mt-3 text-xl font-black">{item.title}</h3>
          {item.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {item.ownerLabel && <span>Responsable: <strong className="text-foreground">{item.ownerLabel}</strong></span>}
            {item.dueAt && <span>Vence: <strong className="text-foreground">{new Date(item.dueAt).toLocaleDateString('es-CL')}</strong></span>}
            <span>Respaldo: <strong className="text-foreground">{item.reasoning.confidence}%</strong></span>
          </div>

          <div className="mt-4">
            <WhyDetails
              reasons={item.reasoning.explanation}
              facts={item.facts}
              confidence={item.reasoning.confidence}
              nextAction={item.reasoning.nextAction}
              sourceLabel={sourceLabel(item.source)}
              compact
            />
          </div>
        </div>
        <Link href={item.href} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90">
          Resolver <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

function HeroMetric({ icon: Icon, label, value, tone = 'default' }: { icon: typeof AlertTriangle; label: string; value: number | string; tone?: 'default' | 'danger' }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === 'danger' ? 'border-red-500/35 bg-red-500/10' : 'bg-background/65'}`}>
      <Icon className={`h-5 w-5 ${tone === 'danger' ? 'text-red-600' : 'text-primary'}`} />
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  )
}

function SmallMetric({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-background/50 p-3">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-2 text-xl font-black">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function StatusLine({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'warning' | 'danger' }) {
  const toneClass = tone === 'danger' ? 'text-red-600' : tone === 'warning' ? 'text-amber-600' : 'text-foreground'
  return <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className={`font-bold ${toneClass}`}>{value}</span></div>
}

function categoryLabel(value: AdvisorCategory) {
  if (value === 'critical') return 'Crítico'
  if (value === 'decision') return 'Decidir'
  if (value === 'assigned') return 'Tu trabajo'
  if (value === 'waiting') return 'Esperando a otros'
  if (value === 'evidence') return 'Evidencia'
  return 'Especialistas'
}

function categoryTone(value: AdvisorCategory) {
  if (value === 'critical') return 'border-red-500/35 bg-red-500/10 text-red-600'
  if (value === 'decision') return 'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  if (value === 'waiting') return 'border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300'
  return 'border-primary/30 bg-primary/10 text-primary'
}

function riskLabel(risk: 'low' | 'medium' | 'high' | 'critical') {
  if (risk === 'critical') return 'crítico'
  if (risk === 'high') return 'alto'
  if (risk === 'low') return 'bajo'
  return 'medio'
}

function sourceLabel(value: AdvisorItem['source']) {
  if (value === 'situation') return 'Situación priorizada'
  if (value === 'decision') return 'Decisión humana'
  if (value === 'mission') return 'Misión de cumplimiento'
  if (value === 'evidence_request') return 'Solicitud de evidencia'
  if (value === 'review') return 'Resultado del Consejo de especialistas'
  return 'Operación de especialistas'
}
