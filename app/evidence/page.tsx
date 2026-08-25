import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { EvidenceWorkspace, type EvidenceListItem } from '@/components/evidence/evidence-workspace'
import { EvidenceRequestsPanel, type EvidenceRequestItem } from '@/components/evidence/evidence-requests-panel'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Evidencias',
  description: 'Evidencias, solicitudes y revisión asociadas al trabajo de cumplimiento en Kumplio.',
  robots: { index: false, follow: false },
}

export default function LegacyEvidencePage() { redirect('/app/evidencia') }

export async function EvidencePageContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/app/evidencia')

  const access = await getWorkspaceAccess(createAdminClient(), user.id)
  if (!access) redirect('/onboarding')
  const organizationId = access.organizationId

  const [projectsResult, documentsResult, controlsResult, evidenceResult, linksResult, membersResult, casesResult, requestsResult] = await Promise.all([
    supabase.from('projects').select('id, name').eq('organization_id', organizationId).order('updated_at', { ascending: false }).limit(100),
    supabase.from('documents').select('id, project_id, name').order('created_at', { ascending: false }).limit(500),
    supabase.from('controls').select('id, project_id, name').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(500),
    supabase.from('evidence').select('id, project_id, name, description, evidence_type, source, validation_status, integrity_status, confidentiality, issued_at, expires_at, created_at').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(500),
    supabase.from('control_evidence').select('control_id, evidence_id').eq('organization_id', organizationId),
    supabase.from('organization_members').select('user_id').eq('organization_id', organizationId).order('joined_at', { ascending: true }),
    supabase.from('compliance_cases').select('id, project_id, title').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(200),
    supabase.from('evidence_requests').select('id, project_id, case_id, control_id, title, description, requested_from, requested_by, due_at, status, submitted_evidence_id, reviewed_by, reviewed_at, review_comment').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(300),
  ])

  const migrationPending = evidenceResult.error?.code === '42P01' || controlsResult.error?.code === '42P01' || requestsResult.error?.code === '42P01'
  const projects = projectsResult.data || []
  const projectIds = new Set(projects.map((project) => project.id))
  const projectNames = new Map(projects.map((project) => [project.id, project.name]))
  const controls = (controlsResult.data || []).filter((control) => projectIds.has(control.project_id)).map((control) => ({ id: control.id, projectId: control.project_id, name: control.name }))
  const controlNames = new Map(controls.map((control) => [control.id, control.name]))
  const documents = (documentsResult.data || []).filter((document) => projectIds.has(document.project_id)).map((document) => ({ id: document.id, projectId: document.project_id, name: document.name }))

  const memberIds = (membersResult.data || []).map((member) => member.user_id)
  const { data: profiles } = memberIds.length ? await supabase.from('profiles').select('id, first_name, last_name, email').in('id', memberIds) : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null; email: string }> }
  const names = new Map((profiles || []).map((profile) => [profile.id, [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || profile.email]))
  const members = memberIds.map((id) => ({ id, name: names.get(id) || `Miembro ${id.slice(0, 8)}` }))

  const evidenceControlNames = new Map<string, string[]>()
  for (const link of linksResult.data || []) {
    const controlName = controlNames.get(link.control_id)
    if (!controlName) continue
    const current = evidenceControlNames.get(link.evidence_id) || []
    current.push(controlName)
    evidenceControlNames.set(link.evidence_id, current)
  }

  const evidence: EvidenceListItem[] = (evidenceResult.data || []).map((item) => ({
    id: item.id, projectId: item.project_id, projectName: projectNames.get(item.project_id) || 'Ámbito sin nombre', name: item.name,
    description: item.description, evidenceType: item.evidence_type, source: item.source, validationStatus: item.validation_status,
    integrityStatus: item.integrity_status, confidentiality: item.confidentiality, issuedAt: item.issued_at, expiresAt: item.expires_at,
    linkedControls: evidenceControlNames.get(item.id) || [],
  }))

  const cases = (casesResult.data || []).filter((item) => projectIds.has(item.project_id)).map((item) => ({ id: item.id, projectId: item.project_id, title: item.title }))
  const caseNames = new Map(cases.map((item) => [item.id, item.title]))
  const evidenceNames = new Map(evidence.map((item) => [item.id, item.name]))
  const requests: EvidenceRequestItem[] = (requestsResult.data || []).filter((item) => projectIds.has(item.project_id)).map((item) => ({
    id: item.id, projectId: item.project_id, projectName: projectNames.get(item.project_id) || 'Ámbito sin nombre', caseId: item.case_id,
    caseTitle: item.case_id ? caseNames.get(item.case_id) || null : null, controlId: item.control_id, controlName: item.control_id ? controlNames.get(item.control_id) || null : null,
    title: item.title, description: item.description, requestedFromName: item.requested_from ? names.get(item.requested_from) || null : null,
    requestedByName: item.requested_by ? names.get(item.requested_by) || null : null, dueAt: item.due_at, status: item.status,
    submittedEvidenceId: item.submitted_evidence_id, submittedEvidenceName: item.submitted_evidence_id ? evidenceNames.get(item.submitted_evidence_id) || null : null,
    reviewComment: item.review_comment, reviewedByName: item.reviewed_by ? names.get(item.reviewed_by) || null : null, reviewedAt: item.reviewed_at,
  }))

  return (
    <main className="container mx-auto px-4 py-8 sm:px-6">
      <header className="mx-auto max-w-6xl border-b border-border/70 pb-7">
        <p className="text-sm font-semibold text-primary">Respaldo y revisión</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Evidencias</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Gestiona lo que falta, revisa lo recibido y vincula el respaldo al trabajo correspondiente. Una carga pendiente de revisión no acredita cumplimiento.</p>
      </header>
      <div className="mx-auto mt-8 max-w-6xl space-y-8">
        {migrationPending ? <SetupNotice /> : !projects.length ? <NoProjectNotice /> : <>
          <section aria-labelledby="evidence-review-heading">
            <h2 id="evidence-review-heading" className="mb-4 text-xl font-bold">Pendiente de revisión y solicitudes</h2>
            <EvidenceRequestsPanel projects={projects} controls={controls} members={members} cases={cases} evidence={evidence.map((item) => ({ id: item.id, projectId: item.projectId, name: item.name }))} requests={requests} />
          </section>
          <section className="border-t border-border/70 pt-7" aria-labelledby="evidence-library-heading">
            <h2 id="evidence-library-heading" className="mb-4 text-xl font-bold">Respaldo disponible</h2>
            <EvidenceWorkspace projects={projects} documents={documents} controls={controls} evidence={evidence} />
          </section>
        </>}
      </div>
    </main>
  )
}

function SetupNotice() {
  return <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center"><p className="font-semibold">Evidencia todavía no disponible en este espacio.</p><p className="mt-2 text-sm text-muted-foreground">La configuración de datos necesaria aún no está activa.</p></div>
}
function NoProjectNotice() {
  return <div className="rounded-2xl border border-dashed p-8 text-center"><p className="font-semibold">Todavía no hay un ámbito para organizar evidencia.</p><p className="mt-2 text-sm text-muted-foreground">Completa el contexto inicial para empezar a asociar respaldo al trabajo.</p></div>
}
