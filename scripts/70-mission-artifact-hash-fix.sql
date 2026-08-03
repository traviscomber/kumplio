-- KUMPLIO — MISSION-004: hash de artefactos con pgcrypto en extensions
begin;
create or replace function public.complete_mission_capability(
  p_capability_run_id uuid,p_agent_id text,p_artifact_type text,p_artifact_title text,p_artifact_content jsonb,p_source_refs jsonb,p_confidence numeric,
  p_result_type text,p_result_title text,p_result_summary text,p_result_payload jsonb,p_evidence_ids uuid[] default '{}'::uuid[]
) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare
  v_run public.mission_capability_runs; v_cap public.mission_capabilities; v_artifact_id uuid; v_result_id uuid;
  v_artifact_version integer; v_result_version integer; v_lineage uuid; v_next_id uuid; v_decision_id uuid;
begin
  select * into v_run from public.mission_capability_runs where id=p_capability_run_id for update;
  if v_run.id is null then raise exception 'capability_run_not_found'; end if;
  if v_run.status<>'running' then raise exception 'capability_not_running'; end if;
  if v_run.assigned_agent_id<>p_agent_id then raise exception 'agent_not_assigned'; end if;
  select * into v_cap from public.mission_capabilities where id=v_run.capability_id;
  if exists(select 1 from unnest(coalesce(p_evidence_ids,'{}'::uuid[])) e_id where not exists(select 1 from public.evidence e where e.id=e_id and e.organization_id=v_run.organization_id)) then raise exception 'evidence_cross_organization_forbidden'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_run.id::text||':'||lower(trim(p_artifact_type)),94));
  select lineage_id,coalesce(max(version),0)+1 into v_lineage,v_artifact_version
  from public.mission_execution_artifacts where capability_run_id=v_run.id and artifact_type=lower(trim(p_artifact_type))
  group by lineage_id order by max(version) desc limit 1;
  if v_lineage is null then v_lineage:=gen_random_uuid(); v_artifact_version:=1; end if;

  insert into public.mission_execution_artifacts(
    organization_id,mission_id,capability_run_id,lineage_id,artifact_type,title,version,content,source_refs,confidence,content_hash,created_by_agent_id
  ) values (
    v_run.organization_id,v_run.mission_id,v_run.id,v_lineage,lower(trim(p_artifact_type)),trim(p_artifact_title),v_artifact_version,
    coalesce(p_artifact_content,'{}'),coalesce(p_source_refs,'[]'),p_confidence,
    encode(extensions.digest(coalesce(p_artifact_content,'{}')::text,'sha256'),'hex'),p_agent_id
  ) returning id into v_artifact_id;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_run.mission_id::text||':'||lower(trim(p_result_type)),95));
  select coalesce(max(version),0)+1 into v_result_version from public.mission_results where mission_id=v_run.mission_id and result_type=lower(trim(p_result_type));
  insert into public.mission_results(organization_id,mission_id,result_type,version,status,title,summary,payload,evidence_ids,created_by_type,created_by_agent_id)
  values(v_run.organization_id,v_run.mission_id,lower(trim(p_result_type)),v_result_version,
    case when v_cap.review_required then 'in_review' else 'proposed' end,trim(p_result_title),p_result_summary,
    coalesce(p_result_payload,'{}'),coalesce(p_evidence_ids,'{}'),'agent',p_agent_id)
  returning id into v_result_id;

  update public.mission_capability_runs
  set status=case when v_cap.review_required then 'review_required' else 'completed' end,
      output_payload=jsonb_build_object('artifactId',v_artifact_id,'resultId',v_result_id),completed_at=now(),updated_at=now()
  where id=v_run.id;

  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,from_status,to_status,payload)
  values(v_run.organization_id,v_run.mission_id,'artifact_created','agent',p_agent_id,'running','created',jsonb_build_object('artifactId',v_artifact_id,'capabilityRunId',v_run.id,'version',v_artifact_version));
  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,to_status,payload)
  values(v_run.organization_id,v_run.mission_id,'mission_result_recorded','agent',p_agent_id,case when v_cap.review_required then 'in_review' else 'proposed' end,jsonb_build_object('resultId',v_result_id,'capabilityRunId',v_run.id,'version',v_result_version));

  if v_cap.review_required then
    insert into public.mission_decisions(organization_id,mission_id,result_id,capability_run_id,title,description,recommendation,priority,requested_by_type,requested_by_agent_id,context,evidence_ids)
    values(v_run.organization_id,v_run.mission_id,v_result_id,v_run.id,'Revisar resultado de '||v_cap.name,
      'Julieta solicita una decisión humana antes de incorporar este resultado al avance de la misión.',
      'Revisar fuentes, evidencia y alcance antes de aprobar.','high','agent','julieta',
      jsonb_build_object('artifactId',v_artifact_id,'resultVersion',v_result_version),coalesce(p_evidence_ids,'{}'))
    returning id into v_decision_id;
    insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,to_status,payload)
    values(v_run.organization_id,v_run.mission_id,'decision_requested','agent','julieta','pending',jsonb_build_object('decisionId',v_decision_id,'resultId',v_result_id,'capabilityRunId',v_run.id));
  else
    select id into v_next_id from public.mission_capability_runs where mission_id=v_run.mission_id and sequence>v_run.sequence and status='pending' order by sequence limit 1 for update;
    if v_next_id is not null then update public.mission_capability_runs set status='ready',updated_at=now() where id=v_next_id; end if;
    insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,from_status,to_status,payload)
    values(v_run.organization_id,v_run.mission_id,'capability_completed','agent',p_agent_id,'running','completed',jsonb_build_object('capabilityRunId',v_run.id,'nextCapabilityRunId',v_next_id));
  end if;

  return jsonb_build_object('capabilityRunId',v_run.id,'artifactId',v_artifact_id,'resultId',v_result_id,
    'status',case when v_cap.review_required then 'review_required' else 'completed' end,
    'decisionId',v_decision_id,'nextCapabilityRunId',v_next_id);
end;
$$;
revoke all on function public.complete_mission_capability(uuid,text,text,text,jsonb,jsonb,numeric,text,text,text,jsonb,uuid[]) from public,anon,authenticated;
grant execute on function public.complete_mission_capability(uuid,text,text,text,jsonb,jsonb,numeric,text,text,text,jsonb,uuid[]) to service_role;
commit;
