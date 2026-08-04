begin;

create extension if not exists pgcrypto;

alter table public.regulatory_sources
  drop constraint if exists regulatory_sources_ingestion_method_check;
alter table public.regulatory_sources
  add constraint regulatory_sources_ingestion_method_check
  check (ingestion_method = any (array[
    'api'::text, 'feed'::text, 'json'::text, 'official_json'::text,
    'html'::text, 'pdf'::text, 'csv'::text, 'manual'::text
  ]));

alter table public.scraper_connectors
  drop constraint if exists scraper_connectors_adapter_type_check;
alter table public.scraper_connectors
  add constraint scraper_connectors_adapter_type_check
  check (adapter_type = any (array[
    'html'::text, 'pdf'::text, 'json'::text, 'xml'::text,
    'rss'::text, 'api'::text, 'csv'::text, 'manual'::text
  ]));

insert into public.regulatory_sources (
  authority_name,
  source_name,
  canonical_url,
  domain,
  jurisdiction,
  source_type,
  authority_level,
  ingestion_method,
  terms_review_status,
  health_status,
  connector_version,
  is_active,
  metadata
)
values (
  'Superintendencia del Medio Ambiente',
  'SNIFA Datos Abiertos — Procedimientos Sancionatorios',
  'https://snifa.sma.gob.cl/DatosAbiertos',
  'environmental_compliance',
  'CL',
  'other',
  'primary',
  'csv',
  'approved',
  'healthy',
  'sma-snifa-sanctioning-v1',
  true,
  jsonb_build_object(
    'officialPublicSource', true,
    'sourceRole', 'official_enforcement_index',
    'datasetKey', 'sanctioning_proceedings',
    'sourceFileId', '1hPEwmUFZpmD7xFbJy-kjhhzjplnUB1mH',
    'sourceFolderUrl', 'https://drive.google.com/drive/folders/1O7o60LzQ-qH8xiK_-Ofqw_mZzti_gbEr',
    'detailBaseUrl', 'https://snifa.sma.gob.cl/Sancionatorio/Ficha/',
    'datasetIsDiscoveryIndex', true,
    'detailHydrationRequired', true,
    'claimsAreNotAutoValidated', true,
    'humanReviewRequired', true,
    'licenseContext', 'official_open_data'
  )
)
on conflict (canonical_url) do update
set authority_name = excluded.authority_name,
    source_name = excluded.source_name,
    domain = excluded.domain,
    source_type = excluded.source_type,
    authority_level = excluded.authority_level,
    ingestion_method = excluded.ingestion_method,
    terms_review_status = excluded.terms_review_status,
    health_status = excluded.health_status,
    connector_version = excluded.connector_version,
    is_active = true,
    metadata = public.regulatory_sources.metadata || excluded.metadata,
    updated_at = now();

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
  'sma-snifa-sanctioning',
  'SMA / SNIFA — Procedimientos sancionatorios',
  'sma-snifa-sanctioning-v1',
  'csv',
  'manual',
  array['drive.usercontent.google.com', 'drive.google.com', 'snifa.sma.gob.cl'],
  array['^/download$', '^/uc$', '^/Sancionatorio/Ficha/[0-9]+$'],
  array['application/octet-stream', 'application/binary', 'text/csv', 'text/html'],
  60000,
  5242880,
  0,
  3,
  array[10, 30, 90],
  3,
  3600,
  'closed',
  0,
  'healthy',
  'KUMPLIO-Regulatory-Connector/1.0 (+https://kumplio.app/regulatory)',
  'https://snifa.sma.gob.cl/DatosAbiertos',
  jsonb_build_object(
    'datasetKey', 'sanctioning_proceedings',
    'sourceFileId', '1hPEwmUFZpmD7xFbJy-kjhhzjplnUB1mH',
    'downloadUrl', 'https://drive.usercontent.google.com/download?id=1hPEwmUFZpmD7xFbJy-kjhhzjplnUB1mH&export=download&confirm=t',
    'expectedEncoding', 'windows-1252',
    'expectedDelimiter', ';',
    'expectedColumnCount', 19,
    'minimumExpectedRows', 3000,
    'detailHydrationRequired', true,
    'schedulingReadiness', 'first_snapshot_required',
    'schedulingStatus', 'manual_until_two_verified_snapshots',
    'humanReviewRequired', true
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

create table if not exists public.sma_dataset_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.regulatory_sources(id) on delete restrict,
  source_fetch_id uuid not null unique references public.regulatory_source_fetches(id) on delete restrict,
  dataset_key text not null check (dataset_key = 'sanctioning_proceedings'),
  source_file_id text not null,
  source_modified_at timestamptz,
  source_updated_date date,
  captured_at timestamptz not null default now(),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 5242880),
  raw_row_count integer not null check (raw_row_count > 0),
  proceeding_count integer,
  fiscalizable_unit_count integer,
  relation_count integer,
  parser_version text not null,
  status text not null default 'processing'
    check (status = any (array['processing'::text, 'succeeded'::text, 'unchanged'::text, 'failed'::text])),
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (status in ('processing', 'failed'))
    or (
      proceeding_count is not null
      and fiscalizable_unit_count is not null
      and relation_count is not null
      and completed_at is not null
    )
  )
);

create unique index if not exists sma_dataset_snapshots_active_hash_idx
  on public.sma_dataset_snapshots(source_id, dataset_key, content_hash)
  where status in ('processing', 'succeeded');
create index if not exists sma_dataset_snapshots_source_captured_idx
  on public.sma_dataset_snapshots(source_id, captured_at desc);
create index if not exists sma_dataset_snapshots_status_idx
  on public.sma_dataset_snapshots(status, captured_at desc);

create table if not exists public.sma_sanctioning_snapshot_rows (
  snapshot_id uuid not null references public.sma_dataset_snapshots(id) on delete restrict,
  row_number integer not null check (row_number > 0),
  sma_process_id bigint not null check (sma_process_id > 0),
  expediente text not null check (expediente ~ '^[A-Z]+-[0-9]{3}-[0-9]{4}$'),
  process_type text not null check (process_type = any (array[
    'Autodenuncia'::text,
    'Denuncia'::text,
    'Fiscalización'::text,
    'Programa de Cumplimiento'::text
  ])),
  process_state text not null check (process_state = any (array[
    'En curso'::text,
    'Programa de Cumplimiento en ejecución'::text,
    'Suspendido'::text,
    'Terminado - Absolución'::text,
    'Terminado - Archivado'::text,
    'Terminado - PDC Satisfactorio'::text,
    'Terminado - Sanción'::text
  ])),
  start_date date not null,
  end_date date,
  confirms_pdc boolean not null,
  fine_total_uta numeric(18,3) check (fine_total_uta is null or fine_total_uta >= 0),
  proceeding_url text not null check (proceeding_url ~ '^https://snifa[.]sma[.]gob[.]cl/Sancionatorio/Ficha/[0-9]+$'),
  sma_unit_id bigint not null check (sma_unit_id > 0),
  unit_name text not null check (btrim(unit_name) <> ''),
  region_name text not null check (btrim(region_name) <> ''),
  commune_name text not null check (btrim(commune_name) <> ''),
  latitude numeric(12,8) check (latitude is null or latitude between -60 and -15),
  longitude numeric(12,8) check (longitude is null or longitude between -82 and -65),
  economic_category text not null check (btrim(economic_category) <> ''),
  economic_subcategory text not null check (btrim(economic_subcategory) <> ''),
  unit_url text not null check (unit_url ~ '^https://snifa[.]sma[.]gob[.]cl/UnidadFiscalizable/Ficha/[0-9]+$'),
  source_update_date date not null,
  process_hash text not null check (process_hash ~ '^[0-9a-f]{64}$'),
  unit_hash text not null check (unit_hash ~ '^[0-9a-f]{64}$'),
  row_hash text not null check (row_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (snapshot_id, row_number),
  unique (snapshot_id, sma_process_id, sma_unit_id),
  check (end_date is null or end_date >= start_date)
);

create index if not exists sma_snapshot_rows_process_idx
  on public.sma_sanctioning_snapshot_rows(snapshot_id, sma_process_id);
create index if not exists sma_snapshot_rows_unit_idx
  on public.sma_sanctioning_snapshot_rows(snapshot_id, sma_unit_id);
create index if not exists sma_snapshot_rows_state_idx
  on public.sma_sanctioning_snapshot_rows(snapshot_id, process_state);
create index if not exists sma_snapshot_rows_category_idx
  on public.sma_sanctioning_snapshot_rows(snapshot_id, economic_category);
create index if not exists sma_snapshot_rows_region_idx
  on public.sma_sanctioning_snapshot_rows(snapshot_id, region_name);

create table if not exists public.sma_sanctioning_proceedings (
  sma_process_id bigint primary key check (sma_process_id > 0),
  expediente text not null unique check (expediente ~ '^[A-Z]+-[0-9]{3}-[0-9]{4}$'),
  process_type text not null,
  process_state text not null,
  start_date date not null,
  end_date date,
  confirms_pdc boolean not null,
  fine_total_uta numeric(18,3),
  proceeding_url text not null,
  source_update_date date not null,
  source_snapshot_id uuid not null references public.sma_dataset_snapshots(id) on delete restrict,
  row_hash text not null check (row_hash ~ '^[0-9a-f]{64}$'),
  is_current boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists sma_proceedings_current_state_idx
  on public.sma_sanctioning_proceedings(process_state, start_date desc)
  where is_current;
create index if not exists sma_proceedings_current_fine_idx
  on public.sma_sanctioning_proceedings(fine_total_uta desc nulls last)
  where is_current;
create index if not exists sma_proceedings_source_update_idx
  on public.sma_sanctioning_proceedings(source_update_date desc);

create table if not exists public.sma_fiscalizable_units (
  sma_unit_id bigint primary key check (sma_unit_id > 0),
  unit_name text not null,
  region_name text not null,
  commune_name text not null,
  latitude numeric(12,8),
  longitude numeric(12,8),
  economic_category text not null,
  economic_subcategory text not null,
  unit_url text not null,
  source_snapshot_id uuid not null references public.sma_dataset_snapshots(id) on delete restrict,
  row_hash text not null check (row_hash ~ '^[0-9a-f]{64}$'),
  is_current boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists sma_units_current_region_idx
  on public.sma_fiscalizable_units(region_name, commune_name)
  where is_current;
create index if not exists sma_units_current_category_idx
  on public.sma_fiscalizable_units(economic_category, economic_subcategory)
  where is_current;
create index if not exists sma_units_name_idx
  on public.sma_fiscalizable_units using gin (to_tsvector('spanish', unit_name));

create table if not exists public.sma_proceeding_units (
  sma_process_id bigint not null references public.sma_sanctioning_proceedings(sma_process_id) on delete restrict,
  sma_unit_id bigint not null references public.sma_fiscalizable_units(sma_unit_id) on delete restrict,
  source_snapshot_id uuid not null references public.sma_dataset_snapshots(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (sma_process_id, sma_unit_id)
);

create index if not exists sma_proceeding_units_unit_idx
  on public.sma_proceeding_units(sma_unit_id, sma_process_id);
create index if not exists sma_proceeding_units_snapshot_idx
  on public.sma_proceeding_units(source_snapshot_id);

alter table public.sma_dataset_snapshots enable row level security;
alter table public.sma_sanctioning_snapshot_rows enable row level security;
alter table public.sma_sanctioning_proceedings enable row level security;
alter table public.sma_fiscalizable_units enable row level security;
alter table public.sma_proceeding_units enable row level security;

drop policy if exists sma_snapshots_authenticated_read on public.sma_dataset_snapshots;
create policy sma_snapshots_authenticated_read
  on public.sma_dataset_snapshots for select to authenticated using (status in ('succeeded', 'unchanged'));
drop policy if exists sma_snapshot_rows_authenticated_read on public.sma_sanctioning_snapshot_rows;
create policy sma_snapshot_rows_authenticated_read
  on public.sma_sanctioning_snapshot_rows for select to authenticated
  using (exists (
    select 1 from public.sma_dataset_snapshots snapshot
    where snapshot.id = snapshot_id and snapshot.status in ('succeeded', 'unchanged')
  ));
drop policy if exists sma_proceedings_authenticated_read on public.sma_sanctioning_proceedings;
create policy sma_proceedings_authenticated_read
  on public.sma_sanctioning_proceedings for select to authenticated using (true);
drop policy if exists sma_units_authenticated_read on public.sma_fiscalizable_units;
create policy sma_units_authenticated_read
  on public.sma_fiscalizable_units for select to authenticated using (true);
drop policy if exists sma_links_authenticated_read on public.sma_proceeding_units;
create policy sma_links_authenticated_read
  on public.sma_proceeding_units for select to authenticated using (true);

revoke all on public.sma_dataset_snapshots from public, anon, authenticated;
revoke all on public.sma_sanctioning_snapshot_rows from public, anon, authenticated;
revoke all on public.sma_sanctioning_proceedings from public, anon, authenticated;
revoke all on public.sma_fiscalizable_units from public, anon, authenticated;
revoke all on public.sma_proceeding_units from public, anon, authenticated;
grant select on public.sma_dataset_snapshots to authenticated;
grant select on public.sma_sanctioning_snapshot_rows to authenticated;
grant select on public.sma_sanctioning_proceedings to authenticated;
grant select on public.sma_fiscalizable_units to authenticated;
grant select on public.sma_proceeding_units to authenticated;
grant all on public.sma_dataset_snapshots to service_role;
grant all on public.sma_sanctioning_snapshot_rows to service_role;
grant all on public.sma_sanctioning_proceedings to service_role;
grant all on public.sma_fiscalizable_units to service_role;
grant all on public.sma_proceeding_units to service_role;

create or replace function public.begin_sma_sanctioning_snapshot(
  p_source_id uuid,
  p_source_fetch_id uuid,
  p_source_file_id text,
  p_source_modified_at timestamptz,
  p_source_updated_date date,
  p_content_hash text,
  p_byte_size bigint,
  p_raw_row_count integer,
  p_parser_version text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_snapshot public.sma_dataset_snapshots%rowtype;
  created_snapshot public.sma_dataset_snapshots%rowtype;
begin
  if p_content_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'sma_invalid_content_hash';
  end if;
  if p_raw_row_count < 3000 then
    raise exception 'sma_unexpected_row_count:%', p_raw_row_count;
  end if;
  if not exists (
    select 1 from public.regulatory_sources source
    where source.id = p_source_id
      and source.canonical_url = 'https://snifa.sma.gob.cl/DatosAbiertos'
      and source.is_active
  ) then
    raise exception 'sma_source_not_registered';
  end if;

  select * into existing_snapshot
  from public.sma_dataset_snapshots snapshot
  where snapshot.source_id = p_source_id
    and snapshot.dataset_key = 'sanctioning_proceedings'
    and snapshot.content_hash = p_content_hash
    and snapshot.status in ('processing', 'succeeded')
  order by snapshot.created_at desc
  limit 1;

  if found then
    return jsonb_build_object(
      'snapshotId', existing_snapshot.id,
      'status', case when existing_snapshot.status = 'succeeded' then 'unchanged' else 'resumed' end,
      'proceedingCount', existing_snapshot.proceeding_count,
      'unitCount', existing_snapshot.fiscalizable_unit_count,
      'relationCount', existing_snapshot.relation_count
    );
  end if;

  insert into public.sma_dataset_snapshots (
    source_id,
    source_fetch_id,
    dataset_key,
    source_file_id,
    source_modified_at,
    source_updated_date,
    content_hash,
    byte_size,
    raw_row_count,
    parser_version,
    status,
    metadata
  ) values (
    p_source_id,
    p_source_fetch_id,
    'sanctioning_proceedings',
    p_source_file_id,
    p_source_modified_at,
    p_source_updated_date,
    p_content_hash,
    p_byte_size,
    p_raw_row_count,
    p_parser_version,
    'processing',
    coalesce(p_metadata, '{}'::jsonb)
  ) returning * into created_snapshot;

  return jsonb_build_object('snapshotId', created_snapshot.id, 'status', 'processing');
end;
$$;

create or replace function public.record_sma_sanctioning_batch(
  p_snapshot_id uuid,
  p_rows jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  batch_size integer;
  inserted_count integer;
begin
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'sma_batch_must_be_array';
  end if;
  batch_size := jsonb_array_length(p_rows);
  if batch_size < 1 or batch_size > 500 then
    raise exception 'sma_invalid_batch_size:%', batch_size;
  end if;
  if not exists (
    select 1 from public.sma_dataset_snapshots snapshot
    where snapshot.id = p_snapshot_id and snapshot.status = 'processing'
  ) then
    raise exception 'sma_snapshot_not_processing';
  end if;

  if exists (
    with incoming as (
      select
        row_number,
        sma_process_id,
        expediente,
        process_type,
        process_state,
        start_date,
        end_date,
        confirms_pdc,
        fine_total_uta,
        proceeding_url,
        sma_unit_id,
        unit_name,
        region_name,
        commune_name,
        latitude,
        longitude,
        economic_category,
        economic_subcategory,
        unit_url,
        source_update_date,
        encode(digest(concat_ws(E'\x1f',
          sma_process_id::text, expediente, process_type, process_state,
          start_date::text, coalesce(end_date::text, ''), confirms_pdc::text,
          coalesce(fine_total_uta::text, ''), proceeding_url, source_update_date::text
        ), 'sha256'), 'hex') as process_hash,
        encode(digest(concat_ws(E'\x1f',
          sma_unit_id::text, lower(unit_name), lower(region_name), lower(commune_name),
          coalesce(latitude::text, ''), coalesce(longitude::text, ''),
          lower(economic_category), lower(economic_subcategory), unit_url
        ), 'sha256'), 'hex') as unit_hash
      from jsonb_to_recordset(p_rows) as row_data(
        row_number integer,
        sma_process_id bigint,
        expediente text,
        process_type text,
        process_state text,
        start_date date,
        end_date date,
        confirms_pdc boolean,
        fine_total_uta numeric,
        proceeding_url text,
        sma_unit_id bigint,
        unit_name text,
        region_name text,
        commune_name text,
        latitude numeric,
        longitude numeric,
        economic_category text,
        economic_subcategory text,
        unit_url text,
        source_update_date date
      )
    ), hashed as (
      select incoming.*,
        encode(digest(process_hash || E'\x1f' || unit_hash, 'sha256'), 'hex') as row_hash
      from incoming
    )
    select 1
    from hashed incoming
    join public.sma_sanctioning_snapshot_rows existing
      on existing.snapshot_id = p_snapshot_id
     and existing.row_number = incoming.row_number
    where existing.row_hash <> incoming.row_hash
  ) then
    raise exception 'sma_batch_conflicts_with_existing_rows';
  end if;

  with incoming as (
    select
      row_number,
      sma_process_id,
      expediente,
      process_type,
      process_state,
      start_date,
      end_date,
      confirms_pdc,
      fine_total_uta,
      proceeding_url,
      sma_unit_id,
      unit_name,
      region_name,
      commune_name,
      latitude,
      longitude,
      economic_category,
      economic_subcategory,
      unit_url,
      source_update_date,
      encode(digest(concat_ws(E'\x1f',
        sma_process_id::text, expediente, process_type, process_state,
        start_date::text, coalesce(end_date::text, ''), confirms_pdc::text,
        coalesce(fine_total_uta::text, ''), proceeding_url, source_update_date::text
      ), 'sha256'), 'hex') as process_hash,
      encode(digest(concat_ws(E'\x1f',
        sma_unit_id::text, lower(unit_name), lower(region_name), lower(commune_name),
        coalesce(latitude::text, ''), coalesce(longitude::text, ''),
        lower(economic_category), lower(economic_subcategory), unit_url
      ), 'sha256'), 'hex') as unit_hash
    from jsonb_to_recordset(p_rows) as row_data(
      row_number integer,
      sma_process_id bigint,
      expediente text,
      process_type text,
      process_state text,
      start_date date,
      end_date date,
      confirms_pdc boolean,
      fine_total_uta numeric,
      proceeding_url text,
      sma_unit_id bigint,
      unit_name text,
      region_name text,
      commune_name text,
      latitude numeric,
      longitude numeric,
      economic_category text,
      economic_subcategory text,
      unit_url text,
      source_update_date date
    )
  ), hashed as (
    select incoming.*,
      encode(digest(process_hash || E'\x1f' || unit_hash, 'sha256'), 'hex') as row_hash
    from incoming
  ), inserted as (
    insert into public.sma_sanctioning_snapshot_rows (
      snapshot_id, row_number, sma_process_id, expediente, process_type,
      process_state, start_date, end_date, confirms_pdc, fine_total_uta,
      proceeding_url, sma_unit_id, unit_name, region_name, commune_name,
      latitude, longitude, economic_category, economic_subcategory, unit_url,
      source_update_date, process_hash, unit_hash, row_hash
    )
    select
      p_snapshot_id, row_number, sma_process_id, expediente, process_type,
      process_state, start_date, end_date, confirms_pdc, fine_total_uta,
      proceeding_url, sma_unit_id, unit_name, region_name, commune_name,
      latitude, longitude, economic_category, economic_subcategory, unit_url,
      source_update_date, process_hash, unit_hash, row_hash
    from hashed
    where proceeding_url = format('https://snifa.sma.gob.cl/Sancionatorio/Ficha/%s', sma_process_id)
      and unit_url = format('https://snifa.sma.gob.cl/UnidadFiscalizable/Ficha/%s', sma_unit_id)
    on conflict (snapshot_id, row_number) do nothing
    returning 1
  )
  select count(*) into inserted_count from inserted;

  if inserted_count + (
    select count(*) from public.sma_sanctioning_snapshot_rows existing
    join jsonb_to_recordset(p_rows) as incoming(row_number integer)
      on existing.snapshot_id = p_snapshot_id and existing.row_number = incoming.row_number
  ) < batch_size then
    raise exception 'sma_batch_contains_invalid_urls_or_rows';
  end if;

  return jsonb_build_object(
    'status', case when inserted_count = 0 then 'unchanged' else 'inserted' end,
    'batchSize', batch_size,
    'inserted', inserted_count
  );
end;
$$;

create or replace function public.complete_sma_sanctioning_snapshot(
  p_snapshot_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_snapshot public.sma_dataset_snapshots%rowtype;
  actual_rows integer;
  actual_proceedings integer;
  actual_units integer;
  actual_relations integer;
  verified_snapshot_count integer;
begin
  select * into target_snapshot
  from public.sma_dataset_snapshots
  where id = p_snapshot_id
  for update;

  if not found then
    raise exception 'sma_snapshot_not_found';
  end if;
  if target_snapshot.status = 'succeeded' then
    return jsonb_build_object(
      'status', 'unchanged',
      'snapshotId', target_snapshot.id,
      'rows', target_snapshot.raw_row_count,
      'proceedings', target_snapshot.proceeding_count,
      'units', target_snapshot.fiscalizable_unit_count,
      'relations', target_snapshot.relation_count
    );
  end if;
  if target_snapshot.status <> 'processing' then
    raise exception 'sma_snapshot_not_processing';
  end if;

  select count(*), count(distinct sma_process_id), count(distinct sma_unit_id)
  into actual_rows, actual_proceedings, actual_units
  from public.sma_sanctioning_snapshot_rows
  where snapshot_id = p_snapshot_id;

  select count(*) into actual_relations
  from (
    select distinct sma_process_id, sma_unit_id
    from public.sma_sanctioning_snapshot_rows
    where snapshot_id = p_snapshot_id
  ) relations;

  if actual_rows <> target_snapshot.raw_row_count then
    raise exception 'sma_snapshot_row_count_mismatch:%:%', target_snapshot.raw_row_count, actual_rows;
  end if;
  if actual_proceedings < 3000 or actual_units < 2500 then
    raise exception 'sma_snapshot_unexpected_cardinality:%:%', actual_proceedings, actual_units;
  end if;
  if exists (
    select 1
    from public.sma_sanctioning_snapshot_rows
    where snapshot_id = p_snapshot_id
    group by sma_process_id
    having count(distinct process_hash) > 1
  ) then
    raise exception 'sma_process_fields_inconsistent_within_snapshot';
  end if;

  update public.sma_sanctioning_proceedings set is_current = false, updated_at = now();
  update public.sma_fiscalizable_units set is_current = false, updated_at = now();

  insert into public.sma_sanctioning_proceedings (
    sma_process_id, expediente, process_type, process_state, start_date,
    end_date, confirms_pdc, fine_total_uta, proceeding_url,
    source_update_date, source_snapshot_id, row_hash, is_current,
    first_seen_at, last_seen_at, metadata, updated_at
  )
  select distinct on (row.sma_process_id)
    row.sma_process_id,
    row.expediente,
    row.process_type,
    row.process_state,
    row.start_date,
    row.end_date,
    row.confirms_pdc,
    row.fine_total_uta,
    row.proceeding_url,
    row.source_update_date,
    p_snapshot_id,
    row.process_hash,
    true,
    now(),
    now(),
    jsonb_build_object('source', 'SNIFA Datos Abiertos', 'detailHydrationRequired', true),
    now()
  from public.sma_sanctioning_snapshot_rows row
  where row.snapshot_id = p_snapshot_id
  order by row.sma_process_id, row.row_number
  on conflict (sma_process_id) do update
  set expediente = excluded.expediente,
      process_type = excluded.process_type,
      process_state = excluded.process_state,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      confirms_pdc = excluded.confirms_pdc,
      fine_total_uta = excluded.fine_total_uta,
      proceeding_url = excluded.proceeding_url,
      source_update_date = excluded.source_update_date,
      source_snapshot_id = excluded.source_snapshot_id,
      row_hash = excluded.row_hash,
      is_current = true,
      last_seen_at = now(),
      metadata = public.sma_sanctioning_proceedings.metadata || excluded.metadata,
      updated_at = now();

  insert into public.sma_fiscalizable_units (
    sma_unit_id, unit_name, region_name, commune_name, latitude, longitude,
    economic_category, economic_subcategory, unit_url, source_snapshot_id,
    row_hash, is_current, first_seen_at, last_seen_at, metadata, updated_at
  )
  select distinct on (row.sma_unit_id)
    row.sma_unit_id,
    row.unit_name,
    row.region_name,
    row.commune_name,
    row.latitude,
    row.longitude,
    row.economic_category,
    row.economic_subcategory,
    row.unit_url,
    p_snapshot_id,
    row.unit_hash,
    true,
    now(),
    now(),
    jsonb_build_object('source', 'SNIFA Datos Abiertos'),
    now()
  from public.sma_sanctioning_snapshot_rows row
  where row.snapshot_id = p_snapshot_id
  order by row.sma_unit_id, row.source_update_date desc, row.start_date desc, row.sma_process_id desc
  on conflict (sma_unit_id) do update
  set unit_name = excluded.unit_name,
      region_name = excluded.region_name,
      commune_name = excluded.commune_name,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      economic_category = excluded.economic_category,
      economic_subcategory = excluded.economic_subcategory,
      unit_url = excluded.unit_url,
      source_snapshot_id = excluded.source_snapshot_id,
      row_hash = excluded.row_hash,
      is_current = true,
      last_seen_at = now(),
      metadata = public.sma_fiscalizable_units.metadata || excluded.metadata,
      updated_at = now();

  delete from public.sma_proceeding_units;
  insert into public.sma_proceeding_units (
    sma_process_id, sma_unit_id, source_snapshot_id, created_at, updated_at
  )
  select distinct sma_process_id, sma_unit_id, p_snapshot_id, now(), now()
  from public.sma_sanctioning_snapshot_rows
  where snapshot_id = p_snapshot_id;

  update public.sma_dataset_snapshots
  set proceeding_count = actual_proceedings,
      fiscalizable_unit_count = actual_units,
      relation_count = actual_relations,
      status = 'succeeded',
      completed_at = now(),
      metadata = metadata || jsonb_build_object(
        'actualRows', actual_rows,
        'proceedingCount', actual_proceedings,
        'fiscalizableUnitCount', actual_units,
        'relationCount', actual_relations,
        'detailHydrationRequired', true,
        'humanReviewRequired', true
      )
  where id = p_snapshot_id;

  select count(*) into verified_snapshot_count
  from public.sma_dataset_snapshots
  where source_id = target_snapshot.source_id and status = 'succeeded';

  update public.regulatory_sources
  set health_status = 'healthy',
      connector_version = target_snapshot.parser_version,
      last_successful_fetch_at = now(),
      last_error_at = null,
      last_error_code = null,
      metadata = metadata || jsonb_build_object(
        'lastSnapshotId', p_snapshot_id,
        'lastSourceUpdatedDate', target_snapshot.source_updated_date,
        'lastRowCount', actual_rows,
        'lastProceedingCount', actual_proceedings,
        'lastFiscalizableUnitCount', actual_units,
        'verifiedSnapshotCount', verified_snapshot_count,
        'detailHydrationRequired', true
      ),
      updated_at = now()
  where id = target_snapshot.source_id;

  update public.scraper_connectors
  set status = 'manual',
      parser_health = 'healthy',
      parser_health_checked_at = now(),
      circuit_state = 'closed',
      consecutive_failures = 0,
      last_succeeded_at = now(),
      last_error_code = null,
      metadata = metadata || jsonb_build_object(
        'lastSnapshotId', p_snapshot_id,
        'lastSourceUpdatedDate', target_snapshot.source_updated_date,
        'lastRowCount', actual_rows,
        'lastProceedingCount', actual_proceedings,
        'lastFiscalizableUnitCount', actual_units,
        'verifiedSnapshotCount', verified_snapshot_count,
        'schedulingReadiness', case when verified_snapshot_count >= 2 then 'ready' else 'first_snapshot_verified' end,
        'schedulingStatus', case when verified_snapshot_count >= 2 then 'manual_until_schedule_approved' else 'manual_until_two_verified_snapshots' end,
        'detailHydrationRequired', true
      ),
      updated_at = now()
  where source_id = target_snapshot.source_id
    and connector_key = 'sma-snifa-sanctioning';

  return jsonb_build_object(
    'status', 'succeeded',
    'snapshotId', p_snapshot_id,
    'rows', actual_rows,
    'proceedings', actual_proceedings,
    'units', actual_units,
    'relations', actual_relations,
    'verifiedSnapshotCount', verified_snapshot_count
  );
end;
$$;

revoke all on function public.begin_sma_sanctioning_snapshot(uuid,uuid,text,timestamptz,date,text,bigint,integer,text,jsonb)
  from public, anon, authenticated;
revoke all on function public.record_sma_sanctioning_batch(uuid,jsonb)
  from public, anon, authenticated;
revoke all on function public.complete_sma_sanctioning_snapshot(uuid)
  from public, anon, authenticated;
grant execute on function public.begin_sma_sanctioning_snapshot(uuid,uuid,text,timestamptz,date,text,bigint,integer,text,jsonb)
  to service_role;
grant execute on function public.record_sma_sanctioning_batch(uuid,jsonb)
  to service_role;
grant execute on function public.complete_sma_sanctioning_snapshot(uuid)
  to service_role;

commit;
