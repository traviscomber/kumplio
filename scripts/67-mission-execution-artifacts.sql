-- KUMPLIO — MISSION-004: ejecución de capacidades, artefactos y resultados
begin;

create table if not exists public.mission_execution_artifacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  capability_run_id uuid not null references public.mission_capability_runs(id) on delete restrict,
  lineage_id uuid not null default gen_random_uuid(),
  parent_artifact_id uuid references public.mission_execution_artifacts(id) on delete restrict,
  artifact_type text not null,
  title text not null,
  version integer not null check (version > 0),
  content jsonb not null default '{}'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  content_hash text not null,
  created_by_agent_id text not null references public.mission_agents(agent_id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(lineage_id,version),
  unique(capability_run_id,artifact_type,version)
);

create index if not exists mission_execution_artifacts_mission_idx
  on public.mission_execution_artifacts(mission_id,created_at desc);
create index if not exists mission_execution_artifacts_run_idx
  on public.mission_execution_artifacts(capability_run_id,created_at desc);
create index if not exists mission_execution_artifacts_parent_idx
  on public.mission_execution_artifacts(parent_artifact_id) where parent_artifact_id is not null;
create index if not exists mission_execution_artifacts_agent_idx
  on public.mission_execution_artifacts(created_by_agent_id,created_at desc);

alter table public.mission_execution_artifacts enable row level security;
revoke all on public.mission_execution_artifacts from anon,authenticated;
grant select on public.mission_execution_artifacts to authenticated;
grant all on public.mission_execution_artifacts to service_role;

create policy mission_execution_artifacts_read_members on public.mission_execution_artifacts
for select to authenticated using (exists (
  select 1 from public.organization_members om
  where om.organization_id=mission_execution_artifacts.organization_id
    and om.user_id=(select auth.uid())
));

create or replace function public.prevent_mission_artifact_mutation()
returns trigger language plpgsql security invoker set search_path=''
as $$ begin raise exception 'mission_execution_artifacts_are_immutable'; end; $$;

drop trigger if exists mission_execution_artifacts_immutable on public.mission_execution_artifacts;
create trigger mission_execution_artifacts_immutable
before update or delete on public.mission_execution_artifacts
for each row execute function public.prevent_mission_artifact_mutation();

create or replace function public.start_mission_capability(
  p_capability_run_id uuid,
  p_actor_user_id uuid
) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare
  v_run public.mission_capability_runs;
  v_mission public.missions;
begin
  select * into v_run from public.mission_capability_runs where id=p_capability_run_id for update;
  if v_run.id is null then raise exception 'capability_run_not_found'; end if;
  select * into v_mission from public.missions where id=v_run.mission_id for update;
  if v_mission.status<>'active' then raise exception 'mission_not_active'; end if;
  if not exists(select 1 from public.organization_members where organization_id=v_run.organization_id and user_id=p_actor_user_id) then raise exception 'actor_not_member'; end if;
  if v_run.status not in ('ready','failed') then raise exception 'capability_cannot_start_from_%',v_run.status; end if;
  if v_run.assigned_agent_id is null then raise exception 'capability_has_no_agent'; end if;
  if exists(select 1 from public.mission_capability_runs r where r.mission_id=v_run.mission_id and r.sequence<v_run.sequence and r.status<>'completed') then raise exception 'previous_capabilities_incomplete'; end if;

  update public.mission_capability_runs
  set status='running',attempt_count=attempt_count+1,started_at=now(),completed_at=null,
      error_code=null,error_message=null,updated_at=now()
  where id=v_run.id;
  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_user_id,actor_agent_id,from_status,to_status,payload)
  values(v_run.organization_id,v_run.mission_id,'capability_started','user',p_actor_user_id,v_run.assigned_agent_id,v_run.status,'running',
    jsonb_build_object('capabilityRunId',v_run.id,'attempt',v_run.attempt_count+1));
  return jsonb_build_object('capabilityRunId',v_run.id,'status','running','agentId',v_run.assigned_agent_id);
end;
$$;

create or replace function public.complete_mission_capability(
  p_capability_run_id uuid,
  p_agent_id text,
  p_artifact_type text,
  p_artifact_title text,
  p_artifact_content jsonb,
  p_source_refs jsonb,
  p_confidence numeric,
  p_result_type text,
  p_result_title text,
  p_result_summary text,
  p_result_payload jsonb,
  p_evidence_ids uuid[] default '{}'::uuid[]
) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare
  v_run public.mission_capability_runs;
  v_cap public.mission_capabilities;
  v_artifact_id uuid;
  v_result_id uuid;
  v_artifact_version integer;
  v_result_version integer;
  v_lineage uuid;
  v_next_id uuid;
  v_decision_id uuid;
begin
  select * into v_run from public.mission_capability_runs where id=p_capability_run_id for update;
  if v_run.id is null then raise exception 'capability_run_not_found'; end if;
  if v_run.status<>'running' then raise exception 'capability_not_running'; end if;
  if v_run.assigned_agent_id<>p_agent_id then raise exception 'agent_not_assigned'; end if;
  select * into v_cap from public.mission_capabilities where id=v_run.capability_id;
  if exists(select 1 from unnest(coalesce(p_evidence_ids,'{}'::uuid[])) e_id where not exists(
    select 1 from public.evidence e where e.id=e_id and e.organization_id=v_run.organization_id
  )) then raise exception 'evidence_cross_organization_forbidden'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_run.id::text||':'||lower(trim(p_artifact_type)),94));
  select lineage_id,coalesce(max(version),0)+1 into v_lineage,v_artifact_version
  from public.mission_execution_artifacts
  where capability_run_id=v_run.id and artifact_type=lower(trim(p_artifact_type))
  group by lineage_id order by max(version) desc limit 1;
  if v_lineage is null then v_lineage:=gen_random_uuid(); v_artifact_version:=1; end if;

  insert into public.mission_execution_artifacts(
    organization_id,mission_id,capability_run_id,lineage_id,artifact_type,title,version,content,source_refs,confidence,content_hash,created_by_agent_id
  ) values (
    v_run.organization_id,v_run.mission_id,v_run.id,v_lineage,lower(trim(p_artifact_type)),trim(p_artifact_title),v_artifact_version,
    coalesce(p_artifact_content,'{}'),coalesce(p_source_refs,'[]'),p_confidence,
    encode(digest(coalesce(p_artifact_content,'{}')::text,'sha256'),'hex'),p_agent_id
  ) returning id into v_artifact_id;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_run.mission_id::text||':'||lower(trim(p_result_type)),95));
  select coalesce(max(version),0)+1 into v_result_version from public.mission_results
  where mission_id=v_run.mission_id and result_type=lower(trim(p_result_type));
  insert into public.mission_results(
    organization_id,mission_id,result_type,version,status,title,summary,payload,evidence_ids,
    created_by_type,created_by_agent_id
  ) values (
    v_run.organization_id,v_run.mission_id,lower(trim(p_result_type)),v_result_version,
    case when v_cap.review_required then 'in_review' else 'proposed' end,
    trim(p_result_title),p_result_summary,coalesce(p_result_payload,'{}'),coalesce(p_evidence_ids,'{}'),'agent',p_agent_id
  ) returning id into v_result_id;

  update public.mission_capability_runs
  set status=case when v_cap.review_required then 'review_required' else 'completed' end,
      output_payload=jsonb_build_object('artifactId',v_artifact_id,'resultId',v_result_id),completed_at=now(),updated_at=now()
  where id=v_run.id;

  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,from_status,to_status,payload)
  values(v_run.organization_id,v_run.mission_id,'artifact_created','agent',p_agent_id,'running','created',
    jsonb_build_object('artifactId',v_artifact_id,'capabilityRunId',v_run.id,'version',v_artifact_version));
  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,from_status,to_status,payload)
  values(v_run.organization_id,v_run.mission_id,'mission_result_recorded','agent',p_agent_id,null,
    case when v_cap.review_required then 'in_review' else 'proposed' end,
    jsonb_build_object('resultId',v_result_id,'capabilityRunId',v_run.id,'version',v_result_version));

  if v_cap.review_required then
    insert into public.mission_decisions(
      organization_id,mission_id,result_id,capability_run_id,title,description,recommendation,priority,
      requested_by_type,requested_by_agent_id,context,evidence_ids
    ) values (
      v_run.organization_id,v_run.mission_id,v_result_id,v_run.id,'Revisar resultado de '||v_cap.name,
      'Julieta solicita una decisión humana antes de incorporar este resultado al avance de la misión.',
      'Revisar fuentes, evidencia y alcance antes de aprobar.','high','agent','julieta',
      jsonb_build_object('artifactId',v_artifact_id,'resultVersion',v_result_version),coalesce(p_evidence_ids,'{}')
    ) returning id into v_decision_id;
    insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,to_status,payload)
    values(v_run.organization_id,v_run.mission_id,'decision_requested','agent','julieta','pending',
      jsonb_build_object('decisionId',v_decision_id,'resultId',v_result_id,'capabilityRunId',v_run.id));
  else
    select id into v_next_id from public.mission_capability_runs
    where mission_id=v_run.mission_id and sequence>v_run.sequence and status='pending'
    order by sequence limit 1 for update;
    if v_next_id is not null then update public.mission_capability_runs set status='ready',updated_at=now() where id=v_next_id; end if;
    insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,from_status,to_status,payload)
    values(v_run.organization_id,v_run.mission_id,'capability_completed','agent',p_agent_id,'running','completed',
      jsonb_build_object('capabilityRunId',v_run.id,'nextCapabilityRunId',v_next_id));
  end if;

  return jsonb_build_object('capabilityRunId',v_run.id,'artifactId',v_artifact_id,'resultId',v_result_id,
    'status',case when v_cap.review_required then 'review_required' else 'completed' end,'decisionId',v_decision_id,'nextCapabilityRunId',v_next_id);
end;
$$;

create or replace function public.fail_mission_capability(
  p_capability_run_id uuid,
  p_agent_id text,
  p_error_code text,
  p_error_message text
) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare v_run public.mission_capability_runs;
begin
  select * into v_run from public.mission_capability_runs where id=p_capability_run_id for update;
  if v_run.id is null then raise exception 'capability_run_not_found'; end if;
  if v_run.status<>'running' then raise exception 'capability_not_running'; end if;
  if v_run.assigned_agent_id<>p_agent_id then raise exception 'agent_not_assigned'; end if;
  update public.mission_capability_runs set status='failed',error_code=trim(p_error_code),error_message=trim(p_error_message),updated_at=now() where id=v_run.id;
  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,from_status,to_status,payload)
  values(v_run.organization_id,v_run.mission_id,'capability_failed','agent',p_agent_id,'running','failed',
    jsonb_build_object('capabilityRunId',v_run.id,'errorCode',trim(p_error_code)));
  return jsonb_build_object('capabilityRunId',v_run.id,'status','failed');
end;
$$;

revoke all on function public.start_mission_capability(uuid,uuid) from public,anon,authenticated;
revoke all on function public.complete_mission_capability(uuid,text,text,text,jsonb,jsonb,numeric,text,text,text,jsonb,uuid[]) from public,anon,authenticated;
revoke all on function public.fail_mission_capability(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.start_mission_capability(uuid,uuid) to service_role;
grant execute on function public.complete_mission_capability(uuid,text,text,text,jsonb,jsonb,numeric,text,text,text,jsonb,uuid[]) to service_role;
grant execute on function public.fail_mission_capability(uuid,text,text,text) to service_role;

commit;
