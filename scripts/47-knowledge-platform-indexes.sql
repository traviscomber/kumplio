-- KUMPLIO Plataforma de Conocimiento — índices de cobertura para claves foráneas
begin;

create index if not exists knowledge_events_actor_id_idx
  on public.knowledge_events(actor_id);

create index if not exists knowledge_mappings_organization_node_id_idx
  on public.knowledge_mappings(organization_node_id);
create index if not exists knowledge_mappings_proposed_by_idx
  on public.knowledge_mappings(proposed_by);
create index if not exists knowledge_mappings_reviewed_by_idx
  on public.knowledge_mappings(reviewed_by);

create index if not exists knowledge_provenance_created_by_idx
  on public.knowledge_provenance(created_by);

create index if not exists organization_memory_edge_versions_created_by_idx
  on public.organization_memory_edge_versions(created_by);
create index if not exists organization_memory_edges_created_by_idx
  on public.organization_memory_edges(created_by);
create index if not exists organization_memory_edges_current_version_id_idx
  on public.organization_memory_edges(current_version_id);
create index if not exists organization_memory_edges_source_node_id_idx
  on public.organization_memory_edges(source_node_id);
create index if not exists organization_memory_edges_target_node_id_idx
  on public.organization_memory_edges(target_node_id);

create index if not exists organization_memory_node_versions_created_by_idx
  on public.organization_memory_node_versions(created_by);
create index if not exists organization_memory_nodes_created_by_idx
  on public.organization_memory_nodes(created_by);
create index if not exists organization_memory_nodes_current_version_id_idx
  on public.organization_memory_nodes(current_version_id);

create index if not exists public_knowledge_edge_versions_created_by_idx
  on public.public_knowledge_edge_versions(created_by);
create index if not exists public_knowledge_edges_created_by_idx
  on public.public_knowledge_edges(created_by);
create index if not exists public_knowledge_edges_current_version_id_idx
  on public.public_knowledge_edges(current_version_id);

create index if not exists public_knowledge_node_versions_created_by_idx
  on public.public_knowledge_node_versions(created_by);
create index if not exists public_knowledge_nodes_created_by_idx
  on public.public_knowledge_nodes(created_by);
create index if not exists public_knowledge_nodes_current_version_id_idx
  on public.public_knowledge_nodes(current_version_id);

commit;
