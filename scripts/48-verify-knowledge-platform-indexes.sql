-- KUMPLIO Plataforma de Conocimiento — verificación de índices obligatorios
-- Solo lectura.
do $$
declare
  missing_indexes text[];
begin
  select array_agg(expected.name order by expected.name)
  into missing_indexes
  from (values
    ('knowledge_events_actor_id_idx'),
    ('knowledge_mappings_organization_node_id_idx'),
    ('knowledge_mappings_proposed_by_idx'),
    ('knowledge_mappings_reviewed_by_idx'),
    ('knowledge_provenance_created_by_idx'),
    ('organization_memory_edge_versions_created_by_idx'),
    ('organization_memory_edges_created_by_idx'),
    ('organization_memory_edges_current_version_id_idx'),
    ('organization_memory_edges_source_node_id_idx'),
    ('organization_memory_edges_target_node_id_idx'),
    ('organization_memory_node_versions_created_by_idx'),
    ('organization_memory_nodes_created_by_idx'),
    ('organization_memory_nodes_current_version_id_idx'),
    ('public_knowledge_edge_versions_created_by_idx'),
    ('public_knowledge_edges_created_by_idx'),
    ('public_knowledge_edges_current_version_id_idx'),
    ('public_knowledge_node_versions_created_by_idx'),
    ('public_knowledge_nodes_created_by_idx'),
    ('public_knowledge_nodes_current_version_id_idx')
  ) expected(name)
  where not exists (
    select 1
    from pg_indexes index_info
    where index_info.schemaname = 'public'
      and index_info.indexname = expected.name
  );

  if missing_indexes is not null then
    raise exception 'missing_knowledge_platform_indexes:%', array_to_string(missing_indexes, ',');
  end if;

  raise notice 'knowledge_platform_indexes_verification_passed';
end;
$$;
