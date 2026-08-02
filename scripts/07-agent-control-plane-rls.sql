-- KUMPLIO Agent Control Plane RLS
-- Tenant isolation, explicit Data API grants and quota RPC for migration 06.
-- Safe to run after scripts/06-agent-control-plane.sql.

begin;

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
      and membership.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_organization_member(uuid) from public;
grant execute on function public.is_organization_member(uuid) to authenticated, service_role;

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
security invoker
set search_path = public
as $$
  with membership as (
    select public.is_organization_member(target_organization) as is_member
  ),
  configured_limits as (
    select
      coalesce(limits.daily_run_limit, 100)::integer as daily_run_limit,
      coalesce(limits.monthly_run_limit, 2000)::integer as monthly_run_limit,
      coalesce(limits.concurrent_run_limit, 3)::integer as concurrent_run_limit,
      coalesce(limits.monthly_token_limit, 50000000)::bigint as monthly_token_limit,
      coalesce(limits.monthly_cost_limit_usd, 1000)::numeric as monthly_cost_limit_usd
    from (select 1) seed
    left join agent_usage_limits limits
      on limits.organization_id = target_organization
  ),
  current_usage as (
    select
      count(*) filter (
        where runs.created_at >= date_trunc('day', now())
      )::bigint as daily_runs,
      count(*) filter (
        where runs.created_at >= date_trunc('month', now())
      )::bigint as monthly_runs,
      count(*) filter (
        where runs.status in ('queued', 'running')
      )::bigint as concurrent_runs,
      coalesce(sum(runs.total_tokens) filter (
        where runs.created_at >= date_trunc('month', now())
      ), 0)::bigint as monthly_tokens,
      coalesce(sum(runs.estimated_cost_usd) filter (
        where runs.created_at >= date_trunc('month', now())
      ), 0)::numeric as monthly_cost_usd
    from agent_runs runs
    where runs.organization_id = target_organization
  ),
  evaluated as (
    select
      membership.is_member,
      current_usage.daily_runs,
      current_usage.monthly_runs,
      current_usage.concurrent_runs,
      current_usage.monthly_tokens,
      current_usage.monthly_cost_usd,
      configured_limits.daily_run_limit,
      configured_limits.monthly_run_limit,
      configured_limits.concurrent_run_limit,
      configured_limits.monthly_token_limit,
      configured_limits.monthly_cost_limit_usd,
      case
        when not membership.is_member then 'organization_access_denied'
        when current_usage.concurrent_runs >= configured_limits.concurrent_run_limit then 'concurrent_run_limit_exceeded'
        when current_usage.daily_runs >= configured_limits.daily_run_limit then 'daily_run_limit_exceeded'
        when current_usage.monthly_runs >= configured_limits.monthly_run_limit then 'monthly_run_limit_exceeded'
        when current_usage.monthly_tokens >= configured_limits.monthly_token_limit then 'monthly_token_limit_exceeded'
        when current_usage.monthly_cost_usd >= configured_limits.monthly_cost_limit_usd then 'monthly_cost_limit_exceeded'
        else null
      end as reason
    from membership
    cross join configured_limits
    cross join current_usage
  )
  select
    evaluated.reason is null as allowed,
    evaluated.reason,
    evaluated.daily_runs,
    evaluated.monthly_runs,
    evaluated.concurrent_runs,
    evaluated.monthly_tokens,
    evaluated.monthly_cost_usd,
    evaluated.daily_run_limit,
    evaluated.monthly_run_limit,
    evaluated.concurrent_run_limit,
    evaluated.monthly_token_limit,
    evaluated.monthly_cost_limit_usd
  from evaluated;
$$;

revoke all on function public.agent_quota_status(uuid) from public;
grant execute on function public.agent_quota_status(uuid) to authenticated, service_role;

revoke all on table
  compliance_cases,
  agent_prompt_versions,
  agent_runs,
  agent_artifacts,
  agent_reviews,
  agent_usage_limits,
  agent_eval_cases,
  agent_eval_results
from anon, authenticated;

grant select, insert, update on table compliance_cases to authenticated;
grant select, insert, update on table agent_runs to authenticated;
grant select, insert, update on table agent_artifacts to authenticated;
grant select, insert on table agent_reviews to authenticated;
grant select on table agent_usage_limits to authenticated;

grant all on table
  compliance_cases,
  agent_prompt_versions,
  agent_runs,
  agent_artifacts,
  agent_reviews,
  agent_usage_limits,
  agent_eval_cases,
  agent_eval_results
to service_role;

drop policy if exists compliance_cases_select_member on compliance_cases;
create policy compliance_cases_select_member on compliance_cases
  for select to authenticated
  using (public.is_organization_member(organization_id));

drop policy if exists compliance_cases_insert_self on compliance_cases;
create policy compliance_cases_insert_self on compliance_cases
  for insert to authenticated
  with check (
    public.is_organization_member(organization_id)
    and created_by = (select auth.uid())
  );

drop policy if exists compliance_cases_update_member on compliance_cases;
create policy compliance_cases_update_member on compliance_cases
  for update to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

drop policy if exists agent_runs_select_member on agent_runs;
create policy agent_runs_select_member on agent_runs
  for select to authenticated
  using (public.is_organization_member(organization_id));

drop policy if exists agent_runs_insert_self on agent_runs;
create policy agent_runs_insert_self on agent_runs
  for insert to authenticated
  with check (
    public.is_organization_member(organization_id)
    and user_id = (select auth.uid())
    and (
      case_id is null
      or exists (
        select 1
        from compliance_cases compliance_case
        where compliance_case.id = agent_runs.case_id
          and compliance_case.organization_id = agent_runs.organization_id
      )
    )
  );

drop policy if exists agent_runs_update_member on agent_runs;
create policy agent_runs_update_member on agent_runs
  for update to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

drop policy if exists agent_artifacts_select_member on agent_artifacts;
create policy agent_artifacts_select_member on agent_artifacts
  for select to authenticated
  using (public.is_organization_member(organization_id));

drop policy if exists agent_artifacts_insert_self on agent_artifacts;
create policy agent_artifacts_insert_self on agent_artifacts
  for insert to authenticated
  with check (
    public.is_organization_member(organization_id)
    and created_by = (select auth.uid())
    and exists (
      select 1
      from agent_runs run
      where run.id = agent_artifacts.run_id
        and run.organization_id = agent_artifacts.organization_id
    )
  );

drop policy if exists agent_artifacts_update_member on agent_artifacts;
create policy agent_artifacts_update_member on agent_artifacts
  for update to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

drop policy if exists agent_reviews_select_member on agent_reviews;
create policy agent_reviews_select_member on agent_reviews
  for select to authenticated
  using (public.is_organization_member(organization_id));

drop policy if exists agent_reviews_insert_self on agent_reviews;
create policy agent_reviews_insert_self on agent_reviews
  for insert to authenticated
  with check (
    public.is_organization_member(organization_id)
    and reviewer_id = (select auth.uid())
    and (
      run_id is null
      or exists (
        select 1
        from agent_runs run
        where run.id = agent_reviews.run_id
          and run.organization_id = agent_reviews.organization_id
      )
    )
    and (
      artifact_id is null
      or exists (
        select 1
        from agent_artifacts artifact
        where artifact.id = agent_reviews.artifact_id
          and artifact.organization_id = agent_reviews.organization_id
      )
    )
  );

drop policy if exists agent_usage_limits_select_member on agent_usage_limits;
create policy agent_usage_limits_select_member on agent_usage_limits
  for select to authenticated
  using (public.is_organization_member(organization_id));

commit;
