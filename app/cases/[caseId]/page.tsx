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
import { CaseManagementPanel } from '@/components/cases/case-management-panel'
import { CaseTimeline, type CaseTimelineItem } from '@/components/cases/case-timeline'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Expediente de cumplimiento',
  description: 'Vista trazable de un caso de cumplimiento KUMPLIO.',
  robots: { index: false, follow: false },
}

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
}

type JsonRecord = Record<string, unknown>

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  pending_review: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  archived: 'Archivado',
  queued: 'En cola',
  running: 'En ejecución',
  completed: 'Completado',
  failed: 'Fallido',
  paused: 'Pausado',
}

const priorityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

const agentLabels: Record<string, string> = {
  isidora: 'Isidora',
  rodrigo: 'Rodrigo',
  javier: 'Javier',
  beatriz: 'Beatriz',
  veronica: 'Verónica',
  andres: 'Andrés',
  catalina: 'Catalina',
}

const reviewLabels: Record<string, string> = {
  approved: 'aprobada',
  rejected: 'rechazada',
  changes_requested: 'con cambios solicitados',
  commented: 'comentada',
}

const fieldLabels: Record<string, string> = {
  title: 'título',
  description: 'alcance',
  status: 'estado',
  priority: 'prioridad',
  project_id: 'ámbito',
  owner_id: 'responsable',
  due_at: 'fecha objetivo',
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function displayName(profile: Profile | undefined) {
  if (!profile) return null
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
  return fullName || profile.email
}

function describeChanges(changes: unknown) {
  const root = asRecord(changes)
  const before = asRecord(root.before)
  const after = asRecord(root.after)
  const changedFields = Object.keys(after).filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
  if (!changedFields.length) return null
  return `Cambios: ${changedFields.map((field) => fieldLabels[field] || field).join(', ')}.`
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

  const [
    projectResult,
    projectsResult,
    membersResult,
    runsCountResult,
    artifactsCountResult,
    reviewsCountResult,
    workflowsCountResult,
    eventsResult,
    recentRunsResult,
    recentReviewsResult,
    recentWorkflowsResult,
  ] = await Promise.all([
    complianceCase.project_id
      ? supabase
          .from('projects')
          .select('id, name, description')
          .eq('id', complianceCase.project_id)
          .eq('organization_id', organizationId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('projects')
      .select('id, name')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(100),
    supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: true }),
    supabase.from('agent_runs').select('id', { count: 'exact', head: true }).eq('case_id', caseId),
    supabase.from('agent_artifacts').select('id', { count: 'exact', head: true }).eq('case_id', caseId),
    supabase.from('agent_reviews').select('id', { count: 'exact', head: true }).eq('case_id', caseId),
    supabase.from('agent_workflows').select('id', { count: 'exact', head: true }).eq('case_id', caseId),
    supabase
      .from('compliance_case_events')
      .select('id, event_type, summary, changes, actor_id, created_at')
      .eq('case_id', caseId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('agent_runs')
      .select('id, agent_id, status, user_id, created_at')
      .eq('case_id', caseId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('agent_reviews')
      .select('id, decision, reviewer_id, created_at')
      .eq('case_id', caseId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('agent_workflows')
      .select('id, workflow_type, status, created_by, created_at')
      .eq('case_id', caseId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const memberRows = membersResult.data || []
  const eventRows = eventsResult.data || []
  const runRows = recentRunsResult.data || []
  const reviewRows = recentReviewsResult.data || []
  const workflowRows = recentWorkflowsResult.data || []

  const profileIds = [...new Set([
    complianceCase.owner_id,
    ...memberRows.map((member) => member.user_id),
    ...eventRows.map((event) => event.actor_id),
    ...runRows.map((run) => run.user_id),
    ...reviewRows.map((review) => review.reviewer_id),
    ...workflowRows.map((workflow) => workflow.created_by),
  ].filter((id): id is string => Boolean(id)))]

  const { data: profileRows } = profileIds.length
    ? await supabase.from('profiles').select('id, first_name, last_name, email').in('id', profileIds)
    : { data: [] as Profile[] }

  const profiles = new Map((profileRows || []).map((profile) => [profile.id, profile as Profile]))
  const projects = (projectsResult.data || []).map((project) => ({ id: project.id, name: project.name }))
  const projectMap = new Map(projects.map((project) => [project.id, project.name]))
  const members = memberRows.map((member) => {
    const profile = profiles.get(member.user_id)
    return {
      id: member.user_id,
      name: displayName(profile) || `Miembro ${member.user_id.slice(0, 8)}`,
      email: profile?.email || 'Sin correo disponible',
      role: member.role,
    }
  })

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
    { label: 'Ejecuciones IA', value: runsCountResult.count || 0, icon: Bot, href: '/agents' },
    { label: 'Artefactos', value: artifactsCountResult.count || 0, icon: FileCheck2, href: '/agents/reviews' },
  ]

  const timeline: CaseTimelineItem[] = [
    ...eventRows.map((event) => ({
      id: event.id,
      type: event.event_type === 'case_created' ? 'case_created' as const : 'case_updated' as const,
      title: event.summary,
      description: event.event_type === 'case_created'
        ? 'Se registró el expediente y su clasificación inicial.'
        : describeChanges(event.changes),
      actor: displayName(profiles.get(event.actor_id || '')),
      createdAt: event.created_at,
    })),
    ...runRows.map((run) => ({
      id: run.id,
      type: 'agent_run' as const,
      title: `Ejecución IA · ${agentLabels[run.agent_id] || run.agent_id}`,
      description: `Estado: ${statusLabels[run.status] || run.status}.`,
      actor: displayName(profiles.get(run.user_id)),
      createdAt: run.created_at,
      href: '/agents',
    })),
    ...workflowRows.map((workflow) => ({
      id: workflow.id,
      type: 'workflow' as const,
      title: `Workflow · ${workflow.workflow_type.replaceAll('_', ' ')}`,
      description: `Estado: ${statusLabels[workflow.status] || workflow.status}.`,
      actor: displayName(profiles.get(workflow.created_by)),
      createdAt: workflow.created_at,
      href: `/agents/workflows/${workflow.id}`,
    })),
    ...reviewRows.map((review) => ({
      id: review.id,
      type: 'review' as const,
      title: `Revisión ${reviewLabels[review.decision] || review.decision}`,
      description: 'La decisión quedó registrada como parte de la trazabilidad del expediente.',
      actor: displayName(profiles.get(review.reviewer_id)),
      createdAt: review.created_at,
      href: '/agents/reviews',
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 80)

  const ownerName = displayName(profiles.get(complianceCase.owner_id || ''))

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
                  <dt>Responsable</dt>
                  <dd className="text-right font-medium text-foreground">{ownerName || 'Sin asignar'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Fecha objetivo</dt>
                  <dd className="font-medium text-foreground">{complianceCase.due_at ? new Date(complianceCase.due_at).toLocaleDateString('es-CL') : 'Sin definir'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Creado</dt>
                  <dd className="font-medium text-foreground">{new Date(complianceCase.created_at).toLocaleDateString('es-CL')}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Revisiones</dt>
                  <dd className="font-medium text-foreground">{reviewsCountResult.count || 0}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Workflows</dt>
                  <dd className="font-medium text-foreground">{workflowsCountResult.count || 0}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <CaseManagementPanel
            complianceCase={{
              id: complianceCase.id,
              title: complianceCase.title,
              description: complianceCase.description,
              status: complianceCase.status as 'draft' | 'active' | 'pending_review' | 'approved' | 'rejected' | 'archived',
              priority: complianceCase.priority as 'low' | 'medium' | 'high' | 'critical',
              projectId: complianceCase.project_id,
              ownerId: complianceCase.owner_id,
              dueAt: complianceCase.due_at,
            }}
            projects={projects}
            members={members}
          />
        </div>

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

        <div className="mt-6">
          <CaseTimeline items={timeline} />
        </div>
      </main>
    </>
  )
}
