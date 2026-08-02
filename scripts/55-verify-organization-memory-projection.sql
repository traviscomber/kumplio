-- KUMPLIO — Verificación de Primera Memoria Organizacional
-- No exige datos productivos reales; valida contrato estructural y seguridad.
do $$
declare
  missing_functions text[];
  missing_indexes text[];
  exposed_functions integer;
  direct_writes integer;
begin
  if to_regclass('public.organization_memory_projection_runs') is null then
    raise exception 'organization_memory_projection_runs_missing';
  end if;

  if not exists(select 1 from pg_class c where c.oid='public.organization_memory_projection_runs'::regclass and c.relrowsecurity) then
    raise exception 'organization_memory_projection_runs_rls_disabled';
  end if;

  select array_agg(x.name order by x.name) into missing_functions
  from (values
    ('upsert_organization_memory_node_version'),
    ('upsert_organization_memory_edge_version'),
    ('project_organization_operational_memory')
  ) x(name)
  where not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=x.name);
  if missing_functions is not null then raise exception 'missing_memory_projection_functions:%',array_to_string(missing_functions,','); end if;

  select array_agg(x.name order by x.name) into missing_indexes
  from (values
    ('organization_memory_projection_runs_org_idx'),
    ('organization_memory_projection_runs_fingerprint_idx')
  ) x(name)
  where not exists(select 1 from pg_indexes i where i.schemaname='public' and i.indexname=x.name);
  if missing_indexes is not null then raise exception 'missing_memory_projection_indexes:%',array_to_string(missing_indexes,','); end if;

  select count(*) into exposed_functions
  from information_schema.routine_privileges rp
  where rp.specific_schema='public'
    and rp.routine_name in ('upsert_organization_memory_node_version','upsert_organization_memory_edge_version','project_organization_operational_memory')
    and rp.grantee in ('anon','authenticated','PUBLIC') and rp.privilege_type='EXECUTE';
  if exposed_functions>0 then raise exception 'memory_projection_functions_exposed:%',exposed_functions; end if;

  select count(*) into direct_writes
  from information_schema.role_table_grants g
  where g.table_schema='public' and g.table_name='organization_memory_projection_runs'
    and g.grantee in ('anon','authenticated') and g.privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE');
  if direct_writes>0 then raise exception 'memory_projection_direct_writes_exposed:%',direct_writes; end if;

  if not exists(select 1 from pg_policies p where p.schemaname='public' and p.tablename='organization_memory_projection_runs' and p.policyname='organization_memory_projection_runs_read_members') then
    raise exception 'memory_projection_read_policy_missing';
  end if;

  if not exists(select 1 from pg_trigger t where t.tgrelid='public.organization_memory_edges'::regclass and t.tgname='organization_memory_edges_validate' and not t.tgisinternal) then
    raise exception 'memory_cross_organization_validator_missing';
  end if;

  raise notice 'organization_memory_projection_verification_passed';
end;
$$;

select
  (select count(*) from public.organization_memory_projection_runs) as ejecuciones,
  (select count(*) from public.organization_memory_nodes) as nodos_privados,
  (select count(*) from public.organization_memory_edges) as relaciones_privadas;