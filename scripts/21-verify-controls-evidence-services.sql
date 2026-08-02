-- KUMPLIO controls/evidence service function verification

do $$
declare
  function_definition text;
  function_config text[];
begin
  if to_regprocedure('public.create_control_record(uuid,uuid,uuid,text,text,text,text,text,text,uuid,timestamptz,uuid)') is null then
    raise exception 'Missing public.create_control_record(...)';
  end if;

  if to_regprocedure('public.create_evidence_record(uuid,uuid,uuid,text,text,text,text,uuid,timestamptz,date,date,timestamptz,text,text,uuid)') is null then
    raise exception 'Missing public.create_evidence_record(...)';
  end if;

  if has_function_privilege('anon', 'public.create_control_record(uuid,uuid,uuid,text,text,text,text,text,text,uuid,timestamptz,uuid)', 'execute')
    or has_function_privilege('authenticated', 'public.create_control_record(uuid,uuid,uuid,text,text,text,text,text,text,uuid,timestamptz,uuid)', 'execute') then
    raise exception 'Control creation function is exposed to Data API users';
  end if;

  if has_function_privilege('anon', 'public.create_evidence_record(uuid,uuid,uuid,text,text,text,text,uuid,timestamptz,date,date,timestamptz,text,text,uuid)', 'execute')
    or has_function_privilege('authenticated', 'public.create_evidence_record(uuid,uuid,uuid,text,text,text,text,uuid,timestamptz,date,date,timestamptz,text,text,uuid)', 'execute') then
    raise exception 'Evidence creation function is exposed to Data API users';
  end if;

  if not has_function_privilege('service_role', 'public.create_control_record(uuid,uuid,uuid,text,text,text,text,text,text,uuid,timestamptz,uuid)', 'execute')
    or not has_function_privilege('service_role', 'public.create_evidence_record(uuid,uuid,uuid,text,text,text,text,uuid,timestamptz,date,date,timestamptz,text,text,uuid)', 'execute') then
    raise exception 'Service role cannot execute controls/evidence transactions';
  end if;

  select pg_get_functiondef(procedure.oid), procedure.proconfig
    into function_definition, function_config
  from pg_proc procedure
  where procedure.oid = 'public.create_control_record(uuid,uuid,uuid,text,text,text,text,text,text,uuid,timestamptz,uuid)'::regprocedure;

  if function_definition like '%SECURITY DEFINER%'
    or function_config is null
    or not ('search_path=""' = any(function_config)) then
    raise exception 'Control creation function must be SECURITY INVOKER with empty search_path';
  end if;

  select pg_get_functiondef(procedure.oid), procedure.proconfig
    into function_definition, function_config
  from pg_proc procedure
  where procedure.oid = 'public.create_evidence_record(uuid,uuid,uuid,text,text,text,text,uuid,timestamptz,date,date,timestamptz,text,text,uuid)'::regprocedure;

  if function_definition like '%SECURITY DEFINER%'
    or function_config is null
    or not ('search_path=""' = any(function_config)) then
    raise exception 'Evidence creation function must be SECURITY INVOKER with empty search_path';
  end if;

  raise notice 'KUMPLIO controls/evidence service verification passed.';
end;
$$;

select routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('create_control_record', 'create_evidence_record')
order by routine_name;
