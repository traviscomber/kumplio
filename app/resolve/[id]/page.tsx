import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, FileCheck2, Scale, ShieldQuestion } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildMissionExplanation } from '@/lib/explainability/engine'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

type Mission = {
  id: string
  title: string
  objective: string
  status: string
  due_at: string | null
  organization_id: string
}

type CapabilityRun = {
  id: string
  status: string
  capability_id: string
}

type MissionResult = {
  id: string
  title: string
  status: string
  result_type: string
  created_at: string
  summary: string | null
  evidence_ids: string[] | null
}

type Evidence = {
  id: string
  name: string
  source: string | null
  issued_at: string | null
  expires_at: string | null
  validation_status: string | null
  metadata: Record<string, unknown> | null
}

export default async function ResolvePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/resolve/${id}`)

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')

  const [{ data: mission, error: missionError }, { data: runRows, error: runsError }, { data: resultRows, error: resultsError }] = await Promise.all([
    admin
      .from('missions')
      .select('id,title,objective,status,due_at,organization_id')
      .eq('id', id)
      .eq('organization_id', membership.organization_id)
      .maybeSingle(),
    admin
      .from('mission_capability_runs')
      .select('id,status,capability_id')
      .eq('mission_id', id)
      .order('sequence'),
    admin
      .from('mission_results')
      .select('id,title,status,result_type,created_at,summary,evidence_ids')
      .eq('mission_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (missionError) throw new Error(`No fue posible cargar la situación: ${missionError.message}`)
  if (runsError) throw new Error(`No fue posible cargar la trazabilidad: ${runsError.message}`)
  if (resultsError) throw new Error(`No fue posible cargar los resultados: ${resultsError.message}`)
  if (!mission) notFound()

  const typedMission = mission as Mission
  const runs = (runRows || []) as CapabilityRun[]
  const results = (resultRows || []) as MissionResult[]
  const evidenceIds = [...new Set(results.flatMap((result) => result.evidence_ids || []))]
  let evidence: Evidence[] = []

  if (evidenceIds.length > 0) {
    const { data: evidenceRows, error: evidenceError } = await admin
      .from('evidence')
      .select('id,name,source,issued_at,expires_at,validation_status,metadata')
      .eq('organization_id', membership.organization_id)
      .in('id', evidenceIds)

    if (evidenceError) throw new Error(`No fue posible cargar la evidencia: ${evidenceError.message}`)
    evidence = (evidenceRows || []) as Evidence[]
  }

  const explanation = buildMissionExplanation({
    mission: {
      id: typedMission.id,
      title: typedMission.title,
      objective: typedMission.objective,
      status: typedMission.status,
      dueAt: typedMission.due_at,
    },
    runs: runs.map((run) => ({
      id: run.id,
      status: run.status,
      capabilityId: run.capability_id,
    })),
    results: results.map((result) => ({
      id: result.id,
      title: result.title,
      status: result.status,
      resultType: result.result_type,
      createdAt: result.created_at,
      summary: result.summary,
      evidenceIds: result.evidence_ids || [],
    })),
    evidence: evidence.map((item) => ({
      id: item.id,
      name: item.name,
      source: item.source,
      issuedAt: item.issued_at,
      expiresAt: item.expires_at,
      validationStatus: item.validation_status,
      metadata: item.metadata,
    })),
  })

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al estado de hoy
        </Link>

        <header className="mt-6 border-b pb-6">
          <p className="text-sm font-semibold text-primary">Situación que requiere revisión</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{typedMission.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{typedMission.objective}</p>
        </header>

        <div className="mt-8 space-y-6">
          <section className="rounded-2xl border bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Encontré</p>
            <h2 className="mt-3 text-2xl font-bold">{explanation.finding.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{explanation.finding.summary}</p>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <div className="flex items-start gap-3">
              <Scale className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Por qué importa</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{explanation.why}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <div className="flex items-start gap-3">
              <ShieldQuestion className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Confianza de la conclusión</p>
                <p className="mt-3 font-bold">{confidenceLabel(explanation.confidence.level)}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{explanation.confidence.reason}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <div className="flex items-start gap-3">
              <FileCheck2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Preparé</p>
                <div className="mt-4 space-y-3">
                  {explanation.prepared.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm leading-6">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <details className="rounded-2xl border bg-card p-6">
            <summary className="cursor-pointer text-sm font-bold">Ver evidencia utilizada</summary>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              {explanation.evidence.length === 0 ? (
                <p>No encontré evidencia vinculada suficiente. Esta limitación reduce la confianza de la conclusión.</p>
              ) : explanation.evidence.map((item) => (
                <article key={item.id} className="rounded-xl border bg-muted/20 p-4">
                  <p className="font-semibold text-foreground">{item.label}</p>
                  <p className="mt-1">Fuente: {item.source}</p>
                  {item.date && <p>Fecha: {new Date(item.date).toLocaleDateString('es-CL')}</p>}
                  {item.version && <p>Versión: {item.version}</p>}
                </article>
              ))}
            </div>
          </details>

          <details className="rounded-2xl border bg-card p-6">
            <summary className="cursor-pointer text-sm font-bold">Ver fundamento legal</summary>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              {explanation.legalBasis.length === 0 ? (
                <p>No hay una referencia legal estructurada vinculada a esta misión. La decisión debe basarse en la evidencia y revisión disponible.</p>
              ) : explanation.legalBasis.map((reference) => (
                <div key={`${reference.label}-${reference.article || ''}`}>
                  <p className="font-semibold text-foreground">{reference.label}</p>
                  {reference.article && <p>Artículo: {reference.article}</p>}
                  {reference.effectiveDate && <p>Vigencia: {new Date(reference.effectiveDate).toLocaleDateString('es-CL')}</p>}
                </div>
              ))}
            </div>
          </details>

          <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <p className="text-sm font-semibold">Mi recomendación</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{explanation.recommendation}</p>
            <p className="mt-4 text-sm font-semibold">La decisión sigue en tus manos.</p>
            <Link
              href={explanation.nextAction.href}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 sm:w-auto"
            >
              {explanation.nextAction.label} <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </main>
    </>
  )
}

function confidenceLabel(level: 'low' | 'medium' | 'high') {
  if (level === 'high') return 'Alta'
  if (level === 'medium') return 'Media'
  return 'Baja'
}
