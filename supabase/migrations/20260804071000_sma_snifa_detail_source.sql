begin;

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
  circuit_state,
  consecutive_failures,
  parser_health,
  user_agent,
  terms_reference,
  metadata
)
select
  source.id,
  'sma-snifa-detail',
  'SMA / SNIFA — Fichas de procedimientos sancionatorios',
  'sma-snifa-detail-v1',
  'html',
  'manual',
  array['snifa.sma.gob.cl'],
  array['^/Sancionatorio/Ficha/[0-9]+$'],
  array['text/html'],
  60000,
  524288,
  0,
  3,
  array[10, 30, 90],
  3,
  3600,
  'closed',
  0,
  'healthy',
  null,
  'https://snifa.sma.gob.cl/DatosAbiertos',
  jsonb_build_object(
    'sourceRole', 'official_enforcement_detail',
    'parserVersion', 'sma-snifa-detail-v1',
    'requestHeaders', jsonb_build_object('Accept', 'text/html'),
    'userAgentRejectedByOrigin', true,
    'maximumBatchSize', 20,
    'detailSections', jsonb_build_array(
      'documents', 'facts', 'inspections', 'provisional_measures', 'sanctions'
    ),
    'schedulingReadiness', 'first_cohort_required',
    'schedulingStatus', 'manual_until_two_verified_cohorts',
    'humanReviewRequired', true,
    'claimsAreNotAutoValidated', true
  )
from public.regulatory_sources source
where source.canonical_url = 'https://snifa.sma.gob.cl/DatosAbiertos'
on conflict (connector_key) do update
set source_id = excluded.source_id,
    display_name = excluded.display_name,
    connector_version = excluded.connector_version,
    adapter_type = excluded.adapter_type,
    status = 'manual',
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
    parser_health = excluded.parser_health,
    user_agent = excluded.user_agent,
    terms_reference = excluded.terms_reference,
    metadata = public.scraper_connectors.metadata || excluded.metadata,
    updated_at = now();

create table if not exists public.sma_sanctioning_detail_versions (
  id uuid primary key default gen_random_uuid(),
  sma_process_id bigint not null
    references public.sma_sanctioning_proceedings(sma_process_id) on delete restrict,
  source_fetch_id uuid not null unique
    references public.regulatory_source_fetches(id) on delete restrict,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  parser_version text not null,
  expediente text not null check (expediente ~ '^[A-Z]+-[0-9]{3}-[0-9]{4}$'),
  start_date date not null,
  end_date date,
  process_state text not null,
  unit_count integer not null check (unit_count > 0),
  holder_count integer not null check (holder_count >= 0),
  document_count integer not null check (document_count >= 0),
  fact_count integer not null check (fact_count >= 0),
  inspection_count integer not null check (inspection_count >= 0),
  provisional_measure_count integer not null check (provisional_measure_count >= 0),
  sanction_count integer not null check (sanction_count >= 0),
  validation_status text not null default 'pending'
    check (validation_status = any (array['pending'::text, 'approved'::text, 'rejected'::text])),
  metadata jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (sma_process_id, content_hash, parser_version),
  check (end_date is null or end_date >= start_date)
);

create index if not exists sma_detail_versions_process_idx
  on public.sma_sanctioning_detail_versions(sma_process_id, captured_at desc);
create index if not exists sma_detail_versions_fetch_idx
  on public.sma_sanctioning_detail_versions(source_fetch_id);
create index if not exists sma_detail_versions_validation_idx
  on public.sma_sanctioning_detail_versions(validation_status, captured_at desc);

create table if not exists public.sma_sanctioning_detail_heads (
  sma_process_id bigint primary key
    references public.sma_sanctioning_proceedings(sma_process_id) on delete restrict,
  current_version_id uuid not null unique
    references public.sma_sanctioning_detail_versions(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create table if not exists public.sma_sanctioning_detail_units (
  version_id uuid not null
    references public.sma_sanctioning_detail_versions(id) on delete restrict,
  ordinal integer not null check (ordinal > 0),
  sma_unit_id bigint not null
    references public.sma_fiscalizable_units(sma_unit_id) on delete restrict,
  unit_name text not null check (btrim(unit_name) <> ''),
  location_text text,
  latitude numeric(12,8) check (latitude is null or latitude between -60 and -15),
  longitude numeric(12,8) check (longitude is null or longitude between -82 and -65),
  unit_url text not null
    check (unit_url ~ '^https://snifa[.]sma[.]gob[.]cl/UnidadFiscalizable/Ficha/[0-9]+$'),
  item_hash text not null check (item_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (version_id, ordinal),
  unique (version_id, sma_unit_id),
  unique (version_id, item_hash)
);

create index if not exists sma_detail_units_unit_idx
  on public.sma_sanctioning_detail_units(sma_unit_id, version_id);

create table if not exists public.sma_sanctioning_detail_holders (
  version_id uuid not null
    references public.sma_sanctioning_detail_versions(id) on delete restrict,
  ordinal integer not null check (ordinal > 0),
  holder_name text not null check (btrim(holder_name) <> ''),
  item_hash text not null check (item_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (version_id, ordinal),
  unique (version_id, item_hash)
);

create table if not exists public.sma_sanctioning_detail_documents (
  version_id uuid not null
    references public.sma_sanctioning_detail_versions(id) on delete restrict,
  ordinal integer not null check (ordinal > 0),
  document_name text not null check (btrim(document_name) <> ''),
  document_type text not null check (btrim(document_type) <> ''),
  document_date date not null,
  download_id bigint not null check (download_id > 0),
  download_url text not null
    check (download_url ~ '^https://snifa[.]sma[.]gob[.]cl/General/Descargar/[0-9]+$'),
  item_hash text not null check (item_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (version_id, ordinal),
  unique (version_id, download_id),
  unique (version_id, item_hash)
);

create index if not exists sma_detail_documents_type_date_idx
  on public.sma_sanctioning_detail_documents(document_type, document_date desc);
create index if not exists sma_detail_documents_download_idx
  on public.sma_sanctioning_detail_documents(download_id);

create table if not exists public.sma_sanctioning_detail_facts (
  version_id uuid not null
    references public.sma_sanctioning_detail_versions(id) on delete restrict,
  ordinal integer not null check (ordinal > 0),
  fact_text text not null check (btrim(fact_text) <> ''),
  instrument_label text,
  instrument_url text,
  infringement_text text,
  classification_label text,
  classification_detail text,
  item_hash text not null check (item_hash ~ '^[0-9a-f]{64}$'),
  validation_status text not null default 'pending'
    check (validation_status = any (array['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamptz not null default now(),
  primary key (version_id, ordinal),
  unique (version_id, item_hash)
);

create index if not exists sma_detail_facts_classification_idx
  on public.sma_sanctioning_detail_facts(classification_label, validation_status);

create table if not exists public.sma_sanctioning_detail_associations (
  version_id uuid not null
    references public.sma_sanctioning_detail_versions(id) on delete restrict,
  association_type text not null
    check (association_type = any (array['inspection'::text, 'provisional_measure'::text])),
  ordinal integer not null check (ordinal > 0),
  reference_label text,
  activity_year integer check (activity_year is null or activity_year between 2000 and 2100),
  external_id bigint check (external_id is null or external_id > 0),
  detail_url text,
  row_data jsonb not null default '{}'::jsonb,
  item_hash text not null check (item_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (version_id, association_type, ordinal),
  unique (version_id, item_hash),
  check (
    detail_url is null
    or detail_url ~ '^https://snifa[.]sma[.]gob[.]cl/(Fiscalizacion|MedidaProvisional)/Ficha/[0-9]+$'
  )
);

create index if not exists sma_detail_associations_external_idx
  on public.sma_sanctioning_detail_associations(association_type, external_id);

create table if not exists public.sma_sanctioning_detail_sanctions (
  version_id uuid not null
    references public.sma_sanctioning_detail_versions(id) on delete restrict,
  ordinal integer not null check (ordinal > 0),
  fact_text text not null check (btrim(fact_text) <> ''),
  instrument_label text,
  instrument_url text,
  infringement_text text,
  classification_label text,
  classification_detail text,
  sanction_text text not null check (btrim(sanction_text) <> ''),
  fine_uta numeric(18,3) check (fine_uta is null or fine_uta >= 0),
  item_hash text not null check (item_hash ~ '^[0-9a-f]{64}$'),
  validation_status text not null default 'pending'
    check (validation_status = any (array['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamptz not null default now(),
  primary key (version_id, ordinal),
  unique (version_id, item_hash)
);

create index if not exists sma_detail_sanctions_fine_idx
  on public.sma_sanctioning_detail_sanctions(fine_uta desc nulls last);
create index if not exists sma_detail_sanctions_classification_idx
  on public.sma_sanctioning_detail_sanctions(classification_label, validation_status);

alter table public.sma_sanctioning_detail_versions enable row level security;
alter table public.sma_sanctioning_detail_heads enable row level security;
alter table public.sma_sanctioning_detail_units enable row level security;
alter table public.sma_sanctioning_detail_holders enable row level security;
alter table public.sma_sanctioning_detail_documents enable row level security;
alter table public.sma_sanctioning_detail_facts enable row level security;
alter table public.sma_sanctioning_detail_associations enable row level security;
alter table public.sma_sanctioning_detail_sanctions enable row level security;

create policy sma_detail_versions_authenticated_read
  on public.sma_sanctioning_detail_versions for select to authenticated using (true);
create policy sma_detail_heads_authenticated_read
  on public.sma_sanctioning_detail_heads for select to authenticated using (true);
create policy sma_detail_units_authenticated_read
  on public.sma_sanctioning_detail_units for select to authenticated using (true);
create policy sma_detail_holders_authenticated_read
  on public.sma_sanctioning_detail_holders for select to authenticated using (true);
create policy sma_detail_documents_authenticated_read
  on public.sma_sanctioning_detail_documents for select to authenticated using (true);
create policy sma_detail_facts_authenticated_read
  on public.sma_sanctioning_detail_facts for select to authenticated using (true);
create policy sma_detail_associations_authenticated_read
  on public.sma_sanctioning_detail_associations for select to authenticated using (true);
create policy sma_detail_sanctions_authenticated_read
  on public.sma_sanctioning_detail_sanctions for select to authenticated using (true);

revoke all on public.sma_sanctioning_detail_versions from public, anon, authenticated;
revoke all on public.sma_sanctioning_detail_heads from public, anon, authenticated;
revoke all on public.sma_sanctioning_detail_units from public, anon, authenticated;
revoke all on public.sma_sanctioning_detail_holders from public, anon, authenticated;
revoke all on public.sma_sanctioning_detail_documents from public, anon, authenticated;
revoke all on public.sma_sanctioning_detail_facts from public, anon, authenticated;
revoke all on public.sma_sanctioning_detail_associations from public, anon, authenticated;
revoke all on public.sma_sanctioning_detail_sanctions from public, anon, authenticated;

grant select on public.sma_sanctioning_detail_versions to authenticated;
grant select on public.sma_sanctioning_detail_heads to authenticated;
grant select on public.sma_sanctioning_detail_units to authenticated;
grant select on public.sma_sanctioning_detail_holders to authenticated;
grant select on public.sma_sanctioning_detail_documents to authenticated;
grant select on public.sma_sanctioning_detail_facts to authenticated;
grant select on public.sma_sanctioning_detail_associations to authenticated;
grant select on public.sma_sanctioning_detail_sanctions to authenticated;

grant all on public.sma_sanctioning_detail_versions to service_role;
grant all on public.sma_sanctioning_detail_heads to service_role;
grant all on public.sma_sanctioning_detail_units to service_role;
grant all on public.sma_sanctioning_detail_holders to service_role;
grant all on public.sma_sanctioning_detail_documents to service_role;
grant all on public.sma_sanctioning_detail_facts to service_role;
grant all on public.sma_sanctioning_detail_associations to service_role;
grant all on public.sma_sanctioning_detail_sanctions to service_role;

create or replace function public.record_sma_sanctioning_detail(
  p_sma_process_id bigint,
  p_source_fetch_id uuid,
  p_content_hash text,
  p_payload_hash text,
  p_parser_version text,
  p_expediente text,
  p_start_date date,
  p_end_date date,
  p_process_state text,
  p_counts jsonb,
  p_units jsonb,
  p_holders jsonb,
  p_documents jsonb,
  p_facts jsonb,
  p_associations jsonb,
  p_sanctions jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_version public.sma_sanctioning_detail_versions%rowtype;
  created_version public.sma_sanctioning_detail_versions%rowtype;
  expected_url text;
  source_id uuid;
  unit_count integer;
  holder_count integer;
  document_count integer;
  fact_count integer;
  inspection_count integer;
  provisional_measure_count integer;
  sanction_count integer;
begin
  if p_content_hash !~ '^[0-9a-f]{64}$' or p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'sma_detail_invalid_hash';
  end if;

  expected_url := format('https://snifa.sma.gob.cl/Sancionatorio/Ficha/%s', p_sma_process_id);

  if not exists (
    select 1
    from public.sma_sanctioning_proceedings proceeding
    where proceeding.sma_process_id = p_sma_process_id
      and proceeding.is_current
      and proceeding.expediente = p_expediente
      and proceeding.start_date = p_start_date
      and proceeding.process_state = p_process_state
      and proceeding.proceeding_url = expected_url
  ) then
    raise exception 'sma_detail_discovery_mismatch:%', p_sma_process_id;
  end if;

  select source.id into source_id
  from public.regulatory_sources source
  where source.canonical_url = 'https://snifa.sma.gob.cl/DatosAbiertos'
    and source.is_active;

  if source_id is null or not exists (
    select 1
    from public.regulatory_source_fetches fetch
    where fetch.id = p_source_fetch_id
      and fetch.source_id = source_id
      and fetch.requested_url = expected_url
      and fetch.final_url = expected_url
      and fetch.content_hash = p_content_hash
      and fetch.status in ('succeeded', 'unchanged')
  ) then
    raise exception 'sma_detail_source_fetch_mismatch:%', p_sma_process_id;
  end if;

  if jsonb_typeof(p_counts) <> 'object'
    or jsonb_typeof(p_units) <> 'array'
    or jsonb_typeof(p_holders) <> 'array'
    or jsonb_typeof(p_documents) <> 'array'
    or jsonb_typeof(p_facts) <> 'array'
    or jsonb_typeof(p_associations) <> 'array'
    or jsonb_typeof(p_sanctions) <> 'array'
  then
    raise exception 'sma_detail_invalid_payload_shape';
  end if;

  unit_count := jsonb_array_length(p_units);
  holder_count := jsonb_array_length(p_holders);
  document_count := jsonb_array_length(p_documents);
  fact_count := jsonb_array_length(p_facts);
  sanction_count := jsonb_array_length(p_sanctions);
  select count(*) filter (where association_type = 'inspection'),
         count(*) filter (where association_type = 'provisional_measure')
  into inspection_count, provisional_measure_count
  from jsonb_to_recordset(p_associations) as association_data(association_type text);

  if unit_count <> (p_counts->>'units')::integer
    or holder_count <> (p_counts->>'holders')::integer
    or document_count <> (p_counts->>'documents')::integer
    or fact_count <> (p_counts->>'facts')::integer
    or inspection_count <> (p_counts->>'inspections')::integer
    or provisional_measure_count <> (p_counts->>'provisionalMeasures')::integer
    or sanction_count <> (p_counts->>'sanctions')::integer
  then
    raise exception 'sma_detail_count_mismatch:%', p_sma_process_id;
  end if;

  select * into existing_version
  from public.sma_sanctioning_detail_versions version
  where version.sma_process_id = p_sma_process_id
    and version.content_hash = p_content_hash
    and version.parser_version = p_parser_version
  limit 1;

  if found then
    return jsonb_build_object(
      'status', 'unchanged',
      'versionId', existing_version.id,
      'processId', p_sma_process_id,
      'documents', existing_version.document_count,
      'facts', existing_version.fact_count,
      'sanctions', existing_version.sanction_count
    );
  end if;

  insert into public.sma_sanctioning_detail_versions (
    sma_process_id, source_fetch_id, content_hash, payload_hash, parser_version,
    expediente, start_date, end_date, process_state,
    unit_count, holder_count, document_count, fact_count, inspection_count,
    provisional_measure_count, sanction_count, validation_status, metadata
  ) values (
    p_sma_process_id, p_source_fetch_id, p_content_hash, p_payload_hash,
    p_parser_version, p_expediente, p_start_date, p_end_date, p_process_state,
    unit_count, holder_count, document_count, fact_count, inspection_count,
    provisional_measure_count, sanction_count, 'pending',
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'requiresHumanReview', true,
      'factsAreNotAutoValidatedClaims', true
    )
  ) returning * into created_version;

  insert into public.sma_sanctioning_detail_units (
    version_id, ordinal, sma_unit_id, unit_name, location_text,
    latitude, longitude, unit_url, item_hash
  )
  select created_version.id, ordinal, sma_unit_id, unit_name, location_text,
         latitude, longitude, unit_url, item_hash
  from jsonb_to_recordset(p_units) as unit_data(
    ordinal integer,
    sma_unit_id bigint,
    unit_name text,
    location_text text,
    latitude numeric,
    longitude numeric,
    unit_url text,
    item_hash text
  );

  insert into public.sma_sanctioning_detail_holders (
    version_id, ordinal, holder_name, item_hash
  )
  select created_version.id, ordinal, holder_name, item_hash
  from jsonb_to_recordset(p_holders) as holder_data(
    ordinal integer,
    holder_name text,
    item_hash text
  );

  insert into public.sma_sanctioning_detail_documents (
    version_id, ordinal, document_name, document_type, document_date,
    download_id, download_url, item_hash
  )
  select created_version.id, ordinal, document_name, document_type,
         document_date, download_id, download_url, item_hash
  from jsonb_to_recordset(p_documents) as document_data(
    ordinal integer,
    document_name text,
    document_type text,
    document_date date,
    download_id bigint,
    download_url text,
    item_hash text
  );

  insert into public.sma_sanctioning_detail_facts (
    version_id, ordinal, fact_text, instrument_label, instrument_url,
    infringement_text, classification_label, classification_detail,
    item_hash, validation_status
  )
  select created_version.id, ordinal, fact_text, instrument_label,
         instrument_url, infringement_text, classification_label,
         classification_detail, item_hash, 'pending'
  from jsonb_to_recordset(p_facts) as fact_data(
    ordinal integer,
    fact_text text,
    instrument_label text,
    instrument_url text,
    infringement_text text,
    classification_label text,
    classification_detail text,
    item_hash text
  );

  insert into public.sma_sanctioning_detail_associations (
    version_id, association_type, ordinal, reference_label, activity_year,
    external_id, detail_url, row_data, item_hash
  )
  select created_version.id, association_type, ordinal, reference_label,
         activity_year, external_id, detail_url, row_data, item_hash
  from jsonb_to_recordset(p_associations) as association_data(
    association_type text,
    ordinal integer,
    reference_label text,
    activity_year integer,
    external_id bigint,
    detail_url text,
    row_data jsonb,
    item_hash text
  );

  insert into public.sma_sanctioning_detail_sanctions (
    version_id, ordinal, fact_text, instrument_label, instrument_url,
    infringement_text, classification_label, classification_detail,
    sanction_text, fine_uta, item_hash, validation_status
  )
  select created_version.id, ordinal, fact_text, instrument_label,
         instrument_url, infringement_text, classification_label,
         classification_detail, sanction_text, fine_uta, item_hash, 'pending'
  from jsonb_to_recordset(p_sanctions) as sanction_data(
    ordinal integer,
    fact_text text,
    instrument_label text,
    instrument_url text,
    infringement_text text,
    classification_label text,
    classification_detail text,
    sanction_text text,
    fine_uta numeric,
    item_hash text
  );

  insert into public.sma_sanctioning_detail_heads (
    sma_process_id, current_version_id, updated_at
  ) values (p_sma_process_id, created_version.id, now())
  on conflict (sma_process_id) do update
  set current_version_id = excluded.current_version_id,
      updated_at = now();

  update public.sma_sanctioning_proceedings
  set metadata = metadata || jsonb_build_object(
        'detailHydrated', true,
        'currentDetailVersionId', created_version.id,
        'detailParserVersion', p_parser_version,
        'detailValidationStatus', 'pending'
      ),
      updated_at = now()
  where sma_process_id = p_sma_process_id;

  return jsonb_build_object(
    'status', 'captured',
    'versionId', created_version.id,
    'processId', p_sma_process_id,
    'documents', document_count,
    'facts', fact_count,
    'inspections', inspection_count,
    'provisionalMeasures', provisional_measure_count,
    'sanctions', sanction_count
  );
end;
$$;

revoke all on function public.record_sma_sanctioning_detail(
  bigint, uuid, text, text, text, text, date, date, text,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb
) from public, anon, authenticated;

grant execute on function public.record_sma_sanctioning_detail(
  bigint, uuid, text, text, text, text, date, date, text,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb
) to service_role;

commit;
