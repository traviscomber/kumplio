-- KUMPLIO controls and evidence foundation
-- Evolves the continuous compliance model without duplicating findings or actions.

begin;

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.controls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  obligation_id uuid references public.obligations(id) on delete set null,
  code text,
  name text not null,
  description text,
  control_objective text,
  control_type text not null default 'hybrid',
  control_nature text not null default 'preventive',
  execution_mode text not null default 'manual',
  frequency text,
  owner_id uuid references auth.users(id) on delete set null,
  lifecycle_status text not null default 'draft',
  status text not null default 'pending',
  design_effectiveness text not null default 'not_evaluated',
  operating_effectiveness text not null default 'not_evaluated',
  last_evaluated_at timestamptz,
  next_evaluation_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.controls add column if not exists code text;
alter table public.controls add column if not exists control_objective text;
alter table public.controls add column if not exists control_nature text not null default 'preventive';
alter table public.controls add column if not exists execution_mode text not null default 'manual';
alter table public.controls add column if not exists lifecycle_status text not null default 'draft';
alter table public.controls add column if not exists design_effectiveness text not null default 'not_evaluated';
alter table public.controls add column if not exists operating_effectiveness text not null default 'not_evaluated';
alter table public.controls add column if not exists created_by uuid references auth.users(id) on delete set null;

create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  name text not null,
  description text,
  evidence_type text not null default 'document',
  source text,
  issued_at timestamptz,
  period_start date,
  period_end date,
  expires_at timestamptz,
  validation_status text not null default 'pending',
  integrity_hash text,
  integrity_status text not null default 'pending',
  confidentiality text not null default 'internal',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.evidence add column if not exists description text;
alter table public.evidence add column if not exists period_start date;
alter table public.evidence add column if not exists period_end date;
alter table public.evidence add column if not exists integrity_status text not null default 'pending';
alter table public.evidence add column if not exists confidentiality text not null default 'internal';

create table if not exists public.control_obligations (
  control_id uuid not null references public.controls(id) on delete cascade,
  obligation_id uuid not null references public.obligations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  relationship_type text not null default 'primary',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (control_id, obligation_id)
);

create table if not exists public.control_evidence (
  control_id uuid not null references public.controls(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  organization_id uuid,
  project_id uuid,
  relevance text not null default 'primary',
  sufficiency_status text not null default 'not_evaluated',
  note text,
  linked_by uuid references auth.users(id) on delete set null,
  linked_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  primary key (control_id, evidence_id)
);

alter table public.control_evidence add column if not exists organization_id uuid;
alter table public.control_evidence add column if not exists project_id uuid;
alter table public.control_evidence add column if not exists relevance text not null default 'primary';
alter table public.control_evidence add column if not exists sufficiency_status text not null default 'not_evaluated';
alter table public.control_evidence add column if not exists note text;
alter table public.control_evidence add column if not exists linked_by uuid references auth.users(id) on delete set null;
alter table public.control_evidence add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.control_evidence add column if not exists reviewed_at timestamptz;

update public.control_evidence link
set organization_id = control.organization_id,
    project_id = control.project_id
from public.controls control
where control.id = link.control_id
  and (link.organization_id is null or link.project_id is null);

create table if not exists public.control_evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  control_id uuid not null references public.controls(id) on delete cascade,
  case_id uuid references public.compliance_cases(id) on delete set null,
  evaluation_type text not null,
  result text not null,
  summary text,
  sample_size integer,
  period_start date,
  period_end date,
  evaluated_by uuid references auth.users(id) on delete set null,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.evidence_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  case_id uuid references public.compliance_cases(id) on delete set null,
  control_id uuid references public.controls(id) on delete set null,
  title text not null,
  description text,
  requested_from uuid references auth.users(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  status text not null default 'open',
  submitted_evidence_id uuid references public.evidence(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Named constraints make future verification and upgrades deterministic.
alter table public.controls drop constraint if exists controls_control_nature_check;
alter table public.controls add constraint controls_control_nature_check
  check (control_nature in ('preventive', 'detective', 'corrective'));

alter table public.controls drop constraint if exists controls_execution_mode_check;
alter table public.controls add constraint controls_execution_mode_check
  check (execution_mode in ('manual', 'automated', 'hybrid'));

alter table public.controls drop constraint if exists controls_lifecycle_status_check;
alter table public.controls add constraint controls_lifecycle_status_check
  check (lifecycle_status in ('draft', 'active', 'paused', 'retired'));

alter table public.controls drop constraint if exists controls_design_effectiveness_check;
alter table public.controls add constraint controls_design_effectiveness_check
  check (design_effectiveness in ('not_evaluated', 'effective', 'partial', 'ineffective', 'not_applicable'));

alter table public.controls drop constraint if exists controls_operating_effectiveness_check;
alter table public.controls add constraint controls_operating_effectiveness_check
  check (operating_effectiveness in ('not_evaluated', 'effective', 'partial', 'ineffective', 'not_applicable'));

alter table public.evidence drop constraint if exists evidence_integrity_status_check;
alter table public.evidence add constraint evidence_integrity_status_check
  check (integrity_status in ('pending', 'verified', 'mismatch', 'unverifiable'));

alter table public.evidence drop constraint if exists evidence_confidentiality_check;
alter table public.evidence add constraint evidence_confidentiality_check
  check (confidentiality in ('internal', 'confidential', 'restricted'));

alter table public.control_obligations drop constraint if exists control_obligations_relationship_type_check;
alter table public.control_obligations add constraint control_obligations_relationship_type_check
  check (relationship_type in ('primary', 'supporting'));

alter table public.control_evidence drop constraint if exists control_evidence_relevance_check;
alter table public.control_evidence add constraint control_evidence_relevance_check
  check (relevance in ('primary', 'supporting'));

alter table public.control_evidence drop constraint if exists control_evidence_sufficiency_status_check;
alter table public.control_evidence add constraint control_evidence_sufficiency_status_check
  check (sufficiency_status in ('not_evaluated', 'sufficient', 'partial', 'insufficient', 'rejected', 'expired'));

alter table public.control_evaluations drop constraint if exists control_evaluations_type_check;
alter table public.control_evaluations add constraint control_evaluations_type_check
  check (evaluation_type in ('design', 'operating'));

alter table public.control_evaluations drop constraint if exists control_evaluations_result_check;
alter table public.control_evaluations add constraint control_evaluations_result_check
  check (result in ('effective', 'partial', 'ineffective', 'not_applicable'));

alter table public.control_evaluations drop constraint if exists control_evaluations_sample_size_check;
alter table public.control_evaluations add constraint control_evaluations_sample_size_check
  check (sample_size is null or sample_size >= 0);

alter table public.evidence_requests drop constraint if exists evidence_requests_status_check;
alter table public.evidence_requests add constraint evidence_requests_status_check
  check (status in ('open', 'submitted', 'under_review', 'accepted', 'rejected', 'overdue', 'cancelled'));

create unique index if not exists controls_org_project_code_uidx
  on public.controls (organization_id, project_id, code)
  where code is not null;
create index if not exists controls_org_project_idx on public.controls (organization_id, project_id, lifecycle_status);
create index if not exists controls_owner_idx on public.controls (owner_id);
create index if not exists controls_next_evaluation_idx on public.controls (next_evaluation_at)
  where lifecycle_status = 'active';
create index if not exists evidence_org_project_idx on public.evidence (organization_id, project_id, created_at desc);
create index if not exists evidence_document_idx on public.evidence (document_id);
create index if not exists evidence_expiration_idx on public.evidence (expires_at)
  where expires_at is not null;
create index if not exists control_obligations_obligation_idx on public.control_obligations (obligation_id);
create index if not exists control_obligations_org_project_idx on public.control_obligations (organization_id, project_id);
create index if not exists control_evidence_evidence_idx on public.control_evidence (evidence_id);
create index if not exists control_evidence_org_project_idx on public.control_evidence (organization_id, project_id);
create index if not exists control_evaluations_control_idx on public.control_evaluations (control_id, evaluated_at desc);
create index if not exists control_evaluations_case_idx on public.control_evaluations (case_id);
create index if not exists control_evaluations_evaluated_by_idx on public.control_evaluations (evaluated_by);
create index if not exists evidence_requests_org_status_idx on public.evidence_requests (organization_id, status, due_at);
create index if not exists evidence_requests_control_idx on public.evidence_requests (control_id);
create index if not exists evidence_requests_case_idx on public.evidence_requests (case_id);
create index if not exists evidence_requests_requested_from_idx on public.evidence_requests (requested_from);
create index if not exists evidence_requests_submitted_evidence_idx on public.evidence_requests (submitted_evidence_id);

alter table public.controls enable row level security;
alter table public.evidence enable row level security;
alter table public.control_obligations enable row level security;
alter table public.control_evidence enable row level security;
alter table public.control_evaluations enable row level security;
alter table public.evidence_requests enable row level security;

revoke all on table public.controls, public.evidence, public.control_obligations,
  public.control_evidence, public.control_evaluations, public.evidence_requests from anon;

grant select, insert, update, delete on table public.controls, public.evidence,
  public.control_obligations, public.control_evidence, public.control_evaluations,
  public.evidence_requests to authenticated;

grant all on table public.controls, public.evidence, public.control_obligations,
  public.control_evidence, public.control_evaluations, public.evidence_requests to service_role;

-- Recreate policies so this migration can safely upgrade the original 04/05 design.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('controls', 'evidence', 'control_obligations', 'control_evidence', 'control_evaluations', 'evidence_requests')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end;
$$;

create policy controls_select_member on public.controls for select to authenticated
  using ((select public.is_organization_member(organization_id)));
create policy controls_insert_member on public.controls for insert to authenticated
  with check ((select public.is_organization_member(organization_id)));
create policy controls_update_member on public.controls for update to authenticated
  using ((select public.is_organization_member(organization_id)))
  with check ((select public.is_organization_member(organization_id)));
create policy controls_delete_member on public.controls for delete to authenticated
  using ((select public.is_organization_member(organization_id)));

create policy evidence_select_member on public.evidence for select to authenticated
  using ((select public.is_organization_member(organization_id)));
create policy evidence_insert_member on public.evidence for insert to authenticated
  with check ((select public.is_organization_member(organization_id)));
create policy evidence_update_member on public.evidence for update to authenticated
  using ((select public.is_organization_member(organization_id)))
  with check ((select public.is_organization_member(organization_id)));
create policy evidence_delete_member on public.evidence for delete to authenticated
  using ((select public.is_organization_member(organization_id)));

create policy control_obligations_select_member on public.control_obligations for select to authenticated
  using ((select public.is_organization_member(organization_id)));
create policy control_obligations_insert_member on public.control_obligations for insert to authenticated
  with check ((select public.is_organization_member(organization_id)));
create policy control_obligations_update_member on public.control_obligations for update to authenticated
  using ((select public.is_organization_member(organization_id)))
  with check ((select public.is_organization_member(organization_id)));
create policy control_obligations_delete_member on public.control_obligations for delete to authenticated
  using ((select public.is_organization_member(organization_id)));

create policy control_evidence_select_member on public.control_evidence for select to authenticated
  using ((select public.is_organization_member(organization_id)));
create policy control_evidence_insert_member on public.control_evidence for insert to authenticated
  with check ((select public.is_organization_member(organization_id)));
create policy control_evidence_update_member on public.control_evidence for update to authenticated
  using ((select public.is_organization_member(organization_id)))
  with check ((select public.is_organization_member(organization_id)));
create policy control_evidence_delete_member on public.control_evidence for delete to authenticated
  using ((select public.is_organization_member(organization_id)));

create policy control_evaluations_select_member on public.control_evaluations for select to authenticated
  using ((select public.is_organization_member(organization_id)));
create policy control_evaluations_insert_member on public.control_evaluations for insert to authenticated
  with check ((select public.is_organization_member(organization_id)));
create policy control_evaluations_update_member on public.control_evaluations for update to authenticated
  using ((select public.is_organization_member(organization_id)))
  with check ((select public.is_organization_member(organization_id)));
create policy control_evaluations_delete_member on public.control_evaluations for delete to authenticated
  using ((select public.is_organization_member(organization_id)));

create policy evidence_requests_select_member on public.evidence_requests for select to authenticated
  using ((select public.is_organization_member(organization_id)));
create policy evidence_requests_insert_member on public.evidence_requests for insert to authenticated
  with check ((select public.is_organization_member(organization_id)));
create policy evidence_requests_update_member on public.evidence_requests for update to authenticated
  using ((select public.is_organization_member(organization_id)))
  with check ((select public.is_organization_member(organization_id)));
create policy evidence_requests_delete_member on public.evidence_requests for delete to authenticated
  using ((select public.is_organization_member(organization_id)));

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

  if tg_op = 'UPDATE' and (new.project_id <> old.project_id or new.organization_id <> old.organization_id) then
    raise exception using errcode = '23514', message = 'Control organization and project are immutable';
  end if;

  if new.owner_id is not null and not exists (
    select 1 from public.organization_members member
    where member.organization_id = project_organization_id
      and member.user_id = new.owner_id
  ) then
    raise exception using errcode = '23514', message = 'Control owner must belong to the organization';
  end if;

  new.organization_id := project_organization_id;
  if tg_op = 'INSERT' then
    new.created_by := coalesce(actor_id, new.created_by);
  end if;

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

  if tg_op = 'UPDATE' and (new.project_id <> old.project_id or new.organization_id <> old.organization_id) then
    raise exception using errcode = '23514', message = 'Evidence organization and project are immutable';
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
  if tg_op = 'INSERT' then
    new.created_by := coalesce(actor_id, new.created_by);
  end if;

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
  new.created_by := coalesce(auth.uid(), new.created_by);
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
  new.linked_by := coalesce(auth.uid(), new.linked_by);
  new.note := nullif(btrim(new.note), '');
  return new;
end;
$$;

create or replace function private.validate_control_evaluation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  control_organization_id uuid;
  control_project_id uuid;
  case_organization_id uuid;
  case_project_id uuid;
begin
  select control.organization_id, control.project_id
    into control_organization_id, control_project_id
  from public.controls control
  where control.id = new.control_id;

  if control_organization_id is null or control_project_id is null then
    raise exception using errcode = '23503', message = 'Control not found';
  end if;

  if new.case_id is not null then
    select compliance_case.organization_id, compliance_case.project_id
      into case_organization_id, case_project_id
    from public.compliance_cases compliance_case
    where compliance_case.id = new.case_id;

    if case_organization_id <> control_organization_id or case_project_id <> control_project_id then
      raise exception using errcode = '23514', message = 'Evaluation case must belong to the control project';
    end if;
  end if;

  if auth.uid() is not null and not public.is_organization_member(control_organization_id) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  new.organization_id := control_organization_id;
  new.project_id := control_project_id;
  new.evaluated_by := coalesce(auth.uid(), new.evaluated_by);
  return new;
end;
$$;

create or replace function private.apply_control_evaluation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.controls
  set design_effectiveness = case when new.evaluation_type = 'design' then new.result else design_effectiveness end,
      operating_effectiveness = case when new.evaluation_type = 'operating' then new.result else operating_effectiveness end,
      last_evaluated_at = greatest(coalesce(last_evaluated_at, new.evaluated_at), new.evaluated_at),
      updated_at = now()
  where id = new.control_id;

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

  if tg_op = 'UPDATE' and (new.project_id <> old.project_id or new.organization_id <> old.organization_id) then
    raise exception using errcode = '23514', message = 'Evidence request organization and project are immutable';
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
  if tg_op = 'INSERT' then
    new.requested_by := coalesce(auth.uid(), new.requested_by);
  end if;
  return new;
end;
$$;

revoke all on function private.validate_control_record(),
  private.validate_evidence_record(),
  private.validate_control_obligation_link(),
  private.validate_control_evidence_link(),
  private.validate_control_evaluation(),
  private.apply_control_evaluation(),
  private.validate_evidence_request()
from public, anon, authenticated;

drop trigger if exists validate_control_record on public.controls;
create trigger validate_control_record before insert or update on public.controls
  for each row execute function private.validate_control_record();
drop trigger if exists set_controls_updated_at on public.controls;
create trigger set_controls_updated_at before update on public.controls
  for each row execute function public.set_updated_at();

drop trigger if exists validate_evidence_record on public.evidence;
create trigger validate_evidence_record before insert or update on public.evidence
  for each row execute function private.validate_evidence_record();
drop trigger if exists set_evidence_updated_at on public.evidence;
create trigger set_evidence_updated_at before update on public.evidence
  for each row execute function public.set_updated_at();

drop trigger if exists validate_control_obligation_link on public.control_obligations;
create trigger validate_control_obligation_link before insert or update on public.control_obligations
  for each row execute function private.validate_control_obligation_link();

drop trigger if exists validate_control_evidence_link on public.control_evidence;
create trigger validate_control_evidence_link before insert or update on public.control_evidence
  for each row execute function private.validate_control_evidence_link();

drop trigger if exists validate_control_evaluation on public.control_evaluations;
create trigger validate_control_evaluation before insert or update on public.control_evaluations
  for each row execute function private.validate_control_evaluation();
drop trigger if exists apply_control_evaluation on public.control_evaluations;
create trigger apply_control_evaluation after insert on public.control_evaluations
  for each row execute function private.apply_control_evaluation();

drop trigger if exists validate_evidence_request on public.evidence_requests;
create trigger validate_evidence_request before insert or update on public.evidence_requests
  for each row execute function private.validate_evidence_request();
drop trigger if exists set_evidence_requests_updated_at on public.evidence_requests;
create trigger set_evidence_requests_updated_at before update on public.evidence_requests
  for each row execute function public.set_updated_at();

-- Extend the integrated case resource model.
alter table public.compliance_case_resource_links
  drop constraint if exists compliance_case_resource_links_resource_type_check;
alter table public.compliance_case_resource_links
  add constraint compliance_case_resource_links_resource_type_check
  check (resource_type in ('document', 'obligation', 'finding', 'risk', 'action', 'control', 'evidence'));

create or replace function private.validate_compliance_case_resource_link()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  case_organization_id uuid;
  case_project_id uuid;
  resource_project_id uuid;
  actor_id uuid := auth.uid();
begin
  select compliance_case.organization_id, compliance_case.project_id
    into case_organization_id, case_project_id
  from public.compliance_cases compliance_case
  where compliance_case.id = new.case_id;

  if case_organization_id is null then
    raise exception using errcode = '23503', message = 'Compliance case not found';
  end if;
  if case_project_id is null then
    raise exception using errcode = '23514', message = 'A project is required before linking case resources';
  end if;

  actor_id := coalesce(actor_id, new.created_by);
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authenticated actor required';
  end if;
  if auth.uid() is not null and not public.is_organization_member(case_organization_id) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  case new.resource_type
    when 'document' then select project_id into resource_project_id from public.documents where id = new.resource_id;
    when 'obligation' then select project_id into resource_project_id from public.obligations where id = new.resource_id;
    when 'finding' then select project_id into resource_project_id from public.audit_findings where id = new.resource_id;
    when 'risk' then select project_id into resource_project_id from public.risks where id = new.resource_id;
    when 'action' then select project_id into resource_project_id from public.roadmaps where id = new.resource_id;
    when 'control' then select project_id into resource_project_id from public.controls where id = new.resource_id;
    when 'evidence' then select project_id into resource_project_id from public.evidence where id = new.resource_id;
    else raise exception using errcode = '22023', message = 'Unsupported resource type';
  end case;

  if resource_project_id is null then
    raise exception using errcode = '23503', message = 'Resource not found';
  end if;
  if resource_project_id <> case_project_id then
    raise exception using errcode = '23514', message = 'Resource belongs to a different project';
  end if;

  new.organization_id := case_organization_id;
  new.project_id := case_project_id;
  new.created_by := actor_id;
  new.note := nullif(btrim(new.note), '');
  return new;
end;
$$;

revoke all on function private.validate_compliance_case_resource_link() from public, anon, authenticated;

drop trigger if exists cleanup_control_case_resource_links on public.controls;
create trigger cleanup_control_case_resource_links before delete on public.controls
  for each row execute function private.cleanup_compliance_case_resource_links('control');
drop trigger if exists cleanup_evidence_case_resource_links on public.evidence;
create trigger cleanup_evidence_case_resource_links before delete on public.evidence
  for each row execute function private.cleanup_compliance_case_resource_links('evidence');

commit;
