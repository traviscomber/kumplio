-- KUMPLIO Regulatory Evidence Engine Foundation — security and integrity

begin;

-- A review decision must target exactly one global regulatory object.
alter table public.regulatory_source_review_decisions
  drop constraint if exists regulatory_source_review_decisions_target_check;
alter table public.regulatory_source_review_decisions
  add constraint regulatory_source_review_decisions_target_check
  check (num_nonnulls(source_id, fetch_id, version_id, claim_id) = 1);

-- PostgreSQL UNIQUE treats NULL as distinct. These partial indexes prevent
-- duplicate assessments at case and project scope.
create unique index if not exists regulatory_applicability_case_claim_uidx
  on public.regulatory_applicability_assessments (organization_id, case_id, claim_id)
  where case_id is not null;
create unique index if not exists regulatory_applicability_project_claim_uidx
  on public.regulatory_applicability_assessments (organization_id, project_id, claim_id)
  where case_id is null and project_id is not null;

alter table public.regulatory_sources enable row level security;
alter table public.regulatory_source_fetches enable row level security;
alter table public.regulatory_documents enable row level security;
alter table public.regulatory_document_versions enable row level security;
alter table public.regulatory_document_sections enable row level security;
alter table public.regulatory_source_changes enable row level security;
alter table public.regulatory_claims enable row level security;
alter table public.regulatory_claim_citations enable row level security;
alter table public.regulatory_applicability_assessments enable row level security;
alter table public.regulatory_source_review_decisions enable row level security;

revoke all on table public.regulatory_sources,
  public.regulatory_source_fetches,
  public.regulatory_documents,
  public.regulatory_document_versions,
  public.regulatory_document_sections,
  public.regulatory_source_changes,
  public.regulatory_claims,
  public.regulatory_claim_citations,
  public.regulatory_applicability_assessments,
  public.regulatory_source_review_decisions
from anon, authenticated;

-- Authenticated users may read verified/global regulatory metadata. Raw content,
-- response headers and provider error messages remain server-only.
grant select on table public.regulatory_sources to authenticated;
grant select (
  id, source_id, previous_fetch_id, requested_url, final_url, fetched_at,
  status, http_status, mime_type, byte_size, content_hash, storage_path,
  connector_version, error_code, created_at
) on table public.regulatory_source_fetches to authenticated;
grant select on table public.regulatory_documents,
  public.regulatory_document_versions,
  public.regulatory_document_sections,
  public.regulatory_source_changes,
  public.regulatory_claims,
  public.regulatory_claim_citations
 to authenticated;

grant select, insert, update, delete
  on table public.regulatory_applicability_assessments
  to authenticated;

grant all on table public.regulatory_sources,
  public.regulatory_source_fetches,
  public.regulatory_documents,
  public.regulatory_document_versions,
  public.regulatory_document_sections,
  public.regulatory_source_changes,
  public.regulatory_claims,
  public.regulatory_claim_citations,
  public.regulatory_applicability_assessments,
  public.regulatory_source_review_decisions
 to service_role;

-- Remove any policy left by an earlier experimental schema.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'regulatory_sources',
        'regulatory_source_fetches',
        'regulatory_documents',
        'regulatory_document_versions',
        'regulatory_document_sections',
        'regulatory_source_changes',
        'regulatory_claims',
        'regulatory_claim_citations',
        'regulatory_applicability_assessments',
        'regulatory_source_review_decisions'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

create policy regulatory_sources_read_authenticated
  on public.regulatory_sources
  for select to authenticated
  using (true);
create policy regulatory_source_fetches_read_authenticated
  on public.regulatory_source_fetches
  for select to authenticated
  using (true);
create policy regulatory_documents_read_authenticated
  on public.regulatory_documents
  for select to authenticated
  using (true);
create policy regulatory_document_versions_read_authenticated
  on public.regulatory_document_versions
  for select to authenticated
  using (true);
create policy regulatory_document_sections_read_authenticated
  on public.regulatory_document_sections
  for select to authenticated
  using (true);
create policy regulatory_source_changes_read_authenticated
  on public.regulatory_source_changes
  for select to authenticated
  using (true);
create policy regulatory_claims_read_authenticated
  on public.regulatory_claims
  for select to authenticated
  using (true);
create policy regulatory_claim_citations_read_authenticated
  on public.regulatory_claim_citations
  for select to authenticated
  using (true);

create policy regulatory_applicability_select_member
  on public.regulatory_applicability_assessments
  for select to authenticated
  using ((select public.is_organization_member(organization_id)));
create policy regulatory_applicability_insert_member
  on public.regulatory_applicability_assessments
  for insert to authenticated
  with check (
    (select public.is_organization_member(organization_id))
    and assessed_by = (select auth.uid())
  );
create policy regulatory_applicability_update_member
  on public.regulatory_applicability_assessments
  for update to authenticated
  using ((select public.is_organization_member(organization_id)))
  with check ((select public.is_organization_member(organization_id)));
create policy regulatory_applicability_delete_member
  on public.regulatory_applicability_assessments
  for delete to authenticated
  using ((select public.is_organization_member(organization_id)));

create or replace function private.prevent_regulatory_immutable_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  raise exception using
    errcode = '23514',
    message = 'Regulatory capture and version records are immutable';
end;
$$;

revoke all on function private.prevent_regulatory_immutable_change()
  from public, anon, authenticated;

-- Captures, normalized versions, sections, diffs, citations and review decisions
-- are append-only. Corrections create a new row/version.
do $$
declare
  target_table regclass;
begin
  foreach target_table in array array[
    'public.regulatory_source_fetches'::regclass,
    'public.regulatory_document_versions'::regclass,
    'public.regulatory_document_sections'::regclass,
    'public.regulatory_source_changes'::regclass,
    'public.regulatory_claim_citations'::regclass,
    'public.regulatory_source_review_decisions'::regclass
  ]
  loop
    execute format(
      'drop trigger if exists prevent_regulatory_immutable_change on %s',
      target_table
    );
    execute format(
      'create trigger prevent_regulatory_immutable_change before update or delete on %s for each row execute function private.prevent_regulatory_immutable_change()',
      target_table
    );
  end loop;
end;
$$;

create or replace function private.validate_regulatory_applicability()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  project_organization_id uuid;
  case_organization_id uuid;
  case_project_id uuid;
  actor_id uuid := auth.uid();
begin
  if not exists (
    select 1
    from public.regulatory_claims claim
    where claim.id = new.claim_id
  ) then
    raise exception using errcode = '23503', message = 'Regulatory claim not found';
  end if;

  if new.project_id is not null then
    select project.organization_id
      into project_organization_id
    from public.projects project
    where project.id = new.project_id;

    if project_organization_id is null
      or project_organization_id <> new.organization_id then
      raise exception using errcode = '23514', message = 'Project must belong to the organization';
    end if;
  end if;

  if new.case_id is not null then
    select compliance_case.organization_id, compliance_case.project_id
      into case_organization_id, case_project_id
    from public.compliance_cases compliance_case
    where compliance_case.id = new.case_id;

    if case_organization_id is null
      or case_organization_id <> new.organization_id then
      raise exception using errcode = '23514', message = 'Case must belong to the organization';
    end if;

    if new.project_id is not null and case_project_id <> new.project_id then
      raise exception using errcode = '23514', message = 'Case must belong to the selected project';
    end if;

    new.project_id := coalesce(new.project_id, case_project_id);
  end if;

  if new.project_id is null and new.case_id is null then
    raise exception using errcode = '23514', message = 'Applicability requires a project or case';
  end if;

  if tg_op = 'INSERT' then
    if actor_id is not null and new.assessed_by <> actor_id then
      raise exception using errcode = '42501', message = 'Assessor must match the authenticated user';
    end if;
  else
    if new.organization_id is distinct from old.organization_id
      or new.project_id is distinct from old.project_id
      or new.case_id is distinct from old.case_id
      or new.claim_id is distinct from old.claim_id
      or new.assessed_by is distinct from old.assessed_by
      or new.created_at is distinct from old.created_at then
      raise exception using errcode = '23514', message = 'Applicability context and authorship are immutable';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_regulatory_applicability()
  from public, anon, authenticated;

drop trigger if exists validate_regulatory_applicability
  on public.regulatory_applicability_assessments;
create trigger validate_regulatory_applicability
  before insert or update on public.regulatory_applicability_assessments
  for each row execute function private.validate_regulatory_applicability();

-- Idempotent updated_at triggers for mutable catalog/assessment entities.
drop trigger if exists set_regulatory_sources_updated_at
  on public.regulatory_sources;
create trigger set_regulatory_sources_updated_at
  before update on public.regulatory_sources
  for each row execute function public.set_updated_at();

drop trigger if exists set_regulatory_documents_updated_at
  on public.regulatory_documents;
create trigger set_regulatory_documents_updated_at
  before update on public.regulatory_documents
  for each row execute function public.set_updated_at();

drop trigger if exists set_regulatory_claims_updated_at
  on public.regulatory_claims;
create trigger set_regulatory_claims_updated_at
  before update on public.regulatory_claims
  for each row execute function public.set_updated_at();

drop trigger if exists set_regulatory_applicability_updated_at
  on public.regulatory_applicability_assessments;
create trigger set_regulatory_applicability_updated_at
  before update on public.regulatory_applicability_assessments
  for each row execute function public.set_updated_at();

commit;
