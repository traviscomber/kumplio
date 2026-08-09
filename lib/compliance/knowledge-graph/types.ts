export type KnowledgeNodeType =
  | 'obligation'
  | 'control'
  | 'evidence'
  | 'case'
  | 'mission'
  | 'document'
  | 'member'
  | 'project'
  | 'regulatory_source'
  | 'regulatory_document'

export type KnowledgeEdgeType =
  | 'requires'
  | 'supports'
  | 'belongs_to'
  | 'owned_by'
  | 'related_to'
  | 'evidences'
  | 'created_for'
  | 'published_by'
  | 'derived_from'

export type KnowledgeNode = {
  id: string
  type: KnowledgeNodeType
  label: string
  href?: string
  meta?: Record<string, string | number | boolean | null>
}

export type KnowledgeEdge = {
  id: string
  from: string
  to: string
  type: KnowledgeEdgeType
  label: string
}

export type KnowledgeGraph = {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}
