-- KUMPLIO — Servicios transaccionales del Motor de Misiones
begin;

create or replace function public.create_mission_from_playbook(
  p_organization_id uuid,
  p_playbook_id uuid,
  p_created_by uuid,
  p_title text,
  p_objective text default null,
  p_case_id uuid default null,
  p_priority text default 'medium',
  p_owner_id uuid default null,
  p_due_at timestamptz default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql security invoker set search_path=''
as $$
declare
  v_playbook public.mission_playbooks;
  v_case public.compliance_cases;
  v_mission_id uuid;
  v_row record;
begin
  if not exists(select 1 from public.organizations o where o.id=p_organization_id) then
    raise exception 'organization_not_found';
  end if;
  if not exists(select 1 from public.organization_members m where m.organization_id=p_organization_id and m.user_id=p_created_by) then
    raise exception 'creator_not_member';
  end if;
  if p_owner_id is not null and not exists(
    select 1 from public.organization_members m where m.organization_id=p_organization_id and m.user_id=p_owner_id
  ) then raise exception 'owner_not_member'; end if;

  select * into v_playbook from public.mission_playbooks p
  where p.id=p_playbook_id and p.status='published';
  if v_playbook.id is null then raise exception 'published_playbook_not_found'; end if;

  if p_case_id is not null then
    select * into v_case from public.compliance_cases c where c.id=p_case_id;
    if v_case.id is null then raise exception 'case_not_found'; end if;
    if v_case.organization_id<>p_organization_id then raise exception 'case_cross_organization_forbidden'; end if;
    if exists(select 1 from public.missions m where m.case_id=p_case_id) then raise exception 'case_already_has_mission'; end if;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_organization_id::text||':'||p_playbook_id::text||':'||coalesce(p_case_id::text,lower(trim(p_title))),91));

  insert into public.missions(
    organization_id,case_id,playbook_id,title,objective,status,priority,owner_id,created_by,due_at,metadata
  ) values (
    p_organization_id,p_case_id,p_playbook_id,trim(p_title),coalesce(nullif(trim(p_objective),''),v_playbook.objective),
    'ready',p_priority,p_owner_id,p_created_by,p_due_at,coalesce(p_metadata,'{}'::jsonb)
  ) returning id into v_mission_id;

  for v_row in
    select pc.id as playbook_capability_id,pc.capability_id,pc.sequence,pc.configuration,c.review_required
    from public.mission_playbook_capabilities pc
    join public.mission_capabilities c on c.id=pc.capability_id
    where pc.playbook_id=p_playbook_id
    order by pc.sequence
  loop
    insert into public.mission_capability_runs(
      organization_id,mission_id,playbook_capability_id,capability_id,sequence,status,input_payload
    ) values (
      p_organization_id,v_mission_id,v_row.playbook_capability_id,v_row.capability_id,v_row.sequence,
      case when v_row.sequence=1 then 'ready' else 'pending' end,
      jsonb_build_object('configuration',v_row.configuration,'reviewRequired',v_row.review_required)
    );
  end loop;

  insert into public.mission_events(
    organization_id,mission_id,event_type,actor_type,actor_user_id,to_status,payload
  ) values (
    p_organization_id,v_mission_id,'mission_created','user',p_created_by,'ready',
    jsonb_build_object('playbookId',p_playbook_id,'caseId',p_case_id,'capabilityCount',(
      select count(*) from public.mission_capability_runs r where r.mission_id=v_mission_id
    ))
  );

  return v_mission_id;
end;
$$;

create or replace function public.start_mission(
  p_mission_id uuid,
  p_actor_user_id uuid
) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare
  v_mission public.missions;
  v_first uuid;
begin
  select * into v_mission from public.missions m where m.id=p_mission_id for update;
  if v_mission.id is null then raise exception 'mission_not_found'; end if;
  if not exists(select 1 from public.organization_members om where om.organization_id=v_mission.organization_id and om.user_id=p_actor_user_id) then
    raise exception 'actor_not_member';
  end if;
  if v_mission.status not in ('ready','blocked') then raise exception 'mission_cannot_start_from_status_%',v_mission.status; end if;
  if not exists(select 1 from public.mission_capability_runs r where r.mission_id=p_mission_id) then
    raise exception 'mission_has_no_capabilities';
  end if;

  update public.missions set status='active',started_at=coalesce(started_at,now()),updated_at=now()
  where id=p_mission_id;

  select r.id into v_first from public.mission_capability_runs r
  where r.mission_id=p_mission_id and r.sequence=(select min(sequence) from public.mission_capability_runs where mission_id=p_mission_id)
  for update;
  update public.mission_capability_runs set status='ready',updated_at=now() where id=v_first and status='pending';

  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_user_id,from_status,to_status,payload)
  values(v_mission.organization_id,p_mission_id,'mission_started','user',p_actor_user_id,v_mission.status,'active','{}'::jsonb);

  return jsonb_build_object('missionId',p_mission_id,'status','active','firstCapabilityRunId',v_first);
end;
$$;

create or replace function public.assign_mission_capability(
  p_capability_run_id uuid,
  p_agent_id text
) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare
  v_run public.mission_capability_runs;
  v_mission public.missions;
begin
  select * into v_run from public.mission_capability_runs r where r.id=p_capability_run_id for update;
  if v_run.id is null then raise exception 'capability_run_not_found'; end if;
  select * into v_mission from public.missions m where m.id=v_run.mission_id;
  if v_run.status not in ('pending','ready','blocked','failed') then raise exception 'capability_run_cannot_be_assigned'; end if;
  if not exists(select 1 from public.agent_capabilities ac where ac.agent_id=p_agent_id and ac.capability_id=v_run.capability_id and ac.status='active') then
    raise exception 'agent_does_not_provide_capability';
  end if;

  update public.mission_capability_runs
  set assigned_agent_id=p_agent_id,status='ready',updated_at=now()
  where id=p_capability_run_id;

  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,from_status,to_status,payload)
  values(v_run.organization_id,v_run.mission_id,'capability_assigned','agent',p_agent_id,v_run.status,'ready',jsonb_build_object('capabilityRunId',p_capability_run_id));

  return jsonb_build_object('capabilityRunId',p_capability_run_id,'agentId',p_agent_id,'status','ready');
end;
$$;

create or replace function public.record_mission_result(
  p_mission_id uuid,
  p_result_type text,
  p_title text,
  p_summary text,
  p_payload jsonb,
  p_evidence_ids uuid[],
  p_source_artifact_id uuid,
  p_created_by_type text,
  p_created_by_user_id uuid default null,
  p_created_by_agent_id text default null
) returns uuid
language plpgsql security invoker set search_path=''
as $$
declare
  v_mission public.missions;
  v_version integer;
  v_result_id uuid;
begin
  select * into v_mission from public.missions m where m.id=p_mission_id;
  if v_mission.id is null then raise exception 'mission_not_found'; end if;
  if p_created_by_type='user' and not exists(
    select 1 from public.organization_members om where om.organization_id=v_mission.organization_id and om.user_id=p_created_by_user_id
  ) then raise exception 'result_creator_not_member'; end if;
  if p_source_artifact_id is not null and not exists(
    select 1 from public.agent_artifacts a where a.id=p_source_artifact_id and a.organization_id=v_mission.organization_id
  ) then raise exception 'artifact_cross_organization_forbidden'; end if;
  if exists(
    select 1 from unnest(coalesce(p_evidence_ids,'{}'::uuid[])) e_id
    where not exists(select 1 from public.evidence e where e.id=e_id and e.organization_id=v_mission.organization_id)
  ) then raise exception 'evidence_cross_organization_forbidden'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_mission_id::text||':'||lower(trim(p_result_type)),92));
  select coalesce(max(r.version),0)+1 into v_version
  from public.mission_results r where r.mission_id=p_mission_id and r.result_type=lower(trim(p_result_type));

  insert into public.mission_results(
    organization_id,mission_id,result_type,version,status,title,summary,payload,evidence_ids,source_artifact_id,
    created_by_type,created_by_user_id,created_by_agent_id
  ) values (
    v_mission.organization_id,p_mission_id,lower(trim(p_result_type)),v_version,'proposed',trim(p_title),p_summary,
    coalesce(p_payload,'{}'::jsonb),coalesce(p_evidence_ids,'{}'::uuid[]),p_source_artifact_id,
    p_created_by_type,p_created_by_user_id,p_created_by_agent_id
  ) returning id into v_result_id;

  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_user_id,actor_agent_id,to_status,payload)
  values(v_mission.organization_id,p_mission_id,'mission_result_recorded',p_created_by_type,p_created_by_user_id,p_created_by_agent_id,'proposed',
    jsonb_build_object('resultId',v_result_id,'resultType',lower(trim(p_result_type)),'version',v_version));

  return v_result_id;
end;
$$;

create or replace function public.review_mission_result(
  p_result_id uuid,
  p_reviewer_id uuid,
  p_decision text,
  p_notes text default null
) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare
  v_result public.mission_results;
  v_mission public.missions;
  v_status text;
begin
  if p_decision not in ('approved','rejected') then raise exception 'invalid_review_decision'; end if;
  select * into v_result from public.mission_results r where r.id=p_result_id for update;
  if v_result.id is null then raise exception 'mission_result_not_found'; end if;
  select * into v_mission from public.missions m where m.id=v_result.mission_id;
  if not exists(select 1 from public.organization_members om where om.organization_id=v_result.organization_id and om.user_id=p_reviewer_id) then
    raise exception 'reviewer_not_member';
  end if;
  if v_result.status not in ('proposed','in_review') then raise exception 'result_cannot_be_reviewed'; end if;
  v_status:=p_decision;

  if p_decision='approved' then
    update public.mission_results
    set status='superseded'
    where mission_id=v_result.mission_id and result_type=v_result.result_type and status='approved' and id<>v_result.id;
  end if;

  update public.mission_results
  set status=v_status,reviewed_by=p_reviewer_id,reviewed_at=now(),review_notes=p_notes
  where id=p_result_id;

  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_user_id,from_status,to_status,payload)
  values(v_result.organization_id,v_result.mission_id,'mission_result_reviewed','user',p_reviewer_id,v_result.status,v_status,
    jsonb_build_object('resultId',p_result_id,'resultType',v_result.result_type,'version',v_result.version,'notes',p_notes));

  return jsonb_build_object('resultId',p_result_id,'status',v_status);
end;
$$;

revoke all on function public.create_mission_from_playbook(uuid,uuid,uuid,text,text,uuid,text,uuid,timestamptz,jsonb) from public, anon, authenticated;
revoke all on function public.start_mission(uuid,uuid) from public, anon, authenticated;
revoke all on function public.assign_mission_capability(uuid,text) from public, anon, authenticated;
revoke all on function public.record_mission_result(uuid,text,text,text,jsonb,uuid[],uuid,text,uuid,text) from public, anon, authenticated;
revoke all on function public.review_mission_result(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.create_mission_from_playbook(uuid,uuid,uuid,text,text,uuid,text,uuid,timestamptz,jsonb) to service_role;
grant execute on function public.start_mission(uuid,uuid) to service_role;
grant execute on function public.assign_mission_capability(uuid,text) to service_role;
grant execute on function public.record_mission_result(uuid,text,text,text,jsonb,uuid[],uuid,text,uuid,text) to service_role;
grant execute on function public.review_mission_result(uuid,uuid,text,text) to service_role;

commit;
