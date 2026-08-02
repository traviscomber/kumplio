-- KUMPLIO Plataforma de Conocimiento — verificación estructural y de seguridad
-- Solo lectura. Falla si el contrato canónico no está instalado correctamente.
do $$
declare
  missing_tables text[];
  missing_functions text[];
  missing_triggers text[];
  rls_disabled text[];
  authenticated_writes integer;
  anon_privileges integer;
  service_functions_exposed integer;
begin
  select array_agg(expected.name order by expected.name)
  into missing_tables
  from (values
    ('public_knowledge_nodes'),
    ('public_knowledge_node_versions'),
    ('public_knowledge_edges'),
    ('public_knowledge_edge_versions'),
    ('organization_memory_nodes'),
    ('organization_memory_node_versions'),
    ('organization_memory_edges'),
    ('organization_memory_edge_versions'),
    ('knowledge_mappings'),
    ('knowledge_provenance'),
    ('knowledge_events')
  ) expected(name)
  where to_regclass('public.' || expected.name) is null;

  if missing_tables is not null then
    raise exception 'missing_knowledge_tables:%', array_to_string(missing_tables, ',');
  end if;

  select array_agg(expected.signature order by expected.signature)
  into missing_functions
  from (values
    ('create_public_knowledge_node'),
    ('create_public_knowledge_edge'),
    ('create_organization_memory_node'),
    ('create_organization_memory_edge'),
    ('create_knowledge_mapping'),
    ('prevent_immutable_knowledge_change'),
    ('validate_organization_memory_node_version'),
    ('validate_organization_memory_edge'),
    ('validate_organization_memory_edge_version'),
    ('validate_knowledge_mapping')
  ) expected(signature)
  where not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname=expected.signature
  );

  if missing_functions is not null then
    raise exception 'missing_knowledge_functions:%', array_to_string(missing_functions, ',');
  end if;

  select array_agg(expected.name order by expected.name)
  into missing_triggers
  from (values
    ('organization_memory_node_versions_validate'),
    ('organization_memory_edges_validate'),
    ('organization_memory_edge_versions_validate'),
    ('knowledge_mappings_validate'),
    ('public_knowledge_node_versions_immutable'),
    ('public_knowledge_edge_versions_immutable'),
    ('organization_memory_node_versions_immutable'),
    ('organization_memory_edge_versions_immutable'),
    ('knowledge_provenance_immutable'),
    ('knowledge_events_immutable')
  ) expected(name)
  where not exists (
    select 1 from pg_trigger t where t.tgname=expected.name and not t.tgisinternal
  );

  if missing_triggers is not null then
    raise exception 'missing_knowledge_triggers:%', array_to_string(missing_triggers, ',');
  end if;

  select array_agg(c.relname order by c.relname)
  into rls_disabled
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relname = any(array[
      'public_knowledge_nodes','public_knowledge_node_versions','public_knowledge_edges','public_knowledge_edge_versions',
      'organization_memory_nodes','organization_memory_node_versions','organization_memory_edges','organization_memory_edge_versions',
      'knowledge_mappings','knowledge_provenance','knowledge_events'
    ])
    and not c.relrowsecurity;

  if rls_disabled is not null then
    raise exception 'knowledge_rls_disabled:%', array_to_string(rls_disabled, ',');
  end if;

  select count(*) into authenticated_writes
  from information_schema.role_table_grants
  where grantee='authenticated'
    and table_schema='public'
    and table_name = any(array[
      'public_knowledge_nodes','public_knowledge_node_versions','public_knowledge_edges','public_knowledge_edge_versions',
      'organization_memory_nodes','organization_memory_node_versions','organization_memory_edges','organization_memory_edge_versions',
      'knowledge_mappings','knowledge_provenance','knowledge_events'
    ])
    and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER');

  if authenticated_writes > 0 then
    raise exception 'authenticated_has_knowledge_write_privileges:%', authenticated_writes;
  end if;

  select count(*) into anon_privileges
  from information_schema.role_table_grants
  where grantee='anon'
    and table_schema='public'
    and table_name = any(array[
      'public_knowledge_nodes','public_knowledge_node_versions','public_knowledge_edges','public_knowledge_edge_versions',
      'organization_memory_nodes','organization_memory_node_versions','organization_memory_edges','organization_memory_edge_versions',
      'knowledge_mappings','knowledge_provenance','knowledge_events'
    ]);

  if anon_privileges > 0 then
    raise exception 'anon_has_knowledge_privileges:%', anon_privileges;
  end if;

  select count(*) into service_functions_exposed
  from information_schema.routine_privileges rp
  where rp.specific_schema='public'
    and rp.grantee in ('anon','authenticated','PUBLIC')
    and rp.routine_name in (
      'create_public_knowledge_node','create_public_knowledge_edge','create_organization_memory_node',
      'create_organization_memory_edge','create_knowledge_mapping'
    )
    and rp.privilege_type='EXECUTE';

  if service_functions_exposed > 0 then
    raise exception 'knowledge_service_functions_exposed:%', service_functions_exposed;
  end if;

  if (select count(*) from pg_policies where schemaname='public' and tablename like 'public_knowledge_%') < 4 then
    raise exception 'public_knowledge_policies_missing';
  end if;

  if (select count(*) from pg_policies where schemaname='public' and tablename like 'organization_memory_%') < 4 then
    raise exception 'organization_memory_policies_missing';
  end if;

  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='knowledge_mappings_org_private_idx'
  ) then raise exception 'knowledge_mapping_index_missing'; end if;

  raise notice 'knowledge_platform_verification_passed';
end;
$$;

select
  (select count(*) from public.public_knowledge_nodes) as nodos_publicos,
  (select count(*) from public.organization_memory_nodes) as nodos_privados,
  (select count(*) from public.knowledge_mappings) as mapeos,
  (select count(*) from public.knowledge_events) as eventos;
