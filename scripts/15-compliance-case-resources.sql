-- KUMPLIO integrated compliance case resources
-- Links existing project-scoped resources to a compliance case without copying data.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.compliance_case_resource_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.compliance_cases(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  resource_type text not null check (
    resource_type in ('document', 'obligation', 'finding', 'risk', 'action')
  ),
  resource_id uuid not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (case_id, resource_type, resource_id)
);

create index if not exists compliance_case_resource_links_case_idx
  on public.compliance_case_resource_links (case_id, resource_type, created_at desc);

create index if not exists compliance_case_resource_links_org_idx
  on public.compliance_case_resource_links (organization_id, created_at desc);

create index if not exists compliance_case_resource_links_project_idx
  on public.compliance_case_resource_links (project_id, resource_type);

create index if not exists compliance_case_resource_links_created_by_idx
  on public.compliance_case_resource_links (created_by);

alter table public.compliance_case_resource_links enable row level security;

revoke all on table public.compliance_case_resource_links from anon;
revoke all on table public.compliance_case_resource_links from authenticated;
grant select, insert, delete on table public.compliance_case_resource_links to authenticated;
grant all on table public.compliance_case_resource_links to service_role;

drop policy if exists compliance_case_resource_links_select_member
  on public.compliance_case_resource_links;
create policy compliance_case_resource_links_select_member
  on public.compliance_case_resource_links
  for select
  to authenticated
  using ((select public.is_organization_member(organization_id)));

drop policy if exists compliance_case_resource_links_insert_member
  on public.compliance_case_resource_links;
create policy compliance_case_resource_links_insert_member
  on public.compliance_case_resource_links
  for insert
  to authenticated
  with check (
    (select public.is_organization_member(organization_id))
    and created_by = (select auth.uid())
  );

drop policy if exists compliance_case_resource_links_delete_member
  on public.compliance_case_resource_links;
create policy compliance_case_resource_links_delete_member
  on public.compliance_case_resource_links
  for delete
  to authenticated
  using ((select public.is_organization_member(organization_id)));

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

  if actor_id is null then
    actor_id := new.created_by;
  end if;

  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authenticated actor required';
  end if;

  if auth.uid() is not null and not public.is_organization_member(case_organization_id) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  case new.resource_type
    when 'document' then
      select document.project_id into resource_project_id
      from public.documents document
      where document.id = new.resource_id;
    when 'obligation' then
      select obligation.project_id into resource_project_id
      from public.obligations obligation
      where obligation.id = new.resource_id;
    when 'finding' then
      select finding.project_id into resource_project_id
      from public.audit_findings finding
      where finding.id = new.resource_id;
    when 'risk' then
      select risk.project_id into resource_project_id
      from public.risks risk
      where risk.id = new.resource_id;
    when 'action' then
      select action.project_id into resource_project_id
      from public.roadmaps action
      where action.id = new.resource_id;
    else
      raise exception using errcode = '22023', message = 'Unsupported resource type';
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

revoke all on function private.validate_compliance_case_resource_link()
  from public, anon, authenticated;

drop trigger if exists validate_compliance_case_resource_link
  on public.compliance_case_resource_links;
create trigger validate_compliance_case_resource_link
  before insert on public.compliance_case_resource_links
  for each row
  execute function private.validate_compliance_case_resource_link();

create or replace function private.record_compliance_case_resource_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  link_record public.compliance_case_resource_links;
  event_actor uuid := auth.uid();
begin
  if tg_op = 'DELETE' then
    link_record := old;
  else
    link_record := new;
  end if;

  insert into public.compliance_case_events (
    organization_id,
    case_id,
    actor_id,
    event_type,
    summary,
    changes
  ) values (
    link_record.organization_id,
    link_record.case_id,
    event_actor,
    case when tg_op = 'DELETE' then 'resource_unlinked' else 'resource_linked' end,
    case when tg_op = 'DELETE' then 'Recurso desvinculado del expediente' else 'Recurso vinculado al expediente' end,
    jsonb_build_object(
      'link_id', link_record.id,
      'resource_type', link_record.resource_type,
      'resource_id', link_record.resource_id,
      'project_id', link_record.project_id,
      'note', link_record.note
    )
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function private.record_compliance_case_resource_event()
  from public, anon, authenticated;

drop trigger if exists compliance_case_resource_link_event
  on public.compliance_case_resource_links;
create trigger compliance_case_resource_link_event
  after insert or delete on public.compliance_case_resource_links
  for each row
  execute function private.record_compliance_case_resource_event();

create or replace function private.cleanup_compliance_case_resource_links()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  delete from public.compliance_case_resource_links
  where resource_type = tg_argv[0]
    and resource_id = old.id;

  return old;
end;
$$;

revoke all on function private.cleanup_compliance_case_resource_links()
  from public, anon, authenticated;

drop trigger if exists cleanup_document_case_resource_links on public.documents;
create trigger cleanup_document_case_resource_links
  before delete on public.documents
  for each row
  execute function private.cleanup_compliance_case_resource_links('document');

drop trigger if exists cleanup_obligation_case_resource_links on public.obligations;
create trigger cleanup_obligation_case_resource_links
  before delete on public.obligations
  for each row
  execute function private.cleanup_compliance_case_resource_links('obligation');

drop trigger if exists cleanup_finding_case_resource_links on public.audit_findings;
create trigger cleanup_finding_case_resource_links
  before delete on public.audit_findings
  for each row
  execute function private.cleanup_compliance_case_resource_links('finding');

drop trigger if exists cleanup_risk_case_resource_links on public.risks;
create trigger cleanup_risk_case_resource_links
  before delete on public.risks
  for each row
  execute function private.cleanup_compliance_case_resource_links('risk');

drop trigger if exists cleanup_action_case_resource_links on public.roadmaps;
create trigger cleanup_action_case_resource_links
  before delete on public.roadmaps
  for each row
  execute function private.cleanup_compliance_case_resource_links('action');

commit;
