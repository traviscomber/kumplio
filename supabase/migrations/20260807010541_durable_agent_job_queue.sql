create extension if not exists pgmq;

create table if not exists public.agent_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_id uuid not null references public.agent_workflows(id) on delete cascade,
  stage_index integer not null check (stage_index >= 0),
  requested_by uuid not null references auth.users(id) on delete restrict,
  retry_instructions text,
  status text not null default 'queued' check (status in ('queued','leased','retry_wait','succeeded','dead_letter','cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  queue_message_id bigint,
  lease_owner text,
  lease_expires_at timestamptz,
  heartbeat_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  last_error_code text,
  last_error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists agent_jobs_one_active_stage_idx
  on public.agent_jobs(workflow_id, stage_index)
  where status in ('queued','leased','retry_wait');
create index if not exists agent_jobs_org_status_idx on public.agent_jobs(organization_id, status, updated_at desc);
create index if not exists agent_jobs_workflow_idx on public.agent_jobs(workflow_id, stage_index, created_at desc);
create index if not exists agent_jobs_lease_idx on public.agent_jobs(status, lease_expires_at) where status = 'leased';

alter table public.agent_jobs enable row level security;
revoke all on table public.agent_jobs from anon;
revoke insert, update, delete on table public.agent_jobs from authenticated;
grant select on table public.agent_jobs to authenticated;
grant all on table public.agent_jobs to service_role;

drop policy if exists agent_jobs_select_workspace on public.agent_jobs;
create policy agent_jobs_select_workspace on public.agent_jobs
for select to authenticated
using (
  exists (
    select 1 from public.organization_members member
    where member.organization_id = agent_jobs.organization_id
      and member.user_id = (select auth.uid())
  )
  and (
    (select profile.organization_id from public.profiles profile where profile.id = (select auth.uid())) is null
    or organization_id = (select profile.organization_id from public.profiles profile where profile.id = (select auth.uid()))
  )
);

do $$
begin
  if to_regclass('pgmq.q_agent_jobs') is null then
    perform pgmq.create('agent_jobs');
  end if;
end $$;

create or replace function private.enqueue_agent_job(
  p_actor_id uuid, p_organization_id uuid, p_workflow_id uuid, p_stage_index integer, p_retry_instructions text default null
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_job public.agent_jobs; v_message_id bigint;
begin
  if p_actor_id is null or not exists (
    select 1 from public.organization_members m where m.user_id=p_actor_id and m.organization_id=p_organization_id
  ) then raise exception using errcode='42501', message='Organization membership required'; end if;

  if not exists (
    select 1 from public.agent_workflows w where w.id=p_workflow_id and w.organization_id=p_organization_id and w.status not in ('completed','cancelled')
  ) then raise exception using errcode='P0002', message='Workflow not available'; end if;

  if not exists (
    select 1 from public.agent_workflow_stages s where s.workflow_id=p_workflow_id and s.organization_id=p_organization_id and s.stage_index=p_stage_index
  ) then raise exception using errcode='P0002', message='Workflow stage not found'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_workflow_id::text||':'||p_stage_index::text,0));
  select * into v_job from public.agent_jobs j
   where j.workflow_id=p_workflow_id and j.stage_index=p_stage_index and j.status in ('queued','leased','retry_wait')
   order by j.created_at desc limit 1;

  if v_job.id is not null then
    return jsonb_build_object('jobId',v_job.id,'messageId',v_job.queue_message_id,'resumed',true,'status',v_job.status);
  end if;

  insert into public.agent_jobs(organization_id,workflow_id,stage_index,requested_by,retry_instructions,status)
  values(p_organization_id,p_workflow_id,p_stage_index,p_actor_id,nullif(btrim(p_retry_instructions),''),'queued')
  returning * into v_job;

  select send into v_message_id from pgmq.send('agent_jobs',jsonb_build_object(
    'jobId',v_job.id,'organizationId',p_organization_id,'workflowId',p_workflow_id,'stageIndex',p_stage_index,'requestedBy',p_actor_id
  ),0) limit 1;

  update public.agent_jobs set queue_message_id=v_message_id,updated_at=now() where id=v_job.id;
  return jsonb_build_object('jobId',v_job.id,'messageId',v_message_id,'resumed',false,'status','queued');
end $$;

create or replace function public.enqueue_agent_job(uuid,uuid,uuid,integer,text)
returns jsonb language sql security invoker set search_path=''
as $$ select private.enqueue_agent_job($1,$2,$3,$4,$5) $$;

create or replace function private.claim_agent_jobs(p_worker_id text,p_visibility_seconds integer default 360,p_qty integer default 1)
returns table(job_id uuid,message_id bigint,read_count bigint,organization_id uuid,workflow_id uuid,stage_index integer,requested_by uuid,retry_instructions text)
language plpgsql security definer set search_path=''
as $$
declare msg record; j public.agent_jobs;
begin
  if coalesce(length(btrim(p_worker_id)),0)<3 then raise exception using errcode='22023',message='Worker id required'; end if;
  if p_visibility_seconds<60 or p_visibility_seconds>900 then raise exception using errcode='22023',message='Visibility timeout out of bounds'; end if;
  if p_qty<1 or p_qty>5 then raise exception using errcode='22023',message='Claim quantity out of bounds'; end if;

  for msg in select * from pgmq.read('agent_jobs',p_visibility_seconds,p_qty) loop
    select * into j from public.agent_jobs where id=(msg.message->>'jobId')::uuid for update;
    if j.id is null then perform pgmq.archive('agent_jobs',msg.msg_id); continue; end if;
    if j.status in ('succeeded','dead_letter','cancelled') then perform pgmq.archive('agent_jobs',msg.msg_id); continue; end if;
    if msg.read_ct>j.max_attempts then
      update public.agent_jobs set status='dead_letter',attempt_count=msg.read_ct::integer,last_error_code='max_attempts_exceeded',last_error_message='Durable worker exhausted retries',updated_at=now(),completed_at=now() where id=j.id;
      perform pgmq.archive('agent_jobs',msg.msg_id); continue;
    end if;

    update public.agent_jobs set status='leased',attempt_count=msg.read_ct::integer,lease_owner=p_worker_id,
      lease_expires_at=now()+make_interval(secs=>p_visibility_seconds),heartbeat_at=now(),updated_at=now()
      where id=j.id returning * into j;

    job_id:=j.id; message_id:=msg.msg_id; read_count:=msg.read_ct; organization_id:=j.organization_id;
    workflow_id:=j.workflow_id; stage_index:=j.stage_index; requested_by:=j.requested_by; retry_instructions:=j.retry_instructions;
    return next;
  end loop;
end $$;

create or replace function public.claim_agent_jobs(text,integer,integer)
returns table(job_id uuid,message_id bigint,read_count bigint,organization_id uuid,workflow_id uuid,stage_index integer,requested_by uuid,retry_instructions text)
language sql security invoker set search_path=''
as $$ select * from private.claim_agent_jobs($1,$2,$3) $$;

create or replace function private.heartbeat_agent_job(p_job_id uuid,p_message_id bigint,p_worker_id text,p_visibility_seconds integer default 360)
returns boolean language plpgsql security definer set search_path=''
as $$ begin
  if not exists(select 1 from public.agent_jobs where id=p_job_id and queue_message_id=p_message_id and status='leased' and lease_owner=p_worker_id) then return false; end if;
  perform pgmq.set_vt('agent_jobs',p_message_id,p_visibility_seconds);
  update public.agent_jobs set heartbeat_at=now(),lease_expires_at=now()+make_interval(secs=>p_visibility_seconds),updated_at=now() where id=p_job_id;
  return true;
end $$;

create or replace function public.heartbeat_agent_job(uuid,bigint,text,integer)
returns boolean language sql security invoker set search_path=''
as $$ select private.heartbeat_agent_job($1,$2,$3,$4) $$;

create or replace function private.complete_agent_job(p_job_id uuid,p_message_id bigint,p_worker_id text)
returns boolean language plpgsql security definer set search_path=''
as $$ begin
  if not exists(select 1 from public.agent_jobs where id=p_job_id and queue_message_id=p_message_id and status='leased' and lease_owner=p_worker_id) then return false; end if;
  perform pgmq.archive('agent_jobs',p_message_id);
  update public.agent_jobs set status='succeeded',completed_at=now(),lease_expires_at=null,heartbeat_at=now(),updated_at=now(),last_error_code=null,last_error_message=null where id=p_job_id;
  return true;
end $$;

create or replace function public.complete_agent_job(uuid,bigint,text)
returns boolean language sql security invoker set search_path=''
as $$ select private.complete_agent_job($1,$2,$3) $$;

create or replace function private.fail_agent_job(p_job_id uuid,p_message_id bigint,p_worker_id text,p_error_code text,p_error_message text,p_retryable boolean default true)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare j public.agent_jobs; delay_seconds integer;
begin
  select * into j from public.agent_jobs where id=p_job_id and queue_message_id=p_message_id and status='leased' and lease_owner=p_worker_id for update;
  if j.id is null then return jsonb_build_object('updated',false); end if;
  if not p_retryable or j.attempt_count>=j.max_attempts then
    perform pgmq.archive('agent_jobs',p_message_id);
    update public.agent_jobs set status='dead_letter',completed_at=now(),lease_expires_at=null,last_error_code=left(p_error_code,120),last_error_message=left(p_error_message,1000),updated_at=now() where id=p_job_id;
    return jsonb_build_object('updated',true,'status','dead_letter','retry',false);
  end if;

  delay_seconds:=least(300,greatest(15,(15*power(2,greatest(j.attempt_count-1,0)))::integer));
  perform pgmq.set_vt('agent_jobs',p_message_id,delay_seconds);
  update public.agent_jobs set status='retry_wait',lease_owner=null,lease_expires_at=null,next_attempt_at=now()+make_interval(secs=>delay_seconds),
    last_error_code=left(p_error_code,120),last_error_message=left(p_error_message,1000),updated_at=now() where id=p_job_id;
  return jsonb_build_object('updated',true,'status','retry_wait','retry',true,'delaySeconds',delay_seconds);
end $$;

create or replace function public.fail_agent_job(uuid,bigint,text,text,text,boolean)
returns jsonb language sql security invoker set search_path=''
as $$ select private.fail_agent_job($1,$2,$3,$4,$5,$6) $$;

create or replace function public.agent_job_metrics(p_organization_id uuid default null)
returns table(status text,total bigint,oldest_age_seconds bigint)
language sql security invoker set search_path=''
as $$
  select j.status,count(*)::bigint,coalesce(extract(epoch from (now()-min(j.created_at)))::bigint,0)
  from public.agent_jobs j where p_organization_id is null or j.organization_id=p_organization_id group by j.status order by j.status
$$;

revoke all on function private.enqueue_agent_job(uuid,uuid,uuid,integer,text) from public,anon,authenticated;
revoke all on function private.claim_agent_jobs(text,integer,integer) from public,anon,authenticated;
revoke all on function private.heartbeat_agent_job(uuid,bigint,text,integer) from public,anon,authenticated;
revoke all on function private.complete_agent_job(uuid,bigint,text) from public,anon,authenticated;
revoke all on function private.fail_agent_job(uuid,bigint,text,text,text,boolean) from public,anon,authenticated;
revoke all on function public.enqueue_agent_job(uuid,uuid,uuid,integer,text) from public,anon,authenticated;
revoke all on function public.claim_agent_jobs(text,integer,integer) from public,anon,authenticated;
revoke all on function public.heartbeat_agent_job(uuid,bigint,text,integer) from public,anon,authenticated;
revoke all on function public.complete_agent_job(uuid,bigint,text) from public,anon,authenticated;
revoke all on function public.fail_agent_job(uuid,bigint,text,text,text,boolean) from public,anon,authenticated;
revoke all on function public.agent_job_metrics(uuid) from public,anon,authenticated;
grant execute on function public.enqueue_agent_job(uuid,uuid,uuid,integer,text) to service_role;
grant execute on function public.claim_agent_jobs(text,integer,integer) to service_role;
grant execute on function public.heartbeat_agent_job(uuid,bigint,text,integer) to service_role;
grant execute on function public.complete_agent_job(uuid,bigint,text) to service_role;
grant execute on function public.fail_agent_job(uuid,bigint,text,text,text,boolean) to service_role;
grant execute on function public.agent_job_metrics(uuid) to service_role;
