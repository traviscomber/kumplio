-- KUMPLIO controls and evidence foundation verification
-- Read-only checks for schema, policies, grants, triggers, constraints and indexes.

do $$
declare
  target_table text;
  target_function text;
  relation regclass;
  expected_policy_count integer;
  actual_policy_count integer;
  set_updated_at_config text[];
begin
  foreach target_table in array array[
    'controls',
    'evidence',
    'control_obligations',
    'control_evidence',
    'control_evaluations',
    'evidence_requests'
  ] loop
    relation := to_regclass(format('public.%I', target_table));
    if relation is null then
      raise exception 'Missing public.%', target_table;
    end if;

    if not exists (
      select 1 from pg_class relation_row
      where relation_row.oid = relation and relation_row.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', target_table;
    end if;

    if has_table_privilege('anon', relation, 'select')
      or has_table_privilege('anon', relation, 'insert')
      or has_table_privilege('anon', relation, 'update')
      or has_table_privilege('anon', relation, 'delete') then
      raise exception 'Anonymous role unexpectedly has access to public.%', target_table;
    end if;
  end loop;

  foreach target_table in array array['controls', 'evidence', 'control_obligations', 'control_evidence', 'evidence_requests'] loop
    if not has_table_privilege('authenticated', format('public.%I', target_table), 'select,insert,update,delete') then
      raise exception 'Authenticated role is missing CRUD privileges on public.%', target_table;
    end if;
  end loop;

  if not has_table_privilege('authenticated', 'public.control_evaluations', 'select,insert') then
    raise exception 'Authenticated role cannot create and read control evaluations';
  end if;

  if has_table_privilege('authenticated', 'public.control_evaluations', 'update')
    or has_table_privilege('authenticated', 'public.control_evaluations', 'delete') then
    raise exception 'Control evaluations are not immutable';
  end if;

  foreach target_table in array array['controls', 'evidence', 'control_obligations', 'control_evidence', 'evidence_requests'] loop
    expected_policy_count := 4;
    select count(*)::integer into actual_policy_count
    from pg_policies policy_row
    where policy_row.schemaname = 'public'
      and policy_row.tablename = target_table;

    if actual_policy_count <> expected_policy_count then
      raise exception 'Expected % policies on public.%, found %', expected_policy_count, target_table, actual_policy_count;
    end if;
  end loop;

  select count(*)::integer into actual_policy_count
  from pg_policies policy_row
  where policy_row.schemaname = 'public'
    and policy_row.tablename = 'control_evaluations';
  if actual_policy_count <> 2 then
    raise exception 'Expected 2 policies on public.control_evaluations, found %', actual_policy_count;
  end if;

  foreach target_function in array array[
    'validate_control_record',
    'validate_evidence_record',
    'validate_control_obligation_link',
    'validate_control_evidence_link',
    'validate_control_evaluation',
    'apply_control_evaluation',
    'validate_evidence_request'
  ] loop
    if to_regprocedure(format('private.%I()', target_function)) is null then
      raise exception 'Missing private.%()', target_function;
    end if;
  end loop;

  if not exists (select 1 from pg_trigger trigger_row where trigger_row.tgrelid = 'public.controls'::regclass and trigger_row.tgname = 'validate_control_record' and not trigger_row.tgisinternal)
    or not exists (select 1 from pg_trigger trigger_row where trigger_row.tgrelid = 'public.controls'::regclass and trigger_row.tgname = 'set_controls_updated_at' and not trigger_row.tgisinternal)
    or not exists (select 1 from pg_trigger trigger_row where trigger_row.tgrelid = 'public.evidence'::regclass and trigger_row.tgname = 'validate_evidence_record' and not trigger_row.tgisinternal)
    or not exists (select 1 from pg_trigger trigger_row where trigger_row.tgrelid = 'public.evidence'::regclass and trigger_row.tgname = 'set_evidence_updated_at' and not trigger_row.tgisinternal)
    or not exists (select 1 from pg_trigger trigger_row where trigger_row.tgrelid = 'public.control_obligations'::regclass and trigger_row.tgname = 'validate_control_obligation_link' and not trigger_row.tgisinternal)
    or not exists (select 1 from pg_trigger trigger_row where trigger_row.tgrelid = 'public.control_evidence'::regclass and trigger_row.tgname = 'validate_control_evidence_link' and not trigger_row.tgisinternal)
    or not exists (select 1 from pg_trigger trigger_row where trigger_row.tgrelid = 'public.control_evaluations'::regclass and trigger_row.tgname = 'validate_control_evaluation' and not trigger_row.tgisinternal)
    or not exists (select 1 from pg_trigger trigger_row where trigger_row.tgrelid = 'public.control_evaluations'::regclass and trigger_row.tgname = 'apply_control_evaluation' and not trigger_row.tgisinternal)
    or not exists (select 1 from pg_trigger trigger_row where trigger_row.tgrelid = 'public.evidence_requests'::regclass and trigger_row.tgname = 'validate_evidence_request' and not trigger_row.tgisinternal)
    or not exists (select 1 from pg_trigger trigger_row where trigger_row.tgrelid = 'public.evidence_requests'::regclass and trigger_row.tgname = 'set_evidence_requests_updated_at' and not trigger_row.tgisinternal) then
    raise exception 'One or more controls/evidence triggers are missing';
  end if;

  if not exists (
    select 1 from information_schema.columns column_row
    where column_row.table_schema = 'public'
      and column_row.table_name = 'control_evidence'
      and column_row.column_name = 'organization_id'
      and column_row.is_nullable = 'NO'
  ) or not exists (
    select 1 from information_schema.columns column_row
    where column_row.table_schema = 'public'
      and column_row.table_name = 'control_evidence'
      and column_row.column_name = 'project_id'
      and column_row.is_nullable = 'NO'
  ) then
    raise exception 'control_evidence tenant columns must be not null';
  end if;

  if not exists (
    select 1 from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.control_evidence'::regclass
      and constraint_row.conname = 'control_evidence_organization_id_fkey'
  ) or not exists (
    select 1 from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.control_evidence'::regclass
      and constraint_row.conname = 'control_evidence_project_id_fkey'
  ) then
    raise exception 'control_evidence tenant foreign keys are missing';
  end if;

  if not exists (
    select 1 from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.compliance_case_resource_links'::regclass
      and constraint_row.conname = 'compliance_case_resource_links_resource_type_check'
      and pg_get_constraintdef(constraint_row.oid) like '%control%'
      and pg_get_constraintdef(constraint_row.oid) like '%evidence%'
  ) then
    raise exception 'Case resource links do not support controls and evidence';
  end if;

  if not exists (
    select 1 from pg_trigger trigger_row
    where trigger_row.tgrelid = 'public.controls'::regclass
      and trigger_row.tgname = 'cleanup_control_case_resource_links'
      and not trigger_row.tgisinternal
  ) or not exists (
    select 1 from pg_trigger trigger_row
    where trigger_row.tgrelid = 'public.evidence'::regclass
      and trigger_row.tgname = 'cleanup_evidence_case_resource_links'
      and not trigger_row.tgisinternal
  ) then
    raise exception 'Case resource cleanup triggers for controls/evidence are missing';
  end if;

  select procedure.proconfig into set_updated_at_config
  from pg_proc procedure
  where procedure.oid = 'public.set_updated_at()'::regprocedure;

  if set_updated_at_config is null
    or not ('search_path=pg_catalog, public' = any(set_updated_at_config)) then
    raise exception 'public.set_updated_at() does not have a fixed search_path';
  end if;

  if not exists (select 1 from pg_indexes index_row where index_row.schemaname = 'public' and index_row.indexname = 'controls_project_id_idx')
    or not exists (select 1 from pg_indexes index_row where index_row.schemaname = 'public' and index_row.indexname = 'controls_obligation_id_idx')
    or not exists (select 1 from pg_indexes index_row where index_row.schemaname = 'public' and index_row.indexname = 'evidence_project_id_idx')
    or not exists (select 1 from pg_indexes index_row where index_row.schemaname = 'public' and index_row.indexname = 'control_evidence_evidence_idx')
    or not exists (select 1 from pg_indexes index_row where index_row.schemaname = 'public' and index_row.indexname = 'control_evaluations_control_idx')
    or not exists (select 1 from pg_indexes index_row where index_row.schemaname = 'public' and index_row.indexname = 'evidence_requests_org_status_idx') then
    raise exception 'One or more required controls/evidence indexes are missing';
  end if;

  raise notice 'KUMPLIO controls and evidence verification passed.';
end;
$$;

select policy_row.tablename as table_name, policy_row.policyname, policy_row.cmd, policy_row.roles
from pg_policies policy_row
where policy_row.schemaname = 'public'
  and policy_row.tablename in ('controls', 'evidence', 'control_obligations', 'control_evidence', 'control_evaluations', 'evidence_requests')
order by policy_row.tablename, policy_row.policyname;
