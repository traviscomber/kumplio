-- KUMPLIO Agent Control Plane RLS
-- Tenant isolation, Data API privileges and quota inspection for migration 06.

begin;

-- Reuse the tenant membership primitive introduced by migration 05 while
-- keeping this migration independently deployable.
create or replace function public.is_organization_member(target_organization uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from organization_members membership
    where membership.organization_id = target_organization
      and membership.user_id = auth.uid()
  );
$$;

revoke all on function public.is_organization_member(uuid) from public;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_member(uuid) to service_role;

-- Data API privileges. RLS remains the authorization boundary for
-- authenticated users; service_role is reserved for controlled backend jobs.
grant select, insert, update on table compliance_cases to authenticated;
grant select on table agent_prompt_versions to authenticated;
grant select, insert, update on table agent_runs to authenticated;
grant select, insert, update on table agent_artifacts to authenticated;
grant select, insert on table agent_reviews to authenticated;
grant select on table agent_usage_limits to authenticated;
grant select on table agent_eval_cases to authenticated;

grant all on table compliance_cases to service_role;
grant all on table agent_prompt_versions to service_role;
grant all on table agent_runs to service_role;
grant all on table agent_artifacts to service_role;
grant all on table agent_reviews to service_role;
grant all on table agent_usage_limits to service_role;
grant all on table agent_eval_cases to service_role;
grant all on table agent_eval_results to service_role;

-- Re-runnable policy definitions.
drop policy if exists compliance_cases_select_member on compliance_cases;
drop policy if exists compliance_cases_insert_self on compliance_cases;
drop policy if exists compliance_cases_update_member on compliance_cases;
create policy compliance_cases_select_member on compliance_cases
  for select to authenticated
  using (public.is_organization_member(organization_id));
create policy compliance_cases_insert_self on compliance_cases
  for insert to authenticated
  with check (
    public.is_organization_member(organization_id)
    and created_by = auth.uid()
  );
create policy compliance_cases_update_member on compliance_cases
  for update to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

drop policy if exists agent_prompt_versions_select_active on agent_prompt_versions;
create policy agent_prompt_versions_select_active on agent_prompt_versions
  for select to authenticated
  using (active = true);

drop policy if exists agent_runs_select_member on agent_runs;
drop policy if exists agent_runs_insert_self on agent_runs;
drop policy if exists agent_runs_update_member on agent_runs;
create policy agent_runs_select_member on agent_runs
  for select to authenticated
  using (public.is_organization_member(organization_id));
create policy agent_runs_insert_self on agent_runs
  for insert to authenticated
  with check (
    public.is_organization_member(organization_id)
    and user_id = auth.uid()
  );
create policy agent_runs_update_member on agent_runs
  for update to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

drop policy if exists agent_artifacts_select_member on agent_artifacts;
drop policy if exists agent_artifacts_insert_self on agent_artifacts;
drop policy if exists agent_artifacts_update_member on agent_artifacts;
create policy agent_artifacts_select_member on agent_artifacts
  for select to authenticated
  using (public.is_organization_member(organization_id));
create policy agent_artifacts_insert_self on agent_artifacts
  for insert to authenticated
  with check (
    public.is_organization_member(organization_id)
    and created_by = auth.uid()
  );
create policy agent_artifacts_update_member on agent_artifacts
  for update to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

drop policy if exists agent_reviews_select_member on agent_reviews;
drop policy if exists agent_reviews_insert_self on agent_reviews;
create policy agent_reviews_select_member on agent_reviews
  for select to authenticated
  using (public.is_organization_member(organization_id));
create policy agent_reviews_insert_self on agent_reviews
  for insert to authenticated
  with check (
    public.is_organization_member(organization_id)
    and reviewer_id = auth.uid()
  );

drop policy if exists agent_usage_limits_select_member on agent_usage_limits;
create policy agent_usage_limits_select_member on agent_usage_limits
  for select to authenticated
  using (public.is_organization_member(organization_id));

drop policy if exists agent_eval_cases_select_active on agent_eval_cases;
create policy agent_eval_cases_select_active on agent_eval_cases
  for select to authenticated
  using (active = true);

-- Fast path for concurrent-run checks.
create index if not exists agent_runs_org_active_idx
  on agent_runs(organization_id, status)
  where status in ('queued', 'running');

-- Returns a normalized quota snapshot. The function is SECURITY DEFINER so it
-- can count tenant rows consistently, but authorization is checked explicitly.
create or replace function public.agent_quota_status(target_organization uuid)
returns table (
  allowed boolean,
  reason text,
  daily_runs bigint,
  monthly_runs bigint,
  concurrent_runs bigint,
  monthly_tokens bigint,
  monthly_cost_usd numeric,
  daily_run_limit integer,
  monthly_run_limit integer,
  concurrent_run_limit integer,
  monthly_token_limit bigint,
  monthly_cost_limit_usd numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with authorization as (
    select (
      auth.role() = 'service_role'
      or public.is_organization_member(target_organization)
    ) as authorized
  ),
  limits as (
    select
      coalesce(config.daily_run_limit, 100) as daily_run_limit,
      coalesce(config.monthly_run_limit, 2000) as monthly_run_limit,
      coalesce(config.concurrent_run_limit, 3) as concurrent_run_limit,
      coalesce(config.monthly_token_limit, 50000000::bigint) as monthly_token_limit,
      coalesce(config.monthly_cost_limit_usd, 1000::numeric) as monthly_cost_limit_usd
    from (select 1) seed
    left join agent_usage_limits config
      on config.organization_id = target_organization
  ),
  usage as (
    select
      count(*) filter (
        where created_at >= date_trunc('day', now())
      )::bigint as daily_runs,
      count(*) filter (
        where created_at >= date_trunc('month', now())
      )::bigint as monthly_runs,
      count(*) filter (
        where status in ('queued', 'running')
      )::bigint as concurrent_runs,
      coalesce(sum(total_tokens) filter (
        where created_at >= date_trunc('month', now())
      ), 0)::bigint as monthly_tokens,
      coalesce(sum(estimated_cost_usd) filter (
        where created_at >= date_trunc('month', now())
      ), 0)::numeric as monthly_cost_usd
    from agent_runs
    where organization_id = target_organization
  )
  select
    authorization.authorized
      and usage.daily_runs < limits.daily_run_limit
      and usage.monthly_runs < limits.monthly_run_limit
      and usage.concurrent_runs < limits.concurrent_run_limit
      and usage.monthly_tokens < limits.monthly_token_limit
      and usage.monthly_cost_usd < limits.monthly_cost_limit_usd as allowed,
    case
      when not authorization.authorized then 'not_authorized'
      when usage.concurrent_runs >= limits.concurrent_run_limit then 'concurrent_run_limit'
      when usage.daily_runs >= limits.daily_run_limit then 'daily_run_limit'
      when usage.monthly_runs >= limits.monthly_run_limit then 'monthly_run_limit'
      when usage.monthly_tokens >= limits.monthly_token_limit then 'monthly_token_limit'
      when usage.monthly_cost_usd >= limits.monthly_cost_limit_usd then 'monthly_cost_limit'
      else null
    end as reason,
    usage.daily_runs,
    usage.monthly_runs,
    usage.concurrent_runs,
    usage.monthly_tokens,
    usage.monthly_cost_usd,
    limits.daily_run_limit,
    limits.monthly_run_limit,
    limits.concurrent_run_limit,
    limits.monthly_token_limit,
    limits.monthly_cost_limit_usd
  from authorization
  cross join limits
  cross join usage;
$$;

revoke all on function public.agent_quota_status(uuid) from public;
grant execute on function public.agent_quota_status(uuid) to authenticated;
grant execute on function public.agent_quota_status(uuid) to service_role;

commit;
