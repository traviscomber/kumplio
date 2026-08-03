-- KUMPLIO — MISSION-004: revisión humana y avance controlado
begin;

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
 v_run public.mission_capability_runs;
 v_next_id uuid;
begin
 if p_resolution not in ('approved','rejected','changes_requested') then raise exception 'invalid_decision_resolution'; end if;
 select * into v_decision from public.mission_decisions where id=p_decision_id for update;
 if v_decision.id is null then raise exception 'decision_not_found'; end if;
 if v_decision.status<>'pending' then raise exception 'decision_already_resolved'; end if;
 if not exists(select 1 from public.organization_members where organization_id=v_decision.organization_id and user_id=p_actor_user_id) then raise exception 'actor_not_member'; end if;

 update public.mission_decisions
 set status=p_resolution,resolved_by=p_actor_user_id,resolution_notes=nullif(trim(p_notes),''),resolved_at=now()
 where id=p_decision_id;

 if v_decision.result_id is not null then
   if p_resolution='approved' then
     update public.mission_results set status='superseded'
     where mission_id=v_decision.mission_id
       and result_type=(select result_type from public.mission_results where id=v_decision.result_id)
       and status='approved' and id<>v_decision.result_id;
     update public.mission_results
     set status='approved',reviewed_by=p_actor_user_id,reviewed_at=now(),review_notes=nullif(trim(p_notes),'')
     where id=v_decision.result_id and status in ('proposed','in_review');
   else
     update public.mission_results
     set status='rejected',reviewed_by=p_actor_user_id,reviewed_at=now(),review_notes=nullif(trim(p_notes),'')
     where id=v_decision.result_id and status in ('proposed','in_review');
   end if;
 end if;

 if v_decision.capability_run_id is not null then
   select * into v_run from public.mission_capability_runs where id=v_decision.capability_run_id for update;
   if p_resolution='approved' then
     update public.mission_capability_runs set status='completed',completed_at=coalesce(completed_at,now()),updated_at=now()
     where id=v_run.id and status='review_required';
     select id into v_next_id from public.mission_capability_runs
     where mission_id=v_run.mission_id and sequence>v_run.sequence and status='pending'
     order by sequence limit 1 for update;
     if v_next_id is not null then
       update public.mission_capability_runs set status='ready',updated_at=now() where id=v_next_id;
     end if;
     insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_user_id,from_status,to_status,payload)
     values(v_decision.organization_id,v_decision.mission_id,'capability_completed','user',p_actor_user_id,'review_required','completed',
       jsonb_build_object('capabilityRunId',v_run.id,'nextCapabilityRunId',v_next_id,'decisionId',p_decision_id));
   elsif p_resolution='changes_requested' then
     update public.mission_capability_runs
     set status='ready',completed_at=null,output_payload=null,updated_at=now()
     where id=v_run.id and status='review_required';
   else
     update public.mission_capability_runs
     set status='blocked',error_code='human_rejected',error_message=coalesce(nullif(trim(p_notes),''),'Resultado rechazado por revisión humana.'),updated_at=now()
     where id=v_run.id and status='review_required';
   end if;
 end if;

 insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_user_id,from_status,to_status,payload)
 values(v_decision.organization_id,v_decision.mission_id,'decision_resolved','user',p_actor_user_id,'pending',p_resolution,
   jsonb_build_object('decisionId',p_decision_id,'resultId',v_decision.result_id,'capabilityRunId',v_decision.capability_run_id,
     'nextCapabilityRunId',v_next_id,'notes',nullif(trim(p_notes),'')));

 return jsonb_build_object('decisionId',p_decision_id,'status',p_resolution,'nextCapabilityRunId',v_next_id);
end;
$$;

revoke all on function public.resolve_mission_decision(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.resolve_mission_decision(uuid,uuid,text,text) to service_role;

commit;
