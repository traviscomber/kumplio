import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, FileClock } from 'lucide-react'
import {
  EvidenceRequestsWorkspace,
  type EvidenceRequestItem,
} from '@/components/evidence/evidence-requests-workspace'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Solicitudes de evidencia',
  description: 'Seguimiento auditable de solicitudes, entregas y revisiones de evidencia KUMPLIO.',
  robots: { index: false, follow: false },
}

type SearchParams = Promise<{
  projectId?: string
  controlId?: string
  caseId?: string
}>

export default async function EvidenceRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/evidence/requests')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')
  const organizationId = membership.organization_id

  const [projectsResult, membersResult, controlsResult, casesResult, evidenceResult, requestsResult, eventsResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(100),
    supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: true }),
    supabase
      .from('controls')
      .select('id, project_id, name')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('compliance_cases')
      .select('id, project_id, title')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('evidence')
      .select('id, project_id, name, validation_status, integrity_status, expires_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('evidence_requests')
      .select('id, project_id, case_id, control_id, title, description, requested_from, requested_by, due_at, status, submitted_evidence_id, reviewed_by, reviewed_at, review_comment, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(300),
    supabase
      .from('evidence_request_events')
      .select('id, project_id, request_id, actor_id, event_type, from_status, to_status, evidence_id, comment, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(2000),
  ])

  const migrationPending = requestsResult.error?.code === '42P01'
    || eventsResult.error?.code === '42P01'
    || eventsResult.error?.message?.includes('evidence_request_events')

  const projects = projectsResult.data || []
  const projectIds = new Set(projects.map((project) => project.id))
  const projectNames = new Map(projects.map((project) => [project.id, project.name]))

  const controls = (controlsResult.data || [])
    .filter((item) => projectIds.has(item.project_id))
    .map((item) => ({ id: item.id, projectId: item.project_id, name: item.name }))
  const controlNames = new Map(controls.map((item) => [item.id, item.name]))

  const cases = (casesResult.data || [])
    .filter((item) => item.project_id && projectIds.has(item.project_id))
    .map((item) => ({ id: item.id, projectId: item.project_id as string, title: item.title }))
  const caseTitles = new Map(cases.map((item) => [item.id, item.title]))

  const evidence = (evidenceResult.data || [])
    .filter((item) => item.project_id && projectIds.has(item.project_id))
    .map((item) => ({
      id: item.id,
      projectId: item.project_id as string,
      name: item.name,
      validationStatus: item.validation_status,
      integrityStatus: item.integrity_status,
      expiresAt: item.expires_at,
    }))
  const evidenceNames = new Map(evidence.map((item) => [item.id, item.name]))

  const requestRows = requestsResult.data || []
  const eventRows = eventsResult.data || []
  const memberIds = (membersResult.data || []).map((member) => member.user_id)
  const profileIds = [...new Set([
    ...memberIds,
    ...requestRows.flatMap((item) => [item.requested_from, item.requested_by, item.reviewed_by]),
    ...eventRows.map((item) => item.actor_id),
  ].filter((id): id is string => Boolean(id)))]

  const { data: profileRows } = profileIds.length
    ? await supabase.from('profiles').select('id, first_name, last_name, email').in('id', profileIds)
    : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null; email: string }> }

  const profileNames = new Map((profileRows || []).map((profile) => {
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || profile.email
    return [profile.id, name]
  }))

  const members = memberIds.map((id) => ({
    id,
    name: profileNames.get(id) || (id === user.id ? user.email || 'Mi cuenta' : `Miembro ${id.slice(0, 8)}`),
  }))

  const eventsByRequest = new Map<string, EvidenceRequestItem['events']>()
  for (const event of eventRows) {
    const current = eventsByRequest.get(event.request_id) || []
    current.push({
      id: event.id,
      eventType: event.event_type,
      fromStatus: event.from_status,
      toStatus: event.to_status,
      comment: event.comment,
      evidenceName: event.evidence_id ? evidenceNames.get(event.evidence_id) || null : null,
      actorName: event.actor_id ? profileNames.get(event.actor_id) || null : null,
      createdAt: event.created_at,
    })
    eventsByRequest.set(event.request_id, current)
  }

  const activeStatuses = new Set(['open', 'submitted', 'under_review', 'changes_requested'])
  const now = Date.now()
  const requests: EvidenceRequestItem[] = requestRows.map((item) => {
    const overdue = Boolean(item.due_at)
      && activeStatuses.has(item.status)
      && new Date(item.due_at as string).getTime() < now

    return {
      id: item.id,
      projectId: item.project_id,
      projectName: projectNames.get(item.project_id) || 'Ámbito sin nombre',
      caseId: item.case_id,
      caseTitle: item.case_id ? caseTitles.get(item.case_id) || null : null,
      controlId: item.control_id,
      controlName: item.control_id ? controlNames.get(item.control_id) || null : null,
      title: item.title,
      description: item.description,
      requestedFromName: item.requested_from ? profileNames.get(item.requested_from) || null : null,
      requestedByName: item.requested_by ? profileNames.get(item.requested_by) || null : null,
      dueAt: item.due_at,
      status: item.status,
      displayStatus: overdue ? 'overdue' : item.status,
      submittedEvidenceId: item.submitted_evidence_id,
      submittedEvidenceName: item.submitted_evidence_id ? evidenceNames.get(item.submitted_evidence_id) || null : null,
      reviewedByName: item.reviewed_by ? profileNames.get(item.reviewed_by) || null : null,
      reviewedAt: item.reviewed_at,
      reviewComment: item.review_comment,
      createdAt: item.created_at,
      events: eventsByRequest.get(item.id) || [],
    }
  })

  const requestedControl = query.controlId ? controls.find((item) => item.id === query.controlId) : null
  const requestedCase = query.caseId ? cases.find((item) => item.id === query.caseId) : null
  const requestedProject = query.projectId && projectIds.has(query.projectId) ? query.projectId : null
  const initialProjectId = requestedControl?.projectId || requestedCase?.projectId || requestedProject || projects[0]?.id || null

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <Link href="/evidence" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a evidencias
        </Link>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Seguimiento verificable</p>
            <h1 className="mt-1 text-3xl font-bold">Solicitudes de evidencia</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Solicita, entrega y revisa evidencias con responsable, vencimiento, historial y relación directa con controles y expedientes.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-primary"><FileClock className="h-6 w-6" /></div>
        </div>

        <div className="mt-8">
          {migrationPending ? <SetupNotice /> : !projects.length ? <NoProjectNotice /> : (
            <EvidenceRequestsWorkspace
              projects={projects}
              members={members}
              controls={controls}
              cases={cases}
              evidence={evidence}
              requests={requests}
              initialProjectId={initialProjectId}
              initialControlId={requestedControl?.id || null}
              initialCaseId={requestedCase?.id || null}
            />
          )}
        </div>
      </main>
    </>
  )
}

function SetupNotice() {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-10 text-center">
      <p className="font-semibold">El flujo de solicitudes está listo para activarse.</p>
      <p className="mt-2 text-sm text-muted-foreground">Aplica la migración de Evidence Requests Workflow en Supabase.</p>
    </div>
  )
}

function NoProjectNotice() {
  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center">
      <p className="font-semibold">Crea un ámbito antes de solicitar evidencia.</p>
      <p className="mt-2 text-sm text-muted-foreground">El onboarding crea automáticamente el primer proyecto de cumplimiento.</p>
    </div>
  )
}
