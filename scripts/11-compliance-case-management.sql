-- KUMPLIO compliance case management
-- Adds an immutable event stream for compliance case changes.

begin;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table if not exists public.compliance_case_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.compliance_cases(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  summary text not null,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists compliance_case_events_case_created_idx
  on public.compliance_case_events (case_id, created_at desc);

create index if not exists compliance_case_events_org_created_idx
  on public.compliance_case_events (organization_id, created_at desc);

alter table public.compliance_case_events enable row level security;

revoke all on table public.compliance_case_events from anon;
revoke insert, update, delete on table public.compliance_case_events from authenticated;
grant select on table public.compliance_case_events to authenticated;
grant all on table public.compliance_case_events to service_role;

drop policy if exists compliance_case_events_select_member on public.compliance_case_events;
create policy compliance_case_events_select_member
  on public.compliance_case_events
  for select
  to authenticated
  using ((select public.is_organization_member(organization_id)));

create or replace function private.record_compliance_case_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.compliance_case_events (
      organization_id,
      case_id,
      actor_id,
      event_type,
      summary,
      changes
    ) values (
      new.organization_id,
      new.id,
      auth.uid(),
      'case_created',
      'Expediente creado',
      jsonb_build_object(
        'after', jsonb_build_object(
          'title', new.title,
          'description', new.description,
          'status', new.status,
          'priority', new.priority,
          'project_id', new.project_id,
          'owner_id', new.owner_id,
          'due_at', new.due_at
        )
      )
    );
  elsif tg_op = 'UPDATE' and row(
    old.title,
    old.description,
    old.status,
    old.priority,
    old.project_id,
    old.owner_id,
    old.due_at
  ) is distinct from row(
    new.title,
    new.description,
    new.status,
    new.priority,
    new.project_id,
    new.owner_id,
    new.due_at
  ) then
    insert into public.compliance_case_events (
      organization_id,
      case_id,
      actor_id,
      event_type,
      summary,
      changes
    ) values (
      new.organization_id,
      new.id,
      auth.uid(),
      'case_updated',
      'Expediente actualizado',
      jsonb_build_object(
        'before', jsonb_build_object(
          'title', old.title,
          'description', old.description,
          'status', old.status,
          'priority', old.priority,
          'project_id', old.project_id,
          'owner_id', old.owner_id,
          'due_at', old.due_at
        ),
        'after', jsonb_build_object(
          'title', new.title,
          'description', new.description,
          'status', new.status,
          'priority', new.priority,
          'project_id', new.project_id,
          'owner_id', new.owner_id,
          'due_at', new.due_at
        )
      )
    );
  end if;

  return new;
end;
$$;

revoke all on function private.record_compliance_case_event() from public, anon, authenticated;

drop trigger if exists compliance_case_event_after_insert on public.compliance_cases;
create trigger compliance_case_event_after_insert
  after insert on public.compliance_cases
  for each row
  execute function private.record_compliance_case_event();

drop trigger if exists compliance_case_event_after_update on public.compliance_cases;
create trigger compliance_case_event_after_update
  after update of title, description, status, priority, project_id, owner_id, due_at
  on public.compliance_cases
  for each row
  execute function private.record_compliance_case_event();

commit;
