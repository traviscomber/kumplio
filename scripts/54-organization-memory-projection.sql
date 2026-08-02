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
  node_row public.organization_memory_nodes;
  current_version public.organization_memory_node_versions;
  new_version_id uuid;
  next_version integer;
  created_node boolean := false;
begin
  if p_content_hash is null or p_content_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_memory_node_hash'; end if;
  if not exists(select 1 from public.organizations o where o.id=p_organization_id) then raise exception 'organization_not_found'; end if;

  select * into node_row from public.organization_memory_nodes n
  where n.organization_id=p_organization_id and n.canonical_key=lower(trim(p_canonical_key)) for update;

  if node_row.id is null then
    insert into public.organization_memory_nodes(
      organization_id,canonical_key,node_type,lifecycle_status,source_entity_type,source_entity_id
    ) values (
      p_organization_id,lower(trim(p_canonical_key)),lower(trim(p_node_type)),p_lifecycle_status,
      p_source_entity_type,p_source_entity_id
    ) returning * into node_row;
    created_node:=true;
  elsif node_row.source_entity_type is distinct from p_source_entity_type
     or node_row.source_entity_id is distinct from p_source_entity_id then
    raise exception 'memory_node_source_identity_conflict';
  end if;

  if node_row.current_version_id is not null then
    select * into current_version from public.organization_memory_node_versions v
    where v.id=node_row.current_version_id;
  end if;

  if current_version.id is not null and current_version.content_hash=p_content_hash then
    return jsonb_build_object('nodeId',node_row.id,'versionId',current_version.id,'nodeCreated',created_node,'versionCreated',false,'unchanged',true);
  end if;

  select coalesce(max(v.version_number),0)+1 into next_version
  from public.organization_memory_node_versions v where v.node_id=node_row.id;

  insert into public.organization_memory_node_versions(
    organization_id,node_id,version_number,display_name,description,attributes,review_status,content_hash
  ) values (
    p_organization_id,node_row.id,next_version,trim(p_display_name),p_description,coalesce(p_attributes,'{}'::jsonb),
    'approved',p_content_hash
  ) returning id into new_version_id;

  update public.organization_memory_nodes
  set current_version_id=new_version_id,node_type=lower(trim(p_node_type)),lifecycle_status=p_lifecycle_status,updated_at=now()
  where id=node_row.id;

  insert into public.knowledge_events(organization_id,object_type,object_id,event_type,actor_type,from_status,to_status,details)
  values(p_organization_id,'organization_memory_node',node_row.id,case when created_node then 'created' else 'version_created' end,
    'system',current_version.review_status,'approved',jsonb_build_object('versionNumber',next_version,'contentHash',p_content_hash));

  return jsonb_build_object('nodeId',node_row.id,'versionId',new_version_id,'nodeCreated',created_node,'versionCreated',true,'unchanged',false);
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
  edge_row public.organization_memory_edges;
  current_version public.organization_memory_edge_versions;
  new_version_id uuid;
  next_version integer;
  created_edge boolean:=false;
begin
  if p_source_node_id=p_target_node_id then raise exception 'self_memory_edge_forbidden'; end if;
  if p_content_hash is null or p_content_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_memory_edge_hash'; end if;
  if not exists(select 1 from public.organization_memory_nodes n where n.id=p_source_node_id and n.organization_id=p_organization_id)
    or not exists(select 1 from public.organization_memory_nodes n where n.id=p_target_node_id and n.organization_id=p_organization_id) then
    raise exception 'memory_edge_cross_organization_forbidden';
  end if;

  select * into edge_row from public.organization_memory_edges e
  where e.organization_id=p_organization_id and e.canonical_key=lower(trim(p_canonical_key)) for update;

  if edge_row.id is null then
    insert into public.organization_memory_edges(organization_id,canonical_key,source_node_id,target_node_id,relation_type,lifecycle_status)
    values(p_organization_id,lower(trim(p_canonical_key)),p_source_node_id,p_target_node_id,upper(trim(p_relation_type)),p_lifecycle_status)
    returning * into edge_row;
    created_edge:=true;
  elsif edge_row.source_node_id<>p_source_node_id or edge_row.target_node_id<>p_target_node_id
     or edge_row.relation_type<>upper(trim(p_relation_type)) then
    raise exception 'memory_edge_identity_conflict';
  end if;

  if edge_row.current_version_id is not null then
    select * into current_version from public.organization_memory_edge_versions v where v.id=edge_row.current_version_id;
  end if;
  if current_version.id is not null and current_version.content_hash=p_content_hash then
    return jsonb_build_object('edgeId',edge_row.id,'versionId',current_version.id,'edgeCreated',created_edge,'versionCreated',false,'unchanged',true);
  end if;

  select coalesce(max(v.version_number),0)+1 into next_version
  from public.organization_memory_edge_versions v where v.edge_id=edge_row.id;
  insert into public.organization_memory_edge_versions(
    organization_id,edge_id,version_number,statement,attributes,review_status,content_hash
  ) values (
    p_organization_id,edge_row.id,next_version,p_statement,coalesce(p_attributes,'{}'::jsonb),'approved',p_content_hash
  ) returning id into new_version_id;
  update public.organization_memory_edges set current_version_id=new_version_id,lifecycle_status=p_lifecycle_status,updated_at=now()
  where id=edge_row.id;
  insert into public.knowledge_events(organization_id,object_type,object_id,event_type,actor_type,from_status,to_status,details)
  values(p_organization_id,'organization_memory_edge',edge_row.id,case when created_edge then 'created' else 'version_created' end,
    'system',current_version.review_status,'approved',jsonb_build_object('versionNumber',next_version,'contentHash',p_content_hash));
  return jsonb_build_object('edgeId',edge_row.id,'versionId',new_version_id,'edgeCreated',created_edge,'versionCreated',true,'unchanged',false);
end;
$$;

create or replace function public.project_organization_operational_memory(p_organization_id uuid)
returns jsonb
language plpgsql security invoker set search_path=''
as $$
#variable_conflict use_variable
declare
  org_row public.organizations;
  doc_row record;
  control_row public.controls;
  evidence_row public.evidence;
  link_row public.control_evidence;
  root_result jsonb; node_result jsonb; edge_result jsonb;
  root_node_id uuid; child_node_id uuid; source_node_id uuid; target_node_id uuid; run_id uuid;
  fingerprint text; content_hash text; edge_hash text; canonical_key text;
  nodes_created integer:=0; node_versions_created integer:=0; edges_created integer:=0; edge_versions_created integer:=0; provenance_created integer:=0;
begin
  select * into org_row from public.organizations o where o.id=p_organization_id;
  if org_row.id is null then raise exception 'organization_not_found'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_organization_id::text,77));

  select encode(extensions.digest(convert_to(
    coalesce(org_row.name,'')||'|'||coalesce(org_row.country,'')||'|'||coalesce(org_row.industry,'')||'|'||coalesce(org_row.size,'')||'|'||
    coalesce((select string_agg(d.id::text||':'||coalesce(d.name,'')||':'||coalesce(d.status,''),'|' order by d.id) from public.documents d join public.projects p on p.id=d.project_id where p.organization_id=p_organization_id),'')||'|'||
    coalesce((select string_agg(c.id::text||':'||coalesce(c.name,'')||':'||coalesce(c.status,'')||':'||coalesce(c.updated_at::text,''),'|' order by c.id) from public.controls c where c.organization_id=p_organization_id),'')||'|'||
    coalesce((select string_agg(e.id::text||':'||coalesce(e.name,'')||':'||coalesce(e.validation_status,'')||':'||coalesce(e.updated_at::text,''),'|' order by e.id) from public.evidence e where e.organization_id=p_organization_id),''),
    'UTF8'),'sha256'),'hex') into fingerprint;

  insert into public.organization_memory_projection_runs(organization_id,status,source_fingerprint)
  values(p_organization_id,'running',fingerprint) returning id into run_id;

  content_hash:=encode(extensions.digest(convert_to(coalesce(org_row.name,'')||'|'||coalesce(org_row.country,'')||'|'||coalesce(org_row.industry,'')||'|'||coalesce(org_row.size,''),'UTF8'),'sha256'),'hex');
  root_result:=public.upsert_organization_memory_node_version(p_organization_id,'org.organizacion.'||replace(p_organization_id::text,'-',''),'organizacion',org_row.name,null,
    jsonb_build_object('pais',org_row.country,'industria',org_row.industry,'tamano',org_row.size),'active',content_hash,'organization',org_row.id);
  root_node_id:=(root_result->>'nodeId')::uuid;
  nodes_created:=nodes_created+case when (root_result->>'nodeCreated')::boolean then 1 else 0 end;
  node_versions_created:=node_versions_created+case when (root_result->>'versionCreated')::boolean then 1 else 0 end;

  if not exists(select 1 from public.knowledge_provenance p where p.organization_id=p_organization_id and p.object_type='organization_memory_node' and p.object_id=root_node_id and p.source_type='organization' and p.source_id=org_row.id) then
    insert into public.knowledge_provenance(organization_id,object_type,object_id,source_type,source_id,source_hash,process_type,process_version)
    values(p_organization_id,'organization_memory_node',root_node_id,'organization',org_row.id,content_hash,'operational_memory_projection','v1'); provenance_created:=provenance_created+1;
  end if;

  for doc_row in select d.*,p.organization_id from public.documents d join public.projects p on p.id=d.project_id where p.organization_id=p_organization_id loop
    content_hash:=encode(extensions.digest(convert_to(coalesce(doc_row.name,'')||'|'||coalesce(doc_row.document_type,'')||'|'||coalesce(doc_row.status,'')||'|'||coalesce(doc_row.file_url,''),'UTF8'),'sha256'),'hex');
    canonical_key:='org.documento.'||replace(doc_row.id::text,'-','');
    node_result:=public.upsert_organization_memory_node_version(p_organization_id,canonical_key,'documento',doc_row.name,null,
      jsonb_build_object('tipoDocumento',doc_row.document_type,'estado',doc_row.status,'proyectoId',doc_row.project_id),'active',content_hash,'document',doc_row.id);
    child_node_id:=(node_result->>'nodeId')::uuid;
    nodes_created:=nodes_created+case when (node_result->>'nodeCreated')::boolean then 1 else 0 end; node_versions_created:=node_versions_created+case when (node_result->>'versionCreated')::boolean then 1 else 0 end;
    edge_hash:=encode(extensions.digest(convert_to(root_node_id::text||'|POSEE|'||child_node_id::text||'|'||content_hash,'UTF8'),'sha256'),'hex');
    edge_result:=public.upsert_organization_memory_edge_version(p_organization_id,'org.rel.posee.'||replace(root_node_id::text,'-','')||'.'||replace(child_node_id::text,'-',''),root_node_id,child_node_id,'POSEE',org_row.name||' posee el documento '||doc_row.name,'{}'::jsonb,'active',edge_hash);
    edges_created:=edges_created+case when (edge_result->>'edgeCreated')::boolean then 1 else 0 end; edge_versions_created:=edge_versions_created+case when (edge_result->>'versionCreated')::boolean then 1 else 0 end;
    if not exists(select 1 from public.knowledge_provenance p where p.organization_id=p_organization_id and p.object_type='organization_memory_node' and p.object_id=child_node_id and p.source_type='document' and p.source_id=doc_row.id) then
      insert into public.knowledge_provenance(organization_id,object_type,object_id,source_type,source_id,source_hash,process_type,process_version)
      values(p_organization_id,'organization_memory_node',child_node_id,'document',doc_row.id,content_hash,'operational_memory_projection','v1'); provenance_created:=provenance_created+1;
    end if;
  end loop;

  for control_row in select * from public.controls c where c.organization_id=p_organization_id loop
    content_hash:=encode(extensions.digest(convert_to(coalesce(control_row.name,'')||'|'||coalesce(control_row.description,'')||'|'||coalesce(control_row.status,'')||'|'||coalesce(control_row.design_effectiveness,'')||'|'||coalesce(control_row.operating_effectiveness,'')||'|'||coalesce(control_row.updated_at::text,''),'UTF8'),'sha256'),'hex');
    canonical_key:='org.control.'||replace(control_row.id::text,'-','');
    node_result:=public.upsert_organization_memory_node_version(p_organization_id,canonical_key,'control',control_row.name,control_row.description,
      jsonb_build_object('codigo',control_row.code,'tipo',control_row.control_type,'naturaleza',control_row.control_nature,'modoEjecucion',control_row.execution_mode,'estado',control_row.status,'efectividadDiseno',control_row.design_effectiveness,'efectividadOperacion',control_row.operating_effectiveness),'active',content_hash,'control',control_row.id);
    child_node_id:=(node_result->>'nodeId')::uuid;
    nodes_created:=nodes_created+case when (node_result->>'nodeCreated')::boolean then 1 else 0 end; node_versions_created:=node_versions_created+case when (node_result->>'versionCreated')::boolean then 1 else 0 end;
    edge_hash:=encode(extensions.digest(convert_to(root_node_id::text||'|IMPLEMENTA|'||child_node_id::text||'|'||content_hash,'UTF8'),'sha256'),'hex');
    edge_result:=public.upsert_organization_memory_edge_version(p_organization_id,'org.rel.implementa.'||replace(root_node_id::text,'-','')||'.'||replace(child_node_id::text,'-',''),root_node_id,child_node_id,'IMPLEMENTA',org_row.name||' implementa el control '||control_row.name,'{}'::jsonb,'active',edge_hash);
    edges_created:=edges_created+case when (edge_result->>'edgeCreated')::boolean then 1 else 0 end; edge_versions_created:=edge_versions_created+case when (edge_result->>'versionCreated')::boolean then 1 else 0 end;
    if not exists(select 1 from public.knowledge_provenance p where p.organization_id=p_organization_id and p.object_type='organization_memory_node' and p.object_id=child_node_id and p.source_type='control' and p.source_id=control_row.id) then
      insert into public.knowledge_provenance(organization_id,object_type,object_id,source_type,source_id,source_hash,process_type,process_version)
      values(p_organization_id,'organization_memory_node',child_node_id,'control',control_row.id,content_hash,'operational_memory_projection','v1'); provenance_created:=provenance_created+1;
    end if;
  end loop;

  for evidence_row in select * from public.evidence e where e.organization_id=p_organization_id loop
    content_hash:=coalesce(nullif(evidence_row.integrity_hash,''),encode(extensions.digest(convert_to(coalesce(evidence_row.name,'')||'|'||coalesce(evidence_row.description,'')||'|'||coalesce(evidence_row.validation_status,'')||'|'||coalesce(evidence_row.integrity_status,'')||'|'||coalesce(evidence_row.updated_at::text,''),'UTF8'),'sha256'),'hex'));
    if content_hash !~ '^[a-f0-9]{64}$' then content_hash:=encode(extensions.digest(convert_to(content_hash,'UTF8'),'sha256'),'hex'); end if;
    canonical_key:='org.evidencia.'||replace(evidence_row.id::text,'-','');
    node_result:=public.upsert_organization_memory_node_version(p_organization_id,canonical_key,'evidencia',evidence_row.name,evidence_row.description,
      jsonb_build_object('tipoEvidencia',evidence_row.evidence_type,'origen',evidence_row.source,'estadoValidacion',evidence_row.validation_status,'estadoIntegridad',evidence_row.integrity_status,'confidencialidad',evidence_row.confidentiality,'documentoId',evidence_row.document_id),'active',content_hash,'evidence',evidence_row.id);
    child_node_id:=(node_result->>'nodeId')::uuid;
    nodes_created:=nodes_created+case when (node_result->>'nodeCreated')::boolean then 1 else 0 end; node_versions_created:=node_versions_created+case when (node_result->>'versionCreated')::boolean then 1 else 0 end;
    edge_hash:=encode(extensions.digest(convert_to(root_node_id::text||'|POSEE|'||child_node_id::text||'|'||content_hash,'UTF8'),'sha256'),'hex');
    edge_result:=public.upsert_organization_memory_edge_version(p_organization_id,'org.rel.posee.'||replace(root_node_id::text,'-','')||'.'||replace(child_node_id::text,'-',''),root_node_id,child_node_id,'POSEE',org_row.name||' posee la evidencia '||evidence_row.name,'{}'::jsonb,'active',edge_hash);
    edges_created:=edges_created+case when (edge_result->>'edgeCreated')::boolean then 1 else 0 end; edge_versions_created:=edge_versions_created+case when (edge_result->>'versionCreated')::boolean then 1 else 0 end;
    if evidence_row.document_id is not null then
      select n.id into source_node_id from public.organization_memory_nodes n where n.organization_id=p_organization_id and n.source_entity_type='document' and n.source_entity_id=evidence_row.document_id;
      if source_node_id is not null then
        edge_hash:=encode(extensions.digest(convert_to(child_node_id::text||'|DERIVA_DE|'||source_node_id::text||'|'||content_hash,'UTF8'),'sha256'),'hex');
        edge_result:=public.upsert_organization_memory_edge_version(p_organization_id,'org.rel.deriva-de.'||replace(child_node_id::text,'-','')||'.'||replace(source_node_id::text,'-',''),child_node_id,source_node_id,'DERIVA_DE',evidence_row.name||' deriva de un documento','{}'::jsonb,'active',edge_hash);
        edges_created:=edges_created+case when (edge_result->>'edgeCreated')::boolean then 1 else 0 end; edge_versions_created:=edge_versions_created+case when (edge_result->>'versionCreated')::boolean then 1 else 0 end;
      end if;
    end if;
    if not exists(select 1 from public.knowledge_provenance p where p.organization_id=p_organization_id and p.object_type='organization_memory_node' and p.object_id=child_node_id and p.source_type='evidence' and p.source_id=evidence_row.id) then
      insert into public.knowledge_provenance(organization_id,object_type,object_id,source_type,source_id,source_hash,process_type,process_version)
      values(p_organization_id,'organization_memory_node',child_node_id,'evidence',evidence_row.id,content_hash,'operational_memory_projection','v1'); provenance_created:=provenance_created+1;
    end if;
  end loop;

  for link_row in select * from public.control_evidence ce where ce.organization_id=p_organization_id loop
    select n.id into source_node_id from public.organization_memory_nodes n where n.organization_id=p_organization_id and n.source_entity_type='control' and n.source_entity_id=link_row.control_id;
    select n.id into target_node_id from public.organization_memory_nodes n where n.organization_id=p_organization_id and n.source_entity_type='evidence' and n.source_entity_id=link_row.evidence_id;
    if source_node_id is not null and target_node_id is not null then
      edge_hash:=encode(extensions.digest(convert_to(source_node_id::text||'|RESPALDADO_POR|'||target_node_id::text||'|'||coalesce(link_row.sufficiency_status,'')||'|'||coalesce(link_row.relevance,''),'UTF8'),'sha256'),'hex');
      edge_result:=public.upsert_organization_memory_edge_version(p_organization_id,'org.rel.respaldado-por.'||replace(source_node_id::text,'-','')||'.'||replace(target_node_id::text,'-',''),source_node_id,target_node_id,'RESPALDADO_POR','El control está respaldado por evidencia',jsonb_build_object('suficiencia',link_row.sufficiency_status,'relevancia',link_row.relevance),'active',edge_hash);
      edges_created:=edges_created+case when (edge_result->>'edgeCreated')::boolean then 1 else 0 end; edge_versions_created:=edge_versions_created+case when (edge_result->>'versionCreated')::boolean then 1 else 0 end;
    end if;
  end loop;

  update public.organization_memory_projection_runs set status=case when node_versions_created=0 and edge_versions_created=0 then 'unchanged' else 'succeeded' end,
    nodes_created=nodes_created,node_versions_created=node_versions_created,edges_created=edges_created,edge_versions_created=edge_versions_created,provenance_created=provenance_created,completed_at=now()
  where id=run_id;
  return jsonb_build_object('runId',run_id,'status',case when node_versions_created=0 and edge_versions_created=0 then 'unchanged' else 'succeeded' end,
    'nodesCreated',nodes_created,'nodeVersionsCreated',node_versions_created,'edgesCreated',edges_created,'edgeVersionsCreated',edge_versions_created,'provenanceCreated',provenance_created);
exception when others then
  if run_id is not null then update public.organization_memory_projection_runs set status='failed',error_code=sqlstate,error_message=left(sqlerrm,500),completed_at=now() where id=run_id; end if;
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