-- KUMPLIO Regulatory Evidence Engine Foundation
-- Shared official-source layer plus tenant-scoped applicability decisions.

begin;

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.regulatory_sources (
  id uuid primary key default gen_random_uuid(),
  authority_name text not null,
  source_name text not null,
  canonical_url text not null unique,
  domain text not null,
  jurisdiction text not null default 'CL',
  source_type text not null,
  authority_level text not null,
  ingestion_method text not null,
  terms_review_status text not null default 'pending',
  health_status text not null default 'unknown',
  connector_version text,
  is_active boolean not null default true,
  last_successful_fetch_at timestamptz,
  last_error_at timestamptz,
  last_error_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_source_fetches (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.regulatory_sources(id) on delete restrict,
  previous_fetch_id uuid references public.regulatory_source_fetches(id) on delete restrict,
  requested_url text not null,
  final_url text,
  fetched_at timestamptz not null default now(),
  status text not null,
  http_status integer,
  mime_type text,
  byte_size bigint,
  content_hash text,
  raw_content text,
  storage_path text,
  response_headers jsonb not null default '{}'::jsonb,
  connector_version text,
  error_code text,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.regulatory_sources(id) on delete restrict,
  canonical_identifier text not null,
  title text not null,
  document_type text not null,
  canonical_url text,
  external_reference text,
  publication_date date,
  effective_from date,
  effective_to date,
  status text not null default 'unknown',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, canonical_identifier)
);

create table if not exists public.regulatory_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.regulatory_documents(id) on delete restrict,
  source_fetch_id uuid not null references public.regulatory_source_fetches(id) on delete restrict,
  version_number integer not null,
  version_label text,
  version_date date,
  valid_from date,
  valid_to date,
  content_hash text not null,
  normalized_content text,
  parser_version text,
  status text not null default 'captured',
  created_at timestamptz not null default now(),
  unique (document_id, version_number),
  unique (document_id, content_hash)
);

create table if not exists public.regulatory_document_sections (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.regulatory_document_versions(id) on delete restrict,
  parent_section_id uuid references public.regulatory_document_sections(id) on delete restrict,
  section_type text not null,
  ordinal integer not null,
  reference_label text,
  heading text,
  body_text text not null,
  normalized_text text not null,
  section_hash text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (version_id, ordinal),
  unique (version_id, section_hash)
);

create table if not exists public.regulatory_source_changes (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.regulatory_documents(id) on delete restrict,
  from_version_id uuid references public.regulatory_document_versions(id) on delete restrict,
  to_version_id uuid not null references public.regulatory_document_versions(id) on delete restrict,
  change_type text not null,
  change_hash text not null,
  summary text,
  deterministic_diff jsonb not null default '{}'::jsonb,
  validation_status text not null default 'pending',
  detected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (document_id, from_version_id, to_version_id)
);

create table if not exists public.regulatory_claims (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.regulatory_document_versions(id) on delete restrict,
  section_id uuid references public.regulatory_document_sections(id) on delete restrict,
  parent_claim_id uuid references public.regulatory_claims(id) on delete restrict,
  claim_type text not null,
  claim_text text not null,
  subject text,
  conditions jsonb not null default '{}'::jsonb,
  effective_from date,
  effective_to date,
  extraction_method text not null,
  confidence numeric,
  validation_status text not null default 'pending',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_claim_citations (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.regulatory_claims(id) on delete restrict,
  section_id uuid not null references public.regulatory_document_sections(id) on delete restrict,
  exact_quote text not null,
  quote_hash text not null,
  start_offset integer,
  end_offset integer,
  created_at timestamptz not null default now(),
  unique (claim_id, section_id, quote_hash)
);

create table if not exists public.regulatory_applicability_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  case_id uuid references public.compliance_cases(id) on delete cascade,
  claim_id uuid not null references public.regulatory_claims(id) on delete restrict,
  status text not null default 'pending',
  rationale text,
  assumptions jsonb not null default '[]'::jsonb,
  assessed_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, case_id, claim_id)
);

create table if not exists public.regulatory_source_review_decisions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.regulatory_sources(id) on delete restrict,
  fetch_id uuid references public.regulatory_source_fetches(id) on delete restrict,
  version_id uuid references public.regulatory_document_versions(id) on delete restrict,
  claim_id uuid references public.regulatory_claims(id) on delete restrict,
  reviewer_id uuid references auth.users(id) on delete set null,
  decision text not null,
  comment text,
  checklist jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (num_nonnulls(source_id, fetch_id, version_id, claim_id) >= 1)
);

-- Extend the historical tenant/project alert table instead of replacing it.
alter table public.regulatory_changes add column if not exists source_change_id uuid references public.regulatory_source_changes(id) on delete set null;
alter table public.regulatory_changes add column if not exists source_version_id uuid references public.regulatory_document_versions(id) on delete set null;
alter table public.regulatory_changes add column if not exists validation_status text not null default 'pending';
alter table public.regulatory_changes add column if not exists review_status text not null default 'pending';
alter table public.regulatory_changes add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.regulatory_sources drop constraint if exists regulatory_sources_source_type_check;
alter table public.regulatory_sources add constraint regulatory_sources_source_type_check
  check (source_type in ('law', 'regulation', 'decree', 'resolution', 'guidance', 'jurisprudence', 'consultation', 'sectoral', 'other'));
alter table public.regulatory_sources drop constraint if exists regulatory_sources_authority_level_check;
alter table public.regulatory_sources add constraint regulatory_sources_authority_level_check
  check (authority_level in ('primary', 'official_guidance', 'official_interpretation', 'secondary'));
alter table public.regulatory_sources drop constraint if exists regulatory_sources_ingestion_method_check;
alter table public.regulatory_sources add constraint regulatory_sources_ingestion_method_check
  check (ingestion_method in ('api', 'feed', 'json', 'html', 'pdf', 'manual'));
alter table public.regulatory_sources drop constraint if exists regulatory_sources_terms_review_check;
alter table public.regulatory_sources add constraint regulatory_sources_terms_review_check
  check (terms_review_status in ('pending', 'approved', 'restricted', 'prohibited'));
alter table public.regulatory_sources drop constraint if exists regulatory_sources_health_check;
alter table public.regulatory_sources add constraint regulatory_sources_health_check
  check (health_status in ('unknown', 'healthy', 'degraded', 'failed', 'disabled'));

alter table public.regulatory_source_fetches drop constraint if exists regulatory_source_fetches_status_check;
alter table public.regulatory_source_fetches add constraint regulatory_source_fetches_status_check
  check (status in ('succeeded', 'failed', 'blocked', 'unchanged'));
alter table public.regulatory_source_fetches drop constraint if exists regulatory_source_fetches_content_check;
alter table public.regulatory_source_fetches add constraint regulatory_source_fetches_content_check
  check (
    (status in ('succeeded', 'unchanged') and content_hash is not null and (raw_content is not null or storage_path is not null))
    or status in ('failed', 'blocked')
  );

alter table public.regulatory_documents drop constraint if exists regulatory_documents_status_check;
alter table public.regulatory_documents add constraint regulatory_documents_status_check
  check (status in ('draft', 'published', 'in_force', 'repealed', 'pending', 'unknown'));
alter table public.regulatory_document_versions drop constraint if exists regulatory_document_versions_status_check;
alter table public.regulatory_document_versions add constraint regulatory_document_versions_status_check
  check (status in ('captured', 'parsed', 'verified', 'rejected'));
alter table public.regulatory_source_changes drop constraint if exists regulatory_source_changes_type_check;
alter table public.regulatory_source_changes add constraint regulatory_source_changes_type_check
  check (change_type in ('initial', 'modified', 'repealed', 'replaced', 'metadata_only'));
alter table public.regulatory_source_changes drop constraint if exists regulatory_source_changes_validation_check;
alter table public.regulatory_source_changes add constraint regulatory_source_changes_validation_check
  check (validation_status in ('pending', 'verified', 'rejected', 'requires_review'));
alter table public.regulatory_claims drop constraint if exists regulatory_claims_type_check;
alter table public.regulatory_claims add constraint regulatory_claims_type_check
  check (claim_type in ('obligation', 'right', 'prohibition', 'permission', 'definition', 'deadline', 'sanction', 'other'));
alter table public.regulatory_claims drop constraint if exists regulatory_claims_method_check;
alter table public.regulatory_claims add constraint regulatory_claims_method_check
  check (extraction_method in ('manual', 'deterministic', 'agent'));
alter table public.regulatory_claims drop constraint if exists regulatory_claims_validation_check;
alter table public.regulatory_claims add constraint regulatory_claims_validation_check
  check (validation_status in ('pending', 'supported', 'partial', 'unsupported', 'contradictory'));
alter table public.regulatory_claims drop constraint if exists regulatory_claims_confidence_check;
alter table public.regulatory_claims add constraint regulatory_claims_confidence_check
  check (confidence is null or (confidence >= 0 and confidence <= 1));
alter table public.regulatory_applicability_assessments drop constraint if exists regulatory_applicability_status_check;
alter table public.regulatory_applicability_assessments add constraint regulatory_applicability_status_check
  check (status in ('pending', 'applicable', 'not_applicable', 'uncertain', 'requires_review'));
alter table public.regulatory_source_review_decisions drop constraint if exists regulatory_source_review_decision_check;
alter table public.regulatory_source_review_decisions add constraint regulatory_source_review_decision_check
  check (decision in ('approved', 'rejected', 'changes_requested', 'escalated'));

create index if not exists regulatory_sources_health_idx on public.regulatory_sources (is_active, health_status);
create index if not exists regulatory_sources_created_by_idx on public.regulatory_sources (created_by);
create index if not exists regulatory_sources_reviewed_by_idx on public.regulatory_sources (reviewed_by);
create index if not exists regulatory_source_fetches_source_idx on public.regulatory_source_fetches (source_id, fetched_at desc);
create index if not exists regulatory_source_fetches_previous_idx on public.regulatory_source_fetches (previous_fetch_id);
create unique index if not exists regulatory_source_fetches_hash_uidx on public.regulatory_source_fetches (source_id, content_hash) where content_hash is not null and status in ('succeeded', 'unchanged');
create index if not exists regulatory_documents_source_idx on public.regulatory_documents (source_id, status);
create index if not exists regulatory_document_versions_document_idx on public.regulatory_document_versions (document_id, version_number desc);
create index if not exists regulatory_document_versions_fetch_idx on public.regulatory_document_versions (source_fetch_id);
create index if not exists regulatory_document_sections_version_idx on public.regulatory_document_sections (version_id, ordinal);
create index if not exists regulatory_document_sections_parent_idx on public.regulatory_document_sections (parent_section_id);
create index if not exists regulatory_source_changes_document_idx on public.regulatory_source_changes (document_id, detected_at desc);
create index if not exists regulatory_source_changes_from_version_idx on public.regulatory_source_changes (from_version_id);
create index if not exists regulatory_source_changes_to_version_idx on public.regulatory_source_changes (to_version_id);
create index if not exists regulatory_claims_version_idx on public.regulatory_claims (version_id, validation_status);
create index if not exists regulatory_claims_section_idx on public.regulatory_claims (section_id);
create index if not exists regulatory_claims_parent_idx on public.regulatory_claims (parent_claim_id);
create index if not exists regulatory_claims_created_by_idx on public.regulatory_claims (created_by);
create index if not exists regulatory_claim_citations_claim_idx on public.regulatory_claim_citations (claim_id);
create index if not exists regulatory_claim_citations_section_idx on public.regulatory_claim_citations (section_id);
create index if not exists regulatory_applicability_org_case_idx on public.regulatory_applicability_assessments (organization_id, case_id, status);
create index if not exists regulatory_applicability_project_idx on public.regulatory_applicability_assessments (project_id);
create index if not exists regulatory_applicability_claim_idx on public.regulatory_applicability_assessments (claim_id);
create index if not exists regulatory_applicability_assessed_by_idx on public.regulatory_applicability_assessments (assessed_by);
create index if not exists regulatory_applicability_reviewed_by_idx on public.regulatory_applicability_assessments (reviewed_by);
create index if not exists regulatory_review_source_idx on public.regulatory_source_review_decisions (source_id);
create index if not exists regulatory_review_fetch_idx on public.regulatory_source_review_decisions (fetch_id);
create index if not exists regulatory_review_version_idx on public.regulatory_source_review_decisions (version_id);
create index if not exists regulatory_review_claim_idx on public.regulatory_source_review_decisions (claim_id);
create index if not exists regulatory_review_reviewer_idx on public.regulatory_source_review_decisions (reviewer_id);
create index if not exists regulatory_changes_source_change_idx on public.regulatory_changes (source_change_id);
create index if not exists regulatory_changes_source_version_idx on public.regulatory_changes (source_version_id);

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

revoke all on table public.regulatory_sources, public.regulatory_source_fetches,
  public.regulatory_documents, public.regulatory_document_versions,
  public.regulatory_document_sections, public.regulatory_source_changes,
  public.regulatory_claims, public.regulatory_claim_citations,
  public.regulatory_applicability_assessments,
  public.regulatory_source_review_decisions from anon, authenticated;

grant select on table public.regulatory_sources, public.regulatory_documents,
  public.regulatory_document_versions, public.regulatory_document_sections,
  public.regulatory_source_changes, public.regulatory_claims,
  public.regulatory_claim_citations to authenticated;

grant select (
  id, source_id, previous_fetch_id, requested_url, final_url, fetched_at,
  status, http_status, mime_type, byte_size, content_hash, storage_path,
  connector_version, error_code, created_at
) on public.regulatory_source_fetches to authenticated;

grant select, insert, update, delete on public.regulatory_applicability_assessments to authenticated;

grant all on table public.regulatory_sources, public.regulatory_source_fetches,
  public.regulatory_documents, public.regulatory_document_versions,
  public.regulatory_document_sections, public.regulatory_source_changes,
  public.regulatory_claims, public.regulatory_claim_citations,
  public.regulatory_applicability_assessments,
  public.regulatory_source_review_decisions to service_role;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'regulatory_sources','regulatory_source_fetches','regulatory_documents',
        'regulatory_document_versions','regulatory_document_sections',
        'regulatory_source_changes','regulatory_claims','regulatory_claim_citations',
        'regulatory_applicability_assessments','regulatory_source_review_decisions'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end;
$$;

create policy regulatory_sources_read_authenticated on public.regulatory_sources for select to authenticated using (true);
create policy regulatory_source_fetches_read_authenticated on public.regulatory_source_fetches for select to authenticated using (true);
create policy regulatory_documents_read_authenticated on public.regulatory_documents for select to authenticated using (true);
create policy regulatory_document_versions_read_authenticated on public.regulatory_document_versions for select to authenticated using (true);
create policy regulatory_document_sections_read_authenticated on public.regulatory_document_sections for select to authenticated using (true);
create policy regulatory_source_changes_read_authenticated on public.regulatory_source_changes for select to authenticated using (true);
create policy regulatory_claims_read_authenticated on public.regulatory_claims for select to authenticated using (true);
create policy regulatory_claim_citations_read_authenticated on public.regulatory_claim_citations for select to authenticated using (true);

create policy regulatory_applicability_select_member on public.regulatory_applicability_assessments for select to authenticated
  using ((select public.is_organization_member(organization_id)));
create policy regulatory_applicability_insert_member on public.regulatory_applicability_assessments for insert to authenticated
  with check ((select public.is_organization_member(organization_id)) and assessed_by = (select auth.uid()));
create policy regulatory_applicability_update_member on public.regulatory_applicability_assessments for update to authenticated
  using ((select public.is_organization_member(organization_id)))
  with check ((select public.is_organization_member(organization_id)));
create policy regulatory_applicability_delete_member on public.regulatory_applicability_assessments for delete to authenticated
  using ((select public.is_organization_member(organization_id)));

create or replace function private.prevent_regulatory_immutable_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  raise exception using errcode = '23514', message = 'Regulatory capture and version records are immutable';
end;
$$;

revoke all on function private.prevent_regulatory_immutable_change() from public, anon, authenticated;

foreach_dummy: do $$
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
  ] loop
    execute format('drop trigger if exists prevent_regulatory_immutable_change on %s', target_table);
    execute format('create trigger prevent_regulatory_immutable_change before update or delete on %s for each row execute function private.prevent_regulatory_immutable_change()', target_table);
  end loop;
end;
$$;

create trigger set_regulatory_sources_updated_at before update on public.regulatory_sources
  for each row execute function public.set_updated_at();
create trigger set_regulatory_documents_updated_at before update on public.regulatory_documents
  for each row execute function public.set_updated_at();
create trigger set_regulatory_claims_updated_at before update on public.regulatory_claims
  for each row execute function public.set_updated_at();
create trigger set_regulatory_applicability_updated_at before update on public.regulatory_applicability_assessments
  for each row execute function public.set_updated_at();

commit;
