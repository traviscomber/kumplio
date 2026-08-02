-- KUMPLIO controls and evidence hardening
-- Protects authorship, makes evaluations immutable and completes FK coverage.

begin;

create index if not exists controls_project_id_idx on public.controls (project_id);
create index if not exists controls_obligation_id_idx on public.controls (obligation_id);
create index if not exists controls_created_by_idx on public.controls (created_by);
create index if not exists evidence_project_id_idx on public.evidence (project_id);
create index if not exists evidence_created_by_idx on public.evidence (created_by);
create index if not exists control_obligations_project_id_idx on public.control_obligations (project_id);
create index if not exists control_obligations_created_by_idx on public.control_obligations (created_by);
create index if not exists control_evidence_project_id_idx on public.control_evidence (project_id);
create index if not exists control_evidence_linked_by_idx on public.control_evidence (linked_by);
create index if not exists control_evidence_reviewed_by_idx on public.control_evidence (reviewed_by);
create index if not exists control_evaluations_org_project_idx on public.control_evaluations (organization_id, project_id);
create index if not exists control_evaluations_project_id_idx on public.control_evaluations (project_id);
create index if not exists evidence_requests_project_id_idx on public.evidence_requests (project_id);
create index if not exists evidence_requests_requested_by_idx on public.evidence_requests (requested_by);

update public.control_evidence link
set organization_id = control.organization_id,
    project_id = control.project_id
from public.controls control
where control.id = link.control_id
  and (link.organization_id is null or link.project_id is null);

do $$
begin
  if not exists (
    select 1 from public.control_evidence
    where organization_id is null or project_id is null
  ) then
    alter table public.control_evidence alter column organization_id set not null;
    alter table public.control_evidence alter column project_id set not null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.control_evidence'::regclass
      and conname = 'control_evidence_organization_id_fkey'
  ) then
    alter table public.control_evidence
      add constraint control_evidence_organization_id_fkey
      foreign key (organization_id) references public.organizations(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.control_evidence'::regclass
      and conname = 'control_evidence_project_id_fkey'
  ) then
    alter table public.control_evidence
      add constraint control_evidence_project_id_fkey
      foreign key (project_id) references public.projects(id) on delete cascade;
  end if;
end;
$$;

revoke update, delete on table public.control_evaluations from authenticated;
grant select, insert on table public.control_evaluations to authenticated;
drop policy if exists control_evaluations_update_member on public.control_evaluations;
drop policy if exists control_evaluations_delete_member on public.control_evaluations;

create or replace function private.validate_control_record()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  project_organization_id uuid;
  actor_id uuid := auth.uid();
begin
  if new.project_id is null then
    raise exception using errcode = '23514', message = 'Control project is required';
  end if;

  select project.organization_id into project_organization_id
  from public.projects project
  where project.id = new.project_id;

  if project_organization_id is null then
    raise exception using errcode = '23503', message = 'Control project not found';
  end if;

  if auth.uid() is not null and not public.is_organization_member(project_organization_id) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  if tg_op = 'UPDATE' then
    if new.project_id <> old.project_id or new.organization_id <> old.organization_id then
      raise exception using errcode = '23514', message = 'Control organization and project are immutable';
    end if;
    new.created_by := old.created_by;
  else
    new.created_by := coalesce(actor_id, new.created_by);
  end if;

  if new.owner_id is not null and not exists (
    select 1 from public.organization_members member
    where member.organization_id = project_organization_id
      and member.user_id = new.owner_id
  ) then
    raise exception using errcode = '23514', message = 'Control owner must belong to the organization';
  end if;

  new.organization_id := project_organization_id;
  return new;
end;
$$;

create or replace function private.validate_evidence_record()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  project_organization_id uuid;
  document_project_id uuid;
  actor_id uuid := auth.uid();
begin
  if new.project_id is null then
    raise exception using errcode = '23514', message = 'Evidence project is required';
  end if;

  select project.organization_id into project_organization_id
  from public.projects project
  where project.id = new.project_id;

  if project_organization_id is null then
    raise exception using errcode = '23503', message = 'Evidence project not found';
  end if;

  if auth.uid() is not null and not public.is_organization_member(project_organization_id) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  if tg_op = 'UPDATE' then
    if new.project_id <> old.project_id or new.organization_id <> old.organization_id then
      raise exception using errcode = '23514', message = 'Evidence organization and project are immutable';
    end if;
    new.created_by := old.created_by;
  else
    new.created_by := coalesce(actor_id, new.created_by);
  end if;

  if new.document_id is not null then
    select document.project_id into document_project_id
    from public.documents document
    where document.id = new.document_id;

    if document_project_id is null or document_project_id <> new.project_id then
      raise exception using errcode = '23514', message = 'Evidence document must belong to the same project';
    end if;
  end if;

  if new.period_start is not null and new.period_end is not null and new.period_end < new.period_start then
    raise exception using errcode = '22023', message = 'Evidence period end cannot precede period start';
  end if;

  new.organization_id := project_organization_id;
  return new;
end;
$$;

create or replace function private.validate_control_obligation_link()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  control_organization_id uuid;
  control_project_id uuid;
  obligation_project_id uuid;
begin
  select control.organization_id, control.project_id
    into control_organization_id, control_project_id
  from public.controls control
  where control.id = new.control_id;

  select obligation.project_id into obligation_project_id
  from public.obligations obligation
  where obligation.id = new.obligation_id;

  if control_organization_id is null or control_project_id is null or obligation_project_id is null then
    raise exception using errcode = '23503', message = 'Control or obligation not found';
  end if;

  if control_project_id <> obligation_project_id then
    raise exception using errcode = '23514', message = 'Control and obligation must belong to the same project';
  end if;

  if auth.uid() is not null and not public.is_organization_member(control_organization_id) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  new.organization_id := control_organization_id;
  new.project_id := control_project_id;
  if tg_op = 'UPDATE' then
    new.created_by := old.created_by;
  else
    new.created_by := coalesce(auth.uid(), new.created_by);
  end if;
  return new;
end;
$$;

create or replace function private.validate_control_evidence_link()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  control_organization_id uuid;
  control_project_id uuid;
  evidence_organization_id uuid;
  evidence_project_id uuid;
begin
  select control.organization_id, control.project_id
    into control_organization_id, control_project_id
  from public.controls control
  where control.id = new.control_id;

  select evidence.organization_id, evidence.project_id
    into evidence_organization_id, evidence_project_id
  from public.evidence evidence
  where evidence.id = new.evidence_id;

  if control_organization_id is null or control_project_id is null
    or evidence_organization_id is null or evidence_project_id is null then
    raise exception using errcode = '23503', message = 'Control or evidence not found';
  end if;

  if control_organization_id <> evidence_organization_id or control_project_id <> evidence_project_id then
    raise exception using errcode = '23514', message = 'Control and evidence must belong to the same project';
  end if;

  if auth.uid() is not null and not public.is_organization_member(control_organization_id) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  new.organization_id := control_organization_id;
  new.project_id := control_project_id;
  if tg_op = 'UPDATE' then
    new.linked_by := old.linked_by;
    new.linked_at := old.linked_at;
  else
    new.linked_by := coalesce(auth.uid(), new.linked_by);
  end if;
  new.note := nullif(btrim(new.note), '');
  return new;
end;
$$;

create or replace function private.validate_evidence_request()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  project_organization_id uuid;
  linked_project_id uuid;
begin
  select project.organization_id into project_organization_id
  from public.projects project
  where project.id = new.project_id;

  if project_organization_id is null then
    raise exception using errcode = '23503', message = 'Evidence request project not found';
  end if;

  if auth.uid() is not null and not public.is_organization_member(project_organization_id) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  if tg_op = 'UPDATE' then
    if new.project_id <> old.project_id or new.organization_id <> old.organization_id then
      raise exception using errcode = '23514', message = 'Evidence request organization and project are immutable';
    end if;
    new.requested_by := old.requested_by;
  else
    new.requested_by := coalesce(auth.uid(), new.requested_by);
  end if;

  if new.case_id is not null then
    select compliance_case.project_id into linked_project_id
    from public.compliance_cases compliance_case
    where compliance_case.id = new.case_id
      and compliance_case.organization_id = project_organization_id;
    if linked_project_id is null or linked_project_id <> new.project_id then
      raise exception using errcode = '23514', message = 'Evidence request case must belong to the project';
    end if;
  end if;

  if new.control_id is not null then
    select control.project_id into linked_project_id
    from public.controls control
    where control.id = new.control_id
      and control.organization_id = project_organization_id;
    if linked_project_id is null or linked_project_id <> new.project_id then
      raise exception using errcode = '23514', message = 'Evidence request control must belong to the project';
    end if;
  end if;

  if new.submitted_evidence_id is not null then
    select evidence.project_id into linked_project_id
    from public.evidence evidence
    where evidence.id = new.submitted_evidence_id
      and evidence.organization_id = project_organization_id;
    if linked_project_id is null or linked_project_id <> new.project_id then
      raise exception using errcode = '23514', message = 'Submitted evidence must belong to the project';
    end if;
  end if;

  if new.requested_from is not null and not exists (
    select 1 from public.organization_members member
    where member.organization_id = project_organization_id
      and member.user_id = new.requested_from
  ) then
    raise exception using errcode = '23514', message = 'Evidence request assignee must belong to the organization';
  end if;

  new.organization_id := project_organization_id;
  return new;
end;
$$;

revoke all on function private.validate_control_record(),
  private.validate_evidence_record(),
  private.validate_control_obligation_link(),
  private.validate_control_evidence_link(),
  private.validate_evidence_request()
from public, anon, authenticated;

commit;
