import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { EvidenceWorkspace, type EvidenceListItem } from '@/components/evidence/evidence-workspace'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Evidencias',
  description: 'Biblioteca verificable de evidencias KUMPLIO.',
  robots: { index: false, follow: false },
}

export default async function EvidencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/evidence')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')
  const organizationId = membership.organization_id

  const [projectsResult, documentsResult, controlsResult, evidenceResult, linksResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(100),
    supabase
      .from('documents')
      .select('id, project_id, name')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('controls')
      .select('id, project_id, name')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('evidence')
      .select('id, project_id, name, description, evidence_type, source, validation_status, integrity_status, confidentiality, issued_at, expires_at, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('control_evidence')
      .select('control_id, evidence_id')
      .eq('organization_id', organizationId),
  ])

  const migrationPending = evidenceResult.error?.code === '42P01'
    || evidenceResult.error?.message?.includes('evidence')
    || controlsResult.error?.code === '42P01'

  const projects = projectsResult.data || []
  const projectIds = new Set(projects.map((project) => project.id))
  const projectNames = new Map(projects.map((project) => [project.id, project.name]))
  const controls = (controlsResult.data || [])
    .filter((control) => projectIds.has(control.project_id))
    .map((control) => ({ id: control.id, projectId: control.project_id, name: control.name }))
  const controlNames = new Map(controls.map((control) => [control.id, control.name]))
  const documents = (documentsResult.data || [])
    .filter((document) => projectIds.has(document.project_id))
    .map((document) => ({ id: document.id, projectId: document.project_id, name: document.name }))

  const evidenceControlNames = new Map<string, string[]>()
  for (const link of linksResult.data || []) {
    const controlName = controlNames.get(link.control_id)
    if (!controlName) continue
    const current = evidenceControlNames.get(link.evidence_id) || []
    current.push(controlName)
    evidenceControlNames.set(link.evidence_id, current)
  }

  const evidence: EvidenceListItem[] = (evidenceResult.data || []).map((item) => ({
    id: item.id,
    projectId: item.project_id,
    projectName: projectNames.get(item.project_id) || 'Ámbito sin nombre',
    name: item.name,
    description: item.description,
    evidenceType: item.evidence_type,
    source: item.source,
    validationStatus: item.validation_status,
    integrityStatus: item.integrity_status,
    confidentiality: item.confidentiality,
    issuedAt: item.issued_at,
    expiresAt: item.expires_at,
    linkedControls: evidenceControlNames.get(item.id) || [],
  }))

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <p className="text-sm font-medium text-primary">Respaldo verificable</p>
        <h1 className="mt-1 text-3xl font-bold">Evidencias</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Registra origen, período, vigencia, integridad y relación con controles. La suficiencia se evalúa en el contexto del control, no de forma global.
        </p>

        <div className="mt-8">
          {migrationPending ? <SetupNotice /> : !projects.length ? <NoProjectNotice /> : (
            <EvidenceWorkspace projects={projects} documents={documents} controls={controls} evidence={evidence} />
          )}
        </div>
      </main>
    </>
  )
}

function SetupNotice() {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-10 text-center">
      <p className="font-semibold">El módulo está listo para activarse.</p>
      <p className="mt-2 text-sm text-muted-foreground">Aplica las migraciones de Controls & Evidence Foundation en Supabase.</p>
    </div>
  )
}

function NoProjectNotice() {
  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center">
      <p className="font-semibold">Crea un ámbito antes de registrar evidencias.</p>
      <p className="mt-2 text-sm text-muted-foreground">El onboarding crea automáticamente el primer proyecto de cumplimiento.</p>
    </div>
  )
}
