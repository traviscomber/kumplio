import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { KnowledgeMap } from '@/components/compliance/knowledge-map'
import { WorkspaceNav } from '@/components/workspace-nav'
import { buildKnowledgeGraph } from '@/lib/compliance/knowledge-graph/build'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mapa de cumplimiento',
  description: 'Relaciones vivas entre fuentes oficiales, obligaciones, controles, evidencia, responsables y expedientes.',
  robots: { index: false, follow: false },
}

const SST_SOURCE_URLS = [
  'https://www.dt.gob.cl/portal/1626/w3-article-127643.html',
  'https://www.suseso.cl/612/w3-propertyvalue-69181.html',
]

export default async function ComplianceMapPage({ searchParams }: { searchParams: Promise<{ node?: string }> }) {
  const { node } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/map')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')
  const organizationId = membership.organization_id

  const [projectsResult, controlsResult, casesResult, missionsResult, evidenceResult, membersResult, regulatorySourcesResult] = await Promise.all([
    supabase.from('projects').select('id, name').eq('organization_id', organizationId).limit(100),
    supabase.from('controls').select('id, project_id, name, owner_id, lifecycle_status, design_effectiveness, operating_effectiveness').eq('organization_id', organizationId).limit(500),
    supabase.from('compliance_cases').select('id, project_id, title, status, owner_id').eq('organization_id', organizationId).limit(300),
    supabase.from('missions').select('id, case_id, title, status, owner_id').eq('organization_id', organizationId).limit(500),
    supabase.from('evidence').select('id, project_id, document_id, name, validation_status, expires_at').eq('organization_id', organizationId).limit(500),
    supabase.from('organization_members').select('user_id').eq('organization_id', organizationId).limit(300),
    supabase
      .from('regulatory_sources')
      .select('id, authority_name, source_name, canonical_url, authority_level, health_status')
      .in('canonical_url', SST_SOURCE_URLS)
      .eq('is_active', true)
      .limit(10),
  ])

  const projects = projectsResult.data || []
  const projectIds = projects.map((project) => project.id)
  const memberIds = (membersResult.data || []).map((member) => member.user_id)
  const regulatorySources = regulatorySourcesResult.data || []
  const regulatorySourceIds = regulatorySources.map((source) => source.id)

  const [obligationsResult, controlObligationsResult, controlEvidenceResult, documentsResult, profilesResult, regulatoryDocumentsResult] = await Promise.all([
    projectIds.length
      ? supabase.from('obligations').select('id, project_id, obligation_text, priority, status').in('project_id', projectIds).limit(1000)
      : Promise.resolve({ data: [] }),
    supabase.from('control_obligations').select('control_id, obligation_id, relationship_type').eq('organization_id', organizationId).limit(1000),
    supabase.from('control_evidence').select('control_id, evidence_id, sufficiency_status, relevance').eq('organization_id', organizationId).limit(1000),
    projectIds.length
      ? supabase.from('documents').select('id, project_id, name, status').in('project_id', projectIds).limit(500)
      : Promise.resolve({ data: [] }),
    memberIds.length
      ? supabase.from('profiles').select('id, first_name, last_name, email').in('id', memberIds)
      : Promise.resolve({ data: [] }),
    regulatorySourceIds.length
      ? supabase
          .from('regulatory_documents')
          .select('id, source_id, title, document_type, canonical_url, status, publication_date')
          .in('source_id', regulatorySourceIds)
          .order('publication_date', { ascending: false, nullsFirst: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
  ])

  const graph = buildKnowledgeGraph({
    projects,
    obligations: obligationsResult.data || [],
    controls: controlsResult.data || [],
    controlObligations: controlObligationsResult.data || [],
    evidence: evidenceResult.data || [],
    controlEvidence: controlEvidenceResult.data || [],
    cases: casesResult.data || [],
    missions: missionsResult.data || [],
    documents: documentsResult.data || [],
    profiles: profilesResult.data || [],
    regulatorySources,
    regulatoryDocuments: regulatoryDocumentsResult.data || [],
  })

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-4 py-8 sm:px-6">
        <p className="text-sm font-medium text-primary">Memoria organizacional</p>
        <h1 className="mt-1 text-3xl font-bold">Mapa de cumplimiento</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Recorre desde la fuente oficial hasta obligaciones, controles, evidencia, responsables y expedientes. La presencia de un documento regulatorio en el mapa no crea por sí sola una obligación para tu organización.
        </p>
        <div className="mt-8">
          <KnowledgeMap graph={graph} initialSelected={node || null} />
        </div>
      </main>
    </>
  )
}
