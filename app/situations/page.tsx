import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, ArrowRight, CheckCircle2, CircleDot, ShieldAlert } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'

export const dynamic = 'force-dynamic'

type Situation = {
  id: string
  situation_type: string
  title: string
  summary: string | null
  status: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string | null
  created_at: string
}

export default async function SituationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/situations')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data, error } = await db
    .from('compliance_situations')
    .select('id,situation_type,title,summary,status,severity,recommendation,created_at')
    .eq('organization_id', access.organizationId)
    .not('status', 'in', '(resolved,dismissed)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(`No fue posible cargar las situaciones: ${error.message}`)
  const situations = (data || []) as Situation[]
  const critical = situations.filter((item) => item.severity === 'critical').length
  const high = situations.filter((item) => item.severity === 'high').length

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Situaciones</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {situations.length === 0 ? 'No hay situaciones abiertas.' : `${situations.length} situaciones están siendo gestionadas.`}
          </h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">Cada situación reúne el evento, contexto, impacto, evidencia y siguiente acción en un expediente trazable.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-full border px-3 py-1.5">{critical} críticas</span>
            <span className="rounded-full border px-3 py-1.5">{high} altas</span>
            <span className="rounded-full border px-3 py-1.5">{situations.length - critical - high} restantes</span>
          </div>
        </section>

        <section className="mt-8 space-y-4">
          {situations.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
              <h2 className="mt-4 text-xl font-bold">Todo está bajo control.</h2>
              <p className="mt-2 text-sm text-muted-foreground">Los nuevos eventos aparecerán aquí solo cuando requieran atención.</p>
            </div>
          ) : situations.map((situation) => (
            <Link key={situation.id} href={`/situations/${situation.id}`} className="block rounded-2xl border bg-card p-5 transition-colors hover:bg-muted/50 sm:p-6">
              <div className="flex items-start gap-4">
                <div className={severityTone(situation.severity)}>{severityIcon(situation.severity)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                    <span>{typeLabel(situation.situation_type)}</span>
                    <span>Impacto {severityLabel(situation.severity)}</span>
                    <span>{statusLabel(situation.status)}</span>
                    <span>{new Date(situation.created_at).toLocaleString('es-CL')}</span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold">{situation.title}</h2>
                  {situation.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{situation.summary}</p>}
                  {situation.recommendation && <p className="mt-4 text-sm leading-6"><span className="font-semibold">Siguiente paso:</span> {situation.recommendation}</p>}
                </div>
                <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-primary" />
              </div>
            </Link>
          ))}
        </section>
      </main>
    </>
  )
}

function severityTone(severity: Situation['severity']) {
  const base = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border'
  if (severity === 'critical') return `${base} border-red-600/40 bg-red-600/10 text-red-700`
  if (severity === 'high') return `${base} border-red-500/30 bg-red-500/10 text-red-600`
  if (severity === 'medium') return `${base} border-amber-500/30 bg-amber-500/10 text-amber-600`
  return `${base} border-primary/30 bg-primary/10 text-primary`
}

function severityIcon(severity: Situation['severity']) {
  if (severity === 'critical') return <ShieldAlert className="h-5 w-5" />
  if (severity === 'high') return <AlertTriangle className="h-5 w-5" />
  return <CircleDot className="h-5 w-5" />
}

function severityLabel(severity: Situation['severity']) {
  if (severity === 'critical') return 'crítico'
  if (severity === 'high') return 'alto'
  if (severity === 'low') return 'bajo'
  return 'medio'
}

function statusLabel(status: string) {
  if (status === 'analyzing') return 'En análisis'
  if (status === 'waiting_decision') return 'Espera decisión'
  if (status === 'in_progress') return 'En ejecución'
  return 'Abierta'
}

function typeLabel(type: string) {
  return type.replaceAll('_', ' ')
}
