-- KUMPLIO Artifact Versioning Foundation verification

do $$
declare
  function_definition text;
  function_security_definer boolean;
  function_config text[];
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'agent_artifacts'
      and column_name = 'lineage_id' and is_nullable = 'NO'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'agent_artifacts'
      and column_name = 'content_hash' and is_nullable = 'NO'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'agent_artifacts'
      and column_name = 'parent_artifact_id'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'agent_artifacts'
      and column_name = 'locked_at'
  ) then
    raise exception 'Artifact lineage or locking columns are missing';
  end if;

  if exists (
    select 1 from public.agent_artifacts
    where lineage_id is null
      or content_hash is null
      or char_length(content_hash) <> 64
  ) then
    raise exception 'Existing artifact lineage or hash backfill is incomplete';
  end if;

  if not exists (
    select 1 from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.agent_artifacts'::regclass
      and constraint_row.conname = 'agent_artifacts_lineage_version_key'
  ) then
    raise exception 'Artifact lineage version uniqueness is missing';
  end if;

  if not exists (
    select 1 from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.agent_artifacts'::regclass
      and constraint_row.conname = 'agent_artifacts_status_check'
      and pg_get_constraintdef(constraint_row.oid) like '%changes_requested%'
      and pg_get_constraintdef(constraint_row.oid) like '%superseded%'
  ) then
    raise exception 'Artifact status constraint is incomplete';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.agent_artifacts'::regclass
      and tgname = 'prepare_agent_artifact_version'
      and not tgisinternal
  ) or not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.agent_artifacts'::regclass
      and tgname = 'protect_agent_artifact_version'
      and not tgisinternal
  ) then
    raise exception 'Artifact versioning triggers are missing';
  end if;

  if not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'agent_artifacts_lineage_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'agent_artifacts_parent_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'agent_artifacts_approved_by_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'agent_artifacts_superseded_by_idx') then
    raise exception 'One or more artifact lineage indexes are missing';
  end if;

  if has_table_privilege('authenticated', 'public.agent_artifacts', 'update')
    or has_table_privilege('authenticated', 'public.agent_artifacts', 'delete') then
    raise exception 'Authenticated role can mutate artifact versions directly';
  end if;

  if not has_table_privilege('authenticated', 'public.agent_artifacts', 'select,insert') then
    raise exception 'Authenticated role is missing artifact read/create privileges';
  end if;

  if to_regprocedure('private.prepare_agent_artifact_version()') is null
    or to_regprocedure('private.protect_agent_artifact_version()') is null then
    raise exception 'Artifact trigger functions are missing';
  end if;

  if to_regprocedure('public.record_agent_artifact_review(uuid,uuid,uuid,uuid,text,text,jsonb)') is null then
    raise exception 'Atomic artifact review service is missing';
  end if;

  if has_function_privilege(
    'anon',
    'public.record_agent_artifact_review(uuid,uuid,uuid,uuid,text,text,jsonb)',
    'execute'
  ) or has_function_privilege(
    'authenticated',
    'public.record_agent_artifact_review(uuid,uuid,uuid,uuid,text,text,jsonb)',
    'execute'
  ) then
    raise exception 'Artifact review service is exposed to client roles';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.record_agent_artifact_review(uuid,uuid,uuid,uuid,text,text,jsonb)',
    'execute'
  ) then
    raise exception 'Service role cannot record artifact reviews';
  end if;

  select pg_get_functiondef(procedure.oid), procedure.prosecdef, procedure.proconfig
    into function_definition, function_security_definer, function_config
  from pg_proc procedure
  where procedure.oid = 'public.record_agent_artifact_review(uuid,uuid,uuid,uuid,text,text,jsonb)'::regprocedure;

  if function_security_definer then
    raise exception 'Artifact review service must be SECURITY INVOKER';
  end if;

  if function_config is null or not ('search_path=""' = any(function_config)) then
    raise exception 'Artifact review service must have an empty search_path';
  end if;

  if function_definition not like '%organization_members%'
    or function_definition not like '%agent_reviews%'
    or function_definition not like '%approved_by%'
    or function_definition not like '%superseded_by_artifact_id%' then
    raise exception 'Artifact review service is missing membership, review or locking controls';
  end if;

  select pg_get_functiondef('private.prepare_agent_artifact_version()'::regprocedure)
    into function_definition;
  if function_definition not like '%pg_advisory_xact_lock%'
    or function_definition not like '%sha256%'
    or function_definition not like '%parent_artifact_id%' then
    raise exception 'Artifact version preparation is missing lineage concurrency or hashing';
  end if;

  select pg_get_functiondef('private.protect_agent_artifact_version()'::regprocedure)
    into function_definition;
  if function_definition not like '%Artifact version content and lineage are immutable%'
    or function_definition not like '%Approved artifact versions are locked%'
    or function_definition not like '%Superseded artifact versions are immutable%' then
    raise exception 'Artifact protection trigger is incomplete';
  end if;

  raise notice 'KUMPLIO Artifact Versioning verification passed.';
end;
$$;

select routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'record_agent_artifact_review';
