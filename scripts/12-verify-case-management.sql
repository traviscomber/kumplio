-- KUMPLIO compliance case management verification
-- Read-only checks for case permissions, event stream, RLS, grants, indexes and triggers.

do $$
begin
  if to_regclass('public.compliance_case_events') is null then
    raise exception 'Missing public.compliance_case_events';
  end if;

  if to_regprocedure('private.record_compliance_case_event()') is null then
    raise exception 'Missing private.record_compliance_case_event()';
  end if;

  if not exists (
    select 1
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'compliance_case_events'
      and relation.relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.compliance_case_events';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'compliance_case_events'
      and policyname = 'compliance_case_events_select_member'
  ) then
    raise exception 'Missing compliance_case_events_select_member policy';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'compliance_cases'
      and policyname = 'compliance_cases_insert_self'
      and with_check like '%organization_members%'
      and with_check like '%projects%'
  ) then
    raise exception 'Compliance case insert policy does not validate owner and project tenant scope';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'compliance_cases'
      and policyname = 'compliance_cases_update_member'
      and with_check like '%organization_members%'
      and with_check like '%projects%'
  ) then
    raise exception 'Compliance case update policy does not validate owner and project tenant scope';
  end if;

  if has_column_privilege('authenticated', 'public.compliance_cases', 'organization_id', 'update')
    or has_column_privilege('authenticated', 'public.compliance_cases', 'created_by', 'update')
    or has_column_privilege('authenticated', 'public.compliance_cases', 'metadata', 'update') then
    raise exception 'Authenticated role can mutate protected compliance case columns';
  end if;

  if not has_column_privilege('authenticated', 'public.compliance_cases', 'title', 'update')
    or not has_column_privilege('authenticated', 'public.compliance_cases', 'status', 'update')
    or not has_column_privilege('authenticated', 'public.compliance_cases', 'owner_id', 'update')
    or not has_column_privilege('authenticated', 'public.compliance_cases', 'due_at', 'update') then
    raise exception 'Authenticated role is missing operational compliance case update privileges';
  end if;

  if has_table_privilege('anon', 'public.compliance_case_events', 'select') then
    raise exception 'Anonymous role unexpectedly has access to compliance_case_events';
  end if;

  if not has_table_privilege('authenticated', 'public.compliance_case_events', 'select') then
    raise exception 'Authenticated role cannot read compliance_case_events';
  end if;

  if has_table_privilege('authenticated', 'public.compliance_case_events', 'insert')
    or has_table_privilege('authenticated', 'public.compliance_case_events', 'update')
    or has_table_privilege('authenticated', 'public.compliance_case_events', 'delete') then
    raise exception 'Authenticated role can mutate immutable compliance case events';
  end if;

  if to_regclass('public.compliance_case_events_case_created_idx') is null
    or to_regclass('public.compliance_case_events_org_created_idx') is null
    or to_regclass('public.compliance_case_events_actor_idx') is null then
    raise exception 'Missing one or more compliance case event indexes';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.compliance_cases'::regclass
      and tgname = 'compliance_case_event_after_insert'
      and not tgisinternal
  ) then
    raise exception 'Missing compliance_case_event_after_insert trigger';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.compliance_cases'::regclass
      and tgname = 'compliance_case_event_after_update'
      and not tgisinternal
  ) then
    raise exception 'Missing compliance_case_event_after_update trigger';
  end if;

  raise notice 'KUMPLIO case management verification passed.';
end;
$$;

select
  trigger_name,
  event_manipulation,
  action_timing
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'compliance_cases'
  and trigger_name in ('compliance_case_event_after_insert', 'compliance_case_event_after_update')
order by trigger_name, event_manipulation;
