import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  FileCheck2,
  FileText,
  ListChecks,
  Network,
  ShieldAlert,
} from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Expediente de cumplimiento',
  description: 'Vista trazable de un caso de cumplimiento KUMPLIO.',
  robots: { index: false, follow: false },
}

export default async function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/cases/${caseId}`)

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) notFound()
  const organizationId = membership.organization_id

  const { data: complianceCase } = await supabase
    .from('compliance_cases')
    .select('id, title, description, status, priority, project_id, owner_id, due_at, created_at, updated_at')
    .eq('id', caseId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!complianceCase) notFound()

  const projectResult = complianceCase.project_id
    ? await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', complianceCase.project_id)
        .eq('organization_id', organizationId)
        .maybeSingle()
    : { data: null }

  const [runs, artifacts, reviews, workflows] = await Promise.all([
    supabase.from('agent_runs').select('id', { count: 'exact', head: true }).eq('case_id', caseId),
    supabase.from('agent_artifacts').select('id', { count: 'exact', head: true }).eq('case_id', caseId),
    supabase.from('agent_reviews').select('id', { count: 'exact', head: true }).eq('case_id', caseId),
    supabase.from('agent_workflows').select('id', { count: 'exact', head: true }).eq('case_id', caseId),
  ])

  const projectCounts = complianceCase.project_id
    ? await Promise.all([
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('project_id', complianceCase.project_id),
        supabase.from('obligations').select('id', { count: 'exact', head: true }).eq('project_id', complianceCase.project_id),
        supabase.from('risks').select('id', { count: 'exact', head: true }).eq('project_id', complianceCase.project_id),
        supabase.from('roadmaps').select('id', { count: 'exact', head: true }).eq('project_id', complianceCase.project_id),
      ])
    : []

  const [documentsCount, obligationsCount, risksCount, actionsCount] = projectCounts.length
    ? projectCounts.map((result) => result.count || 0)
    : [0, 0, 0, 0]

  const metrics = [
    { label: 'Fuentes', value: documentsCount, icon: FileText, href: '/documents' },
    { label: 'Obligaciones', value: obligationsCount, icon: ListChecks, href: '/obligations' },
    { label: 'Riesgos', value: risksCount, icon: ShieldAlert, href: '/risks' },
    { label: 'Acciones', value: actionsCount, icon: CheckCircle2, href: '/roadmaps' },
    { label: 'Ejecuciones IA', value: runs.count || 0, icon: Bot, href: '/agents' },
    { label: 'Artefactos', value: artifacts.count || 0, icon: FileCheck2, href: '/agents/reviews' },
  ]

  const statusLabels: Record<string, string> = {
    draft: 'Borrador',
    active: 'Activo',
    pending_review: 'En revisión',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    archived: 'Archivado',
  }

  const priorityLabels: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica',
  }

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <Link href="/cases" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a casos
        </Link>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                  {statusLabels[complianceCase.status] || complianceCase.status}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                  Prioridad {priorityLabels[complianceCase.priority] || complianceCase.priority}
                </span>
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-bold md:text-4xl">{complianceCase.title}</h1>
              <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
                {complianceCase.description || 'Este expediente todavía no tiene una descripción detallada de alcance.'}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background p-4 text-sm lg:min-w-72">
              <p className="font-semibold">Contexto del expediente</p>
              <dl className="mt-3 space-y-3 text-muted-foreground">
                <div className="flex justify-between gap-4">
                  <dt>Ámbito</dt>
                  <dd className="text-right font-medium text-foreground">{projectResult.data?.name || 'Transversal'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Creado</dt>
                  <dd className="font-medium text-foreground">{new Date(complianceCase.created_at).toLocaleDateString('es-CL')}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Revisiones</dt>
                  <dd className="font-medium text-foreground">{reviews.count || 0}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Workflows</dt>
                  <dd className="font-medium text-foreground">{workflows.count || 0}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map(({ label, value, icon: Icon, href }) => (
            <Link key={label} href={href} className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/40">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-3xl font-bold">{value}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-center gap-3">
            <Network className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Ruta del expediente</h2>
              <p className="text-sm text-muted-foreground">Avanza desde la fuente hasta una decisión revisada y documentada.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {[
              ['1', 'Fuentes', 'Carga contratos, políticas y normativa.', '/documents'],
              ['2', 'Análisis', 'Identifica obligaciones y riesgos.', '/agents'],
              ['3', 'Controles', 'Relaciona controles y evidencia.', '/controls'],
              ['4', 'Revisión', 'Aprueba o solicita cambios.', '/agents/reviews'],
              ['5', 'Acción', 'Define responsables y seguimiento.', '/roadmaps'],
            ].map(([step, title, description, href]) => (
              <Link key={step} href={href} className="rounded-xl border border-border bg-background p-4 transition hover:border-primary/40">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{step}</span>
                <p className="mt-4 font-semibold">{title}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
