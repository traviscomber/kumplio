-- KUMPLIO — GROWTH-OS-001: oportunidades comerciales explicables
begin;

create table if not exists public.growth_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_type text not null check (opportunity_type in ('upgrade','assisted','fullstack','renewal_risk')),
  status text not null default 'new' check (status in ('new','reviewing','contacted','won','dismissed')),
  score integer not null check (score between 0 and 100),
  title text not null,
  summary text not null,
  reasons jsonb not null default '[]'::jsonb,
  recommended_action text not null,
  estimated_value_clp bigint check (estimated_value_clp is null or estimated_value_clp >= 0),
  source_snapshot jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  assigned_to uuid references auth.users(id) on delete set null,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, opportunity_type),
  check ((status in ('won','dismissed') and resolved_at is not null) or (status not in ('won','dismissed') and resolved_at is null))
);

create index if not exists growth_opportunities_status_score_idx on public.growth_opportunities(status,score desc,last_seen_at desc);
create index if not exists growth_opportunities_org_idx on public.growth_opportunities(organization_id,last_seen_at desc);
create index if not exists growth_opportunities_assigned_idx on public.growth_opportunities(assigned_to,status);
create index if not exists growth_opportunities_resolved_by_idx on public.growth_opportunities(resolved_by);

alter table public.growth_opportunities enable row level security;
revoke all on public.growth_opportunities from anon,authenticated;
grant all on public.growth_opportunities to service_role;
create policy growth_opportunities_clients_denied on public.growth_opportunities
  as restrictive for all to anon,authenticated using (false) with check (false);

create or replace view public.internal_growth_signals as
with members as (
  select organization_id,count(*)::int as member_count
  from public.organization_members
  group by organization_id
), mission_stats as (
  select organization_id,
    count(*)::int as mission_count,
    count(*) filter (where status in ('completed','closed'))::int as completed_missions,
    count(*) filter (where status not in ('completed','closed','cancelled') and created_at < now()-interval '21 days')::int as stalled_missions,
    max(created_at) as last_mission_at
  from public.missions
  group by organization_id
), capability_stats as (
  select organization_id,
    count(*)::int as capability_runs,
    count(*) filter (where status='completed')::int as completed_capabilities
  from public.mission_capability_runs
  group by organization_id
), commercial as (
  select distinct on (organization_id)
    organization_id,
    coalesce(plan_key,'Sin plan') as plan_key,
    revenue_type,
    amount_clp,
    billing_period,
    valid_until
  from public.organization_commercial_terms
  where status='active' and valid_from<=current_date and (valid_until is null or valid_until>=current_date)
  order by organization_id,valid_from desc,created_at desc
), economics as (
  select organization_id,monthly_recurring_revenue_clp,gross_margin_percent
  from public.internal_organization_unit_economics
)
select
  o.id as organization_id,
  o.name as organization_name,
  coalesce(m.member_count,0) as member_count,
  coalesce(ms.mission_count,0) as mission_count,
  coalesce(ms.completed_missions,0) as completed_missions,
  coalesce(ms.stalled_missions,0) as stalled_missions,
  ms.last_mission_at,
  coalesce(cs.capability_runs,0) as capability_runs,
  coalesce(cs.completed_capabilities,0) as completed_capabilities,
  coalesce(c.plan_key,'Sin plan') as plan_key,
  c.revenue_type,
  c.valid_until,
  coalesce(e.monthly_recurring_revenue_clp,0) as monthly_revenue_clp,
  e.gross_margin_percent,
  greatest(0,extract(day from (now()-coalesce(ms.last_mission_at,o.created_at)))::int) as days_since_last_mission
from public.organizations o
left join members m on m.organization_id=o.id
left join mission_stats ms on ms.organization_id=o.id
left join capability_stats cs on cs.organization_id=o.id
left join commercial c on c.organization_id=o.id
left join economics e on e.organization_id=o.id;

revoke all on public.internal_growth_signals from public,anon,authenticated;
grant select on public.internal_growth_signals to service_role;

create or replace function public.refresh_growth_opportunities()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_count int := 0;
begin
  -- Upgrade desde Esencial o sin plan cuando el uso ya muestra adopción.
  insert into public.growth_opportunities(
    organization_id,opportunity_type,score,title,summary,reasons,recommended_action,estimated_value_clp,source_snapshot,last_seen_at,updated_at
  )
  select s.organization_id,'upgrade',
    least(100,30 + least(s.mission_count,25)*2 + least(s.member_count,10)*3),
    'Revisar upgrade a Profesional',
    'La organización muestra un nivel de adopción superior al esperado para su plan actual.',
    jsonb_build_array(
      jsonb_build_object('signal','plan_actual','value',s.plan_key),
      jsonb_build_object('signal','misiones','value',s.mission_count),
      jsonb_build_object('signal','usuarios','value',s.member_count)
    ),
    'Preparar conversación de upgrade con evidencia de uso.',249990,
    to_jsonb(s),now(),now()
  from public.internal_growth_signals s
  where lower(s.plan_key) in ('esencial','sin plan') and (s.mission_count>=10 or s.member_count>=5)
  on conflict (organization_id,opportunity_type) do update set
    score=excluded.score,title=excluded.title,summary=excluded.summary,reasons=excluded.reasons,
    recommended_action=excluded.recommended_action,estimated_value_clp=excluded.estimated_value_clp,
    source_snapshot=excluded.source_snapshot,last_seen_at=now(),updated_at=now()
  where public.growth_opportunities.status not in ('won','dismissed');
  get diagnostics v_count = row_count;

  -- Acompañamiento cuando existe trabajo detenido y baja finalización.
  insert into public.growth_opportunities(
    organization_id,opportunity_type,score,title,summary,reasons,recommended_action,estimated_value_clp,source_snapshot,last_seen_at,updated_at
  )
  select s.organization_id,'assisted',
    least(100,40 + least(s.stalled_missions,8)*7 + case when s.mission_count>0 and s.completed_missions::numeric/s.mission_count<0.35 then 15 else 0 end),
    'Ofrecer acompañamiento operativo',
    'Existen misiones detenidas o una tasa baja de cierre que podría mejorar con acompañamiento humano.',
    jsonb_build_array(
      jsonb_build_object('signal','misiones_detenidas','value',s.stalled_missions),
      jsonb_build_object('signal','misiones_completadas','value',s.completed_missions),
      jsonb_build_object('signal','misiones_totales','value',s.mission_count)
    ),
    'Contactar para revisar bloqueos y proponer Kumplio Acompañado.',699990,
    to_jsonb(s),now(),now()
  from public.internal_growth_signals s
  where s.stalled_missions>=2 or (s.mission_count>=6 and s.completed_missions::numeric/nullif(s.mission_count,0)<0.35)
  on conflict (organization_id,opportunity_type) do update set
    score=excluded.score,title=excluded.title,summary=excluded.summary,reasons=excluded.reasons,
    recommended_action=excluded.recommended_action,estimated_value_clp=excluded.estimated_value_clp,
    source_snapshot=excluded.source_snapshot,last_seen_at=now(),updated_at=now()
  where public.growth_opportunities.status not in ('won','dismissed');

  -- Fullstack: complejidad observable, no probabilidad inventada.
  insert into public.growth_opportunities(
    organization_id,opportunity_type,score,title,summary,reasons,recommended_action,estimated_value_clp,source_snapshot,last_seen_at,updated_at
  )
  select s.organization_id,'fullstack',
    least(100,35 + least(s.member_count,20)*2 + least(s.mission_count,40) + least(s.capability_runs,100)/4),
    'Evaluar solución Fullstack',
    'El volumen de usuarios, misiones y ejecuciones justifica evaluar una plataforma personalizada e integraciones propias.',
    jsonb_build_array(
      jsonb_build_object('signal','usuarios','value',s.member_count),
      jsonb_build_object('signal','misiones','value',s.mission_count),
      jsonb_build_object('signal','ejecuciones_capacidad','value',s.capability_runs)
    ),
    'Preparar diagnóstico y propuesta Fullstack desde $5.000.000 + IVA.',5000000,
    to_jsonb(s),now(),now()
  from public.internal_growth_signals s
  where lower(s.plan_key) not like '%fullstack%' and s.member_count>=8 and s.mission_count>=20 and s.capability_runs>=50
  on conflict (organization_id,opportunity_type) do update set
    score=excluded.score,title=excluded.title,summary=excluded.summary,reasons=excluded.reasons,
    recommended_action=excluded.recommended_action,estimated_value_clp=excluded.estimated_value_clp,
    source_snapshot=excluded.source_snapshot,last_seen_at=now(),updated_at=now()
  where public.growth_opportunities.status not in ('won','dismissed');

  -- Riesgo observable por inactividad, sin afirmar churn predictivo.
  insert into public.growth_opportunities(
    organization_id,opportunity_type,score,title,summary,reasons,recommended_action,estimated_value_clp,source_snapshot,last_seen_at,updated_at
  )
  select s.organization_id,'renewal_risk',
    least(100,35 + least(s.days_since_last_mission,90)),
    'Revisar inactividad del cliente',
    'La organización lleva un periodo relevante sin crear misiones nuevas.',
    jsonb_build_array(
      jsonb_build_object('signal','dias_sin_mision','value',s.days_since_last_mission),
      jsonb_build_object('signal','plan_actual','value',s.plan_key),
      jsonb_build_object('signal','ingreso_mensual_clp','value',s.monthly_revenue_clp)
    ),
    'Contactar para entender la causa de inactividad y recuperar adopción.',s.monthly_revenue_clp,
    to_jsonb(s),now(),now()
  from public.internal_growth_signals s
  where s.monthly_revenue_clp>0 and s.days_since_last_mission>=30
  on conflict (organization_id,opportunity_type) do update set
    score=excluded.score,title=excluded.title,summary=excluded.summary,reasons=excluded.reasons,
    recommended_action=excluded.recommended_action,estimated_value_clp=excluded.estimated_value_clp,
    source_snapshot=excluded.source_snapshot,last_seen_at=now(),updated_at=now()
  where public.growth_opportunities.status not in ('won','dismissed');

  return jsonb_build_object('refreshed_at',now(),'first_upsert_count',v_count);
end;
$$;
revoke all on function public.refresh_growth_opportunities() from public,anon,authenticated;
grant execute on function public.refresh_growth_opportunities() to service_role;

create or replace function public.update_growth_opportunity(
  p_opportunity_id uuid,
  p_status text,
  p_actor uuid,
  p_note text default null
) returns public.growth_opportunities
language plpgsql
security definer
set search_path=''
as $$
declare v_row public.growth_opportunities;
begin
  if not public.is_kumplio_internal_user(p_actor,array['analyst','finance_admin','platform_admin']) then
    raise exception 'internal_access_required';
  end if;
  if p_status not in ('new','reviewing','contacted','won','dismissed') then raise exception 'invalid_status'; end if;
  update public.growth_opportunities set
    status=p_status,
    assigned_to=case when p_status in ('reviewing','contacted') then coalesce(assigned_to,p_actor) else assigned_to end,
    resolved_by=case when p_status in ('won','dismissed') then p_actor else null end,
    resolution_note=case when p_status in ('won','dismissed') then nullif(trim(p_note),'') else resolution_note end,
    resolved_at=case when p_status in ('won','dismissed') then now() else null end,
    updated_at=now()
  where id=p_opportunity_id
  returning * into v_row;
  if v_row.id is null then raise exception 'opportunity_not_found'; end if;
  return v_row;
end;
$$;
revoke all on function public.update_growth_opportunity(uuid,text,uuid,text) from public,anon,authenticated;
grant execute on function public.update_growth_opportunity(uuid,text,uuid,text) to service_role;

commit;
