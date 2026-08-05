import type { SupabaseClient } from '@supabase/supabase-js'

export type ContextNode = {
  id: string
  nodeType: string
  label: string
  summary: string | null
  externalId: string | null
}

export type ContextEdge = {
  id: string
  relationType: string
  fromNodeId: string
  toNodeId: string
}

export type OrganizationMemory = {
  id: string
  memoryType: string
  title: string
  summary: string
  outcome: string | null
  tags: string[]
  occurredAt: string
}

export async function getOrganizationContext(
  admin: SupabaseClient,
  organizationId: string,
): Promise<{ nodes: ContextNode[]; edges: ContextEdge[]; memories: OrganizationMemory[] }> {
  // Tables are introduced by the context migration and may not yet exist in generated client types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const [{ data: nodes, error: nodeError }, { data: edges, error: edgeError }, { data: memories, error: memoryError }] = await Promise.all([
    db.from('context_nodes')
      .select('id,node_type,external_id,label,summary')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(200),
    db.from('context_edges')
      .select('id,relation_type,from_node_id,to_node_id')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(400),
    db.from('organization_memory')
      .select('id,memory_type,title,summary,outcome,tags,occurred_at')
      .eq('organization_id', organizationId)
      .order('occurred_at', { ascending: false })
      .limit(50),
  ])

  if (nodeError) throw new Error(`No fue posible cargar el contexto: ${nodeError.message}`)
  if (edgeError) throw new Error(`No fue posible cargar las relaciones: ${edgeError.message}`)
  if (memoryError) throw new Error(`No fue posible cargar la memoria: ${memoryError.message}`)

  return {
    nodes: (nodes || []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      nodeType: String(row.node_type),
      externalId: row.external_id ? String(row.external_id) : null,
      label: String(row.label || 'Elemento'),
      summary: typeof row.summary === 'string' ? row.summary : null,
    })),
    edges: (edges || []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      relationType: String(row.relation_type),
      fromNodeId: String(row.from_node_id),
      toNodeId: String(row.to_node_id),
    })),
    memories: (memories || []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      memoryType: String(row.memory_type),
      title: String(row.title || 'Precedente'),
      summary: String(row.summary || ''),
      outcome: typeof row.outcome === 'string' ? row.outcome : null,
      tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
      occurredAt: String(row.occurred_at),
    })),
  }
}

export function findRelatedNodes(nodeId: string, nodes: ContextNode[], edges: ContextEdge[]) {
  const relatedIds = new Set<string>()
  for (const edge of edges) {
    if (edge.fromNodeId === nodeId) relatedIds.add(edge.toNodeId)
    if (edge.toNodeId === nodeId) relatedIds.add(edge.fromNodeId)
  }
  return nodes.filter((node) => relatedIds.has(node.id))
}
