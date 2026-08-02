-- KUMPLIO LeyChile Controlled Capture verification

do $$
declare
  function_signature text;
  function_definition text;
  function_security_definer boolean;
  function_config text[];
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'regulatory_document_sections'
      and column_name = 'section_key'
      and is_nullable = 'NO'
  ) then
    raise exception 'regulatory_document_sections.section_key is missing or nullable';
  end if;

  if not exists (
    select 1
    from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.regulatory_document_sections'::regclass
      and constraint_row.conname = 'regulatory_document_sections_version_key_key'
  ) then
    raise exception 'Regulatory section key uniqueness is missing';
  end if;

  foreach function_signature in array array[
    'public.record_regulatory_parsed_sections(uuid,text,jsonb)',
    'public.record_leychile_capture_bundle(uuid,text,text,integer,text,text,text,text,text,text,text,text,text,date,date,date,text,text,date,text,text,jsonb)'
  ]
  loop
    if to_regprocedure(function_signature) is null then
      raise exception 'Missing LeyChile service %', function_signature;
    end if;

    if has_function_privilege('anon', function_signature, 'execute')
      or has_function_privilege('authenticated', function_signature, 'execute') then
      raise exception 'LeyChile service is exposed to client roles: %', function_signature;
    end if;

    if not has_function_privilege('service_role', function_signature, 'execute') then
      raise exception 'Service role cannot execute LeyChile service %', function_signature;
    end if;

    select pg_get_functiondef(procedure.oid), procedure.prosecdef, procedure.proconfig
      into function_definition, function_security_definer, function_config
    from pg_proc procedure
    where procedure.oid = function_signature::regprocedure;

    if function_security_definer then
      raise exception 'LeyChile service must be SECURITY INVOKER: %', function_signature;
    end if;

    if function_config is null or not ('search_path=""' = any(function_config)) then
      raise exception 'LeyChile service must have an empty search_path: %', function_signature;
    end if;
  end loop;

  select pg_get_functiondef(
    'public.record_regulatory_parsed_sections(uuid,text,jsonb)'::regprocedure
  ) into function_definition;

  if function_definition not like '%10000%'
    or function_definition not like '%pg_advisory_xact_lock%'
    or function_definition not like '%section_key%'
    or function_definition not like '%parentKey%'
    or function_definition not like '%different content%'
    or function_definition not like '%Inciso parent was not resolved%' then
    raise exception 'Parsed section service is missing size, concurrency, hierarchy or idempotency controls';
  end if;

  select pg_get_functiondef(
    'public.record_leychile_capture_bundle(uuid,text,text,integer,text,text,text,text,text,text,text,text,text,date,date,date,text,text,date,text,text,jsonb)'::regprocedure
  ) into function_definition;

  if function_definition not like '%record_regulatory_source_capture%'
    or function_definition not like '%record_regulatory_parsed_sections%'
    or function_definition not like '%parsedSectionCount%' then
    raise exception 'Atomic LeyChile capture bundle is incomplete';
  end if;

  if has_table_privilege('authenticated', 'public.regulatory_document_sections', 'insert')
    or has_table_privilege('authenticated', 'public.regulatory_document_sections', 'update')
    or has_table_privilege('authenticated', 'public.regulatory_document_sections', 'delete') then
    raise exception 'Authenticated role can mutate parsed regulatory sections directly';
  end if;

  raise notice 'KUMPLIO LeyChile Controlled Capture verification passed.';
end;
$$;

select routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'record_regulatory_parsed_sections',
    'record_leychile_capture_bundle'
  )
order by routine_name;
