-- KUMPLIO — UNIT-ECONOMICS-002: costos completos y margen por plan
begin;

create table if not exists public.operating_cost_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete cascade,
  playbook_id uuid references public.mission_playbooks(id) on delete restrict,
  cost_category text not null check (cost_category in ('infrastructure','software','human_support','implementation','payment_fee','sales_commission','other')),
  allocation_scope text not null check (allocation_scope in ('global','organization','mission','playbook')),
  amount_clp bigint not null check (amount_clp >= 0),
  billing_period text not null default 'monthly' check (billing_period in ('one_time','monthly','quarterly','annual')),
  occurred_on date not null default current_date,
  valid_until date,
  description text not null,
  source_reference text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (valid_until is null or valid_until >= occurred_on),
  check (
    (allocation_scope='global' and organization_id is null and mission_id is null and playbook_id is null)
    or (allocation_scope='organization' and organization_id is not null and mission_id is null)
    or (allocation_scope='mission' and mission_id is not null and organization_id is not null)
    or (allocation_scope='playbook' and playbook_id is not null and mission_id is null)
  )
);

create index if not exists operating_cost_entries_org_idx on public.operating_cost_entries(organization_id,occurred_on desc);
create index if not exists operating_cost_entries_mission_idx on public.operating_cost_entries(mission_id,occurred_on desc);
create index if not exists operating_cost_entries_playbook_idx on public.operating_cost_entries(playbook_id,occurred_on desc);
create index if not exists operating_cost_entries_created_by_idx on public.operating_cost_entries(created_by);

alter table public.operating_cost_entries enable row level security;
revoke all on public.operating_cost_entries from anon,authenticated;
grant all on public.operating_cost_entries to service_role;
create policy operating_cost_entries_clients_denied on public.operating_cost_entries as restrictive for all to anon,authenticated using (false) with check (false);

create or replace view public.internal_plan_unit_economics as
with active_terms as (
  select
    coalesce(plan_key,'Sin plan') as plan_key,
    revenue_type,
    sum(case billing_period
      when 'monthly' then amount_clp
      when 'quarterly' then round(amount_clp::numeric/3)
      when 'annual' then round(amount_clp::numeric/12)
      else 0 end)::bigint as monthly_revenue_clp,
    count(distinct organization_id)::bigint as organizations
  from public.organization_commercial_terms
  where status='active'
    and valid_from <= current_date
    and (valid_until is null or valid_until >= current_date)
  group by coalesce(plan_key,'Sin plan'),revenue_type
), org_plan as (
  select distinct on (organization_id)
    organization_id,
    coalesce(plan_key,'Sin plan') as plan_key
  from public.organization_commercial_terms
  where status='active'
    and valid_from <= current_date
    and (valid_until is null or valid_until >= current_date)
  order by organization_id,valid_from desc,created_at desc
), ai_costs as (
  select op.plan_key,
    coalesce(sum(e.cost_clp),0)::bigint as ai_cost_clp
  from org_plan op
  left join public.internal_organization_unit_economics e on e.organization_id=op.organization_id
  group by op.plan_key
), operating_costs as (
  select coalesce(op.plan_key,'Global') as plan_key,
    sum(case c.billing_period
      when 'monthly' then c.amount_clp
      when 'quarterly' then round(c.amount_clp::numeric/3)
      when 'annual' then round(c.amount_clp::numeric/12)
      when 'one_time' then c.amount_clp
    end)::bigint as operating_cost_clp
  from public.operating_cost_entries c
  left join org_plan op on op.organization_id=c.organization_id
  where c.occurred_on <= current_date and (c.valid_until is null or c.valid_until >= current_date)
  group by coalesce(op.plan_key,'Global')
), global_cost as (
  select coalesce(sum(operating_cost_clp),0)::bigint as amount
  from operating_costs where plan_key='Global'
), plans as (
  select distinct plan_key from active_terms
)
select
  p.plan_key,
  coalesce(sum(a.monthly_revenue_clp),0)::bigint as monthly_revenue_clp,
  coalesce(sum(a.organizations),0)::bigint as organizations,
  coalesce(ai.ai_cost_clp,0)::bigint as ai_cost_clp,
  coalesce(oc.operating_cost_clp,0)::bigint as direct_operating_cost_clp,
  case when (select count(*) from plans)=0 then 0
    else round((select amount from global_cost)::numeric/(select count(*) from plans))::bigint end as allocated_global_cost_clp,
  (coalesce(ai.ai_cost_clp,0)+coalesce(oc.operating_cost_clp,0)+
    case when (select count(*) from plans)=0 then 0 else round((select amount from global_cost)::numeric/(select count(*) from plans))::bigint end
  )::bigint as total_cost_clp,
  (coalesce(sum(a.monthly_revenue_clp),0)-coalesce(ai.ai_cost_clp,0)-coalesce(oc.operating_cost_clp,0)-
    case when (select count(*) from plans)=0 then 0 else round((select amount from global_cost)::numeric/(select count(*) from plans))::bigint end
  )::bigint as gross_margin_clp,
  case when coalesce(sum(a.monthly_revenue_clp),0)=0 then null else round((
    (coalesce(sum(a.monthly_revenue_clp),0)-coalesce(ai.ai_cost_clp,0)-coalesce(oc.operating_cost_clp,0)-
      case when (select count(*) from plans)=0 then 0 else round((select amount from global_cost)::numeric/(select count(*) from plans))::bigint end
    )::numeric/coalesce(sum(a.monthly_revenue_clp),0)
  )*100,2) end as gross_margin_percent
from plans p
left join active_terms a on a.plan_key=p.plan_key
left join ai_costs ai on ai.plan_key=p.plan_key
left join operating_costs oc on oc.plan_key=p.plan_key
 group by p.plan_key,ai.ai_cost_clp,oc.operating_cost_clp;

revoke all on public.internal_plan_unit_economics from public,anon,authenticated;
grant select on public.internal_plan_unit_economics to service_role;

commit;
