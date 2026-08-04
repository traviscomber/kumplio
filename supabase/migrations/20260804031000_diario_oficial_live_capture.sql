begin;

create table if not exists public.diario_oficial_editions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.regulatory_sources(id) on delete restrict,
  raw_fetch_id uuid references public.regulatory_source_fetches(id) on delete set null,
  edition_number integer not null check (edition_number > 0),
  publication_date date not null,
  canonical_url text not null,
  summary_pdf_url text,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  parser_version text not null,
  revision_number integer not null default 1 check (revision_number > 0),
  is_current boolean not null default true,
  publication_count integer not null default 0 check (publication_count >= 0),
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_number, publication_date, revision_number),
  unique (edition_number, publication_date, content_hash)
);

create unique index if not exists diario_oficial_one_current_revision_idx
  on public.diario_oficial_editions (edition_number, publication_date)
  where is_current;

create index if not exists diario_oficial_editions_date_idx
  on public.diario_oficial_editions (publication_date desc, edition_number desc);

create index if not exists diario_oficial_editions_source_idx
  on public.diario_oficial_editions (source_id, publication_date desc);

create index if not exists diario_oficial_editions_fetch_idx
  on public.diario_oficial_editions (raw_fetch_id)
  where raw_fetch_id is not null;

create table if not exists public.diario_oficial_publications (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.diario_oficial_editions(id) on delete cascade,
  cve bigint not null check (cve > 0),
  section text not null default 'normas_generales',
  power_name text,
  ministry_name text,
  agency_name text,
  title text not null check (char_length(title) between 8 and 4000),
  pdf_url text not null,
  publication_hash text not null check (publication_hash ~ '^[0-9a-f]{64}$'),
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, cve)
);

create index if not exists diario_oficial_publications_cve_idx
  on public.diario_oficial_publications (cve);

create index if not exists diario_oficial_publications_edition_idx
  on public.diario_oficial_publications (edition_id);

create index if not exists diario_oficial_publications_ministry_idx
  on public.diario_oficial_publications (ministry_name)
  where ministry_name is not null;

create index if not exists diario_oficial_publications_review_idx
  on public.diario_oficial_publications (review_status, created_at);

alter table public.diario_oficial_editions enable row level security;
alter table public.diario_oficial_publications enable row level security;

revoke all on public.diario_oficial_editions from public, anon, authenticated;
revoke all on public.diario_oficial_publications from public, anon, authenticated;
grant select on public.diario_oficial_editions to authenticated;
grant select on public.diario_oficial_publications to authenticated;
grant all on public.diario_oficial_editions to service_role;
grant all on public.diario_oficial_publications to service_role;

drop policy if exists diario_oficial_editions_read_authenticated on public.diario_oficial_editions;
create policy diario_oficial_editions_read_authenticated
on public.diario_oficial_editions
for select
to authenticated
using (true);

drop policy if exists diario_oficial_publications_read_authenticated on public.diario_oficial_publications;
create policy diario_oficial_publications_read_authenticated
on public.diario_oficial_publications
for select
to authenticated
using (true);

create or replace function public.record_diario_oficial_edition(
  target_source uuid,
  target_fetch uuid,
  target_edition integer,
  target_date date,
  target_url text,
  target_summary_pdf_url text,
  target_content_hash text,
  target_parser_version text,
  target_publications jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_revision public.diario_oficial_editions%rowtype;
  new_edition_id uuid;
  next_revision integer := 1;
  item jsonb;
  inserted_count integer := 0;
  result_status text := 'captured';
begin
  if target_edition <= 0 or target_date is null then
    raise exception 'invalid_diario_oficial_edition';
  end if;

  if target_content_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_diario_oficial_content_hash';
  end if;

  if jsonb_typeof(target_publications) <> 'array' or jsonb_array_length(target_publications) = 0 then
    raise exception 'diario_oficial_publications_required';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(target_edition::text || ':' || target_date::text, 0)
  );

  select *
  into current_revision
  from public.diario_oficial_editions
  where edition_number = target_edition
    and publication_date = target_date
    and is_current
  for update;

  if current_revision.id is not null and current_revision.content_hash = target_content_hash then
    return jsonb_build_object(
      'editionId', current_revision.id,
      'status', 'unchanged',
      'revisionNumber', current_revision.revision_number,
      'publicationCount', current_revision.publication_count
    );
  end if;

  if current_revision.id is not null then
    next_revision := current_revision.revision_number + 1;
    result_status := 'requires_review';

    update public.diario_oficial_editions
    set is_current = false,
        updated_at = now()
    where id = current_revision.id;
  end if;

  insert into public.diario_oficial_editions (
    source_id,
    raw_fetch_id,
    edition_number,
    publication_date,
    canonical_url,
    summary_pdf_url,
    content_hash,
    parser_version,
    revision_number,
    is_current,
    publication_count
  ) values (
    target_source,
    target_fetch,
    target_edition,
    target_date,
    target_url,
    target_summary_pdf_url,
    target_content_hash,
    target_parser_version,
    next_revision,
    true,
    jsonb_array_length(target_publications)
  ) returning id into new_edition_id;

  for item in select value from jsonb_array_elements(target_publications)
  loop
    if coalesce(item->>'cve', '') !~ '^[0-9]{5,12}$' then
      raise exception 'invalid_diario_oficial_cve';
    end if;

    if coalesce(item->>'title', '') = '' then
      raise exception 'invalid_diario_oficial_title';
    end if;

    if coalesce(item->>'pdfUrl', '') !~ '^https://www[.]diariooficial[.]interior[.]gob[.]cl/publicaciones/' then
      raise exception 'invalid_diario_oficial_pdf_url';
    end if;

    insert into public.diario_oficial_publications (
      edition_id,
      cve,
      section,
      power_name,
      ministry_name,
      agency_name,
      title,
      pdf_url,
      publication_hash
    ) values (
      new_edition_id,
      (item->>'cve')::bigint,
      coalesce(nullif(item->>'section', ''), 'normas_generales'),
      nullif(item->>'power', ''),
      nullif(item->>'ministry', ''),
      nullif(item->>'agency', ''),
      btrim(item->>'title'),
      item->>'pdfUrl',
      coalesce(
        nullif(item->>'hash', ''),
        encode(extensions.digest(
          convert_to((item->>'cve') || '|' || btrim(item->>'title') || '|' || (item->>'pdfUrl'), 'UTF8'),
          'sha256'
        ), 'hex')
      )
    );

    inserted_count := inserted_count + 1;
  end loop;

  update public.diario_oficial_editions
  set publication_count = inserted_count,
      updated_at = now()
  where id = new_edition_id;

  update public.regulatory_sources
  set ingestion_method = 'html',
      terms_review_status = 'approved',
      health_status = 'healthy',
      connector_version = target_parser_version,
      last_successful_fetch_at = now(),
      last_error_at = null,
      last_error_code = null,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'captureEnabled', true,
        'lastEditionNumber', target_edition,
        'lastEditionDate', target_date,
        'reuseConditions', jsonb_build_array(
          'No alterar el contenido',
          'No desnaturalizar el sentido',
          'Identificar al Diario Oficial como fuente',
          'Indicar la fecha de publicación'
        ),
        'termsReference', 'https://www.diariooficial.interior.gob.cl/politica/'
      ),
      updated_at = now()
  where id = target_source;

  update public.scraper_connectors
  set parser_health = 'healthy',
      parser_health_checked_at = now(),
      last_succeeded_at = now(),
      consecutive_failures = 0,
      circuit_state = 'closed',
      circuit_opened_at = null,
      last_error_code = null,
      updated_at = now()
  where source_id = target_source
    and connector_key = 'diario-oficial-summary';

  return jsonb_build_object(
    'editionId', new_edition_id,
    'status', result_status,
    'revisionNumber', next_revision,
    'publicationCount', inserted_count
  );
end;
$$;

revoke all on function public.record_diario_oficial_edition(uuid,uuid,integer,date,text,text,text,text,jsonb)
from public, anon, authenticated;
grant execute on function public.record_diario_oficial_edition(uuid,uuid,integer,date,text,text,text,text,jsonb)
to service_role;

update public.regulatory_sources
set source_name = 'Diario Oficial — Edición Electrónica',
    domain = 'diariooficial.interior.gob.cl',
    jurisdiction = 'CL',
    source_type = 'law',
    authority_level = 'primary',
    ingestion_method = 'html',
    terms_review_status = 'approved',
    connector_version = 'diario-oficial-summary-v1',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'scope', 'normas_generales',
      'cveRequired', true,
      'termsReference', 'https://www.diariooficial.interior.gob.cl/politica/',
      'reuseConditionsVerified', true
    ),
    updated_at = now()
where canonical_url = 'https://www.diariooficial.interior.gob.cl/';

insert into public.scraper_connectors (
  source_id,
  connector_key,
  display_name,
  connector_version,
  adapter_type,
  status,
  allowed_hosts,
  allowed_path_patterns,
  allowed_mime_types,
  timeout_ms,
  max_response_bytes,
  max_redirects,
  max_attempts,
  retry_backoff_seconds,
  failure_threshold,
  circuit_open_seconds,
  user_agent,
  terms_reference,
  metadata
)
select
  id,
  'diario-oficial-summary',
  'Diario Oficial — Normas Generales',
  'diario-oficial-summary-v1',
  'html',
  'manual',
  array['www.diariooficial.interior.gob.cl'],
  array['/edicionelectronica/index.php/index.php'],
  array['text/html', 'application/xhtml+xml'],
  25000,
  8388608,
  0,
  3,
  array[60, 300, 1800],
  3,
  3600,
  'KUMPLIO-Regulatory-Connector/1.0 (+https://kumplio.app/regulatory)',
  'https://www.diariooficial.interior.gob.cl/politica/',
  jsonb_build_object(
    'section', 'normas_generales',
    'cveRequired', true,
    'initialStatus', 'manual_until_first_verified_capture'
  )
from public.regulatory_sources
where canonical_url = 'https://www.diariooficial.interior.gob.cl/'
on conflict (connector_key) do update
set source_id = excluded.source_id,
    display_name = excluded.display_name,
    connector_version = excluded.connector_version,
    adapter_type = excluded.adapter_type,
    status = excluded.status,
    allowed_hosts = excluded.allowed_hosts,
    allowed_path_patterns = excluded.allowed_path_patterns,
    allowed_mime_types = excluded.allowed_mime_types,
    timeout_ms = excluded.timeout_ms,
    max_response_bytes = excluded.max_response_bytes,
    max_redirects = excluded.max_redirects,
    max_attempts = excluded.max_attempts,
    retry_backoff_seconds = excluded.retry_backoff_seconds,
    failure_threshold = excluded.failure_threshold,
    circuit_open_seconds = excluded.circuit_open_seconds,
    user_agent = excluded.user_agent,
    terms_reference = excluded.terms_reference,
    metadata = excluded.metadata,
    updated_at = now();

commit;
