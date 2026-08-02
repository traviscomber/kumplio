-- KUMPLIO — Proyección del Motor de Evidencia Regulatoria al Grafo Nacional
-- OBJ-KP-006: identidad, jerarquía, versionado, procedencia e idempotencia.
begin;

create table if not exists public.knowledge_projection_runs (
  id uuid primary key default gen_random_uuid(),
  projection_type text not null,
  source_document_id uuid not null references public.regulatory_documents(id) on delete restrict,
  source_version_id uuid not null references public.regulatory_document_versions(id) on delete restrict,
  status text not null default 'running'
    check (status in ('running','succeeded','unchanged','failed')),
  source_hash text not null check (source_hash ~ '^[a-f0-9]{64}$'),
  nodes_created integer not null default 0 check (nodes_created >= 0),
  node_versions_created integer not null default 0 check (node_versions_created >= 0),
  edges_created integer not null default 0 check (edges_created >= 0),
  edge_versions_created integer not null default 0 check (edge_versions_created >= 0),
  provenance_created integer not null default 0 check (provenance_created >= 0),
  error_code text,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (projection_type, source_version_id, source_hash)
);

create index if not exists knowledge_projection_runs_document_idx
  on public.knowledge_projection_runs(source_document_id, created_at desc);
create index if not exists knowledge_projection_runs_version_idx
  on public.knowledge_projection_runs(source_version_id, created_at desc);

alter table public.knowledge_projection_runs enable row level security;
revoke all on table public.knowledge_projection_runs from anon, authenticated;
grant select on table public.knowledge_projection_runs to authenticated;
grant all on table public.knowledge_projection_runs to service_role;

create policy knowledge_projection_runs_read_authenticated
  on public.knowledge_projection_runs
  for select to authenticated
  using (status in ('succeeded','unchanged'));

create or replace function public.upsert_public_knowledge_node_version(
  p_canonical_key text,
  p_node_type text,
  p_display_name text,
  p_description text,
  p_attributes jsonb,
  p_effective_from date,
  p_effective_to date,
  p_lifecycle_status text,
  p_content_hash text,
  p_source_entity_type text,
  p_source_entity_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  node_row public.public_knowledge_nodes;
  current_version public.public_knowledge_node_versions;
  new_version_id uuid;
  next_version integer;
  created_node boolean := false;
  created_version boolean := false;
begin
  if p_content_hash is null or p_content_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid_knowledge_node_hash';
  end if;

  select * into node_row
  from public.public_knowledge_nodes
  where canonical_key = lower(trim(p_canonical_key))
  for update;

  if node_row.id is null then
    insert into public.public_knowledge_nodes(
      canonical_key,node_type,lifecycle_status,source_entity_type,source_entity_id
    ) values (
      lower(trim(p_canonical_key)),lower(trim(p_node_type)),p_lifecycle_status,
      p_source_entity_type,p_source_entity_id
    ) returning * into node_row;
    created_node := true;
  elsif node_row.source_entity_type is distinct from p_source_entity_type
     or node_row.source_entity_id is distinct from p_source_entity_id then
    raise exception 'knowledge_node_source_identity_conflict';
  end if;

  if node_row.current_version_id is not null then
    select * into current_version
    from public.public_knowledge_node_versions
    where id = node_row.current_version_id;
  end if;

  if current_version.id is not null and current_version.content_hash = p_content_hash then
    return jsonb_build_object(
      'nodeId',node_row.id,'versionId',current_version.id,
      'nodeCreated',created_node,'versionCreated',false,'unchanged',true
    );
  end if;

  select coalesce(max(version_number),0)+1 into next_version
  from public.public_knowledge_node_versions where node_id=node_row.id;

  insert into public.public_knowledge_node_versions(
    node_id,version_number,display_name,description,attributes,
    effective_from,effective_to,review_status,content_hash
  ) values (
    node_row.id,next_version,trim(p_display_name),p_description,coalesce(p_attributes,'{}'::jsonb),
    p_effective_from,p_effective_to,p_lifecycle_status,p_content_hash
  ) returning id into new_version_id;
  created_version := true;

  update public.public_knowledge_nodes
  set current_version_id=new_version_id,
      node_type=lower(trim(p_node_type)),
      lifecycle_status=p_lifecycle_status,
      updated_at=now()
  where id=node_row.id;

  insert into public.knowledge_events(
    object_type,object_id,event_type,actor_type,from_status,to_status,details
  ) values (
    'public_knowledge_node',node_row.id,
    case when created_node then 'created' else 'version_created' end,
    'system',current_version.review_status,p_lifecycle_status,
    jsonb_build_object('versionNumber',next_version,'contentHash',p_content_hash)
  );

  return jsonb_build_object(
    'nodeId',node_row.id,'versionId',new_version_id,
    'nodeCreated',created_node,'versionCreated',created_version,'unchanged',false
  );
end;
$$;

create or replace function public.upsert_public_knowledge_edge_version(
  p_canonical_key text,
  p_source_node_id uuid,
  p_target_node_id uuid,
  p_relation_type text,
  p_statement text,
  p_attributes jsonb,
  p_effective_from date,
  p_effective_to date,
  p_lifecycle_status text,
  p_content_hash text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  edge_row public.public_knowledge_edges;
  current_version public.public_knowledge_edge_versions;
  new_version_id uuid;
  next_version integer;
  created_edge boolean := false;
begin
  if p_source_node_id = p_target_node_id then raise exception 'self_knowledge_edge_forbidden'; end if;
  if p_content_hash is null or p_content_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_knowledge_edge_hash'; end if;

  select * into edge_row
  from public.public_knowledge_edges
  where canonical_key=lower(trim(p_canonical_key))
  for update;

  if edge_row.id is null then
    insert into public.public_knowledge_edges(
      canonical_key,source_node_id,target_node_id,relation_type,lifecycle_status
    ) values (
      lower(trim(p_canonical_key)),p_source_node_id,p_target_node_id,upper(trim(p_relation_type)),p_lifecycle_status
    ) returning * into edge_row;
    created_edge := true;
  elsif edge_row.source_node_id <> p_source_node_id
     or edge_row.target_node_id <> p_target_node_id
     or edge_row.relation_type <> upper(trim(p_relation_type)) then
    raise exception 'knowledge_edge_identity_conflict';
  end if;

  if edge_row.current_version_id is not null then
    select * into current_version
    from public.public_knowledge_edge_versions where id=edge_row.current_version_id;
  end if;

  if current_version.id is not null and current_version.content_hash=p_content_hash then
    return jsonb_build_object(
      'edgeId',edge_row.id,'versionId',current_version.id,
      'edgeCreated',created_edge,'versionCreated',false,'unchanged',true
    );
  end if;

  select coalesce(max(version_number),0)+1 into next_version
  from public.public_knowledge_edge_versions where edge_id=edge_row.id;

  insert into public.public_knowledge_edge_versions(
    edge_id,version_number,statement,attributes,effective_from,effective_to,
    review_status,content_hash
  ) values (
    edge_row.id,next_version,p_statement,coalesce(p_attributes,'{}'::jsonb),
    p_effective_from,p_effective_to,p_lifecycle_status,p_content_hash
  ) returning id into new_version_id;

  update public.public_knowledge_edges
  set current_version_id=new_version_id,lifecycle_status=p_lifecycle_status,updated_at=now()
  where id=edge_row.id;

  insert into public.knowledge_events(
    object_type,object_id,event_type,actor_type,from_status,to_status,details
  ) values (
    'public_knowledge_edge',edge_row.id,
    case when created_edge then 'created' else 'version_created' end,
    'system',current_version.review_status,p_lifecycle_status,
    jsonb_build_object('versionNumber',next_version,'contentHash',p_content_hash)
  );

  return jsonb_build_object(
    'edgeId',edge_row.id,'versionId',new_version_id,
    'edgeCreated',created_edge,'versionCreated',true,'unchanged',false
  );
end;
$$;

create or replace function public.project_regulatory_document_to_knowledge_graph(
  p_document_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_variable
declare
  document_row public.regulatory_documents;
  version_row public.regulatory_document_versions;
  source_row public.regulatory_sources;
  section_row public.regulatory_document_sections;
  parent_node_id uuid;
  law_result jsonb;
  node_result jsonb;
  edge_result jsonb;
  law_node_id uuid;
  section_node_id uuid;
  run_id uuid;
  law_key text;
  section_key_slug text;
  node_key text;
  edge_key text;
  edge_hash text;
  created_nodes integer := 0;
  created_node_versions integer := 0;
  created_edges integer := 0;
  created_edge_versions integer := 0;
  created_provenance integer := 0;
  total_sections integer := 0;
  unchanged_sections integer := 0;
begin
  select * into document_row from public.regulatory_documents where id=p_document_id;
  if document_row.id is null then raise exception 'regulatory_document_not_found'; end if;

  select * into source_row from public.regulatory_sources where id=document_row.source_id;
  select * into version_row
  from public.regulatory_document_versions
  where document_id=p_document_id and status in ('parsed','reviewed','published')
  order by version_number desc limit 1;

  if version_row.id is null then raise exception 'parsed_regulatory_version_not_found'; end if;
  if not exists(select 1 from public.regulatory_document_sections where version_id=version_row.id) then
    raise exception 'regulatory_sections_not_found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_document_id::text,42));

  insert into public.knowledge_projection_runs(
    projection_type,source_document_id,source_version_id,status,source_hash
  ) values (
    'regulatory_document_to_public_graph',p_document_id,version_row.id,'running',version_row.content_hash
  )
  on conflict (projection_type,source_version_id,source_hash) do update
    set started_at=now(),completed_at=null,status='running',error_code=null,error_message=null
  returning id into run_id;

  law_key := 'cl.norma.' || lower(regexp_replace(document_row.canonical_identifier,'[^a-zA-Z0-9]+','-','g'));
  law_key := regexp_replace(law_key,'-+$','','g');

  law_result := public.upsert_public_knowledge_node_version(
    law_key,
    case when document_row.document_type='law' then 'ley' else document_row.document_type end,
    document_row.title,
    null,
    jsonb_build_object(
      'identificadorOficial',document_row.canonical_identifier,
      'tipoDocumento',document_row.document_type,
      'urlCanonica',document_row.canonical_url,
      'fuente',source_row.source_name,
      'autoridad',source_row.authority_name,
      'jurisdiccion',source_row.jurisdiction,
      'versionRegulatoriaId',version_row.id,
      'numeroVersion',version_row.version_number
    ),
    coalesce(version_row.valid_from,document_row.effective_from),
    coalesce(version_row.valid_to,document_row.effective_to),
    'published',version_row.content_hash,'regulatory_document',document_row.id
  );
  law_node_id := (law_result->>'nodeId')::uuid;
  created_nodes := created_nodes + case when (law_result->>'nodeCreated')::boolean then 1 else 0 end;
  created_node_versions := created_node_versions + case when (law_result->>'versionCreated')::boolean then 1 else 0 end;

  if not exists(
    select 1 from public.knowledge_provenance
    where object_type='public_knowledge_node' and object_id=law_node_id
      and source_type='regulatory_document_version' and source_id=version_row.id
  ) then
    insert into public.knowledge_provenance(
      object_type,object_id,source_type,source_id,source_locator,source_hash,
      process_type,process_version
    ) values (
      'public_knowledge_node',law_node_id,'regulatory_document_version',version_row.id,
      document_row.canonical_url,version_row.content_hash,
      'regulatory_document_to_public_graph','v1'
    );
    created_provenance := created_provenance + 1;
  end if;

  for section_row in
    select * from public.regulatory_document_sections
    where version_id=version_row.id
    order by ordinal,id
  loop
    total_sections := total_sections + 1;
    section_key_slug := lower(regexp_replace(section_row.section_key,'[^a-zA-Z0-9]+','-','g'));
    section_key_slug := trim(both '-' from section_key_slug);
    node_key := law_key || '.seccion.' || left(section_key_slug,80) || '-' || left(encode(extensions.digest(convert_to(section_row.section_key,'UTF8'),'sha256'),'hex'),12);

    node_result := public.upsert_public_knowledge_node_version(
      node_key,
      case when section_row.section_type='article' then 'articulo'
           when section_row.section_type='inciso' then 'inciso'
           else lower(section_row.section_type) end,
      coalesce(section_row.reference_label,section_row.heading,'Sección '||section_row.ordinal::text),
      null,
      jsonb_build_object(
        'claveSeccion',section_row.section_key,
        'tipoSeccion',section_row.section_type,
        'ordinal',section_row.ordinal,
        'etiquetaReferencia',section_row.reference_label,
        'encabezado',section_row.heading,
        'versionRegulatoriaId',version_row.id
      ),
      coalesce(version_row.valid_from,document_row.effective_from),
      coalesce(version_row.valid_to,document_row.effective_to),
      'published',section_row.section_hash,'regulatory_document_section',section_row.id
    );
    section_node_id := (node_result->>'nodeId')::uuid;
    created_nodes := created_nodes + case when (node_result->>'nodeCreated')::boolean then 1 else 0 end;
    created_node_versions := created_node_versions + case when (node_result->>'versionCreated')::boolean then 1 else 0 end;
    unchanged_sections := unchanged_sections + case when (node_result->>'unchanged')::boolean then 1 else 0 end;

    if section_row.parent_section_id is null then
      parent_node_id := law_node_id;
    else
      select id into parent_node_id
      from public.public_knowledge_nodes
      where source_entity_type='regulatory_document_section'
        and source_entity_id=section_row.parent_section_id;
      if parent_node_id is null then raise exception 'parent_knowledge_node_not_found'; end if;
    end if;

    edge_key := 'cl.rel.contiene.' || replace(parent_node_id::text,'-','') || '.' || replace(section_node_id::text,'-','');
    edge_hash := encode(extensions.digest(convert_to(
      parent_node_id::text||'|CONTIENE|'||section_node_id::text||'|'||section_row.section_hash,'UTF8'
    ),'sha256'),'hex');

    edge_result := public.upsert_public_knowledge_edge_version(
      edge_key,parent_node_id,section_node_id,'CONTIENE',
      case when section_row.parent_section_id is null
        then document_row.canonical_identifier||' contiene '||coalesce(section_row.reference_label,section_row.heading)
        else 'El artículo contiene '||coalesce(section_row.reference_label,'el inciso') end,
      jsonb_build_object('versionRegulatoriaId',version_row.id,'seccionRegulatoriaId',section_row.id),
      coalesce(version_row.valid_from,document_row.effective_from),
      coalesce(version_row.valid_to,document_row.effective_to),
      'published',edge_hash
    );
    created_edges := created_edges + case when (edge_result->>'edgeCreated')::boolean then 1 else 0 end;
    created_edge_versions := created_edge_versions + case when (edge_result->>'versionCreated')::boolean then 1 else 0 end;

    if not exists(
      select 1 from public.knowledge_provenance
      where object_type='public_knowledge_node' and object_id=section_node_id
        and source_type='regulatory_document_section' and source_id=section_row.id
    ) then
      insert into public.knowledge_provenance(
        object_type,object_id,source_type,source_id,source_locator,source_hash,
        process_type,process_version
      ) values (
        'public_knowledge_node',section_node_id,'regulatory_document_section',section_row.id,
        document_row.canonical_url||'#'||section_row.section_key,section_row.section_hash,
        'regulatory_document_to_public_graph','v1'
      );
      created_provenance := created_provenance + 1;
    end if;
  end loop;

  update public.knowledge_projection_runs
  set status=case when created_node_versions=0 and created_edge_versions=0 then 'unchanged' else 'succeeded' end,
      nodes_created=created_nodes,
      node_versions_created=created_node_versions,
      edges_created=created_edges,
      edge_versions_created=created_edge_versions,
      provenance_created=created_provenance,
      completed_at=now()
  where id=run_id;

  return jsonb_build_object(
    'runId',run_id,
    'status',case when created_node_versions=0 and created_edge_versions=0 then 'unchanged' else 'succeeded' end,
    'documentId',document_row.id,
    'versionId',version_row.id,
    'lawNodeId',law_node_id,
    'totalSections',total_sections,
    'unchangedSections',unchanged_sections,
    'nodesCreated',created_nodes,
    'nodeVersionsCreated',created_node_versions,
    'edgesCreated',created_edges,
    'edgeVersionsCreated',created_edge_versions,
    'provenanceCreated',created_provenance
  );
exception when others then
  if run_id is not null then
    update public.knowledge_projection_runs
    set status='failed',error_code=sqlstate,error_message=left(sqlerrm,500),completed_at=now()
    where id=run_id;
  end if;
  raise;
end;
$$;

revoke all on function public.upsert_public_knowledge_node_version(text,text,text,text,jsonb,date,date,text,text,text,uuid)
  from public,anon,authenticated;
revoke all on function public.upsert_public_knowledge_edge_version(text,uuid,uuid,text,text,jsonb,date,date,text,text)
  from public,anon,authenticated;
revoke all on function public.project_regulatory_document_to_knowledge_graph(uuid)
  from public,anon,authenticated;

grant execute on function public.upsert_public_knowledge_node_version(text,text,text,text,jsonb,date,date,text,text,text,uuid)
  to service_role;
grant execute on function public.upsert_public_knowledge_edge_version(text,uuid,uuid,text,text,jsonb,date,date,text,text)
  to service_role;
grant execute on function public.project_regulatory_document_to_knowledge_graph(uuid)
  to service_role;

commit;
