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
