-- KUMPLIO controls and evidence foundation verification
-- Read-only checks for schema, policies, grants, triggers, constraints and indexes.

do $$
declare
  table_name text;
  relation regclass;
  expected_policy_count integer;
  actual_policy_count integer;
  set_updated_at_config text[];
begin
  foreach table_name in array array[
    'controls',
    'evidence',
    'control_obligations',
    'control_evidence',
    'control_evaluations',
    'evidence_requests'
  ] loop
    relation := to_regclass(format('public.%I', table_name));
    if relation is null then
      raise exception 'Missing public.%', table_name;
    end if;

    if not exists (
      select 1 from pg_class
      where oid = relation and relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', table_name;
    end if;

    if has_table_privilege('anon', relation, 'select')
      or has_table_privilege('anon', relation, 'insert')
      or has_table_privilege('anon', relation, 'update')
      or has_table_privilege('anon', relation, 'delete') then
      raise exception 'Anonymous role unexpectedly has access to public.%', table_name;
    end if;
  end loop;

  foreach table_name in array array['controls', 'evidence', 'control_obligations', 'control_evidence', 'evidence_requests'] loop
    if not has_table_privilege('authenticated', format('public.%I', table_name), 'select,insert,update,delete') then
      raise exception 'Authenticated role is missing CRUD privileges on public.%', table_name;
    end if;
  end loop;

  if not has_table_privilege('authenticated', 'public.control_evaluations', 'select,insert') then
    raise exception 'Authenticated role cannot create and read control evaluations';
  end if;

  if has_table_privilege('authenticated', 'public.control_evaluations', 'update')
    or has_table_privilege('authenticated', 'public.control_evaluations', 'delete') then
    raise exception 'Control evaluations are not immutable';
  end if;

  foreach table_name in array array['controls', 'evidence', 'control_obligations', 'control_evidence', 'evidence_requests'] loop
    expected_policy_count := 4;
    select count(*)::integer into actual_policy_count
    from pg_policies
    where schemaname = 'public' and tablename = table_name;

    if actual_policy_count <> expected_policy_count then
      raise exception 'Expected % policies on public.%, found %', expected_policy_count, table_name, actual_policy_count;
    end if;
  end loop;

  select count(*)::integer into actual_policy_count
  from pg_policies
  where schemaname = 'public' and tablename = 'control_evaluations';
  if actual_policy_count <> 2 then
    raise exception 'Expected 2 policies on public.control_evaluations, found %', actual_policy_count;
  end if;

  foreach table_name in array array[
    'validate_control_record',
    'validate_evidence_record',
    'validate_control_obligation_link',
    'validate_control_evidence_link',
    'validate_control_evaluation',
    'apply_control_evaluation',
    'validate_evidence_request'
  ] loop
    if to_regprocedure(format('private.%I()', table_name)) is null then
      raise exception 'Missing private.%()', table_name;
    end if;
  end loop;

  if not exists (select 1 from pg_trigger where tgrelid = 'public.controls'::regclass and tgname = 'validate_control_record' and not tgisinternal)
    or not exists (select 1 from pg_trigger where tgrelid = 'public.controls'::regclass and tgname = 'set_controls_updated_at' and not tgisinternal)
    or not exists (select 1 from pg_trigger where tgrelid = 'public.evidence'::regclass and tgname = 'validate_evidence_record' and not tgisinternal)
    or not exists (select 1 from pg_trigger where tgrelid = 'public.evidence'::regclass and tgname = 'set_evidence_updated_at' and not tgisinternal)
    or not exists (select 1 from pg_trigger where tgrelid = 'public.control_obligations'::regclass and tgname = 'validate_control_obligation_link' and not tgisinternal)
    or not exists (select 1 from pg_trigger where tgrelid = 'public.control_evidence'::regclass and tgname = 'validate_control_evidence_link' and not tgisinternal)
    or not exists (select 1 from pg_trigger where tgrelid = 'public.control_evaluations'::regclass and tgname = 'validate_control_evaluation' and not tgisinternal)
    or not exists (select 1 from pg_trigger where tgrelid = 'public.control_evaluations'::regclass and tgname = 'apply_control_evaluation' and not tgisinternal)
    or not exists (select 1 from pg_trigger where tgrelid = 'public.evidence_requests'::regclass and tgname = 'validate_evidence_request' and not tgisinternal)
    or not exists (select 1 from pg_trigger where tgrelid = 'public.evidence_requests'::regclass and tgname = 'set_evidence_requests_updated_at' and not tgisinternal) then
    raise exception 'One or more controls/evidence triggers are missing';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'control_evidence'
      and column_name = 'organization_id' and is_nullable = 'NO'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'control_evidence'
      and column_name = 'project_id' and is_nullable = 'NO'
  ) then
    raise exception 'control_evidence tenant columns must be not null';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.control_evidence'::regclass
      and conname = 'control_evidence_organization_id_fkey'
  ) or not exists (
    select 1 from pg_constraint
    where conrelid = 'public.control_evidence'::regclass
      and conname = 'control_evidence_project_id_fkey'
  ) then
    raise exception 'control_evidence tenant foreign keys are missing';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.compliance_case_resource_links'::regclass
      and conname = 'compliance_case_resource_links_resource_type_check'
      and pg_get_constraintdef(oid) like '%control%'
      and pg_get_constraintdef(oid) like '%evidence%'
  ) then
    raise exception 'Case resource links do not support controls and evidence';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.controls'::regclass
      and tgname = 'cleanup_control_case_resource_links'
      and not tgisinternal
  ) or not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.evidence'::regclass
      and tgname = 'cleanup_evidence_case_resource_links'
      and not tgisinternal
  ) then
    raise exception 'Case resource cleanup triggers for controls/evidence are missing';
  end if;

  select proconfig into set_updated_at_config
  from pg_proc
  where oid = 'public.set_updated_at()'::regprocedure;

  if set_updated_at_config is null
    or not ('search_path=pg_catalog, public' = any(set_updated_at_config)) then
    raise exception 'public.set_updated_at() does not have a fixed search_path';
  end if;

  if not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'controls_project_id_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'controls_obligation_id_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'evidence_project_id_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'control_evidence_evidence_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'control_evaluations_control_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'evidence_requests_org_status_idx') then
    raise exception 'One or more required controls/evidence indexes are missing';
  end if;

  raise notice 'KUMPLIO controls and evidence verification passed.';
end;
$$;

select table_name, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and table_name in ('controls', 'evidence', 'control_obligations', 'control_evidence', 'control_evaluations', 'evidence_requests')
order by table_name, policyname;
