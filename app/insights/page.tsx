import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Activity, ArrowRight, Clock3, ShieldCheck, Sparkles } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { buildConfidence, buildImpact, buildTimeline } from '@/lib/compliance/insights'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Confianza e impacto',
  description: 'Timeline organizacional, confianza de cumplimiento e impacto de obligaciones.',
  robots: { index: false, follow: false },
}

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/insights')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')
  const organizationId = membership.organization_id

  const [projectsResult, controlsResult, evidenceResult, casesResult, missionsResult, requestsResult, evidenceEventsResult, evaluationsResult, decisionsResult] = await Promise.all([
    supabase.from('projects').select('id,name').eq('organization_id', organizationId).limit(100),
    supabase.from('controls').select('id,project_id,name,owner_id,design_effectiveness,operating_effectiveness,lifecycle_status').eq('organization_id', organizationId).limit(1000),
    supabase.from('evidence').select('id,project_id,name,validation_status,expires_at').eq('organization_id', organizationId).limit(1000),
    supabase.from('compliance_cases').select('id,project_id,title,status,created_at,updated_at').eq('organization_id', organizationId).limit(500),
    supabase.from('missions').select('id,case_id,title,status,created_at,updated_at').eq('organization_id', organizationId).limit(500),
    supabase.from('evidence_requests').select('id,title,status,created_at,updated_at').eq('organization_id', organizationId).limit(500),
    supabase.from('evidence_request_events').select('id,event_type,created_at').eq('organization_id', organizationId).limit(1000),
    supabase.from('control_evaluations').select('id,control_id,evaluation_type,result,evaluated_at,created_at').eq('organization_id', organizationId).limit(1000),
    supabase.from('mission_decisions').select('id,title,status,requested_at,resolved_at,created_at').eq('organization_id', organizationId).limit(500),
  ])

  const projectIds = (projectsResult.data || []).map((row) => row.id)
  const [obligationsResult, controlObligationsResult, controlEvidenceResult] = await Promise.all([
    projectIds.length
      ? supabase.from('obligations').select('id,project_id,obligation_text,priority,status').in('project_id', projectIds).limit(2000)
      : Promise.resolve({ data: [] }),
    supabase.from('control_obligations').select('control_id,obligation_id,relationship_type').eq('organization_id', organizationId).limit(2000),
    supabase.from('control_evidence').select('control_id,evidence_id,sufficiency_status').eq('organization_id', organizationId).limit(2000),
  ])

  const controls = controlsResult.data || []
  const evidence = evidenceResult.data || []
  const cases = casesResult.data || []
  const obligations = obligationsResult.data || []
  const controlObligations = controlObligationsResult.data || []
  const controlEvidence = controlEvidenceResult.data || []

  const timeline = buildTimeline({
    cases,
    missions: missionsResult.data || [],
    evidenceRequests: requestsResult.data || [],
    evidenceEvents: evidenceEventsResult.data || [],
    evaluations: evaluationsResult.data || [],
    decisions: decisionsResult.data || [],
  })
  const confidence = buildConfidence({ obligations, controls, controlObligations, controlEvidence, evidence })
  const impact = buildImpact({ obligations, controls, controlObligations, controlEvidence, cases })

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Inteligencia operacional</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Confianza, historia e impacto en una sola vista.</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Kumplio transforma el trabajo acumulado en tres respuestas: qué ha pasado, cuánto puedes demostrar hoy y dónde un cambio tendría mayor impacto.
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Mapa de confianza</p>
                <p className="mt-2 text-5xl font-extrabold tracking-tight">{confidence.overall}%</p>
              </div>
              <ShieldCheck className="h-9 w-9 text-primary" />
            </div>
            <div className="mt-6 space-y-5">
              {confidence.dimensions.map((dimension) => (
                <Link key={dimension.key} href={dimension.href} className="block rounded-xl border p-4 transition hover:border-primary/40 hover:bg-muted/30">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold">{dimension.label}</span>
                    <span className="font-bold">{dimension.score}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${dimension.score}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{dimension.covered}/{dimension.total} · {dimension.detail}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Impacto prioritario</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Obligaciones que hoy concentran más exposición por falta de controles, evidencia, responsables o trabajo abierto.</p>
            <div className="mt-5 space-y-3">
              {impact.length === 0 ? (
                <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No hay obligaciones para analizar todavía.</p>
              ) : impact.slice(0, 12).map((item) => (
                <article key={item.obligationId} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="line-clamp-2 text-sm font-semibold">{item.title}</p>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{item.riskScore}/100</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{item.controls} controles</span><span>·</span>
                    <span>{item.evidence} evidencias</span><span>·</span>
                    <span>{item.owners} responsables</span><span>·</span>
                    <span>{item.openCases} casos abiertos</span>
                  </div>
                  <Link href={`/map?node=obligation:${item.obligationId}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    Ver relaciones <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Timeline organizacional</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Historia unificada de casos, misiones, solicitudes y movimientos de evidencia, evaluaciones y decisiones.</p>
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {timeline.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">La actividad futura aparecerá aquí automáticamente.</p>
            ) : timeline.slice(0, 40).map((event) => (
              <Link key={event.id} href={event.href || '/insights'} className="group rounded-xl border p-4 transition hover:border-primary/40 hover:bg-muted/30">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold group-hover:text-primary">{event.title}</p>
                      <span className="text-xs text-muted-foreground">{new Date(event.occurredAt).toLocaleString('es-CL')}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
