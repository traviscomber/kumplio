-- KUMPLIO — MISSION-004: actor válido al iniciar capacidad
begin;
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

  insert into public.mission_events(
    organization_id,mission_id,event_type,actor_type,actor_user_id,from_status,to_status,payload
  ) values (
    v_run.organization_id,v_run.mission_id,'capability_started','user',p_actor_user_id,v_run.status,'running',
    jsonb_build_object('capabilityRunId',v_run.id,'attempt',v_run.attempt_count+1,'assignedAgentId',v_run.assigned_agent_id)
  );

  return jsonb_build_object('capabilityRunId',v_run.id,'status','running','agentId',v_run.assigned_agent_id);
end;
$$;
revoke all on function public.start_mission_capability(uuid,uuid) from public,anon,authenticated;
grant execute on function public.start_mission_capability(uuid,uuid) to service_role;
commit;
