-- KUMPLIO Case Agentic Workflows verification

do $$
declare
  function_definition text;
  function_security_definer boolean;
  function_config text[];
begin
  if not exists (
    select 1
    from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.agent_workflows'::regclass
      and constraint_row.conname = 'agent_workflows_workflow_type_check'
      and pg_get_constraintdef(constraint_row.oid) like '%contract_review%'
      and pg_get_constraintdef(constraint_row.oid) like '%control_assessment%'
  ) then
    raise exception 'Workflow type constraint is missing or incomplete';
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'agent_workflows_case_type_active_uidx'
      and indexdef like '%WHERE%pending_review%'
  ) then
    raise exception 'Active workflow uniqueness index is missing';
  end if;

  if has_table_privilege('authenticated', 'public.agent_workflows', 'insert')
    or has_table_privilege('authenticated', 'public.agent_workflow_stages', 'insert') then
    raise exception 'Authenticated role can bypass atomic workflow creation';
  end if;

  if to_regprocedure('public.create_case_workflow_record(uuid,uuid,uuid,text,jsonb,jsonb)') is null then
    raise exception 'Missing public.create_case_workflow_record(...)';
  end if;

  if has_function_privilege(
    'anon',
    'public.create_case_workflow_record(uuid,uuid,uuid,text,jsonb,jsonb)',
    'execute'
  ) or has_function_privilege(
    'authenticated',
    'public.create_case_workflow_record(uuid,uuid,uuid,text,jsonb,jsonb)',
    'execute'
  ) then
    raise exception 'Workflow creation service is exposed to client roles';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.create_case_workflow_record(uuid,uuid,uuid,text,jsonb,jsonb)',
    'execute'
  ) then
    raise exception 'Service role cannot create case workflows';
  end if;

  select pg_get_functiondef(procedure.oid), procedure.prosecdef, procedure.proconfig
    into function_definition, function_security_definer, function_config
  from pg_proc procedure
  where procedure.oid = 'public.create_case_workflow_record(uuid,uuid,uuid,text,jsonb,jsonb)'::regprocedure;

  if function_security_definer then
    raise exception 'Workflow creation service must be SECURITY INVOKER';
  end if;

  if function_config is null or not ('search_path=""' = any(function_config)) then
    raise exception 'Workflow creation service must have an empty search_path';
  end if;

  if function_definition not like '%organization_members%'
    or function_definition not like '%compliance_cases%'
    or function_definition not like '%agent_workflow_stages%'
    or function_definition not like '%compliance_case_events%'
    or function_definition not like '%jsonb_array_elements%' then
    raise exception 'Workflow creation service is missing validation, stages or audit controls';
  end if;

  raise notice 'KUMPLIO Case Agentic Workflows verification passed.';
end;
$$;

select routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'create_case_workflow_record';
