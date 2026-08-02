import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  ExternalLink,
  ShieldCheck,
  Wrench,
  XCircle,
} from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { getReadinessSnapshot, type ReadinessState } from '@/lib/readiness'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Estado de preparación',
  description: 'Diagnóstico seguro para validar el primer recorrido productivo de KUMPLIO.',
  robots: { index: false, follow: false },
}

const stateLabels: Record<ReadinessState, string> = {
  ready: 'Listo',
  pending: 'Pendiente',
  blocked: 'Bloqueado',
  manual: 'Comprobación manual',
}

const stateClasses: Record<ReadinessState, string> = {
  ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  blocked: 'border-destructive/30 bg-destructive/10 text-destructive',
  manual: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
}

const stateIcons = {
  ready: CheckCircle2,
  pending: CircleDashed,
  blocked: XCircle,
  manual: Wrench,
} satisfies Record<ReadinessState, typeof CheckCircle2>

async function resolveOrigin() {
  const requestHeaders = await headers()
  const forwardedHost = requestHeaders.get('x-forwarded-host')
  const host = forwardedHost || requestHeaders.get('host') || 'www.kumplio.app'
  const protocol = requestHeaders.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}

export default async function ReadinessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/readiness')

  const snapshot = await getReadinessSnapshot(await resolveOrigin())
  const readyCount = snapshot.checks.filter((check) => check.state === 'ready').length
  const blockedCount = snapshot.checks.filter((check) => check.state === 'blocked').length
  const manualCount = snapshot.checks.filter((check) => check.state === 'manual').length
  const pendingCount = snapshot.checks.filter((check) => check.state === 'pending').length
  const total = snapshot.checks.length

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Sprint 1 · Production Validation</p>
              <h1 className="mt-1 text-3xl font-bold md:text-4xl">Estado de preparación</h1>
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
                Diagnóstico seguro del recorrido productivo. Muestra estados y acciones pendientes sin exponer claves, tokens ni valores de configuración.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 text-sm lg:min-w-72">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Comprobaciones listas</span>
                <strong>{readyCount} de {total}</strong>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((readyCount / total) * 100)}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Generado {new Date(snapshot.generatedAt).toLocaleString('es-CL')} desde {snapshot.origin}.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Listas', readyCount, CheckCircle2, 'text-emerald-600'],
            ['Pendientes', pendingCount, CircleDashed, 'text-amber-600'],
            ['Manuales', manualCount, Wrench, 'text-sky-600'],
            ['Bloqueadas', blockedCount, AlertTriangle, 'text-destructive'],
          ].map(([label, value, Icon, iconClass]) => (
            <article key={String(label)} className="rounded-xl border border-border bg-card p-5">
              <Icon className={`h-5 w-5 ${String(iconClass)}`} />
              <p className="mt-3 text-sm text-muted-foreground">{String(label)}</p>
              <p className="mt-1 text-3xl font-bold">{Number(value)}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          {snapshot.checks.map((check) => {
            const Icon = stateIcons[check.state]
            return (
              <article key={check.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-4">
                  <div className={`rounded-xl border p-2.5 ${stateClasses[check.state]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-bold">{check.label}</h2>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${stateClasses[check.state]}`}>
                        {stateLabels[check.state]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{check.detail}</p>
                    {check.action && (
                      <div className="mt-3 rounded-lg bg-muted/60 p-3 text-xs leading-5">
                        <strong>Siguiente acción:</strong> {check.action}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><ClipboardCheck className="h-5 w-5" /></div>
              <div>
                <h2 className="text-xl font-bold">Recorrido real requerido</h2>
                <p className="text-sm text-muted-foreground">El Sprint 1 no se cierra con datos insertados directamente en producción.</p>
              </div>
            </div>

            <ol className="mt-6 grid gap-3 md:grid-cols-2">
              {[
                'Registrar una cuenta desde producción.',
                'Confirmar el correo y regresar por el callback.',
                'Completar onboarding y crear el workspace.',
                'Crear el primer expediente y su ámbito.',
                'Registrar un control y una evidencia.',
                'Vincular ambos al expediente.',
                'Evaluar el control con evidencia real.',
                'Crear, entregar y revisar una solicitud.',
              ].map((step, index) => (
                <li key={step} className="flex gap-3 rounded-xl border border-border bg-background p-4 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
                  <span className="leading-6">{step}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-xl font-bold">Workspace actual</h2>
            <dl className="mt-5 space-y-3 text-sm">
              {[
                ['Ámbitos', snapshot.workspace.projects],
                ['Casos', snapshot.workspace.cases],
                ['Controles', snapshot.workspace.controls],
                ['Evidencias', snapshot.workspace.evidence],
                ['Evaluaciones', snapshot.workspace.evaluations],
                ['Solicitudes', snapshot.workspace.evidenceRequests],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                  <dt className="text-muted-foreground">{String(label)}</dt>
                  <dd className="font-bold">{Number(value)}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 grid gap-2">
              <Link href="/onboarding" className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground">
                Continuar onboarding
              </Link>
              <Link href="/api/readiness" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
                Ver diagnóstico JSON <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </section>
      </main>
    </>
  )
}
