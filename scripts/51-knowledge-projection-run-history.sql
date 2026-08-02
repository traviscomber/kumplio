-- KUMPLIO — Historial inmutable de ejecuciones de proyección
-- Cada corrida conserva su propio registro; la idempotencia vive en nodos y relaciones.
begin;

alter table public.knowledge_projection_runs
  drop constraint if exists knowledge_projection_runs_projection_type_source_version_id_source_hash_key;

create index if not exists knowledge_projection_runs_identity_idx
  on public.knowledge_projection_runs(projection_type, source_version_id, source_hash, created_at desc);

create or replace function public.project_regulatory_document_to_knowledge_graph(p_document_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
#variable_conflict use_variable
declare
  document_row public.regulatory_documents;
  version_row public.regulatory_document_versions;
  source_row public.regulatory_sources;
  section_row public.regulatory_document_sections;
  law_result jsonb; node_result jsonb; edge_result jsonb;
  law_node_id uuid; section_node_id uuid; parent_node_id uuid; run_id uuid;
  law_key text; section_key_slug text; node_key text; edge_key text; edge_hash text;
  created_nodes integer:=0; created_node_versions integer:=0; created_edges integer:=0; created_edge_versions integer:=0; created_provenance integer:=0; total_sections integer:=0; unchanged_sections integer:=0;
begin
  select * into document_row from public.regulatory_documents d where d.id=p_document_id;
  if document_row.id is null then raise exception 'regulatory_document_not_found'; end if;
  select * into source_row from public.regulatory_sources s where s.id=document_row.source_id;
  select * into version_row from public.regulatory_document_versions v where v.document_id=p_document_id and v.status in ('parsed','reviewed','published') order by v.version_number desc limit 1;
  if version_row.id is null then raise exception 'parsed_regulatory_version_not_found'; end if;
  if not exists(select 1 from public.regulatory_document_sections rs where rs.version_id=version_row.id) then raise exception 'regulatory_sections_not_found'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_document_id::text,42));
  insert into public.knowledge_projection_runs(projection_type,source_document_id,source_version_id,status,source_hash)
  values('regulatory_document_to_public_graph',p_document_id,version_row.id,'running',version_row.content_hash)
  returning id into run_id;

  law_key:='cl.norma.'||lower(regexp_replace(document_row.canonical_identifier,'[^a-zA-Z0-9]+','-','g'));
  law_key:=regexp_replace(law_key,'-+$','','g');
  law_result:=public.upsert_public_knowledge_node_version(law_key,case when document_row.document_type='law' then 'ley' else document_row.document_type end,document_row.title,null,
    jsonb_build_object('identificadorOficial',document_row.canonical_identifier,'tipoDocumento',document_row.document_type,'urlCanonica',document_row.canonical_url,'fuente',source_row.source_name,'autoridad',source_row.authority_name,'jurisdiccion',source_row.jurisdiction,'versionRegulatoriaId',version_row.id,'numeroVersion',version_row.version_number),
    coalesce(version_row.valid_from,document_row.effective_from),coalesce(version_row.valid_to,document_row.effective_to),'published',version_row.content_hash,'regulatory_document',document_row.id);
  law_node_id:=(law_result->>'nodeId')::uuid;
  created_nodes:=created_nodes+case when (law_result->>'nodeCreated')::boolean then 1 else 0 end;
  created_node_versions:=created_node_versions+case when (law_result->>'versionCreated')::boolean then 1 else 0 end;

  if not exists(select 1 from public.knowledge_provenance kp where kp.object_type='public_knowledge_node' and kp.object_id=law_node_id and kp.source_type='regulatory_document_version' and kp.source_id=version_row.id) then
    insert into public.knowledge_provenance(object_type,object_id,source_type,source_id,source_locator,source_hash,process_type,process_version)
    values('public_knowledge_node',law_node_id,'regulatory_document_version',version_row.id,document_row.canonical_url,version_row.content_hash,'regulatory_document_to_public_graph','v1');
    created_provenance:=created_provenance+1;
  end if;

  for section_row in select * from public.regulatory_document_sections rs where rs.version_id=version_row.id order by rs.ordinal,rs.id loop
    total_sections:=total_sections+1;
    section_key_slug:=trim(both '-' from lower(regexp_replace(section_row.section_key,'[^a-zA-Z0-9]+','-','g')));
    node_key:=law_key||'.seccion.'||left(section_key_slug,80)||'-'||left(encode(extensions.digest(convert_to(section_row.section_key,'UTF8'),'sha256'),'hex'),12);
    node_result:=public.upsert_public_knowledge_node_version(node_key,case when section_row.section_type='article' then 'articulo' when section_row.section_type='inciso' then 'inciso' else lower(section_row.section_type) end,
      coalesce(section_row.reference_label,section_row.heading,'Sección '||section_row.ordinal::text),null,
      jsonb_build_object('claveSeccion',section_row.section_key,'tipoSeccion',section_row.section_type,'ordinal',section_row.ordinal,'etiquetaReferencia',section_row.reference_label,'encabezado',section_row.heading,'versionRegulatoriaId',version_row.id),
      coalesce(version_row.valid_from,document_row.effective_from),coalesce(version_row.valid_to,document_row.effective_to),'published',section_row.section_hash,'regulatory_document_section',section_row.id);
    section_node_id:=(node_result->>'nodeId')::uuid;
    created_nodes:=created_nodes+case when (node_result->>'nodeCreated')::boolean then 1 else 0 end;
    created_node_versions:=created_node_versions+case when (node_result->>'versionCreated')::boolean then 1 else 0 end;
    unchanged_sections:=unchanged_sections+case when (node_result->>'unchanged')::boolean then 1 else 0 end;

    if section_row.parent_section_id is null then parent_node_id:=law_node_id;
    else
      select n.id into parent_node_id from public.public_knowledge_nodes n where n.source_entity_type='regulatory_document_section' and n.source_entity_id=section_row.parent_section_id;
      if parent_node_id is null then raise exception 'parent_knowledge_node_not_found'; end if;
    end if;

    edge_key:='cl.rel.contiene.'||replace(parent_node_id::text,'-','')||'.'||replace(section_node_id::text,'-','');
    edge_hash:=encode(extensions.digest(convert_to(parent_node_id::text||'|CONTIENE|'||section_node_id::text||'|'||section_row.section_hash,'UTF8'),'sha256'),'hex');
    edge_result:=public.upsert_public_knowledge_edge_version(edge_key,parent_node_id,section_node_id,'CONTIENE',case when section_row.parent_section_id is null then document_row.canonical_identifier||' contiene '||coalesce(section_row.reference_label,section_row.heading) else 'El artículo contiene '||coalesce(section_row.reference_label,'el inciso') end,
      jsonb_build_object('versionRegulatoriaId',version_row.id,'seccionRegulatoriaId',section_row.id),coalesce(version_row.valid_from,document_row.effective_from),coalesce(version_row.valid_to,document_row.effective_to),'published',edge_hash);
    created_edges:=created_edges+case when (edge_result->>'edgeCreated')::boolean then 1 else 0 end;
    created_edge_versions:=created_edge_versions+case when (edge_result->>'versionCreated')::boolean then 1 else 0 end;

    if not exists(select 1 from public.knowledge_provenance kp where kp.object_type='public_knowledge_node' and kp.object_id=section_node_id and kp.source_type='regulatory_document_section' and kp.source_id=section_row.id) then
      insert into public.knowledge_provenance(object_type,object_id,source_type,source_id,source_locator,source_hash,process_type,process_version)
      values('public_knowledge_node',section_node_id,'regulatory_document_section',section_row.id,document_row.canonical_url||'#'||section_row.section_key,section_row.section_hash,'regulatory_document_to_public_graph','v1');
      created_provenance:=created_provenance+1;
    end if;
  end loop;

  update public.knowledge_projection_runs set status=case when created_node_versions=0 and created_edge_versions=0 then 'unchanged' else 'succeeded' end,nodes_created=created_nodes,node_versions_created=created_node_versions,edges_created=created_edges,edge_versions_created=created_edge_versions,provenance_created=created_provenance,completed_at=now() where id=run_id;
  return jsonb_build_object('runId',run_id,'status',case when created_node_versions=0 and created_edge_versions=0 then 'unchanged' else 'succeeded' end,'documentId',document_row.id,'versionId',version_row.id,'lawNodeId',law_node_id,'totalSections',total_sections,'unchangedSections',unchanged_sections,'nodesCreated',created_nodes,'nodeVersionsCreated',created_node_versions,'edgesCreated',created_edges,'edgeVersionsCreated',created_edge_versions,'provenanceCreated',created_provenance);
exception when others then
  if run_id is not null then update public.knowledge_projection_runs set status='failed',error_code=sqlstate,error_message=left(sqlerrm,500),completed_at=now() where id=run_id; end if;
  raise;
end; $$;

revoke all on function public.project_regulatory_document_to_knowledge_graph(uuid) from public,anon,authenticated;
grant execute on function public.project_regulatory_document_to_knowledge_graph(uuid) to service_role;

commit;