-- KUMPLIO Regulatory Evidence Engine Foundation verification

do $$
declare
  table_name text;
  relation regclass;
  function_signature text;
  function_definition text;
  function_security_definer boolean;
  function_config text[];
begin
  foreach table_name in array array[
    'regulatory_sources',
    'regulatory_source_fetches',
    'regulatory_documents',
    'regulatory_document_versions',
    'regulatory_document_sections',
    'regulatory_source_changes',
    'regulatory_claims',
    'regulatory_claim_citations',
    'regulatory_applicability_assessments',
    'regulatory_source_review_decisions'
  ]
  loop
    relation := to_regclass(format('public.%I', table_name));
    if relation is null then
      raise exception 'Missing public.%', table_name;
    end if;

    if not exists (
      select 1 from pg_class class_row
      where class_row.oid = relation
        and class_row.relrowsecurity
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

  if not has_table_privilege('authenticated', 'public.regulatory_sources', 'select')
    or not has_table_privilege('authenticated', 'public.regulatory_documents', 'select')
    or not has_table_privilege('authenticated', 'public.regulatory_document_versions', 'select')
    or not has_table_privilege('authenticated', 'public.regulatory_document_sections', 'select')
    or not has_table_privilege('authenticated', 'public.regulatory_source_changes', 'select')
    or not has_table_privilege('authenticated', 'public.regulatory_claims', 'select')
    or not has_table_privilege('authenticated', 'public.regulatory_claim_citations', 'select') then
    raise exception 'Authenticated role is missing shared regulatory read access';
  end if;

  if has_column_privilege('authenticated', 'public.regulatory_source_fetches', 'raw_content', 'select')
    or has_column_privilege('authenticated', 'public.regulatory_source_fetches', 'response_headers', 'select')
    or has_column_privilege('authenticated', 'public.regulatory_source_fetches', 'error_message', 'select') then
    raise exception 'Authenticated role can read sensitive capture payloads';
  end if;

  if not has_column_privilege('authenticated', 'public.regulatory_source_fetches', 'content_hash', 'select')
    or not has_column_privilege('authenticated', 'public.regulatory_source_fetches', 'status', 'select') then
    raise exception 'Authenticated role cannot read safe capture metadata';
  end if;

  if has_table_privilege('authenticated', 'public.regulatory_sources', 'insert')
    or has_table_privilege('authenticated', 'public.regulatory_sources', 'update')
    or has_table_privilege('authenticated', 'public.regulatory_source_fetches', 'insert')
    or has_table_privilege('authenticated', 'public.regulatory_claims', 'insert')
    or has_table_privilege('authenticated', 'public.regulatory_source_review_decisions', 'select') then
    raise exception 'Client roles can mutate or read internal regulatory administration data';
  end if;

  if not has_table_privilege(
    'authenticated',
    'public.regulatory_applicability_assessments',
    'select,insert,update,delete'
  ) then
    raise exception 'Authenticated role is missing tenant applicability privileges';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'regulatory_applicability_assessments'
      and policyname in (
        'regulatory_applicability_select_member',
        'regulatory_applicability_insert_member',
        'regulatory_applicability_update_member',
        'regulatory_applicability_delete_member'
      )
  ) <> 4 then
    raise exception 'Tenant applicability policies are incomplete';
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'regulatory_applicability_case_claim_uidx'
  ) or not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'regulatory_applicability_project_claim_uidx'
  ) then
    raise exception 'Applicability uniqueness indexes are missing';
  end if;

  if not exists (
    select 1
    from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.regulatory_source_review_decisions'::regclass
      and constraint_row.conname = 'regulatory_source_review_decisions_target_check'
      and pg_get_constraintdef(constraint_row.oid) like '%= 1%'
  ) then
    raise exception 'Review decisions do not target exactly one regulatory object';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'regulatory_changes'
      and column_name = 'source_change_id'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'regulatory_changes'
      and column_name = 'source_version_id'
  ) then
    raise exception 'Historical regulatory_changes compatibility columns are missing';
  end if;

  if to_regprocedure('private.prevent_regulatory_immutable_change()') is null
    or to_regprocedure('private.validate_regulatory_applicability()') is null then
    raise exception 'Regulatory integrity trigger functions are missing';
  end if;

  foreach table_name in array array[
    'regulatory_source_fetches',
    'regulatory_document_versions',
    'regulatory_document_sections',
    'regulatory_source_changes',
    'regulatory_claim_citations',
    'regulatory_source_review_decisions'
  ]
  loop
    relation := to_regclass(format('public.%I', table_name));
    if not exists (
      select 1 from pg_trigger
      where tgrelid = relation
        and tgname = 'prevent_regulatory_immutable_change'
        and not tgisinternal
    ) then
      raise exception 'Immutable trigger missing on public.%', table_name;
    end if;
  end loop;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.regulatory_applicability_assessments'::regclass
      and tgname = 'validate_regulatory_applicability'
      and not tgisinternal
  ) then
    raise exception 'Applicability validation trigger is missing';
  end if;

  foreach function_signature in array array[
    'public.register_regulatory_source_record(uuid,text,text,text,text,text,text,text,text,text,jsonb)',
    'public.record_regulatory_source_capture(uuid,text,text,text,integer,text,text,text,text,jsonb,text,text,text,text,text,text,text,date,date,date,text,text,date,text,text)',
    'public.record_regulatory_claim_with_citation(uuid,uuid,uuid,text,integer,text,text,text,text,text,text,jsonb,date,date,text,numeric,text,integer,integer)',
    'public.review_regulatory_claim_record(uuid,uuid,text,text,jsonb)'
  ]
  loop
    if to_regprocedure(function_signature) is null then
      raise exception 'Missing service function %', function_signature;
    end if;

    if has_function_privilege('anon', function_signature, 'execute')
      or has_function_privilege('authenticated', function_signature, 'execute') then
      raise exception 'Regulatory service is exposed to client roles: %', function_signature;
    end if;

    if not has_function_privilege('service_role', function_signature, 'execute') then
      raise exception 'Service role cannot execute %', function_signature;
    end if;

    select pg_get_functiondef(procedure.oid), procedure.prosecdef, procedure.proconfig
      into function_definition, function_security_definer, function_config
    from pg_proc procedure
    where procedure.oid = function_signature::regprocedure;

    if function_security_definer then
      raise exception 'Regulatory service must be SECURITY INVOKER: %', function_signature;
    end if;

    if function_config is null or not ('search_path=""' = any(function_config)) then
      raise exception 'Regulatory service must have an empty search_path: %', function_signature;
    end if;
  end loop;

  select pg_get_functiondef(
    'public.record_regulatory_source_capture(uuid,text,text,text,integer,text,text,text,text,jsonb,text,text,text,text,text,text,text,date,date,date,text,text,date,text,text)'::regprocedure
  ) into function_definition;

  if function_definition not like '%pg_advisory_xact_lock%'
    or function_definition not like '%5242880%'
    or function_definition not like '%sha256%'
    or function_definition not like '%regulatory_source_changes%'
    or function_definition not like '%unchanged%' then
    raise exception 'Capture service is missing concurrency, size, hashing, diff or unchanged controls';
  end if;

  select pg_get_functiondef(
    'public.record_regulatory_claim_with_citation(uuid,uuid,uuid,text,integer,text,text,text,text,text,text,jsonb,date,date,text,numeric,text,integer,integer)'::regprocedure
  ) into function_definition;

  if function_definition not like '%position(clean_quote in p_body_text)%'
    or function_definition not like '%quote_hash%'
    or function_definition not like '%section_hash%' then
    raise exception 'Claim service does not verify exact citation text and hashes';
  end if;

  if not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'regulatory_source_fetches_hash_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'regulatory_document_versions_document_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'regulatory_document_sections_version_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'regulatory_claims_version_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'regulatory_claim_citations_claim_idx') then
    raise exception 'One or more core regulatory indexes are missing';
  end if;

  raise notice 'KUMPLIO Regulatory Evidence Engine Foundation verification passed.';
end;
$$;

select routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'register_regulatory_source_record',
    'record_regulatory_source_capture',
    'record_regulatory_claim_with_citation',
    'review_regulatory_claim_record'
  )
order by routine_name;
