-- KUMPLIO Plataforma de Conocimiento — integridad y servicios internos
begin;

create or replace function public.prevent_immutable_knowledge_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'immutable_knowledge_record';
end;
$$;

create or replace function public.validate_organization_memory_node_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare node_org uuid;
begin
  select organization_id into node_org
  from public.organization_memory_nodes
  where id = new.node_id;
  if node_org is null or node_org <> new.organization_id then
    raise exception 'memory_node_version_organization_mismatch';
  end if;
  return new;
end;
$$;

create or replace function public.validate_organization_memory_edge()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare source_org uuid; target_org uuid;
begin
  select organization_id into source_org from public.organization_memory_nodes where id = new.source_node_id;
  select organization_id into target_org from public.organization_memory_nodes where id = new.target_node_id;
  if source_org is null or target_org is null then raise exception 'memory_edge_node_not_found'; end if;
  if source_org <> new.organization_id or target_org <> new.organization_id then
    raise exception 'memory_edge_cross_organization_forbidden';
  end if;
  return new;
end;
$$;

create or replace function public.validate_organization_memory_edge_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare edge_org uuid;
begin
  select organization_id into edge_org
  from public.organization_memory_edges
  where id = new.edge_id;
  if edge_org is null or edge_org <> new.organization_id then
    raise exception 'memory_edge_version_organization_mismatch';
  end if;
  return new;
end;
$$;

create or replace function public.validate_knowledge_mapping()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare private_org uuid;
begin
  select organization_id into private_org
  from public.organization_memory_nodes
  where id = new.organization_node_id;
  if private_org is null or private_org <> new.organization_id then
    raise exception 'knowledge_mapping_organization_mismatch';
  end if;
  if not exists (select 1 from public.public_knowledge_nodes where id = new.public_node_id) then
    raise exception 'knowledge_mapping_public_node_not_found';
  end if;
  return new;
end;
$$;

create trigger organization_memory_node_versions_validate
before insert or update on public.organization_memory_node_versions
for each row execute function public.validate_organization_memory_node_version();

create trigger organization_memory_edges_validate
before insert or update on public.organization_memory_edges
for each row execute function public.validate_organization_memory_edge();

create trigger organization_memory_edge_versions_validate
before insert or update on public.organization_memory_edge_versions
for each row execute function public.validate_organization_memory_edge_version();

create trigger knowledge_mappings_validate
before insert or update on public.knowledge_mappings
for each row execute function public.validate_knowledge_mapping();

create trigger public_knowledge_node_versions_immutable
before update or delete on public.public_knowledge_node_versions
for each row execute function public.prevent_immutable_knowledge_change();
create trigger public_knowledge_edge_versions_immutable
before update or delete on public.public_knowledge_edge_versions
for each row execute function public.prevent_immutable_knowledge_change();
create trigger organization_memory_node_versions_immutable
before update or delete on public.organization_memory_node_versions
for each row execute function public.prevent_immutable_knowledge_change();
create trigger organization_memory_edge_versions_immutable
before update or delete on public.organization_memory_edge_versions
for each row execute function public.prevent_immutable_knowledge_change();
create trigger knowledge_provenance_immutable
before update or delete on public.knowledge_provenance
for each row execute function public.prevent_immutable_knowledge_change();
create trigger knowledge_events_immutable
before update or delete on public.knowledge_events
for each row execute function public.prevent_immutable_knowledge_change();

create or replace function public.create_public_knowledge_node(
  p_canonical_key text,
  p_node_type text,
  p_display_name text,
  p_description text default null,
  p_attributes jsonb default '{}'::jsonb,
  p_effective_from date default null,
  p_effective_to date default null,
  p_lifecycle_status text default 'draft',
  p_source_entity_type text default null,
  p_source_entity_id uuid default null,
  p_created_by uuid default null
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  node_id uuid;
  version_id uuid;
  calculated_hash text;
begin
  calculated_hash := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        p_canonical_key || '|' || p_node_type || '|' || p_display_name || '|' || coalesce(p_description,'') || '|' || coalesce(p_attributes,'{}'::jsonb)::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  insert into public.public_knowledge_nodes(
    canonical_key,node_type,lifecycle_status,source_entity_type,source_entity_id,created_by
  ) values (
    lower(trim(p_canonical_key)),lower(trim(p_node_type)),p_lifecycle_status,p_source_entity_type,p_source_entity_id,p_created_by
  ) returning id into node_id;

  insert into public.public_knowledge_node_versions(
    node_id,version_number,display_name,description,attributes,effective_from,effective_to,review_status,content_hash,created_by
  ) values (
    node_id,1,trim(p_display_name),p_description,coalesce(p_attributes,'{}'::jsonb),p_effective_from,p_effective_to,p_lifecycle_status,calculated_hash,p_created_by
  ) returning id into version_id;

  update public.public_knowledge_nodes set current_version_id=version_id,updated_at=now() where id=node_id;
  insert into public.knowledge_events(object_type,object_id,event_type,actor_type,actor_id,to_status)
  values('public_knowledge_node',node_id,'created',case when p_created_by is null then 'system' else 'user' end,p_created_by,p_lifecycle_status);
  return node_id;
end;
$$;

create or replace function public.create_public_knowledge_edge(
  p_canonical_key text,
  p_source_node_id uuid,
  p_target_node_id uuid,
  p_relation_type text,
  p_statement text default null,
  p_attributes jsonb default '{}'::jsonb,
  p_effective_from date default null,
  p_effective_to date default null,
  p_lifecycle_status text default 'draft',
  p_created_by uuid default null
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare edge_id uuid; version_id uuid; calculated_hash text;
begin
  if not exists(select 1 from public.public_knowledge_nodes where id=p_source_node_id) or
     not exists(select 1 from public.public_knowledge_nodes where id=p_target_node_id) then
    raise exception 'public_knowledge_edge_node_not_found';
  end if;
  calculated_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    p_source_node_id::text||'|'||p_relation_type||'|'||p_target_node_id::text||'|'||coalesce(p_statement,'')||'|'||coalesce(p_attributes,'{}'::jsonb)::text,'UTF8'),'sha256'),'hex');
  insert into public.public_knowledge_edges(canonical_key,source_node_id,target_node_id,relation_type,lifecycle_status,created_by)
  values(lower(trim(p_canonical_key)),p_source_node_id,p_target_node_id,upper(trim(p_relation_type)),p_lifecycle_status,p_created_by)
  returning id into edge_id;
  insert into public.public_knowledge_edge_versions(edge_id,version_number,statement,attributes,effective_from,effective_to,review_status,content_hash,created_by)
  values(edge_id,1,p_statement,coalesce(p_attributes,'{}'::jsonb),p_effective_from,p_effective_to,p_lifecycle_status,calculated_hash,p_created_by)
  returning id into version_id;
  update public.public_knowledge_edges set current_version_id=version_id,updated_at=now() where id=edge_id;
  insert into public.knowledge_events(object_type,object_id,event_type,actor_type,actor_id,to_status)
  values('public_knowledge_edge',edge_id,'created',case when p_created_by is null then 'system' else 'user' end,p_created_by,p_lifecycle_status);
  return edge_id;
end;
$$;

create or replace function public.create_organization_memory_node(
  p_organization_id uuid,
  p_canonical_key text,
  p_node_type text,
  p_display_name text,
  p_description text default null,
  p_attributes jsonb default '{}'::jsonb,
  p_lifecycle_status text default 'active',
  p_source_entity_type text default null,
  p_source_entity_id uuid default null,
  p_created_by uuid default null
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare node_id uuid; version_id uuid; calculated_hash text;
begin
  if not exists(select 1 from public.organizations where id=p_organization_id) then raise exception 'organization_not_found'; end if;
  calculated_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    p_organization_id::text||'|'||p_canonical_key||'|'||p_node_type||'|'||p_display_name||'|'||coalesce(p_description,'')||'|'||coalesce(p_attributes,'{}'::jsonb)::text,'UTF8'),'sha256'),'hex');
  insert into public.organization_memory_nodes(organization_id,canonical_key,node_type,lifecycle_status,source_entity_type,source_entity_id,created_by)
  values(p_organization_id,lower(trim(p_canonical_key)),lower(trim(p_node_type)),p_lifecycle_status,p_source_entity_type,p_source_entity_id,p_created_by)
  returning id into node_id;
  insert into public.organization_memory_node_versions(organization_id,node_id,version_number,display_name,description,attributes,review_status,content_hash,created_by)
  values(p_organization_id,node_id,1,trim(p_display_name),p_description,coalesce(p_attributes,'{}'::jsonb),case when p_lifecycle_status='active' then 'approved' else p_lifecycle_status end,calculated_hash,p_created_by)
  returning id into version_id;
  update public.organization_memory_nodes set current_version_id=version_id,updated_at=now() where id=node_id;
  insert into public.knowledge_events(organization_id,object_type,object_id,event_type,actor_type,actor_id,to_status)
  values(p_organization_id,'organization_memory_node',node_id,'created',case when p_created_by is null then 'system' else 'user' end,p_created_by,p_lifecycle_status);
  return node_id;
end;
$$;

create or replace function public.create_organization_memory_edge(
  p_organization_id uuid,
  p_canonical_key text,
  p_source_node_id uuid,
  p_target_node_id uuid,
  p_relation_type text,
  p_statement text default null,
  p_attributes jsonb default '{}'::jsonb,
  p_lifecycle_status text default 'active',
  p_created_by uuid default null
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare edge_id uuid; version_id uuid; calculated_hash text;
begin
  calculated_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    p_organization_id::text||'|'||p_source_node_id::text||'|'||p_relation_type||'|'||p_target_node_id::text||'|'||coalesce(p_statement,'')||'|'||coalesce(p_attributes,'{}'::jsonb)::text,'UTF8'),'sha256'),'hex');
  insert into public.organization_memory_edges(organization_id,canonical_key,source_node_id,target_node_id,relation_type,lifecycle_status,created_by)
  values(p_organization_id,lower(trim(p_canonical_key)),p_source_node_id,p_target_node_id,upper(trim(p_relation_type)),p_lifecycle_status,p_created_by)
  returning id into edge_id;
  insert into public.organization_memory_edge_versions(organization_id,edge_id,version_number,statement,attributes,review_status,content_hash,created_by)
  values(p_organization_id,edge_id,1,p_statement,coalesce(p_attributes,'{}'::jsonb),case when p_lifecycle_status='active' then 'approved' else p_lifecycle_status end,calculated_hash,p_created_by)
  returning id into version_id;
  update public.organization_memory_edges set current_version_id=version_id,updated_at=now() where id=edge_id;
  insert into public.knowledge_events(organization_id,object_type,object_id,event_type,actor_type,actor_id,to_status)
  values(p_organization_id,'organization_memory_edge',edge_id,'created',case when p_created_by is null then 'system' else 'user' end,p_created_by,p_lifecycle_status);
  return edge_id;
end;
$$;

create or replace function public.create_knowledge_mapping(
  p_organization_id uuid,
  p_public_node_id uuid,
  p_organization_node_id uuid,
  p_mapping_type text,
  p_scope text default null,
  p_assumptions text default null,
  p_applicability_status text default 'proposed',
  p_confidence_components jsonb default '{}'::jsonb,
  p_proposed_by_type text default 'user',
  p_proposed_by uuid default null
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare mapping_id uuid;
begin
  insert into public.knowledge_mappings(
    organization_id,public_node_id,organization_node_id,mapping_type,scope,assumptions,
    applicability_status,confidence_components,proposed_by_type,proposed_by
  ) values (
    p_organization_id,p_public_node_id,p_organization_node_id,upper(trim(p_mapping_type)),p_scope,p_assumptions,
    p_applicability_status,coalesce(p_confidence_components,'{}'::jsonb),p_proposed_by_type,p_proposed_by
  ) returning id into mapping_id;
  insert into public.knowledge_events(organization_id,object_type,object_id,event_type,actor_type,actor_id,to_status)
  values(p_organization_id,'knowledge_mapping',mapping_id,'created',p_proposed_by_type,p_proposed_by,p_applicability_status);
  return mapping_id;
end;
$$;

revoke all on function public.prevent_immutable_knowledge_change() from public,anon,authenticated;
revoke all on function public.validate_organization_memory_node_version() from public,anon,authenticated;
revoke all on function public.validate_organization_memory_edge() from public,anon,authenticated;
revoke all on function public.validate_organization_memory_edge_version() from public,anon,authenticated;
revoke all on function public.validate_knowledge_mapping() from public,anon,authenticated;
revoke all on function public.create_public_knowledge_node(text,text,text,text,jsonb,date,date,text,text,uuid,uuid) from public,anon,authenticated;
revoke all on function public.create_public_knowledge_edge(text,uuid,uuid,text,text,jsonb,date,date,text,uuid) from public,anon,authenticated;
revoke all on function public.create_organization_memory_node(uuid,text,text,text,text,jsonb,text,text,uuid,uuid) from public,anon,authenticated;
revoke all on function public.create_organization_memory_edge(uuid,text,uuid,uuid,text,text,jsonb,text,uuid) from public,anon,authenticated;
revoke all on function public.create_knowledge_mapping(uuid,uuid,uuid,text,text,text,text,jsonb,text,uuid) from public,anon,authenticated;

grant execute on function public.create_public_knowledge_node(text,text,text,text,jsonb,date,date,text,text,uuid,uuid) to service_role;
grant execute on function public.create_public_knowledge_edge(text,uuid,uuid,text,text,jsonb,date,date,text,uuid) to service_role;
grant execute on function public.create_organization_memory_node(uuid,text,text,text,text,jsonb,text,text,uuid,uuid) to service_role;
grant execute on function public.create_organization_memory_edge(uuid,text,uuid,uuid,text,text,jsonb,text,uuid) to service_role;
grant execute on function public.create_knowledge_mapping(uuid,uuid,uuid,text,text,text,text,jsonb,text,uuid) to service_role;

commit;
