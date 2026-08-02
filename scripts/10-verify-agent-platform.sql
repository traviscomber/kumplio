-- KUMPLIO Agent Platform verification
-- Run after migrations 06, 07, 08 and 09.
-- This script is read-only and raises an exception when the installation is incomplete.

do $$
declare
  missing_relations text[];
  missing_policies text[];
  missing_functions text[];
  relation_name text;
  policy_name text;
  function_signature text;
begin
  select array_agg(required.name order by required.name)
  into missing_relations
  from (
    values
      ('compliance_cases'),
      ('agent_prompt_versions'),
      ('agent_runs'),
      ('agent_artifacts'),
      ('agent_reviews'),
      ('agent_usage_limits'),
      ('agent_eval_cases'),
      ('agent_eval_results'),
      ('agent_workflows'),
      ('agent_workflow_stages'),
      ('agent_tool_calls')
  ) as required(name)
  where to_regclass('public.' || required.name) is null;

  if missing_relations is not null then
    raise exception 'Missing Agent Platform relations: %', array_to_string(missing_relations, ', ');
  end if;

  select array_agg(required.name order by required.name)
  into missing_functions
  from (
    values
      ('public.is_organization_member(uuid)'),
      ('public.agent_quota_status(uuid)')
  ) as required(name)
  where to_regprocedure(required.name) is null;

  if missing_functions is not null then
    raise exception 'Missing Agent Platform functions: %', array_to_string(missing_functions, ', ');
  end if;

  select array_agg(required.name order by required.name)
  into missing_policies
  from (
    values
      ('compliance_cases_select_member'),
      ('compliance_cases_insert_self'),
      ('compliance_cases_update_member'),
      ('agent_runs_select_member'),
      ('agent_runs_insert_self'),
      ('agent_runs_update_member'),
      ('agent_artifacts_select_member'),
      ('agent_artifacts_insert_self'),
      ('agent_artifacts_update_member'),
      ('agent_reviews_select_member'),
      ('agent_reviews_insert_self'),
      ('agent_usage_limits_select_member'),
      ('agent_workflows_select_member'),
      ('agent_workflows_insert_self'),
      ('agent_workflows_update_creator'),
      ('agent_workflow_stages_select_member'),
      ('agent_workflow_stages_insert_member'),
      ('agent_workflow_stages_update_creator'),
      ('agent_tool_calls_select_member'),
      ('agent_tool_calls_insert_self'),
      ('agent_tool_calls_update_self')
  ) as required(name)
  where not exists (
    select 1
    from pg_policies policy
    where policy.schemaname = 'public'
      and policy.policyname = required.name
  );

  if missing_policies is not null then
    raise exception 'Missing Agent Platform RLS policies: %', array_to_string(missing_policies, ', ');
  end if;

  foreach relation_name in array array[
    'compliance_cases',
    'agent_prompt_versions',
    'agent_runs',
    'agent_artifacts',
    'agent_reviews',
    'agent_usage_limits',
    'agent_eval_cases',
    'agent_eval_results',
    'agent_workflows',
    'agent_workflow_stages',
    'agent_tool_calls'
  ] loop
    if not exists (
      select 1
      from pg_class relation
      join pg_namespace namespace on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public'
        and relation.relname = relation_name
        and relation.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', relation_name;
    end if;
  end loop;

  if has_table_privilege('anon', 'public.agent_runs', 'select')
    or has_table_privilege('anon', 'public.agent_artifacts', 'select')
    or has_table_privilege('anon', 'public.agent_reviews', 'select') then
    raise exception 'Anonymous role unexpectedly has access to Agent Platform data';
  end if;

  if not has_table_privilege('authenticated', 'public.agent_runs', 'select,insert,update') then
    raise exception 'Authenticated role is missing required privileges on agent_runs';
  end if;

  if not has_table_privilege('authenticated', 'public.agent_artifacts', 'select,insert,update') then
    raise exception 'Authenticated role is missing required privileges on agent_artifacts';
  end if;

  if not has_table_privilege('authenticated', 'public.agent_reviews', 'select,insert') then
    raise exception 'Authenticated role is missing required privileges on agent_reviews';
  end if;

  if not has_function_privilege('authenticated', 'public.agent_quota_status(uuid)', 'execute') then
    raise exception 'Authenticated role cannot execute agent_quota_status(uuid)';
  end if;

  raise notice 'KUMPLIO Agent Platform verification passed: schema, RLS, policies and grants are present.';
end;
$$;

select
  relname as table_name,
  relrowsecurity as rls_enabled
from pg_class
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where pg_namespace.nspname = 'public'
  and relname in (
    'compliance_cases',
    'agent_runs',
    'agent_artifacts',
    'agent_reviews',
    'agent_workflows',
    'agent_workflow_stages',
    'agent_tool_calls'
  )
order by relname;
