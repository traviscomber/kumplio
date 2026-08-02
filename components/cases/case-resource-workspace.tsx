import { CaseResourcePanel, type CaseResourceItem, type CaseResourceType } from '@/components/cases/case-resource-panel'
import { createClient } from '@/lib/supabase/server'

type Props = {
  caseId: string
  organizationId: string
  projectId: string | null
  projectName: string | null
  reviewCount: number
  artifactCount: number
}

type LinkRow = {
  id: string
  resource_type: CaseResourceType
  resource_id: string
  created_at: string
}

type DocumentRow = {
  id: string
  name: string
  document_type: string | null
  status: string | null
}

type ObligationRow = {
  id: string
  obligation_text: string
  responsible_party: string | null
  priority: string | null
  status: string | null
  due_date: string | null
}

type ControlRow = {
  id: string
  name: string
  description: string | null
  control_nature: string
  execution_mode: string
  lifecycle_status: string
  design_effectiveness: string
  operating_effectiveness: string
  next_evaluation_at: string | null
}

type EvidenceRow = {
  id: string
  name: string
  description: string | null
  evidence_type: string
  validation_status: string
  integrity_status: string
  expires_at: string | null
}

type FindingRow = {
  id: string
  description: string
  finding_type: string
  current_state: string | null
  status: string | null
  due_date: string | null
}

type RiskRow = {
  id: string
  risk_description: string
  risk_score: number | null
  likelihood: string | null
  impact: string | null
  mitigation_status: string | null
}

type ActionRow = {
  id: string
  phase_name: string | null
  description: string | null
  status: string | null
  end_date: string | null
}

function compact(value: string | null | undefined, maxLength = 150) {
  if (!value) return null
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized
}

function joinDetails(values: Array<string | null | undefined>) {
  const details = values.filter((value): value is string => Boolean(value))
  return details.length ? details.join(' · ') : null
}

export async function CaseResourceWorkspace({
  caseId,
  organizationId,
  projectId,
  projectName,
  reviewCount,
  artifactCount,
}: Props) {
  if (!projectId) {
    return (
      <CaseResourcePanel
        caseId={caseId}
        projectName={null}
        linkedResources={[]}
        availableResources={[]}
        reviewCount={reviewCount}
        artifactCount={artifactCount}
      />
    )
  }

  const supabase = await createClient()
  const [
    linksResult,
    documentsResult,
    obligationsResult,
    controlsResult,
    evidenceResult,
    findingsResult,
    risksResult,
    actionsResult,
  ] = await Promise.all([
    supabase
      .from('compliance_case_resource_links')
      .select('id, resource_type, resource_id, created_at')
      .eq('case_id', caseId)
      .eq('organization_id', organizationId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),
    supabase
      .from('documents')
      .select('id, name, document_type, status')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('obligations')
      .select('id, obligation_text, responsible_party, priority, status, due_date')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('controls')
      .select('id, name, description, control_nature, execution_mode, lifecycle_status, design_effectiveness, operating_effectiveness, next_evaluation_at')
      .eq('organization_id', organizationId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('evidence')
      .select('id, name, description, evidence_type, validation_status, integrity_status, expires_at')
      .eq('organization_id', organizationId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('audit_findings')
      .select('id, description, finding_type, current_state, status, due_date')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('risks')
      .select('id, risk_description, risk_score, likelihood, impact, mitigation_status')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('roadmaps')
      .select('id, phase_name, description, status, end_date')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  if (linksResult.error?.code === '42P01') {
    return (
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <h2 className="font-semibold">La integración del expediente está lista para activarse</h2>
        <p className="mt-2 text-sm text-muted-foreground">Aplica la migración de recursos del caso en Supabase.</p>
      </section>
    )
  }

  const controlsAvailable = !controlsResult.error || controlsResult.error.code !== '42P01'
  const evidenceAvailable = !evidenceResult.error || evidenceResult.error.code !== '42P01'

  const resources: CaseResourceItem[] = [
    ...((documentsResult.data || []) as DocumentRow[]).map((row) => ({
      id: row.id,
      type: 'document' as const,
      title: row.name,
      detail: compact(row.document_type),
      status: row.status,
    })),
    ...((obligationsResult.data || []) as ObligationRow[]).map((row) => ({
      id: row.id,
      type: 'obligation' as const,
      title: compact(row.obligation_text, 180) || 'Obligación sin descripción',
      detail: joinDetails([
        row.responsible_party ? `Responsable: ${row.responsible_party}` : null,
        row.due_date ? `Vence: ${new Date(row.due_date).toLocaleDateString('es-CL')}` : null,
      ]),
      status: row.status || row.priority,
    })),
    ...(controlsAvailable ? ((controlsResult.data || []) as ControlRow[]).map((row) => ({
      id: row.id,
      type: 'control' as const,
      title: row.name,
      detail: joinDetails([
        compact(row.description),
        `Naturaleza: ${row.control_nature}`,
        `Ejecución: ${row.execution_mode}`,
        `Diseño: ${row.design_effectiveness}`,
        `Operación: ${row.operating_effectiveness}`,
        row.next_evaluation_at ? `Próxima evaluación: ${new Date(row.next_evaluation_at).toLocaleDateString('es-CL')}` : null,
      ]),
      status: row.lifecycle_status,
    })) : []),
    ...(evidenceAvailable ? ((evidenceResult.data || []) as EvidenceRow[]).map((row) => ({
      id: row.id,
      type: 'evidence' as const,
      title: row.name,
      detail: joinDetails([
        compact(row.description),
        `Tipo: ${row.evidence_type}`,
        `Integridad: ${row.integrity_status}`,
        row.expires_at ? `Vence: ${new Date(row.expires_at).toLocaleDateString('es-CL')}` : 'Sin vencimiento',
      ]),
      status: row.validation_status,
    })) : []),
    ...((findingsResult.data || []) as FindingRow[]).map((row) => ({
      id: row.id,
      type: 'finding' as const,
      title: compact(row.description, 180) || 'Hallazgo sin descripción',
      detail: joinDetails([
        row.finding_type,
        compact(row.current_state),
        row.due_date ? `Vence: ${new Date(row.due_date).toLocaleDateString('es-CL')}` : null,
      ]),
      status: row.status,
    })),
    ...((risksResult.data || []) as RiskRow[]).map((row) => ({
      id: row.id,
      type: 'risk' as const,
      title: compact(row.risk_description, 180) || 'Riesgo sin descripción',
      detail: joinDetails([
        row.risk_score !== null ? `Puntaje: ${row.risk_score}` : null,
        row.likelihood ? `Probabilidad: ${row.likelihood}` : null,
        row.impact ? `Impacto: ${row.impact}` : null,
      ]),
      status: row.mitigation_status,
    })),
    ...((actionsResult.data || []) as ActionRow[]).map((row) => ({
      id: row.id,
      type: 'action' as const,
      title: compact(row.phase_name || row.description, 180) || 'Acción sin descripción',
      detail: joinDetails([
        row.phase_name ? compact(row.description) : null,
        row.end_date ? `Fecha objetivo: ${new Date(row.end_date).toLocaleDateString('es-CL')}` : null,
      ]),
      status: row.status,
    })),
  ]

  const resourceMap = new Map(resources.map((resource) => [`${resource.type}:${resource.id}`, resource]))
  const links = (linksResult.data || []) as LinkRow[]
  const linkedKeys = new Set(links.map((link) => `${link.resource_type}:${link.resource_id}`))

  const linkedResources = links.flatMap((link) => {
    const resource = resourceMap.get(`${link.resource_type}:${link.resource_id}`)
    return resource ? [{ ...resource, linkId: link.id, linkedAt: link.created_at }] : []
  })

  const availableResources = resources.filter((resource) => !linkedKeys.has(`${resource.type}:${resource.id}`))

  return (
    <CaseResourcePanel
      caseId={caseId}
      projectName={projectName}
      linkedResources={linkedResources}
      availableResources={availableResources}
      reviewCount={reviewCount}
      artifactCount={artifactCount}
    />
  )
}
