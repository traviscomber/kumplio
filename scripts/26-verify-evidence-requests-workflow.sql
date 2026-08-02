-- KUMPLIO Evidence Requests workflow verification
-- Read-only checks for immutable history, controlled transitions and service-only functions.

do $$
declare
  function_signature text;
  function_definition text;
  function_security_definer boolean;
  function_config text[];
  function_name text;
begin
  if to_regclass('public.evidence_request_events') is null then
    raise exception 'Missing public.evidence_request_events';
  end if;

  if not exists (
    select 1 from pg_class relation
    where relation.oid = 'public.evidence_request_events'::regclass
      and relation.relrowsecurity
  ) then
    raise exception 'RLS is not enabled on evidence_request_events';
  end if;

  if has_table_privilege('anon', 'public.evidence_requests', 'select')
    or has_table_privilege('anon', 'public.evidence_request_events', 'select') then
    raise exception 'Anonymous role unexpectedly has evidence request access';
  end if;

  if not has_table_privilege('authenticated', 'public.evidence_requests', 'select')
    or not has_table_privilege('authenticated', 'public.evidence_request_events', 'select') then
    raise exception 'Authenticated role is missing read access to evidence requests';
  end if;

  if has_table_privilege('authenticated', 'public.evidence_requests', 'insert')
    or has_table_privilege('authenticated', 'public.evidence_requests', 'update')
    or has_table_privilege('authenticated', 'public.evidence_requests', 'delete')
    or has_table_privilege('authenticated', 'public.evidence_request_events', 'insert')
    or has_table_privilege('authenticated', 'public.evidence_request_events', 'update')
    or has_table_privilege('authenticated', 'public.evidence_request_events', 'delete') then
    raise exception 'Evidence request workflow can bypass service transitions';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'evidence_request_events'
      and policyname = 'evidence_request_events_select_member'
  ) <> 1 then
    raise exception 'Missing evidence request event select policy';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'evidence_requests'
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
  ) then
    raise exception 'Direct evidence request mutation policy remains';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'evidence_requests'
      and column_name = 'reviewed_by'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'evidence_requests'
      and column_name = 'reviewed_at'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'evidence_requests'
      and column_name = 'review_comment'
  ) then
    raise exception 'Evidence request review columns are missing';
  end if;

  if not exists (
    select 1
    from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.evidence_requests'::regclass
      and constraint_row.conname = 'evidence_requests_status_check'
      and pg_get_constraintdef(constraint_row.oid) like '%changes_requested%'
      and pg_get_constraintdef(constraint_row.oid) like '%accepted%'
      and pg_get_constraintdef(constraint_row.oid) like '%cancelled%'
  ) then
    raise exception 'Evidence request status constraint is incomplete';
  end if;

  if not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'evidence_requests_reviewed_by_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'evidence_request_events_request_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'evidence_request_events_project_id_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'evidence_request_events_actor_idx')
    or not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'evidence_request_events_evidence_idx') then
    raise exception 'One or more evidence request indexes are missing';
  end if;

  foreach function_signature in array array[
    'public.create_evidence_request_record(uuid,uuid,uuid,uuid,uuid,text,text,uuid,timestamptz)',
    'public.submit_evidence_request_record(uuid,uuid,uuid,uuid,text)',
    'public.review_evidence_request_record(uuid,uuid,uuid,text,text)',
    'public.cancel_evidence_request_record(uuid,uuid,uuid,text)'
  ] loop
    if to_regprocedure(function_signature) is null then
      raise exception 'Missing service function %', function_signature;
    end if;

    if has_function_privilege('anon', function_signature, 'execute')
      or has_function_privilege('authenticated', function_signature, 'execute') then
      raise exception 'Service function is exposed to client roles: %', function_signature;
    end if;

    if not has_function_privilege('service_role', function_signature, 'execute') then
      raise exception 'Service role cannot execute %', function_signature;
    end if;

    select pg_get_functiondef(procedure.oid), procedure.prosecdef, procedure.proconfig, procedure.proname
      into function_definition, function_security_definer, function_config, function_name
    from pg_proc procedure
    where procedure.oid = function_signature::regprocedure;

    if function_security_definer then
      raise exception '% must be SECURITY INVOKER', function_name;
    end if;

    if function_config is null or not ('search_path=""' = any(function_config)) then
      raise exception '% must have an empty search_path', function_name;
    end if;

    if function_definition not like '%organization_members%'
      or function_definition not like '%evidence_request_events%' then
      raise exception '% is missing membership or audit controls', function_name;
    end if;
  end loop;

  select pg_get_functiondef('public.review_evidence_request_record(uuid,uuid,uuid,text,text)'::regprocedure)
    into function_definition;
  if function_definition not like '%control_evidence%'
    or function_definition not like '%sufficiency_status%'
    or function_definition not like '%compliance_case_events%' then
    raise exception 'Evidence review does not update sufficiency and case audit';
  end if;

  raise notice 'KUMPLIO Evidence Requests workflow verification passed.';
end;
$$;

select routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'create_evidence_request_record',
    'submit_evidence_request_record',
    'review_evidence_request_record',
    'cancel_evidence_request_record'
  )
order by routine_name;
