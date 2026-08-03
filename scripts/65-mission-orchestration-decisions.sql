-- KUMPLIO — MISSION-003: coordinación IA y decisiones humanas
begin;

alter table public.mission_capabilities
  add column if not exists expected_duration_seconds integer
  check (expected_duration_seconds is null or expected_duration_seconds > 0);

create table if not exists public.mission_agents (
  agent_id text primary key,
  display_name text not null unique,
  customer_promise text not null,
  status text not null default 'active' check (status in ('active','paused','retired')),
  sort_order integer not null check (sort_order > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mission_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  result_id uuid references public.mission_results(id) on delete restrict,
  capability_run_id uuid references public.mission_capability_runs(id) on delete restrict,
  title text not null,
  description text,
  recommendation text,
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','changes_requested','cancelled')),
  requested_by_type text not null check (requested_by_type in ('agent','system')),
  requested_by_agent_id text,
  assigned_to uuid references auth.users(id) on delete set null,
  context jsonb not null default '{}'::jsonb,
  evidence_ids uuid[] not null default '{}'::uuid[],
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_notes text,
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (requested_by_type='agent' and requested_by_agent_id is not null)
    or (requested_by_type='system' and requested_by_agent_id is null)
  ),
  check (
    (status='pending' and resolved_by is null and resolved_at is null)
    or (status<>'pending' and resolved_by is not null and resolved_at is not null)
  )
);

create index if not exists mission_decisions_org_pending_idx
  on public.mission_decisions(organization_id,status,priority,requested_at desc);
create index if not exists mission_decisions_mission_idx
  on public.mission_decisions(mission_id,requested_at desc);
create index if not exists mission_decisions_result_idx
  on public.mission_decisions(result_id) where result_id is not null;
create index if not exists mission_decisions_capability_run_idx
  on public.mission_decisions(capability_run_id) where capability_run_id is not null;
create index if not exists mission_decisions_assigned_idx
  on public.mission_decisions(assigned_to,status) where assigned_to is not null;

alter table public.mission_agents enable row level security;
alter table public.mission_decisions enable row level security;

revoke all on public.mission_agents, public.mission_decisions from anon, authenticated;
grant select on public.mission_agents, public.mission_decisions to authenticated;
grant all on public.mission_agents, public.mission_decisions to service_role;

create policy mission_agents_read_active on public.mission_agents
  for select to authenticated using (status='active');
create policy mission_decisions_read_members on public.mission_decisions
  for select to authenticated using (exists (
    select 1 from public.organization_members om
    where om.organization_id=mission_decisions.organization_id
      and om.user_id=(select auth.uid())
  ));

create or replace function public.protect_resolved_mission_decision()
returns trigger language plpgsql security invoker set search_path=''
as $$
begin
  if tg_op='DELETE' then raise exception 'mission_decisions_are_historical'; end if;
  if old.status<>'pending' then raise exception 'resolved_mission_decisions_are_immutable'; end if;
  return new;
end;
$$;

drop trigger if exists mission_decisions_protect_history on public.mission_decisions;
create trigger mission_decisions_protect_history
before update or delete on public.mission_decisions
for each row execute function public.protect_resolved_mission_decision();

insert into public.mission_agents(agent_id,display_name,customer_promise,sort_order)
values
 ('isidora','Isidora','Encuentra las obligaciones aplicables y las deja listas para trabajar.',1),
 ('vera','Vera','Detecta cambios regulatorios relevantes antes de que generen riesgo.',2),
 ('rodrigo','Rodrigo','Prioriza los riesgos y controles que requieren atención.',3),
 ('alejandro','Alejandro','Convierte el análisis en un plan de trabajo ejecutable.',4),
 ('julieta','Julieta','Revisa cada propuesta antes de que una persona decida.',5),
 ('sofia','Sofía','Muestra qué falta para enfrentar una auditoría.',6)
on conflict (agent_id) do update set
 display_name=excluded.display_name,
 customer_promise=excluded.customer_promise,
 sort_order=excluded.sort_order,
 status='active',updated_at=now();

update public.mission_capabilities set expected_duration_seconds=300 where capability_key='detect_obligations';
update public.mission_capabilities set expected_duration_seconds=240 where capability_key='monitor_regulatory_change';
update public.mission_capabilities set expected_duration_seconds=240 where capability_key='prioritize_risk_controls';
update public.mission_capabilities set expected_duration_seconds=180 where capability_key='build_action_plan';
update public.mission_capabilities set expected_duration_seconds=180 where capability_key='review_decision';
update public.mission_capabilities set expected_duration_seconds=420 where capability_key='prepare_audit';

insert into public.agent_capabilities(agent_id,capability_id,priority,status)
select mapping.agent_id,c.id,mapping.priority,'active'
from (values
 ('isidora','detect_obligations',10),
 ('vera','monitor_regulatory_change',10),
 ('rodrigo','prioritize_risk_controls',10),
 ('alejandro','build_action_plan',10),
 ('julieta','review_decision',10),
 ('sofia','prepare_audit',10)
) as mapping(agent_id,capability_key,priority)
join public.mission_capabilities c on c.capability_key=mapping.capability_key
on conflict (agent_id,capability_id) do update set
 priority=excluded.priority,status='active',updated_at=now();

create or replace function public.start_and_assign_mission(
  p_mission_id uuid,
  p_actor_user_id uuid
) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare
  v_mission public.missions;
  v_run record;
  v_agent_id text;
  v_assigned integer:=0;
begin
  select * into v_mission from public.missions m where m.id=p_mission_id for update;
  if v_mission.id is null then raise exception 'mission_not_found'; end if;
  if not exists(select 1 from public.organization_members om where om.organization_id=v_mission.organization_id and om.user_id=p_actor_user_id) then
    raise exception 'actor_not_member';
  end if;
  if v_mission.status not in ('ready','blocked') then raise exception 'mission_cannot_start_from_status_%',v_mission.status; end if;

  for v_run in
    select r.id,r.capability_id,r.status
    from public.mission_capability_runs r
    where r.mission_id=p_mission_id
    order by r.sequence
    for update
  loop
    select ac.agent_id into v_agent_id
    from public.agent_capabilities ac
    join public.mission_agents a on a.agent_id=ac.agent_id and a.status='active'
    where ac.capability_id=v_run.capability_id and ac.status='active'
    order by ac.priority,a.sort_order
    limit 1;
    if v_agent_id is null then raise exception 'no_active_agent_for_capability_%',v_run.capability_id; end if;
    update public.mission_capability_runs
    set assigned_agent_id=v_agent_id,
        status=case when sequence=1 then 'ready' else 'pending' end,
        updated_at=now()
    where id=v_run.id;
    v_assigned:=v_assigned+1;
    insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,from_status,to_status,payload)
    values(v_mission.organization_id,p_mission_id,'capability_assigned','agent',v_agent_id,v_run.status,
      case when (select sequence from public.mission_capability_runs where id=v_run.id)=1 then 'ready' else 'pending' end,
      jsonb_build_object('capabilityRunId',v_run.id));
  end loop;

  update public.missions
  set status='active',started_at=coalesce(started_at,now()),updated_at=now()
  where id=p_mission_id;
  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_user_id,from_status,to_status,payload)
  values(v_mission.organization_id,p_mission_id,'mission_started','user',p_actor_user_id,v_mission.status,'active',jsonb_build_object('assignedCapabilities',v_assigned));
  return jsonb_build_object('missionId',p_mission_id,'status','active','assignedCapabilities',v_assigned);
end;
$$;

create or replace function public.request_mission_decision(
  p_mission_id uuid,
  p_title text,
  p_description text,
  p_recommendation text,
  p_priority text,
  p_requested_by_type text,
  p_requested_by_agent_id text default null,
  p_result_id uuid default null,
  p_capability_run_id uuid default null,
  p_assigned_to uuid default null,
  p_context jsonb default '{}'::jsonb,
  p_evidence_ids uuid[] default '{}'::uuid[]
) returns uuid
language plpgsql security invoker set search_path=''
as $$
declare
 v_mission public.missions;
 v_id uuid;
begin
 select * into v_mission from public.missions where id=p_mission_id;
 if v_mission.id is null then raise exception 'mission_not_found'; end if;
 if p_assigned_to is not null and not exists(select 1 from public.organization_members where organization_id=v_mission.organization_id and user_id=p_assigned_to) then raise exception 'assignee_not_member'; end if;
 if p_result_id is not null and not exists(select 1 from public.mission_results where id=p_result_id and mission_id=p_mission_id) then raise exception 'result_not_in_mission'; end if;
 if p_capability_run_id is not null and not exists(select 1 from public.mission_capability_runs where id=p_capability_run_id and mission_id=p_mission_id) then raise exception 'capability_run_not_in_mission'; end if;
 insert into public.mission_decisions(organization_id,mission_id,result_id,capability_run_id,title,description,recommendation,priority,requested_by_type,requested_by_agent_id,assigned_to,context,evidence_ids)
 values(v_mission.organization_id,p_mission_id,p_result_id,p_capability_run_id,trim(p_title),p_description,p_recommendation,p_priority,p_requested_by_type,p_requested_by_agent_id,p_assigned_to,coalesce(p_context,'{}'),coalesce(p_evidence_ids,'{}'))
 returning id into v_id;
 insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,to_status,payload)
 values(v_mission.organization_id,p_mission_id,'decision_requested',p_requested_by_type,p_requested_by_agent_id,'pending',jsonb_build_object('decisionId',v_id,'priority',p_priority));
 return v_id;
end;
$$;

create or replace function public.resolve_mission_decision(
  p_decision_id uuid,
  p_actor_user_id uuid,
  p_resolution text,
  p_notes text default null
) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare
 v_decision public.mission_decisions;
begin
 if p_resolution not in ('approved','rejected','changes_requested') then raise exception 'invalid_decision_resolution'; end if;
 select * into v_decision from public.mission_decisions where id=p_decision_id for update;
 if v_decision.id is null then raise exception 'decision_not_found'; end if;
 if v_decision.status<>'pending' then raise exception 'decision_already_resolved'; end if;
 if not exists(select 1 from public.organization_members where organization_id=v_decision.organization_id and user_id=p_actor_user_id) then raise exception 'actor_not_member'; end if;
 update public.mission_decisions set status=p_resolution,resolved_by=p_actor_user_id,resolution_notes=p_notes,resolved_at=now() where id=p_decision_id;
 insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_user_id,from_status,to_status,payload)
 values(v_decision.organization_id,v_decision.mission_id,'decision_resolved','user',p_actor_user_id,'pending',p_resolution,jsonb_build_object('decisionId',p_decision_id,'notes',p_notes));
 return jsonb_build_object('decisionId',p_decision_id,'status',p_resolution);
end;
$$;

revoke all on function public.start_and_assign_mission(uuid,uuid) from public,anon,authenticated;
revoke all on function public.request_mission_decision(uuid,text,text,text,text,text,text,uuid,uuid,uuid,jsonb,uuid[]) from public,anon,authenticated;
revoke all on function public.resolve_mission_decision(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.start_and_assign_mission(uuid,uuid) to service_role;
grant execute on function public.request_mission_decision(uuid,text,text,text,text,text,text,uuid,uuid,uuid,jsonb,uuid[]) to service_role;
grant execute on function public.resolve_mission_decision(uuid,uuid,text,text) to service_role;

commit;
