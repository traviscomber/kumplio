-- KUMPLIO Agent Control Plane RLS
-- Tenant isolation and minimum-authority policies for migration 06.

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
      and membership.user_id = auth.uid()
  );
$$;

revoke all on function public.is_organization_member(uuid) from public;
grant execute on function public.is_organization_member(uuid) to authenticated;

create policy compliance_cases_select_member on compliance_cases
  for select to authenticated
  using (public.is_organization_member(organization_id));
create policy compliance_cases_insert_member on compliance_cases
  for insert to authenticated
  with check (public.is_organization_member(organization_id) and created_by = auth.uid());
create policy compliance_cases_update_member on compliance_cases
  for update to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));
create policy compliance_cases_delete_creator on compliance_cases
  for delete to authenticated
  using (public.is_organization_member(organization_id) and created_by = auth.uid() and status = 'draft');

create policy agent_runs_select_member on agent_runs
  for select to authenticated
  using (public.is_organization_member(organization_id));
create policy agent_runs_insert_self on agent_runs
  for insert to authenticated
  with check (public.is_organization_member(organization_id) and user_id = auth.uid());
create policy agent_runs_update_self on agent_runs
  for update to authenticated
  using (public.is_organization_member(organization_id) and user_id = auth.uid())
  with check (public.is_organization_member(organization_id) and user_id = auth.uid());

create policy agent_artifacts_select_member on agent_artifacts
  for select to authenticated
  using (public.is_organization_member(organization_id));
create policy agent_artifacts_insert_self on agent_artifacts
  for insert to authenticated
  with check (public.is_organization_member(organization_id) and created_by = auth.uid());
create policy agent_artifacts_update_member on agent_artifacts
  for update to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

create policy agent_reviews_select_member on agent_reviews
  for select to authenticated
  using (public.is_organization_member(organization_id));
create policy agent_reviews_insert_self on agent_reviews
  for insert to authenticated
  with check (public.is_organization_member(organization_id) and reviewer_id = auth.uid());

create policy agent_usage_limits_select_member on agent_usage_limits
  for select to authenticated
  using (public.is_organization_member(organization_id));

create policy prompt_versions_read_authenticated on agent_prompt_versions
  for select to authenticated
  using (true);

create policy eval_cases_read_authenticated on agent_eval_cases
  for select to authenticated
  using (active = true);
create policy eval_results_read_authenticated on agent_eval_results
  for select to authenticated
  using (true);

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
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  limits agent_usage_limits%rowtype;
begin
  if not public.is_organization_member(target_organization) then
    raise exception 'organization access denied';
  end if;

  select * into limits
  from agent_usage_limits
  where organization_id = target_organization;

  if not found then
    limits.organization_id := target_organization;
    limits.daily_run_limit := 100;
    limits.monthly_run_limit := 2000;
    limits.concurrent_run_limit := 3;
    limits.monthly_token_limit := 50000000;
    limits.monthly_cost_limit_usd := 1000;
  end if;

  return query
  with usage as (
    select
      count(*) filter (where created_at >= date_trunc('day', now())) as d_runs,
      count(*) filter (where created_at >= date_trunc('month', now())) as m_runs,
      count(*) filter (where status in ('queued','running')) as c_runs,
      coalesce(sum(total_tokens) filter (where created_at >= date_trunc('month', now())), 0)::bigint as m_tokens,
      coalesce(sum(estimated_cost_usd) filter (where created_at >= date_trunc('month', now())), 0)::numeric as m_cost
    from agent_runs
    where organization_id = target_organization
  )
  select
    (d_runs < limits.daily_run_limit
      and m_runs < limits.monthly_run_limit
      and c_runs < limits.concurrent_run_limit
      and m_tokens < limits.monthly_token_limit
      and m_cost < limits.monthly_cost_limit_usd),
    case
      when d_runs >= limits.daily_run_limit then 'daily_run_limit'
      when m_runs >= limits.monthly_run_limit then 'monthly_run_limit'
      when c_runs >= limits.concurrent_run_limit then 'concurrent_run_limit'
      when m_tokens >= limits.monthly_token_limit then 'monthly_token_limit'
      when m_cost >= limits.monthly_cost_limit_usd then 'monthly_cost_limit'
      else null
    end,
    d_runs, m_runs, c_runs, m_tokens, m_cost,
    limits.daily_run_limit,
    limits.monthly_run_limit,
    limits.concurrent_run_limit,
    limits.monthly_token_limit,
    limits.monthly_cost_limit_usd
  from usage;
end;
$$;

revoke all on function public.agent_quota_status(uuid) from public;
grant execute on function public.agent_quota_status(uuid) to authenticated;

commit;
