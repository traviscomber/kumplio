import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ArrowLeft, ArrowRight, CheckCircle2, FileSearch, ShieldAlert } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { classifyDocument } from '@/lib/document-intelligence/classifier'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ projectId: string }> }

type Gap = {
  id: string
  obligation_id: string
  coverage_status: 'covered' | 'partial' | 'missing'
  priority: 'low' | 'medium' | 'high' | 'critical'
  rationale: string
  evidence_count: number
  control_count: number
  obligations: { obligation_text: string } | null
}

type PlanItem = {
  id: string
  sequence: number
  title: string
  objective: string
  target_date: string
  status: string
  mission_id: string | null
}

export default async function ReadinessPage({ params }: PageProps) {
  const { projectId } = await params
  const { user, organizationId } = await requireProjectAccess(projectId)
  const admin = createAdminClient()

  const [{ data: project }, { data: documents }] = await Promise.all([
    admin.from('projects').select('id,name,description,compliance_law').eq('id', projectId).eq('organization_id', organizationId).maybeSingle(),
    admin.from('documents').select('id,name,file_url,document_type').eq('project_id', projectId).order('created_at', { ascending: false }),
  ])

  if (!project) notFound()

  for (const document of documents || []) {
    const result = classifyDocument({ name: document.name, currentType: document.document_type, fileUrl: document.file_url })
    await admin.from('document_intelligence').upsert({
      document_id: document.id,
      project_id: projectId,
      organization_id: organizationId,
      classification: result.classification,
      confidence: result.confidence,
      extracted_metadata: { ...result.metadata, reason: result.reason },
      analyzed_at: new Date().toISOString(),
      engine_version: 'document-intelligence-v1',
    }, { onConflict: 'document_id' })
  }

  await admin.rpc('refresh_compliance_gaps_v1', { p_project_id: projectId })

  const [{ data: intelligence }, { data: gapRows }, { data: planRows }] = await Promise.all([
    admin.from('document_intelligence').select('id,classification,confidence').eq('project_id', projectId),
    admin
      .from('compliance_gaps')
      .select('id,obligation_id,coverage_status,priority,rationale,evidence_count,control_count,obligations(obligation_text)')
      .eq('project_id', projectId),
    admin
      .from('compliance_action_plan_items')
      .select('id,sequence,title,objective,target_date,status,mission_id')
      .eq('project_id', projectId)
      .order('sequence'),
  ])

  const gaps = (gapRows || []) as unknown as Gap[]
  const plan = (planRows || []) as PlanItem[]
  const covered = gaps.filter((gap) => gap.coverage_status === 'covered').length
  const partial = gaps.filter((gap) => gap.coverage_status === 'partial').length
  const missing = gaps.filter((gap) => gap.coverage_status === 'missing').length
  const classified = intelligence?.filter((item) => item.classification !== 'other').length || 0

  async function generatePlan() {
    'use server'
    const access = await requireProjectAccess(projectId)
    const serverAdmin = createAdminClient()
    const { error } = await serverAdmin.rpc('generate_compliance_action_plan_v1', {
      p_project_id: projectId,
      p_created_by: access.user.id,
    })
    if (error) throw new Error(`No fue posible generar el plan: ${error.message}`)
    revalidatePath(`/readiness/${projectId}`)
    revalidatePath('/dashboard')
  }

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al estado de hoy
        </Link>

        <header className="mt-6 max-w-3xl">
          <p className="text-sm font-semibold text-primary">Preparación de cumplimiento</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{project.name}</h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Kumplio clasificó los documentos disponibles, comparó obligaciones, controles y evidencia, y preparó las brechas que requieren una acción.
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Documentos clasificados" value={`${classified}/${documents?.length || 0}`} />
          <Metric label="Obligaciones cubiertas" value={covered} tone="healthy" />
          <Metric label="Cobertura parcial" value={partial} tone="attention" />
          <Metric label="Sin evidencia suficiente" value={missing} tone="critical" />
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Gap analysis</p>
              <h2 className="mt-1 text-2xl font-bold">Qué falta para demostrar cumplimiento</h2>
            </div>
            {gaps.some((gap) => gap.coverage_status !== 'covered') && (
              <form action={generatePlan}>
                <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90">
                  Generar plan de acción <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>

          <div className="mt-5 space-y-4">
            {gaps.length === 0 ? (
              <EmptyState />
            ) : gaps.map((gap) => (
              <article key={gap.id} className="rounded-2xl border bg-card p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className={gapTone(gap.coverage_status)}>
                    {gap.coverage_status === 'covered' ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      <span>{coverageLabel(gap.coverage_status)}</span><span>·</span><span>Prioridad {gap.priority}</span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold">{gap.obligations?.obligation_text || 'Obligación de cumplimiento'}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{gap.rationale}</p>
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">
                      {gap.control_count} controles · {gap.evidence_count} evidencias validadas
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border bg-muted/20 p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Plan ejecutable</p>
          <h2 className="mt-1 text-2xl font-bold">Misiones creadas desde las brechas</h2>
          {plan.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Genera el plan para convertir cada brecha abierta en una misión trazable.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {plan.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-2xl border bg-card p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{item.sequence}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.objective}</p>
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">Fecha objetivo: {new Date(item.target_date).toLocaleDateString('es-CL')}</p>
                  </div>
                  {item.mission_id && (
                    <Link href={`/resolve/${item.mission_id}`} className="self-center text-sm font-bold text-primary">Resolver</Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}

async function requireProjectAccess(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/readiness/${projectId}`)
  const admin = createAdminClient()
  const { data: project } = await admin.from('projects').select('organization_id').eq('id', projectId).maybeSingle()
  if (!project?.organization_id) notFound()
  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('organization_id', project.organization_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!membership) notFound()
  return { user, organizationId: project.organization_id as string }
}

function Metric({ label, value, tone = 'neutral' }: { label: string; value: string | number; tone?: 'neutral' | 'healthy' | 'attention' | 'critical' }) {
  const border = tone === 'critical' ? 'border-red-500/35' : tone === 'attention' ? 'border-amber-500/35' : tone === 'healthy' ? 'border-emerald-500/30' : ''
  return <div className={`rounded-2xl border bg-card p-5 ${border}`}><p className="text-3xl font-extrabold">{value}</p><p className="mt-2 text-sm text-muted-foreground">{label}</p></div>
}

function gapTone(status: Gap['coverage_status']) {
  const base = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border'
  if (status === 'covered') return `${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-700`
  if (status === 'partial') return `${base} border-amber-500/30 bg-amber-500/10 text-amber-700`
  return `${base} border-red-500/30 bg-red-500/10 text-red-700`
}

function coverageLabel(status: Gap['coverage_status']) {
  if (status === 'covered') return 'Cubierto'
  if (status === 'partial') return 'Parcial'
  return 'Sin evidencia'
}

function EmptyState() {
  return <div className="rounded-2xl border bg-card p-8 text-center"><FileSearch className="mx-auto h-9 w-9 text-primary" /><h3 className="mt-4 text-xl font-bold">Todavía no hay obligaciones para comparar.</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Cuando el proyecto tenga obligaciones, controles o evidencia, esta vista calculará automáticamente la preparación.</p></div>
}
