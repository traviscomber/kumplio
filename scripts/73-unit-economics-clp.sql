-- KUMPLIO — UNIT-ECONOMICS-001: costos, conversión CLP y margen interno
begin;

create table if not exists public.kumplio_internal_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'analyst' check (role in ('analyst','finance_admin','platform_admin')),
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fx_rates (
  id uuid primary key default gen_random_uuid(),
  rate_date date not null,
  base_currency text not null default 'USD' check (base_currency='USD'),
  quote_currency text not null default 'CLP' check (quote_currency='CLP'),
  rate numeric(18,6) not null check (rate > 0),
  source_name text not null,
  source_reference text,
  recorded_by uuid not null references auth.users(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  unique(rate_date,base_currency,quote_currency,source_name)
);
create index if not exists fx_rates_date_idx on public.fx_rates(rate_date desc,recorded_at desc);
create index if not exists fx_rates_recorded_by_idx on public.fx_rates(recorded_by);

create table if not exists public.organization_commercial_terms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  revenue_type text not null check (revenue_type in ('subscription','managed_service','fullstack_project','other')),
  plan_key text,
  amount_clp bigint not null check (amount_clp >= 0),
  billing_period text not null default 'monthly' check (billing_period in ('one_time','monthly','quarterly','annual')),
  valid_from date not null,
  valid_until date,
  notes text,
  status text not null default 'active' check (status in ('draft','active','ended','cancelled')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_until >= valid_from)
);
create index if not exists organization_commercial_terms_org_idx on public.organization_commercial_terms(organization_id,status,valid_from desc);
create index if not exists organization_commercial_terms_created_by_idx on public.organization_commercial_terms(created_by);

alter table public.kumplio_internal_users enable row level security;
alter table public.fx_rates enable row level security;
alter table public.organization_commercial_terms enable row level security;

revoke all on public.kumplio_internal_users,public.fx_rates,public.organization_commercial_terms from anon,authenticated;
grant all on public.kumplio_internal_users,public.fx_rates,public.organization_commercial_terms to service_role;

create or replace function public.is_kumplio_internal_user(p_user_id uuid, p_roles text[] default null)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(
    select 1 from public.kumplio_internal_users iu
    where iu.user_id=p_user_id and iu.status='active'
      and (p_roles is null or iu.role=any(p_roles))
  );
$$;
revoke all on function public.is_kumplio_internal_user(uuid,text[]) from public,anon,authenticated;
grant execute on function public.is_kumplio_internal_user(uuid,text[]) to service_role;

create or replace view public.internal_mission_unit_economics as
with mission_costs as (
  select
    m.id as mission_id,
    m.organization_id,
    m.playbook_version_id,
    coalesce(sum(j.total_cost_microusd),0)::bigint as cost_microusd,
    coalesce(sum(j.total_input_tokens),0)::bigint as input_tokens,
    coalesce(sum(j.total_output_tokens),0)::bigint as output_tokens,
    coalesce(sum(j.total_latency_ms),0)::bigint as latency_ms
  from public.missions m
  left join public.mission_execution_jobs j on j.mission_id=m.id
  group by m.id,m.organization_id,m.playbook_version_id
), rated as (
  select mc.*,
    fx.rate as usd_clp_rate,
    case when fx.rate is null then null else round((mc.cost_microusd::numeric/1000000)*fx.rate)::bigint end as cost_clp
  from mission_costs mc
  left join lateral (
    select f.rate from public.fx_rates f
    where f.rate_date <= current_date
    order by f.rate_date desc,f.recorded_at desc limit 1
  ) fx on true
)
select * from rated;

create or replace view public.internal_organization_unit_economics as
with costs as (
  select organization_id,
    sum(cost_microusd)::bigint as cost_microusd,
    sum(cost_clp)::bigint as cost_clp,
    max(usd_clp_rate) as usd_clp_rate,
    sum(input_tokens)::bigint as input_tokens,
    sum(output_tokens)::bigint as output_tokens,
    count(*)::bigint as mission_count
  from public.internal_mission_unit_economics group by organization_id
), revenue as (
  select organization_id,
    sum(case billing_period
      when 'monthly' then amount_clp
      when 'quarterly' then round(amount_clp::numeric/3)
      when 'annual' then round(amount_clp::numeric/12)
      else 0 end)::bigint as monthly_recurring_revenue_clp,
    sum(case when billing_period='one_time' then amount_clp else 0 end)::bigint as project_revenue_clp
  from public.organization_commercial_terms
  where status='active' and valid_from<=current_date and (valid_until is null or valid_until>=current_date)
  group by organization_id
)
select
  o.id as organization_id,
  o.name as organization_name,
  coalesce(c.mission_count,0) as mission_count,
  coalesce(c.cost_microusd,0) as cost_microusd,
  c.cost_clp,
  c.usd_clp_rate,
  coalesce(c.input_tokens,0) as input_tokens,
  coalesce(c.output_tokens,0) as output_tokens,
  coalesce(r.monthly_recurring_revenue_clp,0) as monthly_recurring_revenue_clp,
  coalesce(r.project_revenue_clp,0) as project_revenue_clp,
  case when c.cost_clp is null then null else coalesce(r.monthly_recurring_revenue_clp,0)-c.cost_clp end as gross_margin_clp,
  case when c.cost_clp is null or coalesce(r.monthly_recurring_revenue_clp,0)=0 then null
    else round(((coalesce(r.monthly_recurring_revenue_clp,0)-c.cost_clp)::numeric/coalesce(r.monthly_recurring_revenue_clp,0))*100,2)
  end as gross_margin_percent
from public.organizations o
left join costs c on c.organization_id=o.id
left join revenue r on r.organization_id=o.id;

revoke all on public.internal_mission_unit_economics,public.internal_organization_unit_economics from public,anon,authenticated;
grant select on public.internal_mission_unit_economics,public.internal_organization_unit_economics to service_role;

commit;
