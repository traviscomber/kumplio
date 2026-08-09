import type { KnowledgeEdge, KnowledgeGraph, KnowledgeNode } from './types'

type ProjectRow = { id: string; name: string }
type ObligationRow = { id: string; project_id: string; obligation_text: string; priority: string | null; status: string | null }
type ControlRow = { id: string; project_id: string; name: string; owner_id: string | null; lifecycle_status: string; design_effectiveness: string; operating_effectiveness: string }
type ControlObligationRow = { control_id: string; obligation_id: string; relationship_type: string }
type EvidenceRow = { id: string; project_id: string; document_id: string | null; name: string; validation_status: string | null; expires_at: string | null }
type ControlEvidenceRow = { control_id: string; evidence_id: string; sufficiency_status: string; relevance: string }
type CaseRow = { id: string; project_id: string; title: string; status: string; owner_id: string | null }
type MissionRow = { id: string; case_id: string | null; title: string; status: string; owner_id: string | null }
type DocumentRow = { id: string; project_id: string; name: string; status: string | null }
type ProfileRow = { id: string; first_name: string | null; last_name: string | null; email: string }
type RegulatorySourceRow = { id: string; authority_name: string; source_name: string; canonical_url: string; authority_level: string; health_status: string }
type RegulatoryDocumentRow = { id: string; source_id: string; title: string; document_type: string; canonical_url: string; status: string; publication_date: string | null }

export type KnowledgeGraphInput = {
  projects: ProjectRow[]
  obligations: ObligationRow[]
  controls: ControlRow[]
  controlObligations: ControlObligationRow[]
  evidence: EvidenceRow[]
  controlEvidence: ControlEvidenceRow[]
  cases: CaseRow[]
  missions: MissionRow[]
  documents: DocumentRow[]
  profiles: ProfileRow[]
  regulatorySources?: RegulatorySourceRow[]
  regulatoryDocuments?: RegulatoryDocumentRow[]
}

export function buildKnowledgeGraph(input: KnowledgeGraphInput): KnowledgeGraph {
  const nodes = new Map<string, KnowledgeNode>()
  const edges = new Map<string, KnowledgeEdge>()
  const nodeKey = (type: KnowledgeNode['type'], id: string) => `${type}:${id}`
  const addNode = (node: KnowledgeNode) => nodes.set(nodeKey(node.type, node.id), node)
  const addEdge = (edge: Omit<KnowledgeEdge, 'id'>) => {
    const id = `${edge.from}|${edge.type}|${edge.to}`
    edges.set(id, { ...edge, id })
  }

  for (const project of input.projects) addNode({ id: project.id, type: 'project', label: project.name, href: '/context' })
  for (const obligation of input.obligations) {
    addNode({
      id: obligation.id,
      type: 'obligation',
      label: obligation.obligation_text.length > 110 ? `${obligation.obligation_text.slice(0, 109)}…` : obligation.obligation_text,
      href: '/obligations',
      meta: { priority: obligation.priority, status: obligation.status },
    })
    addEdge({ from: nodeKey('obligation', obligation.id), to: nodeKey('project', obligation.project_id), type: 'belongs_to', label: 'pertenece a' })
  }

  for (const control of input.controls) {
    addNode({
      id: control.id,
      type: 'control',
      label: control.name,
      href: `/controls/${control.id}`,
      meta: {
        lifecycle: control.lifecycle_status,
        design: control.design_effectiveness,
        operating: control.operating_effectiveness,
      },
    })
    addEdge({ from: nodeKey('control', control.id), to: nodeKey('project', control.project_id), type: 'belongs_to', label: 'pertenece a' })
    if (control.owner_id) addEdge({ from: nodeKey('control', control.id), to: nodeKey('member', control.owner_id), type: 'owned_by', label: 'responsable' })
  }

  for (const link of input.controlObligations) {
    addEdge({ from: nodeKey('obligation', link.obligation_id), to: nodeKey('control', link.control_id), type: 'requires', label: link.relationship_type || 'requiere' })
  }

  for (const item of input.evidence) {
    addNode({
      id: item.id,
      type: 'evidence',
      label: item.name,
      href: '/evidence',
      meta: { validation: item.validation_status, expiresAt: item.expires_at },
    })
    addEdge({ from: nodeKey('evidence', item.id), to: nodeKey('project', item.project_id), type: 'belongs_to', label: 'pertenece a' })
    if (item.document_id) addEdge({ from: nodeKey('evidence', item.id), to: nodeKey('document', item.document_id), type: 'created_for', label: 'proviene de' })
  }

  for (const link of input.controlEvidence) {
    addEdge({ from: nodeKey('evidence', link.evidence_id), to: nodeKey('control', link.control_id), type: 'evidences', label: link.sufficiency_status === 'sufficient' ? 'respalda' : 'evidencia' })
  }

  for (const item of input.cases) {
    addNode({ id: item.id, type: 'case', label: item.title, href: `/cases/${item.id}`, meta: { status: item.status } })
    addEdge({ from: nodeKey('case', item.id), to: nodeKey('project', item.project_id), type: 'belongs_to', label: 'pertenece a' })
    if (item.owner_id) addEdge({ from: nodeKey('case', item.id), to: nodeKey('member', item.owner_id), type: 'owned_by', label: 'responsable' })
  }

  for (const mission of input.missions) {
    addNode({ id: mission.id, type: 'mission', label: mission.title, href: '/my-work', meta: { status: mission.status } })
    if (mission.case_id) addEdge({ from: nodeKey('mission', mission.id), to: nodeKey('case', mission.case_id), type: 'created_for', label: 'ejecuta' })
    if (mission.owner_id) addEdge({ from: nodeKey('mission', mission.id), to: nodeKey('member', mission.owner_id), type: 'owned_by', label: 'responsable' })
  }

  for (const document of input.documents) {
    addNode({ id: document.id, type: 'document', label: document.name, href: '/documents', meta: { status: document.status } })
    addEdge({ from: nodeKey('document', document.id), to: nodeKey('project', document.project_id), type: 'belongs_to', label: 'pertenece a' })
  }

  for (const profile of input.profiles) {
    const label = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || profile.email
    addNode({ id: profile.id, type: 'member', label, href: '/team' })
  }

  for (const source of input.regulatorySources || []) {
    addNode({
      id: source.id,
      type: 'regulatory_source',
      label: `${source.authority_name} · ${source.source_name}`,
      href: '/regulatory',
      meta: { authorityLevel: source.authority_level, health: source.health_status, canonicalUrl: source.canonical_url },
    })
  }

  for (const document of input.regulatoryDocuments || []) {
    addNode({
      id: document.id,
      type: 'regulatory_document',
      label: document.title,
      href: '/regulatory',
      meta: { documentType: document.document_type, status: document.status, publicationDate: document.publication_date, canonicalUrl: document.canonical_url },
    })
    addEdge({
      from: nodeKey('regulatory_document', document.id),
      to: nodeKey('regulatory_source', document.source_id),
      type: 'published_by',
      label: 'publicado por',
    })
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] }
}
