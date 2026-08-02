import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  CalendarClock,
  FileCheck2,
  Link2,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import {
  ControlAssurancePanel,
  type ControlEvaluationItem,
} from '@/components/controls/control-assurance-panel'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Evaluación de control',
  description: 'Ficha trazable de diseño, operación y evidencia de un control KUMPLIO.',
  robots: { index: false, follow: false },
}

const effectivenessLabels: Record<string, string> = {
  not_evaluated: 'No evaluado',
  effective: 'Efectivo',
  partial: 'Parcial',
  ineffective: 'Inefectivo',
  not_applicable: 'No aplica',
}

const natureLabels: Record<string, string> = {
  preventive: 'Preventivo',
  detective: 'Detectivo',
  corrective: 'Correctivo',
}

const modeLabels: Record<string, string> = {
  manual: 'Manual',
  automated: 'Automatizado',
  hybrid: 'Híbrido',
}

function displayProfile(profile: { first_name: string | null; last_name: string | null; email: string } | undefined) {
  if (!profile) return null
  return [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || profile.email
}

export default async function ControlDetailPage({ params }: { params: Promise<{ controlId: string }> }) {
  const { controlId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/controls/${controlId}`)

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')
  const organizationId = membership.organization_id

  const { data: control } = await supabase
    .from('controls')
    .select('id, organization_id, project_id, obligation_id, code, name, description, control_objective, control_nature, execution_mode, frequency, owner_id, lifecycle_status, design_effectiveness, operating_effectiveness, last_evaluated_at, next_evaluation_at, created_at')
    .eq('id', controlId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!control?.project_id) notFound()

  const [
    projectResult,
    obligationLinksResult,
    evidenceLinksResult,
    casesResult,
    evaluationsResult,
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name')
      .eq('id', control.project_id)
      .eq('organization_id', organizationId)
      .maybeSingle(),
    supabase
      .from('control_obligations')
      .select('obligation_id, relationship_type')
      .eq('control_id', controlId)
      .eq('organization_id', organizationId)
      .eq('project_id', control.project_id),
    supabase
      .from('control_evidence')
      .select('evidence_id, sufficiency_status, relevance, reviewed_at')
      .eq('control_id', controlId)
      .eq('organization_id', organizationId)
      .eq('project_id', control.project_id),
    supabase
      .from('compliance_cases')
      .select('id, title')
      .eq('organization_id', organizationId)
      .eq('project_id', control.project_id)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('control_evaluations')
      .select('id, case_id, evaluation_type, result, summary, sample_size, period_start, period_end, evaluated_by, evaluated_at')
      .eq('organization_id', organizationId)
      .eq('project_id', control.project_id)
      .eq('control_id', controlId)
      .order('evaluated_at', { ascending: false })
      .limit(200),
  ])

  const evaluationRows = evaluationsResult.data || []
  const evaluationIds = evaluationRows.map((item) => item.id)
  const { data: evaluationEvidenceRows } = evaluationIds.length
    ? await supabase
        .from('control_evaluation_evidence')
        .select('evaluation_id, evidence_id')
        .eq('organization_id', organizationId)
        .eq('project_id', control.project_id)
        .in('evaluation_id', evaluationIds)
    : { data: [] as Array<{ evaluation_id: string; evidence_id: string }> }

  const obligationIds = [...new Set([
    control.obligation_id,
    ...(obligationLinksResult.data || []).map((link) => link.obligation_id),
  ].filter((id): id is string => Boolean(id)))]

  const evidenceIds = [...new Set([
    ...(evidenceLinksResult.data || []).map((link) => link.evidence_id),
    ...(evaluationEvidenceRows || []).map((link) => link.evidence_id),
  ])]

  const profileIds = [...new Set([
    control.owner_id,
    ...evaluationRows.map((item) => item.evaluated_by),
  ].filter((id): id is string => Boolean(id)))]

  const [obligationsResult, evidenceResult, profilesResult] = await Promise.all([
    obligationIds.length
      ? supabase.from('obligations').select('id, obligation_text, status, priority').in('id', obligationIds)
      : Promise.resolve({ data: [] as Array<{ id: string; obligation_text: string; status: string | null; priority: string | null }> }),
    evidenceIds.length
      ? supabase.from('evidence').select('id, name, validation_status, integrity_status, expires_at').eq('organization_id', organizationId).in('id', evidenceIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string; validation_status: string; integrity_status: string; expires_at: string | null }> }),
    profileIds.length
      ? supabase.from('profiles').select('id, first_name, last_name, email').in('id', profileIds)
      : Promise.resolve({ data: [] as Array<{ id: string; first_name: string | null; last_name: string | null; email: string }> }),
  ])

  const profiles = new Map((profilesResult.data || []).map((profile) => [profile.id, profile]))
  const cases = casesResult.data || []
  const caseTitles = new Map(cases.map((item) => [item.id, item.title]))
  const evidenceRows = evidenceResult.data || []
  const evidenceNames = new Map(evidenceRows.map((item) => [item.id, item.name]))
  const evidenceLinkMap = new Map((evidenceLinksResult.data || []).map((link) => [link.evidence_id, link]))

  const evaluationEvidenceMap = new Map<string, string[]>()
  for (const link of evaluationEvidenceRows || []) {
    const current = evaluationEvidenceMap.get(link.evaluation_id) || []
    const name = evidenceNames.get(link.evidence_id)
    if (name) current.push(name)
    evaluationEvidenceMap.set(link.evaluation_id, current)
  }

  const evaluations: ControlEvaluationItem[] = evaluationRows.map((item) => ({
    id: item.id,
    evaluationType: item.evaluation_type as 'design' | 'operating',
    result: item.result as 'effective' | 'partial' | 'ineffective' | 'not_applicable',
    summary: item.summary,
    sampleSize: item.sample_size,
    periodStart: item.period_start,
    periodEnd: item.period_end,
    evaluatedAt: item.evaluated_at,
    evaluatorName: displayProfile(profiles.get(item.evaluated_by || '')),
    caseId: item.case_id,
    caseTitle: item.case_id ? caseTitles.get(item.case_id) || null : null,
    evidenceNames: evaluationEvidenceMap.get(item.id) || [],
  }))

  const evidence = (evidenceLinksResult.data || []).flatMap((link) => {
    const item = evidenceRows.find((row) => row.id === link.evidence_id)
    return item ? [{
      id: item.id,
      name: item.name,
      validationStatus: item.validation_status,
      integrityStatus: item.integrity_status,
      sufficiencyStatus: link.sufficiency_status,
      expiresAt: item.expires_at,
    }] : []
  })

  const ownerName = displayProfile(profiles.get(control.owner_id || ''))

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <Link href="/controls" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a controles
        </Link>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">{natureLabels[control.control_nature] || control.control_nature}</span>
                <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{modeLabels[control.execution_mode] || control.execution_mode}</span>
                <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{control.lifecycle_status}</span>
              </div>
              <h1 className="mt-4 text-3xl font-bold md:text-4xl">{control.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{projectResult.data?.name || 'Ámbito sin nombre'}{control.code ? ` · ${control.code}` : ''}</p>
              {control.description && <p className="mt-4 leading-7 text-muted-foreground">{control.description}</p>}
              {control.control_objective && (
                <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Objetivo del control</p>
                  <p className="mt-2 text-sm leading-6">{control.control_objective}</p>
                </div>
              )}
            </div>

            <dl className="grid min-w-72 gap-3 rounded-xl border border-border bg-background p-4 text-sm">
              <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><UserRound className="h-4 w-4" /> Responsable</dt><dd className="text-right font-semibold">{ownerName || 'Sin asignar'}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><CalendarClock className="h-4 w-4" /> Frecuencia</dt><dd className="font-semibold">{control.frequency || 'Sin definir'}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Próxima evaluación</dt><dd className="font-semibold">{control.next_evaluation_at ? new Date(control.next_evaluation_at).toLocaleDateString('es-CL') : 'Sin programar'}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Última evaluación</dt><dd className="font-semibold">{control.last_evaluated_at ? new Date(control.last_evaluated_at).toLocaleDateString('es-CL') : 'Sin evaluar'}</dd></div>
            </dl>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="rounded-xl border border-border bg-card p-5">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">Diseño</p>
            <p className="mt-1 text-xl font-bold">{effectivenessLabels[control.design_effectiveness] || control.design_effectiveness}</p>
          </article>
          <article className="rounded-xl border border-border bg-card p-5">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">Operación</p>
            <p className="mt-1 text-xl font-bold">{effectivenessLabels[control.operating_effectiveness] || control.operating_effectiveness}</p>
          </article>
          <article className="rounded-xl border border-border bg-card p-5">
            <FileCheck2 className="h-5 w-5 text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">Evidencias vinculadas</p>
            <p className="mt-1 text-xl font-bold">{evidence.length}</p>
          </article>
        </section>

        {(obligationsResult.data || []).length > 0 && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" /><h2 className="font-bold">Obligaciones cubiertas</h2></div>
            <div className="mt-4 space-y-3">
              {(obligationsResult.data || []).map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm leading-6">{item.obligation_text}</p>
                  <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                    {item.status && <span>{item.status}</span>}
                    {item.priority && <span>Prioridad: {item.priority}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-6">
          <ControlAssurancePanel
            controlId={control.id}
            designEffectiveness={control.design_effectiveness}
            operatingEffectiveness={control.operating_effectiveness}
            evidence={evidence}
            cases={cases}
            evaluations={evaluations}
          />
        </div>
      </main>
    </>
  )
}
