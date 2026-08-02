-- KUMPLIO Control Assurance verification
-- Read-only checks for immutable evaluations, evidence links and service transaction.

do $$
declare
  service_definition text;
  service_security_definer boolean;
  service_config text[];
begin
  if to_regclass('public.control_evaluation_evidence') is null then
    raise exception 'Missing public.control_evaluation_evidence';
  end if;

  if not exists (
    select 1
    from pg_class relation
    where relation.oid = 'public.control_evaluation_evidence'::regclass
      and relation.relrowsecurity
  ) then
    raise exception 'RLS is not enabled on control_evaluation_evidence';
  end if;

  if has_table_privilege('anon', 'public.control_evaluation_evidence', 'select')
    or has_table_privilege('anon', 'public.control_evaluation_evidence', 'insert') then
    raise exception 'Anonymous role unexpectedly has access to control evaluation evidence';
  end if;

  if not has_table_privilege('authenticated', 'public.control_evaluation_evidence', 'select') then
    raise exception 'Authenticated role cannot read control evaluation evidence';
  end if;

  if has_table_privilege('authenticated', 'public.control_evaluation_evidence', 'insert')
    or has_table_privilege('authenticated', 'public.control_evaluation_evidence', 'update')
    or has_table_privilege('authenticated', 'public.control_evaluation_evidence', 'delete') then
    raise exception 'Control evaluation evidence is not immutable for authenticated users';
  end if;

  if has_table_privilege('authenticated', 'public.control_evaluations', 'insert')
    or has_table_privilege('authenticated', 'public.control_evaluations', 'update')
    or has_table_privilege('authenticated', 'public.control_evaluations', 'delete') then
    raise exception 'Control evaluations can bypass the service transaction';
  end if;

  if not has_table_privilege('authenticated', 'public.control_evaluations', 'select') then
    raise exception 'Authenticated role cannot read control evaluations';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'control_evaluation_evidence'
      and policyname = 'control_evaluation_evidence_select_member'
  ) <> 1 then
    raise exception 'Missing control evaluation evidence select policy';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.control_evaluation_evidence'::regclass
      and tgname = 'validate_control_evaluation_evidence'
      and not tgisinternal
  ) then
    raise exception 'Missing validation trigger for control evaluation evidence';
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'control_evaluation_evidence_evidence_idx'
  ) or not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'control_evaluation_evidence_org_project_idx'
  ) or not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'control_evaluation_evidence_linked_by_idx'
  ) then
    raise exception 'Missing one or more control evaluation evidence indexes';
  end if;

  if to_regprocedure('public.create_control_evaluation_record(uuid,uuid,uuid,uuid,text,text,text,integer,date,date,uuid[])') is null then
    raise exception 'Missing public.create_control_evaluation_record(...)';
  end if;

  if has_function_privilege(
    'anon',
    'public.create_control_evaluation_record(uuid,uuid,uuid,uuid,text,text,text,integer,date,date,uuid[])',
    'execute'
  ) or has_function_privilege(
    'authenticated',
    'public.create_control_evaluation_record(uuid,uuid,uuid,uuid,text,text,text,integer,date,date,uuid[])',
    'execute'
  ) then
    raise exception 'Control assurance service function is exposed to client roles';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.create_control_evaluation_record(uuid,uuid,uuid,uuid,text,text,text,integer,date,date,uuid[])',
    'execute'
  ) then
    raise exception 'Service role cannot execute control assurance transaction';
  end if;

  select pg_get_functiondef(procedure.oid), procedure.prosecdef, procedure.proconfig
    into service_definition, service_security_definer, service_config
  from pg_proc procedure
  where procedure.oid = 'public.create_control_evaluation_record(uuid,uuid,uuid,uuid,text,text,text,integer,date,date,uuid[])'::regprocedure;

  if service_security_definer then
    raise exception 'Control assurance service must be SECURITY INVOKER';
  end if;

  if service_config is null or not ('search_path=""' = any(service_config)) then
    raise exception 'Control assurance service must have an empty search_path';
  end if;

  if service_definition not like '%organization_members%'
    or service_definition not like '%control_evidence%'
    or service_definition not like '%control_evaluations%'
    or service_definition not like '%compliance_case_events%' then
    raise exception 'Control assurance service is missing required validation or audit controls';
  end if;

  raise notice 'KUMPLIO Control Assurance verification passed.';
end;
$$;

select
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'create_control_evaluation_record';
