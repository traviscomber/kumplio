import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { refreshVendorAssessments } from '@/lib/compliance/operations/vendor-audit-marketplace'

export const dynamic = 'force-dynamic'

export default async function VendorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/vendors')

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')

  const assessments = await refreshVendorAssessments(admin, membership.organization_id)
  const critical = assessments.filter((item) => item.riskLevel === 'critical' || item.riskLevel === 'high').length

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Proveedores inteligentes</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {critical > 0 ? `${critical} proveedores requieren atención.` : 'No encontré proveedores críticos.'}
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Kumplio prioriza tratamiento de datos, transferencias internacionales, vigencia contractual y riesgo registrado.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          {assessments.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
              <h2 className="mt-4 text-xl font-bold">Aún no hay proveedores registrados.</h2>
            </div>
          ) : assessments.map((assessment) => (
            <article key={assessment.id} className="rounded-2xl border bg-card p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className={tone(assessment.riskLevel)}>
                  {assessment.riskLevel === 'critical' || assessment.riskLevel === 'high'
                    ? <ShieldAlert className="h-5 w-5" />
                    : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold">{assessment.vendorName}</h2>
                    <span className="rounded-full border px-2.5 py-1 text-xs font-semibold">Riesgo {label(assessment.riskLevel)}</span>
                    <span className="rounded-full border px-2.5 py-1 text-xs font-semibold">Score {assessment.riskScore}</span>
                  </div>
                  {assessment.serviceCategory && <p className="mt-1 text-sm text-muted-foreground">{assessment.serviceCategory}</p>}
                  <div className="mt-4 space-y-2">
                    {assessment.findings.map((finding) => <p key={finding.code} className="text-sm">• {finding.label}</p>)}
                  </div>
                  <p className="mt-4 text-sm leading-6"><span className="font-semibold">Siguiente acción:</span> {assessment.recommendedAction}</p>
                </div>
                <Link href={`/vendors/${assessment.vendorId}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
                  Resolver <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  )
}

function tone(level: 'low' | 'medium' | 'high' | 'critical') {
  const base = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border'
  if (level === 'critical') return `${base} border-red-600/40 bg-red-600/10 text-red-700`
  if (level === 'high') return `${base} border-red-500/30 bg-red-500/10 text-red-600`
  if (level === 'medium') return `${base} border-amber-500/30 bg-amber-500/10 text-amber-600`
  return `${base} border-primary/30 bg-primary/10 text-primary`
}

function label(level: string) {
  if (level === 'critical') return 'crítico'
  if (level === 'high') return 'alto'
  if (level === 'medium') return 'medio'
  return 'bajo'
}
