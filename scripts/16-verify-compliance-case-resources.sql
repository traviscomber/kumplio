-- KUMPLIO integrated case resources verification
-- Read-only checks for schema, RLS, grants, policies, functions, triggers and indexes.

do $$
declare
  cleanup_trigger_count integer;
begin
  if to_regclass('public.compliance_case_resource_links') is null then
    raise exception 'Missing public.compliance_case_resource_links';
  end if;

  if to_regprocedure('private.validate_compliance_case_resource_link()') is null then
    raise exception 'Missing private.validate_compliance_case_resource_link()';
  end if;

  if to_regprocedure('private.record_compliance_case_resource_event()') is null then
    raise exception 'Missing private.record_compliance_case_resource_event()';
  end if;

  if to_regprocedure('private.cleanup_compliance_case_resource_links()') is null then
    raise exception 'Missing private.cleanup_compliance_case_resource_links()';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'compliance_case_resource_links'
      and column_name = 'created_by'
      and is_nullable = 'YES'
  ) then
    raise exception 'created_by must be nullable to preserve links when users are deleted';
  end if;

  if not exists (
    select 1
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'compliance_case_resource_links'
      and relation.relrowsecurity
  ) then
    raise exception 'RLS is not enabled on compliance_case_resource_links';
  end if;

  if has_table_privilege('anon', 'public.compliance_case_resource_links', 'select')
    or has_table_privilege('anon', 'public.compliance_case_resource_links', 'insert')
    or has_table_privilege('anon', 'public.compliance_case_resource_links', 'delete') then
    raise exception 'Anonymous role unexpectedly has access to case resource links';
  end if;

  if not has_table_privilege('authenticated', 'public.compliance_case_resource_links', 'select,insert,delete') then
    raise exception 'Authenticated role is missing required case resource link privileges';
  end if;

  if has_table_privilege('authenticated', 'public.compliance_case_resource_links', 'update') then
    raise exception 'Authenticated role can update immutable case resource links';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'compliance_case_resource_links'
      and policyname in (
        'compliance_case_resource_links_select_member',
        'compliance_case_resource_links_insert_member',
        'compliance_case_resource_links_delete_member'
      )
  ) <> 3 then
    raise exception 'Missing one or more case resource link policies';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.compliance_case_resource_links'::regclass
      and tgname = 'validate_compliance_case_resource_link'
      and not tgisinternal
  ) then
    raise exception 'Missing case resource validation trigger';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.compliance_case_resource_links'::regclass
      and tgname = 'compliance_case_resource_link_event'
      and not tgisinternal
  ) then
    raise exception 'Missing case resource event trigger';
  end if;

  select count(*)::integer
    into cleanup_trigger_count
  from pg_trigger
  where not tgisinternal
    and tgname in (
      'cleanup_document_case_resource_links',
      'cleanup_obligation_case_resource_links',
      'cleanup_finding_case_resource_links',
      'cleanup_risk_case_resource_links',
      'cleanup_action_case_resource_links'
    );

  if cleanup_trigger_count <> 5 then
    raise exception 'Expected five source cleanup triggers, found %', cleanup_trigger_count;
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'compliance_case_resource_links'
      and indexname = 'compliance_case_resource_links_case_idx'
  ) or not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'compliance_case_resource_links'
      and indexname = 'compliance_case_resource_links_org_idx'
  ) or not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'compliance_case_resource_links'
      and indexname = 'compliance_case_resource_links_project_idx'
  ) or not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'compliance_case_resource_links'
      and indexname = 'compliance_case_resource_links_created_by_idx'
  ) then
    raise exception 'Missing one or more case resource link indexes';
  end if;

  if not exists (
    select 1
    from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.compliance_case_resource_links'::regclass
      and constraint_row.contype = 'u'
      and pg_get_constraintdef(constraint_row.oid) like '%case_id, resource_type, resource_id%'
  ) then
    raise exception 'Missing unique case/resource constraint';
  end if;

  raise notice 'KUMPLIO integrated case resources verification passed.';
end;
$$;

select
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename = 'compliance_case_resource_links'
order by policyname;
