import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Activity, AlertTriangle, ArrowRight, Boxes, FileCheck2, PackageCheck, RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'

export const dynamic = 'force-dynamic'

export default async function OperationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/operations')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  const [{ data: organization }, { data: projects }, { data: jobs }] = await Promise.all([
    admin.from('organizations').select('name').eq('id', access.organizationId).maybeSingle(),
    admin.from('projects').select('id,name').eq('organization_id', access.organizationId).order('created_at', { ascending: false }),
    admin.from('agent_jobs')
      .select('status, lease_expires_at, next_attempt_at, last_error_code, updated_at')
      .eq('organization_id', access.organizationId)
      .order('updated_at', { ascending: false })
      .limit(200),
  ])

  const queue = summarizeQueue(jobs || [])

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Centro operacional</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Cumplimiento de {organization?.name || 'tu organización'}.
          </h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Un solo lugar para revisar trabajo, evidencia y salud de las ejecuciones que Kumplio procesa en segundo plano.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Ejecución durable</p>
              <h2 className="mt-2 text-2xl font-black">Los agentes ya no dependen de mantener abierta una solicitud web.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                Cada etapa queda persistida en una cola. Un worker toma un lease temporal, renueva heartbeat mientras trabaja y reintenta fallos transitorios. Los fallos terminales quedan en dead-letter para revisión.
              </p>
            </div>
            <Activity className="h-7 w-7 shrink-0 text-primary" />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QueueMetric label="En cola" value={queue.queued} detail="Esperando worker" />
            <QueueMetric label="Trabajando" value={queue.leased} detail={queue.staleLeases ? `${queue.staleLeases} lease(s) vencidos` : 'Lease con heartbeat'} />
            <QueueMetric label="Reintentos" value={queue.retryWait} detail="Backoff automático" />
            <QueueMetric label="Dead-letter" value={queue.deadLetter} detail="Requiere revisión" alert={queue.deadLetter > 0} />
          </div>

          {(queue.deadLetter > 0 || queue.staleLeases > 0) && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p className="leading-6 text-muted-foreground">
                Hay ejecuciones que necesitan atención operacional. El historial conserva el código del último error y ningún job terminal se elimina silenciosamente.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <OperationCard href="/vendors" icon={Users} title="Proveedores" description="Revisa riesgo, contratos, tratamiento de datos y transferencias." />
          <OperationCard href="/marketplace" icon={PackageCheck} title="Packs regulatorios" description="Activa capacidades versionadas con permisos y trazabilidad." />
          <OperationCard href="/review-center" icon={ShieldCheck} title="Decisiones pendientes" description="Resuelve lo que Kumplio priorizó para revisión humana." />
        </section>

        <section className="mt-10">
          <p className="text-sm font-semibold text-primary">Ámbitos activos</p>
          <h2 className="mt-1 text-2xl font-bold">Preparación por proyecto</h2>
          <div className="mt-5 space-y-4">
            {!projects?.length ? (
              <div className="rounded-2xl border bg-card p-8">
                <Boxes className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-xl font-bold">Todavía no hay proyectos activos.</h3>
                <p className="mt-2 text-sm text-muted-foreground">Completa el onboarding para crear el primer ámbito de cumplimiento.</p>
              </div>
            ) : projects.map((project) => (
              <article key={project.id} className="rounded-2xl border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{project.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Diagnóstico, brechas, plan de acción y paquete de auditoría.</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href={`/readiness/${project.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold hover:bg-muted">
                      <FileCheck2 className="h-4 w-4" /> Ver preparación
                    </Link>
                    <Link href={`/audit-prep/${project.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90">
                      Preparar auditoría <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

function summarizeQueue(jobs: Array<{ status: string; lease_expires_at: string | null }>) {
  const now = Date.now()
  return {
    queued: jobs.filter((job) => job.status === 'queued').length,
    leased: jobs.filter((job) => job.status === 'leased').length,
    retryWait: jobs.filter((job) => job.status === 'retry_wait').length,
    deadLetter: jobs.filter((job) => job.status === 'dead_letter').length,
    staleLeases: jobs.filter((job) => job.status === 'leased' && job.lease_expires_at && new Date(job.lease_expires_at).getTime() < now).length,
  }
}

function QueueMetric({ label, value, detail, alert = false }: { label: string; value: number; detail: string; alert?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${alert ? 'border-amber-500/30 bg-amber-500/5' : 'bg-background/60'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        {label === 'Reintentos' && <RefreshCw className="h-4 w-4 text-primary" />}
      </div>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

function OperationCard({ href, icon: Icon, title, description }: { href: string; icon: typeof Users; title: string; description: string }) {
  return (
    <Link href={href} className="group rounded-2xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-5 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">Abrir <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
    </Link>
  )
}
