-- KUMPLIO — Primera Memoria Organizacional
-- Proyecta organización, documentos, controles y evidencias sin reemplazar entidades operacionales.
begin;

create table if not exists public.organization_memory_projection_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status text not null default 'running' check (status in ('running','succeeded','unchanged','failed')),
  source_fingerprint text not null check (source_fingerprint ~ '^[a-f0-9]{64}$'),
  nodes_created integer not null default 0 check (nodes_created >= 0),
  node_versions_created integer not null default 0 check (node_versions_created >= 0),
  edges_created integer not null default 0 check (edges_created >= 0),
  edge_versions_created integer not null default 0 check (edge_versions_created >= 0),
  provenance_created integer not null default 0 check (provenance_created >= 0),
  error_code text,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists organization_memory_projection_runs_org_idx
  on public.organization_memory_projection_runs(organization_id, created_at desc);
create index if not exists organization_memory_projection_runs_fingerprint_idx
  on public.organization_memory_projection_runs(organization_id, source_fingerprint, created_at desc);

alter table public.organization_memory_projection_runs enable row level security;
revoke all on table public.organization_memory_projection_runs from anon, authenticated;
grant select on table public.organization_memory_projection_runs to authenticated;
grant all on table public.organization_memory_projection_runs to service_role;
drop policy if exists organization_memory_projection_runs_read_members on public.organization_memory_projection_runs;
create policy organization_memory_projection_runs_read_members
  on public.organization_memory_projection_runs for select to authenticated
  using (exists (
    select 1 from public.organization_members m
    where m.organization_id=organization_memory_projection_runs.organization_id
      and m.user_id=(select auth.uid())
  ));

create or replace function public.upsert_organization_memory_node_version(
  p_organization_id uuid,
  p_canonical_key text,
  p_node_type text,
  p_display_name text,
  p_description text,
  p_attributes jsonb,
  p_lifecycle_status text,
  p_content_hash text,
  p_source_entity_type text,
  p_source_entity_id uuid
) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare
  v_node public.organization_memory_nodes;
  v_current public.organization_memory_node_versions;
  v_version_id uuid;
  v_next integer;
  v_created boolean := false;
begin
  if p_content_hash is null or p_content_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_memory_node_hash'; end if;
  if not exists(select 1 from public.organizations o where o.id=p_organization_id) then raise exception 'organization_not_found'; end if;

  select * into v_node from public.organization_memory_nodes n
  where n.organization_id=p_organization_id and n.canonical_key=lower(trim(p_canonical_key)) for update;

  if v_node.id is null then
    insert into public.organization_memory_nodes(organization_id,canonical_key,node_type,lifecycle_status,source_entity_type,source_entity_id)
    values(p_organization_id,lower(trim(p_canonical_key)),lower(trim(p_node_type)),p_lifecycle_status,p_source_entity_type,p_source_entity_id)
    returning * into v_node;
    v_created:=true;
  elsif v_node.source_entity_type is distinct from p_source_entity_type
     or v_node.source_entity_id is distinct from p_source_entity_id then
    raise exception 'memory_node_source_identity_conflict';
  end if;

  if v_node.current_version_id is not null then
    select * into v_current from public.organization_memory_node_versions v where v.id=v_node.current_version_id;
  end if;
  if v_current.id is not null and v_current.content_hash=p_content_hash then
    return jsonb_build_object('nodeId',v_node.id,'versionId',v_current.id,'nodeCreated',v_created,'versionCreated',false,'unchanged',true);
  end if;

  select coalesce(max(v.version_number),0)+1 into v_next
  from public.organization_memory_node_versions v where v.node_id=v_node.id;
  insert into public.organization_memory_node_versions(
    organization_id,node_id,version_number,display_name,description,attributes,review_status,content_hash
  ) values (
    p_organization_id,v_node.id,v_next,trim(p_display_name),p_description,coalesce(p_attributes,'{}'::jsonb),'approved',p_content_hash
  ) returning id into v_version_id;
  update public.organization_memory_nodes
  set current_version_id=v_version_id,node_type=lower(trim(p_node_type)),lifecycle_status=p_lifecycle_status,updated_at=now()
  where id=v_node.id;
  insert into public.knowledge_events(organization_id,object_type,object_id,event_type,actor_type,from_status,to_status,details)
  values(p_organization_id,'organization_memory_node',v_node.id,case when v_created then 'created' else 'version_created' end,
    'system',v_current.review_status,'approved',jsonb_build_object('versionNumber',v_next,'contentHash',p_content_hash));
  return jsonb_build_object('nodeId',v_node.id,'versionId',v_version_id,'nodeCreated',v_created,'versionCreated',true,'unchanged',false);
end;
$$;

create or replace function public.upsert_organization_memory_edge_version(
  p_organization_id uuid,
  p_canonical_key text,
  p_source_node_id uuid,
  p_target_node_id uuid,
  p_relation_type text,
  p_statement text,
  p_attributes jsonb,
  p_lifecycle_status text,
  p_content_hash text
) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare
  v_edge public.organization_memory_edges;
  v_current public.organization_memory_edge_versions;
  v_version_id uuid;
  v_next integer;
  v_created boolean := false;
begin
  if p_source_node_id=p_target_node_id then raise exception 'self_memory_edge_forbidden'; end if;
  if p_content_hash is null or p_content_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_memory_edge_hash'; end if;
  if not exists(select 1 from public.organization_memory_nodes n where n.id=p_source_node_id and n.organization_id=p_organization_id)
    or not exists(select 1 from public.organization_memory_nodes n where n.id=p_target_node_id and n.organization_id=p_organization_id) then
    raise exception 'memory_edge_cross_organization_forbidden';
  end if;

  select * into v_edge from public.organization_memory_edges e
  where e.organization_id=p_organization_id and e.canonical_key=lower(trim(p_canonical_key)) for update;
  if v_edge.id is null then
    insert into public.organization_memory_edges(organization_id,canonical_key,source_node_id,target_node_id,relation_type,lifecycle_status)
    values(p_organization_id,lower(trim(p_canonical_key)),p_source_node_id,p_target_node_id,upper(trim(p_relation_type)),p_lifecycle_status)
    returning * into v_edge;
    v_created:=true;
  elsif v_edge.source_node_id<>p_source_node_id or v_edge.target_node_id<>p_target_node_id
     or v_edge.relation_type<>upper(trim(p_relation_type)) then
    raise exception 'memory_edge_identity_conflict';
  end if;

  if v_edge.current_version_id is not null then
    select * into v_current from public.organization_memory_edge_versions v where v.id=v_edge.current_version_id;
  end if;
  if v_current.id is not null and v_current.content_hash=p_content_hash then
    return jsonb_build_object('edgeId',v_edge.id,'versionId',v_current.id,'edgeCreated',v_created,'versionCreated',false,'unchanged',true);
  end if;

  select coalesce(max(v.version_number),0)+1 into v_next
  from public.organization_memory_edge_versions v where v.edge_id=v_edge.id;
  insert into public.organization_memory_edge_versions(
    organization_id,edge_id,version_number,statement,attributes,review_status,content_hash
  ) values (
    p_organization_id,v_edge.id,v_next,p_statement,coalesce(p_attributes,'{}'::jsonb),'approved',p_content_hash
  ) returning id into v_version_id;
  update public.organization_memory_edges set current_version_id=v_version_id,lifecycle_status=p_lifecycle_status,updated_at=now()
  where id=v_edge.id;
  insert into public.knowledge_events(organization_id,object_type,object_id,event_type,actor_type,from_status,to_status,details)
  values(p_organization_id,'organization_memory_edge',v_edge.id,case when v_created then 'created' else 'version_created' end,
    'system',v_current.review_status,'approved',jsonb_build_object('versionNumber',v_next,'contentHash',p_content_hash));
  return jsonb_build_object('edgeId',v_edge.id,'versionId',v_version_id,'edgeCreated',v_created,'versionCreated',true,'unchanged',false);
end;
$$;

create or replace function public.project_organization_operational_memory(p_organization_id uuid)
returns jsonb
language plpgsql security invoker set search_path=''
as $$
#variable_conflict use_variable
declare
  v_org public.organizations;
  v_row record;
  v_result jsonb;
  v_edge_result jsonb;
  v_root uuid;
  v_node uuid;
  v_source uuid;
  v_target uuid;
  v_run uuid;
  v_hash text;
  v_edge_hash text;
  v_fingerprint text;
  v_nodes integer:=0;
  v_node_versions integer:=0;
  v_edges integer:=0;
  v_edge_versions integer:=0;
  v_provenance integer:=0;
begin
  select * into v_org from public.organizations o where o.id=p_organization_id;
  if v_org.id is null then raise exception 'organization_not_found'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_organization_id::text,77));

  select encode(extensions.digest(convert_to(
    coalesce(v_org.name,'')||'|'||coalesce(v_org.country,'')||'|'||coalesce(v_org.industry,'')||'|'||coalesce(v_org.size,'')||'|'||
    coalesce((select string_agg(d.id::text||':'||coalesce(d.name,'')||':'||coalesce(d.status,''),'|' order by d.id) from public.documents d join public.projects p on p.id=d.project_id where p.organization_id=p_organization_id),'')||'|'||
    coalesce((select string_agg(c.id::text||':'||coalesce(c.name,'')||':'||coalesce(c.status,'')||':'||coalesce(c.updated_at::text,''),'|' order by c.id) from public.controls c where c.organization_id=p_organization_id),'')||'|'||
    coalesce((select string_agg(e.id::text||':'||coalesce(e.name,'')||':'||coalesce(e.validation_status,'')||':'||coalesce(e.updated_at::text,''),'|' order by e.id) from public.evidence e where e.organization_id=p_organization_id),''),
    'UTF8'),'sha256'),'hex') into v_fingerprint;

  insert into public.organization_memory_projection_runs(organization_id,status,source_fingerprint)
  values(p_organization_id,'running',v_fingerprint) returning id into v_run;

  v_hash:=encode(extensions.digest(convert_to(coalesce(v_org.name,'')||'|'||coalesce(v_org.country,'')||'|'||coalesce(v_org.industry,'')||'|'||coalesce(v_org.size,''),'UTF8'),'sha256'),'hex');
  v_result:=public.upsert_organization_memory_node_version(p_organization_id,'org.organizacion.'||replace(p_organization_id::text,'-',''),'organizacion',v_org.name,null,
    jsonb_build_object('pais',v_org.country,'industria',v_org.industry,'tamano',v_org.size),'active',v_hash,'organization',v_org.id);
  v_root:=(v_result->>'nodeId')::uuid;
  v_nodes:=v_nodes+case when (v_result->>'nodeCreated')::boolean then 1 else 0 end;
  v_node_versions:=v_node_versions+case when (v_result->>'versionCreated')::boolean then 1 else 0 end;
  if not exists(select 1 from public.knowledge_provenance p where p.organization_id=p_organization_id and p.object_type='organization_memory_node' and p.object_id=v_root and p.source_type='organization' and p.source_id=v_org.id) then
    insert into public.knowledge_provenance(organization_id,object_type,object_id,source_type,source_id,source_hash,process_type,process_version)
    values(p_organization_id,'organization_memory_node',v_root,'organization',v_org.id,v_hash,'operational_memory_projection','v1');
    v_provenance:=v_provenance+1;
  end if;

  for v_row in select d.*,p.organization_id from public.documents d join public.projects p on p.id=d.project_id where p.organization_id=p_organization_id loop
    v_hash:=encode(extensions.digest(convert_to(coalesce(v_row.name,'')||'|'||coalesce(v_row.document_type,'')||'|'||coalesce(v_row.status,'')||'|'||coalesce(v_row.file_url,''),'UTF8'),'sha256'),'hex');
    v_result:=public.upsert_organization_memory_node_version(p_organization_id,'org.documento.'||replace(v_row.id::text,'-',''),'documento',v_row.name,null,
      jsonb_build_object('tipoDocumento',v_row.document_type,'estado',v_row.status,'proyectoId',v_row.project_id),'active',v_hash,'document',v_row.id);
    v_node:=(v_result->>'nodeId')::uuid;
    v_nodes:=v_nodes+case when (v_result->>'nodeCreated')::boolean then 1 else 0 end;
    v_node_versions:=v_node_versions+case when (v_result->>'versionCreated')::boolean then 1 else 0 end;
    v_edge_hash:=encode(extensions.digest(convert_to(v_root::text||'|POSEE|'||v_node::text||'|'||v_hash,'UTF8'),'sha256'),'hex');
    v_edge_result:=public.upsert_organization_memory_edge_version(p_organization_id,'org.rel.posee.'||replace(v_root::text,'-','')||'.'||replace(v_node::text,'-',''),v_root,v_node,'POSEE',v_org.name||' posee el documento '||v_row.name,'{}'::jsonb,'active',v_edge_hash);
    v_edges:=v_edges+case when (v_edge_result->>'edgeCreated')::boolean then 1 else 0 end;
    v_edge_versions:=v_edge_versions+case when (v_edge_result->>'versionCreated')::boolean then 1 else 0 end;
    if not exists(select 1 from public.knowledge_provenance p where p.organization_id=p_organization_id and p.object_type='organization_memory_node' and p.object_id=v_node and p.source_type='document' and p.source_id=v_row.id) then
      insert into public.knowledge_provenance(organization_id,object_type,object_id,source_type,source_id,source_hash,process_type,process_version)
      values(p_organization_id,'organization_memory_node',v_node,'document',v_row.id,v_hash,'operational_memory_projection','v1'); v_provenance:=v_provenance+1;
    end if;
  end loop;

  for v_row in select * from public.controls c where c.organization_id=p_organization_id loop
    v_hash:=encode(extensions.digest(convert_to(coalesce(v_row.name,'')||'|'||coalesce(v_row.description,'')||'|'||coalesce(v_row.status,'')||'|'||coalesce(v_row.design_effectiveness,'')||'|'||coalesce(v_row.operating_effectiveness,'')||'|'||coalesce(v_row.updated_at::text,''),'UTF8'),'sha256'),'hex');
    v_result:=public.upsert_organization_memory_node_version(p_organization_id,'org.control.'||replace(v_row.id::text,'-',''),'control',v_row.name,v_row.description,
      jsonb_build_object('codigo',v_row.code,'tipo',v_row.control_type,'naturaleza',v_row.control_nature,'modoEjecucion',v_row.execution_mode,'estado',v_row.status,'efectividadDiseno',v_row.design_effectiveness,'efectividadOperacion',v_row.operating_effectiveness),'active',v_hash,'control',v_row.id);
    v_node:=(v_result->>'nodeId')::uuid;
    v_nodes:=v_nodes+case when (v_result->>'nodeCreated')::boolean then 1 else 0 end;
    v_node_versions:=v_node_versions+case when (v_result->>'versionCreated')::boolean then 1 else 0 end;
    v_edge_hash:=encode(extensions.digest(convert_to(v_root::text||'|IMPLEMENTA|'||v_node::text||'|'||v_hash,'UTF8'),'sha256'),'hex');
    v_edge_result:=public.upsert_organization_memory_edge_version(p_organization_id,'org.rel.implementa.'||replace(v_root::text,'-','')||'.'||replace(v_node::text,'-',''),v_root,v_node,'IMPLEMENTA',v_org.name||' implementa el control '||v_row.name,'{}'::jsonb,'active',v_edge_hash);
    v_edges:=v_edges+case when (v_edge_result->>'edgeCreated')::boolean then 1 else 0 end;
    v_edge_versions:=v_edge_versions+case when (v_edge_result->>'versionCreated')::boolean then 1 else 0 end;
    if not exists(select 1 from public.knowledge_provenance p where p.organization_id=p_organization_id and p.object_type='organization_memory_node' and p.object_id=v_node and p.source_type='control' and p.source_id=v_row.id) then
      insert into public.knowledge_provenance(organization_id,object_type,object_id,source_type,source_id,source_hash,process_type,process_version)
      values(p_organization_id,'organization_memory_node',v_node,'control',v_row.id,v_hash,'operational_memory_projection','v1'); v_provenance:=v_provenance+1;
    end if;
  end loop;

  for v_row in select * from public.evidence e where e.organization_id=p_organization_id loop
    v_hash:=coalesce(nullif(v_row.integrity_hash,''),encode(extensions.digest(convert_to(coalesce(v_row.name,'')||'|'||coalesce(v_row.description,'')||'|'||coalesce(v_row.validation_status,'')||'|'||coalesce(v_row.integrity_status,'')||'|'||coalesce(v_row.updated_at::text,''),'UTF8'),'sha256'),'hex'));
    if v_hash !~ '^[a-f0-9]{64}$' then v_hash:=encode(extensions.digest(convert_to(v_hash,'UTF8'),'sha256'),'hex'); end if;
    v_result:=public.upsert_organization_memory_node_version(p_organization_id,'org.evidencia.'||replace(v_row.id::text,'-',''),'evidencia',v_row.name,v_row.description,
      jsonb_build_object('tipoEvidencia',v_row.evidence_type,'origen',v_row.source,'estadoValidacion',v_row.validation_status,'estadoIntegridad',v_row.integrity_status,'confidencialidad',v_row.confidentiality,'documentoId',v_row.document_id),'active',v_hash,'evidence',v_row.id);
    v_node:=(v_result->>'nodeId')::uuid;
    v_nodes:=v_nodes+case when (v_result->>'nodeCreated')::boolean then 1 else 0 end;
    v_node_versions:=v_node_versions+case when (v_result->>'versionCreated')::boolean then 1 else 0 end;
    v_edge_hash:=encode(extensions.digest(convert_to(v_root::text||'|POSEE|'||v_node::text||'|'||v_hash,'UTF8'),'sha256'),'hex');
    v_edge_result:=public.upsert_organization_memory_edge_version(p_organization_id,'org.rel.posee.'||replace(v_root::text,'-','')||'.'||replace(v_node::text,'-',''),v_root,v_node,'POSEE',v_org.name||' posee la evidencia '||v_row.name,'{}'::jsonb,'active',v_edge_hash);
    v_edges:=v_edges+case when (v_edge_result->>'edgeCreated')::boolean then 1 else 0 end;
    v_edge_versions:=v_edge_versions+case when (v_edge_result->>'versionCreated')::boolean then 1 else 0 end;
    if v_row.document_id is not null then
      select n.id into v_source from public.organization_memory_nodes n where n.organization_id=p_organization_id and n.source_entity_type='document' and n.source_entity_id=v_row.document_id;
      if v_source is not null then
        v_edge_hash:=encode(extensions.digest(convert_to(v_node::text||'|DERIVA_DE|'||v_source::text||'|'||v_hash,'UTF8'),'sha256'),'hex');
        v_edge_result:=public.upsert_organization_memory_edge_version(p_organization_id,'org.rel.deriva-de.'||replace(v_node::text,'-','')||'.'||replace(v_source::text,'-',''),v_node,v_source,'DERIVA_DE',v_row.name||' deriva de un documento','{}'::jsonb,'active',v_edge_hash);
        v_edges:=v_edges+case when (v_edge_result->>'edgeCreated')::boolean then 1 else 0 end;
        v_edge_versions:=v_edge_versions+case when (v_edge_result->>'versionCreated')::boolean then 1 else 0 end;
      end if;
    end if;
    if not exists(select 1 from public.knowledge_provenance p where p.organization_id=p_organization_id and p.object_type='organization_memory_node' and p.object_id=v_node and p.source_type='evidence' and p.source_id=v_row.id) then
      insert into public.knowledge_provenance(organization_id,object_type,object_id,source_type,source_id,source_hash,process_type,process_version)
      values(p_organization_id,'organization_memory_node',v_node,'evidence',v_row.id,v_hash,'operational_memory_projection','v1'); v_provenance:=v_provenance+1;
    end if;
  end loop;

  for v_row in select * from public.control_evidence ce where ce.organization_id=p_organization_id loop
    select n.id into v_source from public.organization_memory_nodes n where n.organization_id=p_organization_id and n.source_entity_type='control' and n.source_entity_id=v_row.control_id;
    select n.id into v_target from public.organization_memory_nodes n where n.organization_id=p_organization_id and n.source_entity_type='evidence' and n.source_entity_id=v_row.evidence_id;
    if v_source is not null and v_target is not null then
      v_edge_hash:=encode(extensions.digest(convert_to(v_source::text||'|RESPALDADO_POR|'||v_target::text||'|'||coalesce(v_row.sufficiency_status,'')||'|'||coalesce(v_row.relevance,''),'UTF8'),'sha256'),'hex');
      v_edge_result:=public.upsert_organization_memory_edge_version(p_organization_id,'org.rel.respaldado-por.'||replace(v_source::text,'-','')||'.'||replace(v_target::text,'-',''),v_source,v_target,'RESPALDADO_POR','El control está respaldado por evidencia',jsonb_build_object('suficiencia',v_row.sufficiency_status,'relevancia',v_row.relevance),'active',v_edge_hash);
      v_edges:=v_edges+case when (v_edge_result->>'edgeCreated')::boolean then 1 else 0 end;
      v_edge_versions:=v_edge_versions+case when (v_edge_result->>'versionCreated')::boolean then 1 else 0 end;
    end if;
  end loop;

  update public.organization_memory_projection_runs r
  set status=case when v_node_versions=0 and v_edge_versions=0 then 'unchanged' else 'succeeded' end,
      nodes_created=v_nodes,node_versions_created=v_node_versions,edges_created=v_edges,
      edge_versions_created=v_edge_versions,provenance_created=v_provenance,completed_at=now()
  where r.id=v_run;
  return jsonb_build_object('runId',v_run,'status',case when v_node_versions=0 and v_edge_versions=0 then 'unchanged' else 'succeeded' end,
    'nodesCreated',v_nodes,'nodeVersionsCreated',v_node_versions,'edgesCreated',v_edges,'edgeVersionsCreated',v_edge_versions,'provenanceCreated',v_provenance);
exception when others then
  if v_run is not null then
    update public.organization_memory_projection_runs r set status='failed',error_code=sqlstate,error_message=left(sqlerrm,500),completed_at=now() where r.id=v_run;
  end if;
  raise;
end;
$$;

revoke all on function public.upsert_organization_memory_node_version(uuid,text,text,text,text,jsonb,text,text,text,uuid) from public,anon,authenticated;
revoke all on function public.upsert_organization_memory_edge_version(uuid,text,uuid,uuid,text,text,jsonb,text,text) from public,anon,authenticated;
revoke all on function public.project_organization_operational_memory(uuid) from public,anon,authenticated;
grant execute on function public.upsert_organization_memory_node_version(uuid,text,text,text,text,jsonb,text,text,text,uuid) to service_role;
grant execute on function public.upsert_organization_memory_edge_version(uuid,text,uuid,uuid,text,text,jsonb,text,text) to service_role;
grant execute on function public.project_organization_operational_memory(uuid) to service_role;

commit;