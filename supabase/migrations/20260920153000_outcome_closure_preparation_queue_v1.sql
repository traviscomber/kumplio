-- Outcome UX v4 — durable, idempotent safe preparation queue.
-- Queue items may prepare context only. They never verify a closure task.

create table if not exists public.outcome_closure_preparation_queue (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  action_plan_id uuid not null references public.compliance_action_plans(id) on delete cascade,
  task_id uuid not null references public.compliance_action_plan_tasks(id) on delete cascade,
  preparation_type text not null,
  status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outcome_closure_preparation_type_check check (preparation_type in ('prepare_evidence_context')),
  constraint outcome_closure_preparation_status_check check (status in ('queued','running','completed','failed')),
  unique (task_id, preparation_type)
);

alter table public.outcome_closure_preparation_queue enable row level security;
revoke all on table public.outcome_closure_preparation_queue from anon, authenticated;
grant all on table public.outcome_closure_preparation_queue to service_role;

create index if not exists outcome_closure_preparation_queue_ready_idx
  on public.outcome_closure_preparation_queue(status, available_at, created_at)
  where status in ('queued','failed');

create index if not exists outcome_closure_preparation_queue_org_idx
  on public.outcome_closure_preparation_queue(organization_id, created_at desc);

create or replace function public.enqueue_outcome_closure_preparation(
  p_actor_id uuid,
  p_organization_id uuid,
  p_task_id uuid,
  p_preparation_type text default 'prepare_evidence_context'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan_id uuid;
  v_status text;
  v_queue_id uuid;
begin
  if not exists (
    select 1 from public.organization_members m
    where m.organization_id = p_organization_id and m.user_id = p_actor_id
  ) then
    raise exception 'organization_membership_required' using errcode = '42501';
  end if;

  select p.id, t.verification_status into v_plan_id, v_status
  from public.compliance_action_plan_tasks t
  join public.compliance_action_plans p on p.id = t.action_plan_id
  where t.id = p_task_id and p.organization_id = p_organization_id;

  if v_plan_id is null then
    raise exception 'closure_task_not_found' using errcode = 'P0002';
  end if;

  if v_status <> 'pending_evidence' then
    raise exception 'closure_task_not_preparable' using errcode = '55000';
  end if;

  insert into public.outcome_closure_preparation_queue (
    organization_id, action_plan_id, task_id, preparation_type, payload
  ) values (
    p_organization_id, v_plan_id, p_task_id, p_preparation_type,
    jsonb_build_object('requestedBy', p_actor_id, 'requiresHumanVerification', true)
  )
  on conflict (task_id, preparation_type) do update
    set updated_at = now()
  returning id into v_queue_id;

  return jsonb_build_object(
    'queueId', v_queue_id,
    'taskId', p_task_id,
    'preparationType', p_preparation_type,
    'requiresHumanVerification', true
  );
end;
$$;

revoke all on function public.enqueue_outcome_closure_preparation(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.enqueue_outcome_closure_preparation(uuid, uuid, uuid, text) to service_role;


drop function if exists public.claim_outcome_closure_preparation(text);

create or replace function public.claim_outcome_closure_preparation(
  p_worker_id text,
  p_queue_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.outcome_closure_preparation_queue%rowtype;
begin
  select q.* into v_item
  from public.outcome_closure_preparation_queue q
  where q.id = p_queue_id
    and q.status in ('queued','failed')
    and q.available_at <= now()
    and q.attempts < 5
  order by q.created_at asc
  for update skip locked
  limit 1;

  if not found then return null; end if;

  update public.outcome_closure_preparation_queue
  set status = 'running', claimed_at = now(), attempts = attempts + 1, updated_at = now(),
      payload = payload || jsonb_build_object('workerId', p_worker_id)
  where id = v_item.id;

  return jsonb_build_object(
    'id', v_item.id,
    'organizationId', v_item.organization_id,
    'actionPlanId', v_item.action_plan_id,
    'taskId', v_item.task_id,
    'preparationType', v_item.preparation_type
  );
end;
$$;

create or replace function public.complete_outcome_closure_preparation(
  p_queue_id uuid,
  p_result jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.outcome_closure_preparation_queue
  set status = 'completed', result = coalesce(p_result, '{}'::jsonb),
      completed_at = now(), updated_at = now(), last_error = null
  where id = p_queue_id and status = 'running';
end;
$$;

create or replace function public.fail_outcome_closure_preparation(
  p_queue_id uuid,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.outcome_closure_preparation_queue
  set status = case when attempts >= 5 then 'failed' else 'queued' end,
      available_at = now() + make_interval(secs => least(300, 15 * greatest(attempts, 1))),
      updated_at = now(), last_error = left(coalesce(p_error, 'unknown_error'), 1000)
  where id = p_queue_id and status = 'running';
end;
$$;

revoke all on function public.claim_outcome_closure_preparation(text, uuid) from public, anon, authenticated;
revoke all on function public.complete_outcome_closure_preparation(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.fail_outcome_closure_preparation(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_outcome_closure_preparation(text, uuid) to service_role;
grant execute on function public.complete_outcome_closure_preparation(uuid, jsonb) to service_role;
grant execute on function public.fail_outcome_closure_preparation(uuid, text) to service_role;
