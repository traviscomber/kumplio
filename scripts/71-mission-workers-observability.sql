-- KUMPLIO — MISSION-005: cola durable, workers y observabilidad
begin;

create table if not exists public.mission_worker_profiles (
  worker_id text primary key,
  agent_id text not null references public.mission_agents(agent_id) on delete restrict,
  display_name text not null,
  runtime_key text not null unique,
  provider text,
  default_model text,
  max_concurrency integer not null default 1 check (max_concurrency between 1 and 20),
  default_lease_seconds integer not null default 300 check (default_lease_seconds between 30 and 3600),
  quality_threshold numeric not null default 0.75 check (quality_threshold between 0 and 1),
  status text not null default 'active' check (status in ('active','paused','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mission_worker_tools (
  worker_id text not null references public.mission_worker_profiles(worker_id) on delete cascade,
  tool_key text not null,
  permission text not null default 'execute' check (permission in ('read','execute')),
  enabled boolean not null default true,
  constraints jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key(worker_id,tool_key)
);

create table if not exists public.mission_worker_sources (
  worker_id text not null references public.mission_worker_profiles(worker_id) on delete cascade,
  source_key text not null,
  source_kind text not null check (source_kind in ('official','organization','knowledge','external')),
  allowed_domains text[] not null default '{}'::text[],
  requires_citation boolean not null default true,
  enabled boolean not null default true,
  constraints jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key(worker_id,source_key)
);

create table if not exists public.mission_execution_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  capability_run_id uuid not null references public.mission_capability_runs(id) on delete restrict,
  worker_id text not null references public.mission_worker_profiles(worker_id) on delete restrict,
  status text not null default 'queued' check (status in ('queued','running','retry_scheduled','completed','failed','cancelled')),
  priority integer not null default 100,
  attempt integer not null default 0 check (attempt >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  available_at timestamptz not null default now(),
  claimed_at timestamptz,
  lease_expires_at timestamptz,
  lease_token uuid,
  heartbeat_at timestamptz,
  completed_at timestamptz,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb,
  error_code text,
  error_message text,
  total_input_tokens bigint not null default 0 check (total_input_tokens >= 0),
  total_output_tokens bigint not null default 0 check (total_output_tokens >= 0),
  total_cost_microusd bigint not null default 0 check (total_cost_microusd >= 0),
  total_latency_ms bigint not null default 0 check (total_latency_ms >= 0),
  quality_score numeric check (quality_score is null or quality_score between 0 and 1),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists mission_execution_jobs_one_open_run_idx
  on public.mission_execution_jobs(capability_run_id)
  where status in ('queued','running','retry_scheduled');
create index if not exists mission_execution_jobs_claim_idx
  on public.mission_execution_jobs(worker_id,status,available_at,priority,created_at);
create index if not exists mission_execution_jobs_mission_idx
  on public.mission_execution_jobs(mission_id,created_at desc);
create index if not exists mission_execution_jobs_lease_idx
  on public.mission_execution_jobs(lease_expires_at)
  where status='running';
create index if not exists mission_execution_jobs_created_by_idx
  on public.mission_execution_jobs(created_by) where created_by is not null;

create table if not exists public.mission_model_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  job_id uuid not null references public.mission_execution_jobs(id) on delete cascade,
  provider text not null,
  model text not null,
  operation text not null,
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  cached_input_tokens bigint not null default 0 check (cached_input_tokens >= 0),
  reasoning_tokens bigint not null default 0 check (reasoning_tokens >= 0),
  latency_ms bigint not null check (latency_ms >= 0),
  cost_microusd bigint not null default 0 check (cost_microusd >= 0),
  currency text not null default 'USD' check (currency='USD'),
  request_id text,
  finish_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists mission_model_runs_job_idx on public.mission_model_runs(job_id,created_at);
create index if not exists mission_model_runs_mission_idx on public.mission_model_runs(mission_id,created_at desc);

create table if not exists public.mission_tool_calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  job_id uuid not null references public.mission_execution_jobs(id) on delete cascade,
  tool_key text not null,
  source_key text,
  status text not null check (status in ('succeeded','failed','blocked')),
  latency_ms bigint not null default 0 check (latency_ms >= 0),
  input_summary jsonb not null default '{}'::jsonb,
  output_summary jsonb not null default '{}'::jsonb,
  citation_refs jsonb not null default '[]'::jsonb,
  error_code text,
  created_at timestamptz not null default now()
);
create index if not exists mission_tool_calls_job_idx on public.mission_tool_calls(job_id,created_at);
create index if not exists mission_tool_calls_mission_idx on public.mission_tool_calls(mission_id,created_at desc);

create table if not exists public.mission_quality_evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  job_id uuid not null references public.mission_execution_jobs(id) on delete cascade,
  evaluator_agent_id text not null references public.mission_agents(agent_id) on delete restrict,
  rubric_version text not null,
  score numeric not null check (score between 0 and 1),
  passed boolean not null,
  dimensions jsonb not null default '{}'::jsonb,
  findings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(job_id,rubric_version,evaluator_agent_id)
);
create index if not exists mission_quality_evaluations_mission_idx
  on public.mission_quality_evaluations(mission_id,created_at desc);
create index if not exists mission_quality_evaluations_evaluator_idx
  on public.mission_quality_evaluations(evaluator_agent_id,created_at desc);

alter table public.mission_worker_profiles enable row level security;
alter table public.mission_worker_tools enable row level security;
alter table public.mission_worker_sources enable row level security;
alter table public.mission_execution_jobs enable row level security;
alter table public.mission_model_runs enable row level security;
alter table public.mission_tool_calls enable row level security;
alter table public.mission_quality_evaluations enable row level security;

revoke all on public.mission_worker_profiles,public.mission_worker_tools,public.mission_worker_sources,
  public.mission_execution_jobs,public.mission_model_runs,public.mission_tool_calls,public.mission_quality_evaluations
  from anon,authenticated;
grant select on public.mission_worker_profiles,public.mission_worker_tools,public.mission_worker_sources,
  public.mission_execution_jobs,public.mission_model_runs,public.mission_tool_calls,public.mission_quality_evaluations
  to authenticated;
grant all on public.mission_worker_profiles,public.mission_worker_tools,public.mission_worker_sources,
  public.mission_execution_jobs,public.mission_model_runs,public.mission_tool_calls,public.mission_quality_evaluations
  to service_role;

create policy mission_worker_profiles_read on public.mission_worker_profiles
  for select to authenticated using (status='active');
create policy mission_worker_tools_read on public.mission_worker_tools
  for select to authenticated using (enabled and exists(select 1 from public.mission_worker_profiles p where p.worker_id=mission_worker_tools.worker_id and p.status='active'));
create policy mission_worker_sources_read on public.mission_worker_sources
  for select to authenticated using (enabled and exists(select 1 from public.mission_worker_profiles p where p.worker_id=mission_worker_sources.worker_id and p.status='active'));

create policy mission_execution_jobs_read_members on public.mission_execution_jobs
  for select to authenticated using (exists(select 1 from public.organization_members om where om.organization_id=mission_execution_jobs.organization_id and om.user_id=(select auth.uid())));
create policy mission_model_runs_read_members on public.mission_model_runs
  for select to authenticated using (exists(select 1 from public.organization_members om where om.organization_id=mission_model_runs.organization_id and om.user_id=(select auth.uid())));
create policy mission_tool_calls_read_members on public.mission_tool_calls
  for select to authenticated using (exists(select 1 from public.organization_members om where om.organization_id=mission_tool_calls.organization_id and om.user_id=(select auth.uid())));
create policy mission_quality_evaluations_read_members on public.mission_quality_evaluations
  for select to authenticated using (exists(select 1 from public.organization_members om where om.organization_id=mission_quality_evaluations.organization_id and om.user_id=(select auth.uid())));

insert into public.mission_worker_profiles(worker_id,agent_id,display_name,runtime_key,provider,default_model,max_concurrency,quality_threshold)
values
 ('worker-isidora','isidora','Worker de Isidora','isidora-regulatory','openai','gpt-5-mini',2,0.82),
 ('worker-rodrigo','rodrigo','Worker de Rodrigo','rodrigo-risk','openai','gpt-5-mini',2,0.80),
 ('worker-javier','javier','Worker de Javier','javier-controls','openai','gpt-5-mini',2,0.80),
 ('worker-beatriz','beatriz','Worker de Beatriz','beatriz-evidence','openai','gpt-5-mini',2,0.82),
 ('worker-veronica','veronica','Worker de Verónica','veronica-monitoring','openai','gpt-5-mini',2,0.82),
 ('worker-andres','andres','Worker de Andrés','andres-planning','openai','gpt-5-mini',2,0.78),
 ('worker-julieta','julieta','Worker de Julieta','julieta-review','openai','gpt-5-mini',2,0.88)
on conflict(worker_id) do update set
 agent_id=excluded.agent_id,display_name=excluded.display_name,runtime_key=excluded.runtime_key,
 provider=excluded.provider,default_model=excluded.default_model,max_concurrency=excluded.max_concurrency,
 quality_threshold=excluded.quality_threshold,status='active',updated_at=now();

insert into public.mission_worker_tools(worker_id,tool_key,permission,constraints)
values
 ('worker-isidora','regulatory_search','execute','{"officialOnly":true}'::jsonb),
 ('worker-isidora','knowledge_graph','read','{}'::jsonb),
 ('worker-rodrigo','risk_matrix','execute','{}'::jsonb),
 ('worker-rodrigo','knowledge_graph','read','{}'::jsonb),
 ('worker-javier','control_catalog','execute','{}'::jsonb),
 ('worker-javier','organization_memory','read','{}'::jsonb),
 ('worker-beatriz','evidence_library','execute','{}'::jsonb),
 ('worker-beatriz','organization_memory','read','{}'::jsonb),
 ('worker-veronica','regulatory_monitor','execute','{"officialOnly":true}'::jsonb),
 ('worker-andres','action_plan','execute','{}'::jsonb),
 ('worker-julieta','artifact_review','execute','{}'::jsonb),
 ('worker-julieta','citation_verifier','execute','{}'::jsonb)
on conflict(worker_id,tool_key) do update set permission=excluded.permission,constraints=excluded.constraints,enabled=true;

insert into public.mission_worker_sources(worker_id,source_key,source_kind,allowed_domains,requires_citation)
values
 ('worker-isidora','official-regulation','official',array['bcn.cl','diariooficial.interior.gob.cl'],true),
 ('worker-isidora','kumplio-knowledge','knowledge','{}',true),
 ('worker-rodrigo','organization-context','organization','{}',true),
 ('worker-javier','organization-context','organization','{}',true),
 ('worker-beatriz','organization-evidence','organization','{}',true),
 ('worker-veronica','official-regulation','official',array['bcn.cl','diariooficial.interior.gob.cl'],true),
 ('worker-andres','organization-context','organization','{}',true),
 ('worker-julieta','mission-artifacts','knowledge','{}',true)
on conflict(worker_id,source_key) do update set source_kind=excluded.source_kind,allowed_domains=excluded.allowed_domains,requires_citation=excluded.requires_citation,enabled=true;

create or replace function public.enqueue_mission_capability(
  p_capability_run_id uuid,
  p_actor_user_id uuid
) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare
  v_run public.mission_capability_runs;
  v_mission public.missions;
  v_worker public.mission_worker_profiles;
  v_job_id uuid;
begin
  select * into v_run from public.mission_capability_runs where id=p_capability_run_id for update;
  if v_run.id is null then raise exception 'capability_run_not_found'; end if;
  select * into v_mission from public.missions where id=v_run.mission_id;
  if v_mission.status<>'active' then raise exception 'mission_not_active'; end if;
  if not exists(select 1 from public.organization_members where organization_id=v_run.organization_id and user_id=p_actor_user_id) then raise exception 'actor_not_member'; end if;
  if v_run.status not in ('ready','failed') then raise exception 'capability_cannot_enqueue_from_%',v_run.status; end if;
  if v_run.assigned_agent_id is null then raise exception 'capability_has_no_agent'; end if;
  if exists(select 1 from public.mission_capability_runs r where r.mission_id=v_run.mission_id and r.sequence<v_run.sequence and r.status<>'completed') then raise exception 'previous_capabilities_incomplete'; end if;
  if exists(select 1 from public.mission_execution_jobs j where j.capability_run_id=v_run.id and j.status in ('queued','running','retry_scheduled')) then raise exception 'capability_already_queued'; end if;

  select * into v_worker from public.mission_worker_profiles p where p.agent_id=v_run.assigned_agent_id and p.status='active' order by p.worker_id limit 1;
  if v_worker.worker_id is null then raise exception 'no_active_worker_for_agent_%',v_run.assigned_agent_id; end if;

  insert into public.mission_execution_jobs(organization_id,mission_id,capability_run_id,worker_id,status,input_payload,created_by)
  values(v_run.organization_id,v_run.mission_id,v_run.id,v_worker.worker_id,'queued',jsonb_build_object('capabilityRunId',v_run.id,'agentId',v_run.assigned_agent_id),p_actor_user_id)
  returning id into v_job_id;

  update public.mission_capability_runs set error_code=null,error_message=null,updated_at=now() where id=v_run.id;
  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_user_id,from_status,to_status,payload)
  values(v_run.organization_id,v_run.mission_id,'execution_job_queued','user',p_actor_user_id,v_run.status,'queued',jsonb_build_object('jobId',v_job_id,'workerId',v_worker.worker_id,'capabilityRunId',v_run.id));
  return jsonb_build_object('jobId',v_job_id,'status','queued','workerId',v_worker.worker_id);
end;
$$;

create or replace function public.claim_mission_execution_job(
  p_worker_id text,
  p_lease_seconds integer default null
) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare
  v_profile public.mission_worker_profiles;
  v_job public.mission_execution_jobs;
  v_token uuid:=gen_random_uuid();
  v_lease integer;
begin
  select * into v_profile from public.mission_worker_profiles where worker_id=p_worker_id and status='active';
  if v_profile.worker_id is null then raise exception 'worker_not_active'; end if;
  v_lease:=coalesce(p_lease_seconds,v_profile.default_lease_seconds);
  if v_lease<30 or v_lease>3600 then raise exception 'invalid_lease'; end if;

  update public.mission_execution_jobs
  set status='retry_scheduled',available_at=now(),lease_token=null,lease_expires_at=null,updated_at=now(),
      error_code='lease_expired',error_message='El worker perdió el lease antes de completar el job.'
  where worker_id=p_worker_id and status='running' and lease_expires_at<now();

  select * into v_job
  from public.mission_execution_jobs
  where worker_id=p_worker_id and status in ('queued','retry_scheduled') and available_at<=now()
  order by priority asc,created_at asc
  limit 1 for update skip locked;
  if v_job.id is null then return null; end if;
  if v_job.attempt>=v_job.max_attempts then
    update public.mission_execution_jobs set status='failed',completed_at=now(),updated_at=now(),error_code='max_attempts_exceeded' where id=v_job.id;
    return null;
  end if;

  update public.mission_execution_jobs
  set status='running',attempt=attempt+1,claimed_at=now(),heartbeat_at=now(),lease_token=v_token,
      lease_expires_at=now()+make_interval(secs=>v_lease),updated_at=now(),error_code=null,error_message=null
  where id=v_job.id;
  update public.mission_capability_runs
  set status='running',attempt_count=attempt_count+1,started_at=coalesce(started_at,now()),completed_at=null,
      error_code=null,error_message=null,updated_at=now()
  where id=v_job.capability_run_id;
  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,from_status,to_status,payload)
  select v_job.organization_id,v_job.mission_id,'execution_job_claimed','agent',p.agent_id,v_job.status,'running',
    jsonb_build_object('jobId',v_job.id,'workerId',p_worker_id,'attempt',v_job.attempt+1,'leaseSeconds',v_lease)
  from public.mission_worker_profiles p where p.worker_id=p_worker_id;

  return jsonb_build_object('jobId',v_job.id,'missionId',v_job.mission_id,'capabilityRunId',v_job.capability_run_id,
    'workerId',p_worker_id,'leaseToken',v_token,'leaseExpiresAt',now()+make_interval(secs=>v_lease),
    'input',v_job.input_payload,'allowedTools',(select coalesce(jsonb_agg(jsonb_build_object('toolKey',t.tool_key,'permission',t.permission,'constraints',t.constraints)),'[]') from public.mission_worker_tools t where t.worker_id=p_worker_id and t.enabled),
    'allowedSources',(select coalesce(jsonb_agg(jsonb_build_object('sourceKey',s.source_key,'kind',s.source_kind,'domains',s.allowed_domains,'requiresCitation',s.requires_citation,'constraints',s.constraints)),'[]') from public.mission_worker_sources s where s.worker_id=p_worker_id and s.enabled),
    'provider',v_profile.provider,'model',v_profile.default_model,'qualityThreshold',v_profile.quality_threshold);
end;
$$;

create or replace function public.heartbeat_mission_execution_job(p_job_id uuid,p_lease_token uuid,p_extend_seconds integer default 300)
returns timestamptz language plpgsql security invoker set search_path=''
as $$ declare v_exp timestamptz; begin
  if p_extend_seconds<30 or p_extend_seconds>3600 then raise exception 'invalid_lease_extension'; end if;
  update public.mission_execution_jobs set heartbeat_at=now(),lease_expires_at=now()+make_interval(secs=>p_extend_seconds),updated_at=now()
  where id=p_job_id and status='running' and lease_token=p_lease_token and lease_expires_at>now()
  returning lease_expires_at into v_exp;
  if v_exp is null then raise exception 'invalid_or_expired_lease'; end if;
  return v_exp;
end; $$;

create or replace function public.record_mission_model_run(
  p_job_id uuid,p_lease_token uuid,p_provider text,p_model text,p_operation text,
  p_input_tokens bigint,p_output_tokens bigint,p_cached_input_tokens bigint,p_reasoning_tokens bigint,
  p_latency_ms bigint,p_cost_microusd bigint,p_request_id text default null,p_finish_reason text default null,p_metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql security invoker set search_path=''
as $$ declare v_job public.mission_execution_jobs; v_id uuid; begin
  select * into v_job from public.mission_execution_jobs where id=p_job_id and status='running' and lease_token=p_lease_token and lease_expires_at>now() for update;
  if v_job.id is null then raise exception 'invalid_or_expired_lease'; end if;
  insert into public.mission_model_runs(organization_id,mission_id,job_id,provider,model,operation,input_tokens,output_tokens,cached_input_tokens,reasoning_tokens,latency_ms,cost_microusd,request_id,finish_reason,metadata)
  values(v_job.organization_id,v_job.mission_id,v_job.id,trim(p_provider),trim(p_model),trim(p_operation),coalesce(p_input_tokens,0),coalesce(p_output_tokens,0),coalesce(p_cached_input_tokens,0),coalesce(p_reasoning_tokens,0),p_latency_ms,coalesce(p_cost_microusd,0),p_request_id,p_finish_reason,coalesce(p_metadata,'{}')) returning id into v_id;
  update public.mission_execution_jobs set total_input_tokens=total_input_tokens+coalesce(p_input_tokens,0),total_output_tokens=total_output_tokens+coalesce(p_output_tokens,0),total_cost_microusd=total_cost_microusd+coalesce(p_cost_microusd,0),total_latency_ms=total_latency_ms+p_latency_ms,updated_at=now() where id=v_job.id;
  return v_id;
end; $$;

create or replace function public.record_mission_tool_call(
  p_job_id uuid,p_lease_token uuid,p_tool_key text,p_source_key text,p_status text,p_latency_ms bigint,
  p_input_summary jsonb,p_output_summary jsonb,p_citation_refs jsonb,p_error_code text default null
) returns uuid language plpgsql security invoker set search_path=''
as $$ declare v_job public.mission_execution_jobs; v_id uuid; v_requires boolean; begin
  select * into v_job from public.mission_execution_jobs where id=p_job_id and status='running' and lease_token=p_lease_token and lease_expires_at>now();
  if v_job.id is null then raise exception 'invalid_or_expired_lease'; end if;
  if not exists(select 1 from public.mission_worker_tools where worker_id=v_job.worker_id and tool_key=p_tool_key and enabled) then raise exception 'tool_not_allowed'; end if;
  if p_source_key is not null then
    select requires_citation into v_requires from public.mission_worker_sources where worker_id=v_job.worker_id and source_key=p_source_key and enabled;
    if v_requires is null then raise exception 'source_not_allowed'; end if;
    if v_requires and (p_citation_refs is null or jsonb_array_length(coalesce(p_citation_refs,'[]'))=0) and p_status='succeeded' then raise exception 'citation_required'; end if;
  end if;
  insert into public.mission_tool_calls(organization_id,mission_id,job_id,tool_key,source_key,status,latency_ms,input_summary,output_summary,citation_refs,error_code)
  values(v_job.organization_id,v_job.mission_id,v_job.id,p_tool_key,p_source_key,p_status,p_latency_ms,coalesce(p_input_summary,'{}'),coalesce(p_output_summary,'{}'),coalesce(p_citation_refs,'[]'),p_error_code) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.record_mission_quality_evaluation(
  p_job_id uuid,p_lease_token uuid,p_evaluator_agent_id text,p_rubric_version text,p_score numeric,p_dimensions jsonb,p_findings jsonb
) returns jsonb language plpgsql security invoker set search_path=''
as $$ declare v_job public.mission_execution_jobs; v_profile public.mission_worker_profiles; v_passed boolean; v_id uuid; begin
  select * into v_job from public.mission_execution_jobs where id=p_job_id and status='running' and lease_token=p_lease_token and lease_expires_at>now() for update;
  if v_job.id is null then raise exception 'invalid_or_expired_lease'; end if;
  select * into v_profile from public.mission_worker_profiles where worker_id=v_job.worker_id;
  v_passed:=p_score>=v_profile.quality_threshold;
  insert into public.mission_quality_evaluations(organization_id,mission_id,job_id,evaluator_agent_id,rubric_version,score,passed,dimensions,findings)
  values(v_job.organization_id,v_job.mission_id,v_job.id,p_evaluator_agent_id,p_rubric_version,p_score,v_passed,coalesce(p_dimensions,'{}'),coalesce(p_findings,'[]'))
  on conflict(job_id,rubric_version,evaluator_agent_id) do update set score=excluded.score,passed=excluded.passed,dimensions=excluded.dimensions,findings=excluded.findings,created_at=now()
  returning id into v_id;
  update public.mission_execution_jobs set quality_score=p_score,updated_at=now() where id=v_job.id;
  return jsonb_build_object('evaluationId',v_id,'score',p_score,'threshold',v_profile.quality_threshold,'passed',v_passed);
end; $$;

create or replace function public.finalize_mission_execution_job(
  p_job_id uuid,p_lease_token uuid,p_artifact_type text,p_artifact_title text,p_artifact_content jsonb,p_source_refs jsonb,p_confidence numeric,
  p_result_type text,p_result_title text,p_result_summary text,p_result_payload jsonb,p_evidence_ids uuid[] default '{}'::uuid[]
) returns jsonb language plpgsql security invoker set search_path=''
as $$ declare v_job public.mission_execution_jobs; v_profile public.mission_worker_profiles; v_result jsonb; begin
  select * into v_job from public.mission_execution_jobs where id=p_job_id and status='running' and lease_token=p_lease_token and lease_expires_at>now() for update;
  if v_job.id is null then raise exception 'invalid_or_expired_lease'; end if;
  select * into v_profile from public.mission_worker_profiles where worker_id=v_job.worker_id;
  if not exists(select 1 from public.mission_model_runs where job_id=v_job.id) then raise exception 'model_usage_required'; end if;
  if not exists(select 1 from public.mission_quality_evaluations where job_id=v_job.id and passed) then raise exception 'quality_gate_not_passed'; end if;
  v_result:=public.complete_mission_capability(v_job.capability_run_id,v_profile.agent_id,p_artifact_type,p_artifact_title,p_artifact_content,p_source_refs,p_confidence,p_result_type,p_result_title,p_result_summary,p_result_payload,p_evidence_ids);
  update public.mission_execution_jobs set status='completed',completed_at=now(),lease_token=null,lease_expires_at=null,output_payload=v_result,updated_at=now() where id=v_job.id;
  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,from_status,to_status,payload)
  values(v_job.organization_id,v_job.mission_id,'execution_job_completed','agent',v_profile.agent_id,'running','completed',jsonb_build_object('jobId',v_job.id,'costMicrousd',v_job.total_cost_microusd,'qualityScore',v_job.quality_score));
  return v_result||jsonb_build_object('jobId',v_job.id,'usage',jsonb_build_object('inputTokens',v_job.total_input_tokens,'outputTokens',v_job.total_output_tokens,'costMicrousd',v_job.total_cost_microusd,'latencyMs',v_job.total_latency_ms,'qualityScore',v_job.quality_score));
end; $$;

create or replace function public.fail_mission_execution_job(
  p_job_id uuid,p_lease_token uuid,p_error_code text,p_error_message text,p_retry_delay_seconds integer default 60
) returns jsonb language plpgsql security invoker set search_path=''
as $$ declare v_job public.mission_execution_jobs; v_final boolean; begin
  select * into v_job from public.mission_execution_jobs where id=p_job_id and status='running' and lease_token=p_lease_token for update;
  if v_job.id is null then raise exception 'invalid_lease'; end if;
  v_final:=v_job.attempt>=v_job.max_attempts;
  update public.mission_execution_jobs set status=case when v_final then 'failed' else 'retry_scheduled' end,
    available_at=case when v_final then available_at else now()+make_interval(secs=>greatest(10,p_retry_delay_seconds)) end,
    lease_token=null,lease_expires_at=null,error_code=trim(p_error_code),error_message=trim(p_error_message),
    completed_at=case when v_final then now() else null end,updated_at=now() where id=v_job.id;
  update public.mission_capability_runs set status=case when v_final then 'failed' else 'ready' end,error_code=trim(p_error_code),error_message=trim(p_error_message),updated_at=now() where id=v_job.capability_run_id;
  insert into public.mission_events(organization_id,mission_id,event_type,actor_type,actor_agent_id,from_status,to_status,payload)
  select v_job.organization_id,v_job.mission_id,'execution_job_failed','agent',p.agent_id,'running',case when v_final then 'failed' else 'retry_scheduled' end,jsonb_build_object('jobId',v_job.id,'attempt',v_job.attempt,'final',v_final,'errorCode',trim(p_error_code)) from public.mission_worker_profiles p where p.worker_id=v_job.worker_id;
  return jsonb_build_object('jobId',v_job.id,'status',case when v_final then 'failed' else 'retry_scheduled' end,'attempt',v_job.attempt,'maxAttempts',v_job.max_attempts);
end; $$;

revoke all on function public.enqueue_mission_capability(uuid,uuid) from public,anon,authenticated;
revoke all on function public.claim_mission_execution_job(text,integer) from public,anon,authenticated;
revoke all on function public.heartbeat_mission_execution_job(uuid,uuid,integer) from public,anon,authenticated;
revoke all on function public.record_mission_model_run(uuid,uuid,text,text,text,bigint,bigint,bigint,bigint,bigint,bigint,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.record_mission_tool_call(uuid,uuid,text,text,text,bigint,jsonb,jsonb,jsonb,text) from public,anon,authenticated;
revoke all on function public.record_mission_quality_evaluation(uuid,uuid,text,text,numeric,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.finalize_mission_execution_job(uuid,uuid,text,text,jsonb,jsonb,numeric,text,text,text,jsonb,uuid[]) from public,anon,authenticated;
revoke all on function public.fail_mission_execution_job(uuid,uuid,text,text,integer) from public,anon,authenticated;

grant execute on function public.enqueue_mission_capability(uuid,uuid) to service_role;
grant execute on function public.claim_mission_execution_job(text,integer) to service_role;
grant execute on function public.heartbeat_mission_execution_job(uuid,uuid,integer) to service_role;
grant execute on function public.record_mission_model_run(uuid,uuid,text,text,text,bigint,bigint,bigint,bigint,bigint,bigint,text,text,jsonb) to service_role;
grant execute on function public.record_mission_tool_call(uuid,uuid,text,text,text,bigint,jsonb,jsonb,jsonb,text) to service_role;
grant execute on function public.record_mission_quality_evaluation(uuid,uuid,text,text,numeric,jsonb,jsonb) to service_role;
grant execute on function public.finalize_mission_execution_job(uuid,uuid,text,text,jsonb,jsonb,numeric,text,text,text,jsonb,uuid[]) to service_role;
grant execute on function public.fail_mission_execution_job(uuid,uuid,text,text,integer) to service_role;

commit;
