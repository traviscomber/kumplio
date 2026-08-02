-- KUMPLIO — Verificación final de Ley N.º 21.719 en el Grafo Nacional
-- Solo lectura.
do $$
declare
  v_document_id uuid;
  v_version_id uuid;
  v_sections integer;
  v_nodes integer;
  v_node_versions integer;
  v_edges integer;
  v_edge_versions integer;
  v_provenance integer;
  v_runs integer;
  v_exposed integer;
begin
  select d.id into v_document_id from public.regulatory_documents d where d.canonical_identifier='LEY-21719';
  if v_document_id is null then raise exception 'ley_21719_document_missing'; end if;

  select v.id into v_version_id from public.regulatory_document_versions v
  where v.document_id=v_document_id order by v.version_number desc limit 1;

  select count(*) into v_sections from public.regulatory_document_sections s where s.version_id=v_version_id;
  if v_sections <> 741 then raise exception 'ley_21719_source_sections_mismatch:%',v_sections; end if;

  select count(*) into v_nodes from public.public_knowledge_nodes n
  where (n.source_entity_type='regulatory_document' and n.source_entity_id=v_document_id)
     or (n.source_entity_type='regulatory_document_section' and n.source_entity_id in
       (select s.id from public.regulatory_document_sections s where s.version_id=v_version_id));
  if v_nodes <> 742 then raise exception 'ley_21719_nodes_mismatch:%',v_nodes; end if;

  select count(*) into v_node_versions
  from public.public_knowledge_node_versions nv
  join public.public_knowledge_nodes n on n.id=nv.node_id
  where (n.source_entity_type='regulatory_document' and n.source_entity_id=v_document_id)
     or (n.source_entity_type='regulatory_document_section' and n.source_entity_id in
       (select s.id from public.regulatory_document_sections s where s.version_id=v_version_id));
  if v_node_versions <> 742 then raise exception 'ley_21719_node_versions_mismatch:%',v_node_versions; end if;

  select count(*) into v_edges from public.public_knowledge_edges e
  where e.relation_type='CONTIENE' and e.target_node_id in
    (select n.id from public.public_knowledge_nodes n where n.source_entity_type='regulatory_document_section'
      and n.source_entity_id in (select s.id from public.regulatory_document_sections s where s.version_id=v_version_id));
  if v_edges <> 741 then raise exception 'ley_21719_edges_mismatch:%',v_edges; end if;

  select count(*) into v_edge_versions from public.public_knowledge_edge_versions ev
  join public.public_knowledge_edges e on e.id=ev.edge_id
  where e.relation_type='CONTIENE' and e.target_node_id in
    (select n.id from public.public_knowledge_nodes n where n.source_entity_type='regulatory_document_section'
      and n.source_entity_id in (select s.id from public.regulatory_document_sections s where s.version_id=v_version_id));
  if v_edge_versions <> 741 then raise exception 'ley_21719_edge_versions_mismatch:%',v_edge_versions; end if;

  select count(*) into v_provenance from public.knowledge_provenance p
  where p.object_type='public_knowledge_node' and p.object_id in
    (select n.id from public.public_knowledge_nodes n
      where (n.source_entity_type='regulatory_document' and n.source_entity_id=v_document_id)
         or (n.source_entity_type='regulatory_document_section' and n.source_entity_id in
           (select s.id from public.regulatory_document_sections s where s.version_id=v_version_id)));
  if v_provenance <> 742 then raise exception 'ley_21719_provenance_mismatch:%',v_provenance; end if;

  if exists(
    select 1 from public.regulatory_document_sections s
    join public.public_knowledge_nodes child on child.source_entity_type='regulatory_document_section' and child.source_entity_id=s.id
    left join public.public_knowledge_nodes parent on parent.source_entity_type='regulatory_document_section' and parent.source_entity_id=s.parent_section_id
    left join public.public_knowledge_nodes law on law.source_entity_type='regulatory_document' and law.source_entity_id=v_document_id
    left join public.public_knowledge_edges e on e.source_node_id=case when s.parent_section_id is null then law.id else parent.id end
      and e.target_node_id=child.id and e.relation_type='CONTIENE'
    where s.version_id=v_version_id and e.id is null
  ) then raise exception 'ley_21719_hierarchy_incomplete'; end if;

  select count(*) into v_runs from public.knowledge_projection_runs r where r.source_document_id=v_document_id;
  if v_runs < 2 then raise exception 'projection_run_history_missing:%',v_runs; end if;
  if not exists(select 1 from public.knowledge_projection_runs r where r.source_document_id=v_document_id and r.status='unchanged') then
    raise exception 'idempotent_projection_run_missing';
  end if;

  select count(*) into v_exposed from information_schema.routine_privileges rp
  where rp.specific_schema='public' and rp.routine_name in
    ('upsert_public_knowledge_node_version','upsert_public_knowledge_edge_version','project_regulatory_document_to_knowledge_graph')
    and rp.grantee in ('anon','authenticated','PUBLIC') and rp.privilege_type='EXECUTE';
  if v_exposed>0 then raise exception 'projection_functions_exposed:%',v_exposed; end if;

  raise notice 'ley_21719_knowledge_graph_verification_passed';
end;
$$;

select
  741 as secciones_fuente,
  742 as nodos_canónicos,
  741 as relaciones_contiene,
  (select count(*) from public.knowledge_projection_runs r
    where r.source_document_id=(select d.id from public.regulatory_documents d where d.canonical_identifier='LEY-21719')) as ejecuciones_registradas;