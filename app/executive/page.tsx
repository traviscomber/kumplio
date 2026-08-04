import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, BarChart3, Gauge, ShieldCheck, TimerReset, WalletCards } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type Snapshot = {
  id: string
  status: string
  period_start: string
  period_end: string
  overall_risk_score: number | null
  critical_risks: number
  open_impacts: number
  overdue_actions: number
  expiring_evidence: number
  control_coverage_pct: number | null
  evidence_confidence_pct: number | null
  benchmark_percentile: number | null
  estimated_financial_exposure_clp: number | null
  executive_summary: Record<string, unknown>
  generated_at: string
}

type Priority = { id: string; priority_rank: number; priority_type: string; title: string; rationale: string | null; severity: string; due_date: string | null; status: string }

export default async function ExecutivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/executive')

  const admin = createAdminClient()
  const { data: membership } = await admin.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')

  const organizationId = membership.organization_id
  const [organizationResult, snapshotResult] = await Promise.all([
    admin.from('organizations').select('id,name').eq('id', organizationId).maybeSingle(),
    admin.from('executive_intelligence_snapshots').select('id,status,period_start,period_end,overall_risk_score,critical_risks,open_impacts,overdue_actions,expiring_evidence,control_coverage_pct,evidence_confidence_pct,benchmark_percentile,estimated_financial_exposure_clp,executive_summary,generated_at').eq('organization_id', organizationId).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const snapshot = snapshotResult.data as Snapshot | null
  let priorities: Priority[] = []
  if (snapshot?.id) {
    const { data } = await admin.from('executive_priorities').select('id,priority_rank,priority_type,title,rationale,severity,due_date,status').eq('snapshot_id', snapshot.id).order('priority_rank').limit(8)
    priorities = (data || []) as Priority[]
  }

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
        <header className="overflow-hidden rounded-3xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary"><Gauge className="h-5 w-5" /><p className="text-sm font-bold">Executive Command Center</p></div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{organizationResult.data?.name || 'Kumplio'}</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">Una lectura ejecutiva de riesgo, capacidad de respuesta y prioridades que requieren decisión humana.</p>
            </div>
            <Link href="/copilot" className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Consultar al Copilot</Link>
          </div>
        </header>

        {!snapshot ? (
          <section className="rounded-3xl border border-dashed bg-card p-10 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-xl font-bold">Aún no existe un snapshot ejecutivo</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">El centro se activará cuando Kumplio cuente con suficientes señales revisadas de riesgos, controles, evidencias, impactos y planes. No se mostrarán indicadores fabricados.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/digital-twin" className="rounded-xl border px-5 py-3 text-sm font-bold">Completar gemelo digital</Link><Link href="/roc" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Revisar impactos</Link></div>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={<Gauge className="h-5 w-5" />} label="Riesgo general" value={snapshot.overall_risk_score == null ? '—' : Math.round(Number(snapshot.overall_risk_score)).toString()} helper={riskLabel(snapshot.overall_risk_score)} />
              <Metric icon={<ShieldCheck className="h-5 w-5" />} label="Cobertura de controles" value={formatPct(snapshot.control_coverage_pct)} helper={`${snapshot.critical_risks} riesgos críticos`} />
              <Metric icon={<TimerReset className="h-5 w-5" />} label="Acciones vencidas" value={snapshot.overdue_actions.toString()} helper={`${snapshot.open_impacts} impactos abiertos`} />
              <Metric icon={<WalletCards className="h-5 w-5" />} label="Exposición estimada" value={formatClp(snapshot.estimated_financial_exposure_clp)} helper={`Benchmark p${snapshot.benchmark_percentile == null ? '—' : Math.round(Number(snapshot.benchmark_percentile))}`} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
              <div className="rounded-2xl border bg-card">
                <div className="border-b px-5 py-4"><p className="text-sm font-semibold text-primary">Qué requiere atención</p><h2 className="mt-1 text-xl font-bold">Prioridades ejecutivas</h2></div>
                <div className="divide-y">
                  {priorities.map((priority) => <article key={priority.id} className="p-5"><div className="flex items-start gap-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-extrabold text-primary">{priority.priority_rank}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{priority.title}</h3><span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold">{priority.severity}</span></div><p className="mt-2 text-sm text-muted-foreground">{priority.rationale || 'Requiere revisión ejecutiva.'}</p><p className="mt-3 text-xs text-muted-foreground">{priority.priority_type} · {priority.status}{priority.due_date ? ` · vence ${new Date(priority.due_date).toLocaleDateString('es-CL')}` : ''}</p></div></div></article>)}
                  {!priorities.length && <p className="p-5 text-sm text-muted-foreground">El snapshot no contiene prioridades pendientes.</p>}
                </div>
              </div>

              <aside className="space-y-4">
                <section className="rounded-2xl border bg-card p-5"><h2 className="font-bold">Calidad de la señal</h2><dl className="mt-4 space-y-3 text-sm"><Row label="Confianza de evidencia" value={formatPct(snapshot.evidence_confidence_pct)} /><Row label="Evidencias por vencer" value={snapshot.expiring_evidence.toString()} /><Row label="Estado del snapshot" value={snapshot.status} /><Row label="Período" value={`${new Date(snapshot.period_start).toLocaleDateString('es-CL')} – ${new Date(snapshot.period_end).toLocaleDateString('es-CL')}`} /></dl></section>
                <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" /><div><h2 className="font-bold">Lectura asistida, no decisión automática</h2><p className="mt-2 text-sm text-muted-foreground">El centro resume información revisada. Las acciones, montos y prioridades requieren validación de responsables antes de ejecutarse.</p></div></div></section>
              </aside>
            </section>
          </>
        )}
      </main>
    </>
  )
}

function Metric({ icon, label, value, helper }: { icon: React.ReactNode; label: string; value: string; helper: string }) {
  return <article className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between text-primary"><p className="text-sm font-semibold text-muted-foreground">{label}</p>{icon}</div><p className="mt-4 text-3xl font-extrabold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{helper}</p></article>
}

function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-semibold">{value}</dd></div> }
function formatPct(value: number | null) { return value == null ? '—' : `${Math.round(Number(value))}%` }
function formatClp(value: number | null) { return value == null ? '—' : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value)) }
function riskLabel(value: number | null) { if (value == null) return 'Sin cálculo revisado'; if (Number(value) >= 75) return 'Crítico'; if (Number(value) >= 50) return 'Alto'; if (Number(value) >= 25) return 'Medio'; return 'Bajo' }
