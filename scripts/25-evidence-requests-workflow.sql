-- KUMPLIO Evidence Requests workflow

begin;

alter table public.evidence_requests add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.evidence_requests add column if not exists reviewed_at timestamptz;
alter table public.evidence_requests add column if not exists review_comment text;

alter table public.evidence_requests drop constraint if exists evidence_requests_status_check;
alter table public.evidence_requests add constraint evidence_requests_status_check
  check (status in ('open', 'submitted', 'under_review', 'accepted', 'rejected', 'changes_requested', 'cancelled'));

create index if not exists evidence_requests_reviewed_by_idx on public.evidence_requests (reviewed_by);

create table if not exists public.evidence_request_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  request_id uuid not null references public.evidence_requests(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('created', 'submitted', 'accepted', 'rejected', 'changes_requested', 'cancelled')),
  from_status text,
  to_status text not null,
  evidence_id uuid references public.evidence(id) on delete set null,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists evidence_request_events_request_idx
  on public.evidence_request_events (request_id, created_at desc);
create index if not exists evidence_request_events_org_project_idx
  on public.evidence_request_events (organization_id, project_id, created_at desc);
create index if not exists evidence_request_events_actor_idx
  on public.evidence_request_events (actor_id);
create index if not exists evidence_request_events_evidence_idx
  on public.evidence_request_events (evidence_id);

alter table public.evidence_request_events enable row level security;

revoke all on table public.evidence_request_events from anon, authenticated;
grant select on table public.evidence_request_events to authenticated;
grant all on table public.evidence_request_events to service_role;

-- Request state transitions are available only through service transactions.
revoke insert, update, delete on table public.evidence_requests from authenticated;
grant select on table public.evidence_requests to authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'evidence_requests'
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
  loop
    execute format('drop policy if exists %I on public.evidence_requests', policy_record.policyname);
  end loop;
end;
$$;

drop policy if exists evidence_request_events_select_member on public.evidence_request_events;
create policy evidence_request_events_select_member
  on public.evidence_request_events
  for select
  to authenticated
  using ((select public.is_organization_member(organization_id)));

create or replace function public.create_evidence_request_record(
  p_actor_id uuid,
  p_organization_id uuid,
  p_project_id uuid,
  p_case_id uuid,
  p_control_id uuid,
  p_title text,
  p_description text,
  p_requested_from uuid,
  p_due_at timestamptz
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  project_organization_id uuid;
  case_project_id uuid;
  control_project_id uuid;
  request_id uuid;
  clean_title text := btrim(p_title);
begin
  if p_actor_id is null or not exists (
    select 1 from public.organization_members member
    where member.organization_id = p_organization_id and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  select project.organization_id into project_organization_id
  from public.projects project where project.id = p_project_id;
  if project_organization_id is null or project_organization_id <> p_organization_id then
    raise exception using errcode = '23514', message = 'Project must belong to the organization';
  end if;

  if char_length(clean_title) < 3 or char_length(clean_title) > 180 then
    raise exception using errcode = '22023', message = 'Invalid request title';
  end if;

  if p_requested_from is not null and not exists (
    select 1 from public.organization_members member
    where member.organization_id = p_organization_id and member.user_id = p_requested_from
  ) then
    raise exception using errcode = '23514', message = 'Request owner must belong to the organization';
  end if;

  if p_case_id is not null then
    select compliance_case.project_id into case_project_id
    from public.compliance_cases compliance_case
    where compliance_case.id = p_case_id and compliance_case.organization_id = p_organization_id;
    if case_project_id is null or case_project_id <> p_project_id then
      raise exception using errcode = '23514', message = 'Case must belong to the project';
    end if;
  end if;

  if p_control_id is not null then
    select control.project_id into control_project_id
    from public.controls control
    where control.id = p_control_id and control.organization_id = p_organization_id;
    if control_project_id is null or control_project_id <> p_project_id then
      raise exception using errcode = '23514', message = 'Control must belong to the project';
    end if;
  end if;

  insert into public.evidence_requests (
    organization_id, project_id, case_id, control_id, title, description,
    requested_from, requested_by, due_at, status
  ) values (
    p_organization_id, p_project_id, p_case_id, p_control_id, clean_title,
    nullif(btrim(p_description), ''), p_requested_from, p_actor_id, p_due_at, 'open'
  ) returning id into request_id;

  insert into public.evidence_request_events (
    organization_id, project_id, request_id, actor_id, event_type,
    from_status, to_status, comment
  ) values (
    p_organization_id, p_project_id, request_id, p_actor_id, 'created',
    null, 'open', nullif(btrim(p_description), '')
  );

  if p_case_id is not null then
    insert into public.compliance_case_events (
      organization_id, case_id, actor_id, event_type, summary, changes
    ) values (
      p_organization_id, p_case_id, p_actor_id, 'evidence_requested',
      'Solicitud de evidencia creada',
      jsonb_build_object('request_id', request_id, 'control_id', p_control_id, 'due_at', p_due_at)
    );
  end if;

  return request_id;
end;
$$;

create or replace function public.submit_evidence_request_record(
  p_actor_id uuid,
  p_organization_id uuid,
  p_request_id uuid,
  p_evidence_id uuid,
  p_comment text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_record public.evidence_requests;
  evidence_project_id uuid;
begin
  if p_actor_id is null or not exists (
    select 1 from public.organization_members member
    where member.organization_id = p_organization_id and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  select * into request_record
  from public.evidence_requests request
  where request.id = p_request_id and request.organization_id = p_organization_id
  for update;

  if request_record.id is null then
    raise exception using errcode = '23503', message = 'Evidence request not found';
  end if;

  if request_record.status not in ('open', 'changes_requested') then
    raise exception using errcode = '23514', message = 'Evidence request cannot accept a submission in its current state';
  end if;

  select evidence.project_id into evidence_project_id
  from public.evidence evidence
  where evidence.id = p_evidence_id and evidence.organization_id = p_organization_id;

  if evidence_project_id is null or evidence_project_id <> request_record.project_id then
    raise exception using errcode = '23514', message = 'Evidence must belong to the request project';
  end if;

  if request_record.control_id is not null then
    insert into public.control_evidence (
      control_id, evidence_id, organization_id, project_id,
      relevance, sufficiency_status, linked_by
    ) values (
      request_record.control_id, p_evidence_id, p_organization_id, request_record.project_id,
      'primary', 'not_evaluated', p_actor_id
    ) on conflict (control_id, evidence_id) do nothing;
  end if;

  update public.evidence_requests
  set submitted_evidence_id = p_evidence_id,
      status = 'submitted',
      reviewed_by = null,
      reviewed_at = null,
      review_comment = null,
      updated_at = now()
  where id = p_request_id;

  insert into public.evidence_request_events (
    organization_id, project_id, request_id, actor_id, event_type,
    from_status, to_status, evidence_id, comment
  ) values (
    p_organization_id, request_record.project_id, p_request_id, p_actor_id, 'submitted',
    request_record.status, 'submitted', p_evidence_id, nullif(btrim(p_comment), '')
  );

  if request_record.case_id is not null then
    insert into public.compliance_case_events (
      organization_id, case_id, actor_id, event_type, summary, changes
    ) values (
      p_organization_id, request_record.case_id, p_actor_id, 'evidence_submitted',
      'Evidencia entregada para revisión',
      jsonb_build_object('request_id', p_request_id, 'evidence_id', p_evidence_id)
    );
  end if;
end;
$$;

create or replace function public.review_evidence_request_record(
  p_actor_id uuid,
  p_organization_id uuid,
  p_request_id uuid,
  p_decision text,
  p_comment text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_record public.evidence_requests;
  clean_comment text := btrim(p_comment);
  sufficiency text;
begin
  if p_actor_id is null or not exists (
    select 1 from public.organization_members member
    where member.organization_id = p_organization_id and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  if p_decision not in ('accepted', 'rejected', 'changes_requested') then
    raise exception using errcode = '22023', message = 'Invalid review decision';
  end if;

  if char_length(clean_comment) < 3 or char_length(clean_comment) > 2000 then
    raise exception using errcode = '22023', message = 'Review comment must contain between 3 and 2000 characters';
  end if;

  select * into request_record
  from public.evidence_requests request
  where request.id = p_request_id and request.organization_id = p_organization_id
  for update;

  if request_record.id is null then
    raise exception using errcode = '23503', message = 'Evidence request not found';
  end if;

  if request_record.status not in ('submitted', 'under_review') or request_record.submitted_evidence_id is null then
    raise exception using errcode = '23514', message = 'Evidence request has no reviewable submission';
  end if;

  update public.evidence_requests
  set status = p_decision,
      reviewed_by = p_actor_id,
      reviewed_at = now(),
      review_comment = clean_comment,
      updated_at = now()
  where id = p_request_id;

  if request_record.control_id is not null then
    sufficiency := case p_decision
      when 'accepted' then 'sufficient'
      when 'rejected' then 'rejected'
      else 'insufficient'
    end;

    update public.control_evidence
    set sufficiency_status = sufficiency,
        reviewed_by = p_actor_id,
        reviewed_at = now(),
        note = clean_comment
    where control_id = request_record.control_id
      and evidence_id = request_record.submitted_evidence_id
      and organization_id = p_organization_id
      and project_id = request_record.project_id;
  end if;

  insert into public.evidence_request_events (
    organization_id, project_id, request_id, actor_id, event_type,
    from_status, to_status, evidence_id, comment
  ) values (
    p_organization_id, request_record.project_id, p_request_id, p_actor_id, p_decision,
    request_record.status, p_decision, request_record.submitted_evidence_id, clean_comment
  );

  if request_record.case_id is not null then
    insert into public.compliance_case_events (
      organization_id, case_id, actor_id, event_type, summary, changes
    ) values (
      p_organization_id, request_record.case_id, p_actor_id, 'evidence_reviewed',
      case p_decision
        when 'accepted' then 'Evidencia aceptada'
        when 'rejected' then 'Evidencia rechazada'
        else 'Se solicitó reemplazar la evidencia'
      end,
      jsonb_build_object('request_id', p_request_id, 'decision', p_decision, 'evidence_id', request_record.submitted_evidence_id)
    );
  end if;
end;
$$;

create or replace function public.cancel_evidence_request_record(
  p_actor_id uuid,
  p_organization_id uuid,
  p_request_id uuid,
  p_comment text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_record public.evidence_requests;
begin
  if p_actor_id is null or not exists (
    select 1 from public.organization_members member
    where member.organization_id = p_organization_id and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  select * into request_record
  from public.evidence_requests request
  where request.id = p_request_id and request.organization_id = p_organization_id
  for update;

  if request_record.id is null then
    raise exception using errcode = '23503', message = 'Evidence request not found';
  end if;

  if request_record.status not in ('open', 'changes_requested') then
    raise exception using errcode = '23514', message = 'Evidence request cannot be cancelled in its current state';
  end if;

  update public.evidence_requests
  set status = 'cancelled', updated_at = now()
  where id = p_request_id;

  insert into public.evidence_request_events (
    organization_id, project_id, request_id, actor_id, event_type,
    from_status, to_status, comment
  ) values (
    p_organization_id, request_record.project_id, p_request_id, p_actor_id, 'cancelled',
    request_record.status, 'cancelled', nullif(btrim(p_comment), '')
  );
end;
$$;

revoke all on function public.create_evidence_request_record(uuid,uuid,uuid,uuid,uuid,text,text,uuid,timestamptz) from public, anon, authenticated;
revoke all on function public.submit_evidence_request_record(uuid,uuid,uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.review_evidence_request_record(uuid,uuid,uuid,text,text) from public, anon, authenticated;
revoke all on function public.cancel_evidence_request_record(uuid,uuid,uuid,text) from public, anon, authenticated;

grant execute on function public.create_evidence_request_record(uuid,uuid,uuid,uuid,uuid,text,text,uuid,timestamptz) to service_role;
grant execute on function public.submit_evidence_request_record(uuid,uuid,uuid,uuid,text) to service_role;
grant execute on function public.review_evidence_request_record(uuid,uuid,uuid,text,text) to service_role;
grant execute on function public.cancel_evidence_request_record(uuid,uuid,uuid,text) to service_role;

commit;
