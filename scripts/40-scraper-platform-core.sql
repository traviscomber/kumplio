-- KUMPLIO Scraper Platform — connector registry, queue, leases, retries and circuit breaker
begin;

create table if not exists public.scraper_connectors (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.regulatory_sources(id) on delete cascade,
  connector_key text not null unique,
  display_name text not null,
  connector_version text not null,
  adapter_type text not null check (adapter_type in ('html','pdf','json','xml','rss','api','manual')),
  status text not null default 'disabled' check (status in ('disabled','manual','scheduled','paused')),
  allowed_hosts text[] not null default '{}',
  allowed_path_patterns text[] not null default '{}',
  allowed_mime_types text[] not null default '{}',
  timeout_ms integer not null default 20000 check (timeout_ms between 1000 and 300000),
  max_response_bytes bigint not null default 5242880 check (max_response_bytes between 1024 and 52428800),
  max_redirects integer not null default 2 check (max_redirects between 0 and 5),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  retry_backoff_seconds integer[] not null default array[60,300,1800],
  failure_threshold integer not null default 3 check (failure_threshold between 1 and 20),
  circuit_open_seconds integer not null default 3600 check (circuit_open_seconds between 60 and 604800),
  circuit_state text not null default 'closed' check (circuit_state in ('closed','open','half_open')),
  consecutive_failures integer not null default 0,
  circuit_opened_at timestamptz,
  last_started_at timestamptz,
  last_succeeded_at timestamptz,
  last_unchanged_at timestamptz,
  last_failed_at timestamptz,
  last_error_code text,
  parser_health text not null default 'unknown' check (parser_health in ('unknown','healthy','degraded','failed')),
  parser_health_checked_at timestamptz,
  terms_reference text,
  robots_reference text,
  user_agent text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, connector_version)
);

create table if not exists public.scraper_runs (
  id uuid primary key default gen_random_uuid(),
  connector_id uuid not null references public.scraper_connectors(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null,
  trigger_type text not null check (trigger_type in ('manual','schedule','retry','reprocess','webhook')),
  requested_url text not null,
  canonical_url text not null,
  idempotency_key text not null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','unchanged','failed','blocked','requires_review','dead_letter','cancelled')),
  attempt integer not null default 1 check (attempt between 1 and 10),
  parent_run_id uuid references public.scraper_runs(id) on delete restrict,
  available_at timestamptz not null default now(),
  lease_owner text,
  lease_expires_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms bigint,
  http_status integer,
  mime_type text,
  byte_size bigint,
  content_hash text,
  document_id uuid references public.regulatory_documents(id) on delete set null,
  version_id uuid references public.regulatory_document_versions(id) on delete set null,
  source_change_id uuid references public.regulatory_source_changes(id) on delete set null,
  section_count integer,
  change_count integer,
  error_code text,
  error_message text,
  retryable boolean,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scraper_run_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.scraper_runs(id) on delete cascade,
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  from_status text,
  to_status text,
  error_code text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists scraper_runs_active_idempotency_uidx
  on public.scraper_runs (connector_id, idempotency_key)
  where status in ('queued','running');
create index if not exists scraper_runs_queue_idx
  on public.scraper_runs (status, available_at, created_at) where status = 'queued';
create index if not exists scraper_runs_connector_created_idx on public.scraper_runs (connector_id, created_at desc);
create index if not exists scraper_runs_parent_idx on public.scraper_runs (parent_run_id);
create index if not exists scraper_runs_requested_by_idx on public.scraper_runs (requested_by);
create index if not exists scraper_runs_organization_idx on public.scraper_runs (organization_id, created_at desc);
create index if not exists scraper_runs_document_idx on public.scraper_runs (document_id);
create index if not exists scraper_runs_version_idx on public.scraper_runs (version_id);
create index if not exists scraper_runs_source_change_idx on public.scraper_runs (source_change_id);
create index if not exists scraper_run_events_run_idx on public.scraper_run_events (run_id, created_at);
create index if not exists scraper_run_events_actor_idx on public.scraper_run_events (actor_id);

alter table public.scraper_connectors enable row level security;
alter table public.scraper_runs enable row level security;
alter table public.scraper_run_events enable row level security;

revoke all on public.scraper_connectors, public.scraper_runs, public.scraper_run_events from anon, authenticated;
grant select on public.scraper_connectors to authenticated;
grant select on public.scraper_runs, public.scraper_run_events to authenticated;
grant all on public.scraper_connectors, public.scraper_runs, public.scraper_run_events to service_role;

drop policy if exists scraper_connectors_read_authenticated on public.scraper_connectors;
create policy scraper_connectors_read_authenticated on public.scraper_connectors
  for select to authenticated using (true);

drop policy if exists scraper_runs_read_members on public.scraper_runs;
create policy scraper_runs_read_members on public.scraper_runs
  for select to authenticated using (
    organization_id is null or public.is_organization_member(organization_id)
  );

drop policy if exists scraper_run_events_read_members on public.scraper_run_events;
create policy scraper_run_events_read_members on public.scraper_run_events
  for select to authenticated using (
    exists (
      select 1 from public.scraper_runs run
      where run.id = scraper_run_events.run_id
        and (run.organization_id is null or public.is_organization_member(run.organization_id))
    )
  );

create or replace function public.enqueue_scraper_run(
  target_connector_key text,
  target_organization uuid,
  target_requested_by uuid,
  target_trigger_type text,
  target_requested_url text,
  target_canonical_url text,
  target_idempotency_key text,
  target_parent_run uuid default null
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  connector public.scraper_connectors%rowtype;
  existing_run uuid;
  new_run uuid;
begin
  select * into connector from public.scraper_connectors where connector_key = target_connector_key for update;
  if not found then raise exception 'scraper_connector_not_found'; end if;
  if connector.status not in ('manual','scheduled') then raise exception 'scraper_connector_not_active'; end if;
  if connector.circuit_state = 'open' and connector.circuit_opened_at + make_interval(secs => connector.circuit_open_seconds) > now() then
    raise exception 'scraper_circuit_open';
  end if;

  select id into existing_run from public.scraper_runs
  where connector_id = connector.id and idempotency_key = target_idempotency_key
    and status in ('queued','running')
  order by created_at desc limit 1;
  if existing_run is not null then return existing_run; end if;

  insert into public.scraper_runs (
    connector_id, organization_id, requested_by, trigger_type,
    requested_url, canonical_url, idempotency_key, parent_run_id
  ) values (
    connector.id, target_organization, target_requested_by, target_trigger_type,
    target_requested_url, target_canonical_url, target_idempotency_key, target_parent_run
  ) returning id into new_run;

  insert into public.scraper_run_events(run_id,event_type,actor_id,to_status)
  values(new_run,'enqueued',target_requested_by,'queued');
  return new_run;
end;
$$;

create or replace function public.claim_scraper_run(target_run uuid, worker_id text, lease_seconds integer default 300)
returns public.scraper_runs
language plpgsql
security invoker
set search_path = ''
as $$
declare claimed public.scraper_runs%rowtype;
begin
  update public.scraper_runs
  set status='running', lease_owner=worker_id,
      lease_expires_at=now()+make_interval(secs=>greatest(30,least(lease_seconds,900))),
      started_at=coalesce(started_at,now()), updated_at=now()
  where id=target_run and status='queued' and available_at<=now()
  returning * into claimed;
  if claimed.id is null then raise exception 'scraper_run_not_claimable'; end if;
  update public.scraper_connectors set last_started_at=now(), updated_at=now() where id=claimed.connector_id;
  insert into public.scraper_run_events(run_id,event_type,from_status,to_status,details)
  values(target_run,'claimed','queued','running',jsonb_build_object('worker',worker_id));
  return claimed;
end;
$$;

create or replace function public.complete_scraper_run(
  target_run uuid, target_status text, target_http_status integer, target_mime text,
  target_bytes bigint, target_hash text, target_document uuid, target_version uuid,
  target_change uuid, target_sections integer, target_changes integer, target_metrics jsonb default '{}'::jsonb
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare runrow public.scraper_runs%rowtype;
begin
  if target_status not in ('succeeded','unchanged','requires_review') then raise exception 'invalid_scraper_completion_status'; end if;
  select * into runrow from public.scraper_runs where id=target_run for update;
  if runrow.status <> 'running' then raise exception 'scraper_run_not_running'; end if;
  update public.scraper_runs set status=target_status, finished_at=now(),
    duration_ms=(extract(epoch from (now()-started_at))*1000)::bigint,
    http_status=target_http_status,mime_type=target_mime,byte_size=target_bytes,content_hash=target_hash,
    document_id=target_document,version_id=target_version,source_change_id=target_change,
    section_count=target_sections,change_count=target_changes,metrics=coalesce(target_metrics,'{}'::jsonb),
    lease_owner=null,lease_expires_at=null,updated_at=now()
  where id=target_run;
  update public.scraper_connectors set consecutive_failures=0,circuit_state='closed',circuit_opened_at=null,
    last_succeeded_at=case when target_status in ('succeeded','requires_review') then now() else last_succeeded_at end,
    last_unchanged_at=case when target_status='unchanged' then now() else last_unchanged_at end,
    last_error_code=null,parser_health='healthy',parser_health_checked_at=now(),updated_at=now()
  where id=runrow.connector_id;
  insert into public.scraper_run_events(run_id,event_type,from_status,to_status,details)
  values(target_run,'completed','running',target_status,jsonb_build_object('sections',target_sections,'changes',target_changes));
end;
$$;

create or replace function public.fail_scraper_run(target_run uuid, target_error_code text, target_error_message text, target_retryable boolean)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare runrow public.scraper_runs%rowtype; connector public.scraper_connectors%rowtype; next_run uuid; delay_seconds integer;
begin
  select * into runrow from public.scraper_runs where id=target_run for update;
  if runrow.status <> 'running' then raise exception 'scraper_run_not_running'; end if;
  select * into connector from public.scraper_connectors where id=runrow.connector_id for update;
  update public.scraper_runs set status=case when target_retryable and attempt>=connector.max_attempts then 'dead_letter' else 'failed' end,
    finished_at=now(),duration_ms=(extract(epoch from (now()-started_at))*1000)::bigint,
    error_code=left(target_error_code,120),error_message=left(target_error_message,1000),retryable=target_retryable,
    lease_owner=null,lease_expires_at=null,updated_at=now() where id=target_run;
  update public.scraper_connectors set consecutive_failures=consecutive_failures+1,last_failed_at=now(),
    last_error_code=left(target_error_code,120),parser_health=case when target_error_code like 'parse_%' then 'failed' else parser_health end,
    parser_health_checked_at=case when target_error_code like 'parse_%' then now() else parser_health_checked_at end,
    circuit_state=case when consecutive_failures+1>=failure_threshold then 'open' else circuit_state end,
    circuit_opened_at=case when consecutive_failures+1>=failure_threshold then now() else circuit_opened_at end,
    updated_at=now() where id=connector.id;
  insert into public.scraper_run_events(run_id,event_type,from_status,to_status,error_code,details)
  values(target_run,'failed','running',case when target_retryable and runrow.attempt>=connector.max_attempts then 'dead_letter' else 'failed' end,
    target_error_code,jsonb_build_object('retryable',target_retryable));
  if target_retryable and runrow.attempt < connector.max_attempts then
    delay_seconds:=coalesce(connector.retry_backoff_seconds[least(runrow.attempt,array_length(connector.retry_backoff_seconds,1))],300);
    insert into public.scraper_runs(connector_id,organization_id,requested_by,trigger_type,requested_url,canonical_url,idempotency_key,status,attempt,parent_run_id,available_at)
    values(runrow.connector_id,runrow.organization_id,runrow.requested_by,'retry',runrow.requested_url,runrow.canonical_url,
      runrow.idempotency_key||':attempt:'||(runrow.attempt+1),'queued',runrow.attempt+1,target_run,now()+make_interval(secs=>delay_seconds))
    returning id into next_run;
    insert into public.scraper_run_events(run_id,event_type,actor_id,to_status,details)
    values(next_run,'retry_scheduled',runrow.requested_by,'queued',jsonb_build_object('parentRunId',target_run,'delaySeconds',delay_seconds));
  end if;
  return next_run;
end;
$$;

revoke all on function public.enqueue_scraper_run(text,uuid,uuid,text,text,text,text,uuid) from public,anon,authenticated;
revoke all on function public.claim_scraper_run(uuid,text,integer) from public,anon,authenticated;
revoke all on function public.complete_scraper_run(uuid,text,integer,text,bigint,text,uuid,uuid,uuid,integer,integer,jsonb) from public,anon,authenticated;
revoke all on function public.fail_scraper_run(uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.enqueue_scraper_run(text,uuid,uuid,text,text,text,text,uuid) to service_role;
grant execute on function public.claim_scraper_run(uuid,text,integer) to service_role;
grant execute on function public.complete_scraper_run(uuid,text,integer,text,bigint,text,uuid,uuid,uuid,integer,integer,jsonb) to service_role;
grant execute on function public.fail_scraper_run(uuid,text,text,boolean) to service_role;

insert into public.scraper_connectors (
  source_id,connector_key,display_name,connector_version,adapter_type,status,
  allowed_hosts,allowed_path_patterns,allowed_mime_types,user_agent,terms_reference,metadata
)
select source.id,'leychile-controlled-html','LeyChile / BCN','leychile-controlled-html-v2','html','manual',
  array['www.bcn.cl','bcn.cl'],array['/leychile/navegar'],array['text/html','application/xhtml+xml','text/plain'],
  'KUMPLIO-Regulatory-Connector/0.2 (+https://www.kumplio.app/regulatory)',
  'BCN linked open data and LeyChile public interoperability documentation',
  jsonb_build_object('initialNormId','1209272','initialVersion','2026-12-01')
from public.regulatory_sources source where source.canonical_url='https://www.bcn.cl/leychile/'
on conflict (connector_key) do update set
  connector_version=excluded.connector_version,status=excluded.status,allowed_hosts=excluded.allowed_hosts,
  allowed_path_patterns=excluded.allowed_path_patterns,allowed_mime_types=excluded.allowed_mime_types,
  user_agent=excluded.user_agent,terms_reference=excluded.terms_reference,metadata=excluded.metadata,updated_at=now();

commit;
