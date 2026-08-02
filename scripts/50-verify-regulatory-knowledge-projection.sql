-- KUMPLIO — Verificador de proyección regulatoria al Grafo Nacional
-- Solo lectura salvo la prueba transaccional encerrada en ROLLBACK.
do $$
declare
  exposed_functions integer;
  authenticated_writes integer;
  rls_enabled boolean;
begin
  if to_regclass('public.knowledge_projection_runs') is null then
    raise exception 'knowledge_projection_runs_missing';
  end if;

  select c.relrowsecurity into rls_enabled
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname='knowledge_projection_runs';
  if not coalesce(rls_enabled,false) then raise exception 'knowledge_projection_runs_rls_disabled'; end if;

  if not exists(
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='project_regulatory_document_to_knowledge_graph'
  ) then raise exception 'projection_function_missing'; end if;

  select count(*) into exposed_functions
  from information_schema.routine_privileges
  where specific_schema='public'
    and routine_name in (
      'upsert_public_knowledge_node_version',
      'upsert_public_knowledge_edge_version',
      'project_regulatory_document_to_knowledge_graph'
    )
    and grantee in ('anon','authenticated','PUBLIC')
    and privilege_type='EXECUTE';
  if exposed_functions > 0 then raise exception 'projection_functions_exposed:%',exposed_functions; end if;

  select count(*) into authenticated_writes
  from information_schema.role_table_grants
  where table_schema='public' and table_name='knowledge_projection_runs'
    and grantee='authenticated'
    and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER');
  if authenticated_writes > 0 then raise exception 'authenticated_projection_writes:%',authenticated_writes; end if;

  if not exists(select 1 from pg_indexes where schemaname='public' and indexname='knowledge_projection_runs_document_idx') then
    raise exception 'projection_document_index_missing';
  end if;
  if not exists(select 1 from pg_indexes where schemaname='public' and indexname='knowledge_projection_runs_version_idx') then
    raise exception 'projection_version_index_missing';
  end if;
end;
$$;

-- Prueba productiva esperada después de ejecutar la proyección de LEY-21719.
do $$
declare
  document_id uuid;
  version_id uuid;
  expected_sections integer;
  law_node_id uuid;
  projected_sections integer;
  projected_edges integer;
  projected_provenance integer;
begin
  select id into document_id
  from public.regulatory_documents
  where canonical_identifier='LEY-21719';
  if document_id is null then raise exception 'ley_21719_document_missing'; end if;

  select id into version_id
  from public.regulatory_document_versions
  where document_id=document_id
  order by version_number desc limit 1;

  select count(*) into expected_sections
  from public.regulatory_document_sections where version_id=version_id;
  if expected_sections <> 741 then raise exception 'unexpected_ley_21719_sections:%',expected_sections; end if;

  select id into law_node_id
  from public.public_knowledge_nodes
  where source_entity_type='regulatory_document' and source_entity_id=document_id;
  if law_node_id is null then raise exception 'ley_21719_law_node_missing'; end if;

  select count(*) into projected_sections
  from public.public_knowledge_nodes
  where source_entity_type='regulatory_document_section'
    and source_entity_id in (
      select id from public.regulatory_document_sections where version_id=version_id
    );
  if projected_sections <> expected_sections then
    raise exception 'projected_section_count_mismatch:%/%',projected_sections,expected_sections;
  end if;

  select count(*) into projected_edges
  from public.public_knowledge_edges e
  where e.relation_type='CONTIENE'
    and e.target_node_id in (
      select id from public.public_knowledge_nodes
      where source_entity_type='regulatory_document_section'
        and source_entity_id in (
          select id from public.regulatory_document_sections where version_id=version_id
        )
    );
  if projected_edges <> expected_sections then
    raise exception 'projected_edge_count_mismatch:%/%',projected_edges,expected_sections;
  end if;

  if exists(
    select 1
    from public.regulatory_document_sections s
    join public.public_knowledge_nodes child
      on child.source_entity_type='regulatory_document_section' and child.source_entity_id=s.id
    left join public.public_knowledge_nodes parent
      on parent.source_entity_type='regulatory_document_section' and parent.source_entity_id=s.parent_section_id
    left join public.public_knowledge_edges edge
      on edge.source_node_id=case when s.parent_section_id is null then law_node_id else parent.id end
     and edge.target_node_id=child.id and edge.relation_type='CONTIENE'
    where s.version_id=version_id and edge.id is null
  ) then raise exception 'knowledge_hierarchy_incomplete'; end if;

  select count(*) into projected_provenance
  from public.knowledge_provenance p
  where p.object_type='public_knowledge_node'
    and (
      (p.source_type='regulatory_document_version' and p.source_id=version_id)
      or
      (p.source_type='regulatory_document_section' and p.source_id in (
        select id from public.regulatory_document_sections where version_id=version_id
      ))
    );
  if projected_provenance < expected_sections + 1 then
    raise exception 'projection_provenance_incomplete:%',projected_provenance;
  end if;

  if not exists(
    select 1 from public.knowledge_projection_runs
    where source_document_id=document_id and source_version_id=version_id
      and status in ('succeeded','unchanged')
  ) then raise exception 'successful_projection_run_missing'; end if;
end;
$$;

select
  d.canonical_identifier,
  v.version_number,
  count(distinct n.id) filter (where n.source_entity_type='regulatory_document_section') as secciones_proyectadas,
  count(distinct e.id) as relaciones_contiene,
  count(distinct p.id) as procedencias
from public.regulatory_documents d
join public.regulatory_document_versions v on v.document_id=d.id
left join public.regulatory_document_sections s on s.version_id=v.id
left join public.public_knowledge_nodes n
  on n.source_entity_type='regulatory_document_section' and n.source_entity_id=s.id
left join public.public_knowledge_edges e
  on e.target_node_id=n.id and e.relation_type='CONTIENE'
left join public.knowledge_provenance p
  on p.object_type='public_knowledge_node' and p.object_id=n.id
where d.canonical_identifier='LEY-21719'
group by d.canonical_identifier,v.version_number;
