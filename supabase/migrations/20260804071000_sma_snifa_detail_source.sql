begin;

insert into public.scraper_connectors (
  source_id, connector_key, display_name, connector_version, adapter_type,
  status, allowed_hosts, allowed_path_patterns, allowed_mime_types,
  timeout_ms, max_response_bytes, max_redirects, max_attempts,
  retry_backoff_seconds, failure_threshold, circuit_open_seconds,
  circuit_state, consecutive_failures, parser_health, user_agent,
  terms_reference, metadata
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

create table public.sma_sanctioning_detail_versions (
  id uuid primary key default gen_random_uuid(),
  sma_process_id bigint not null references public.sma_sanctioning_proceedings(sma_process_id) on delete restrict,
  source_fetch_id uuid not null unique references public.regulatory_source_fetches(id) on delete restrict,
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
    check (validation_status = any (array['pending'::text,'approved'::text,'rejected'::text])),
  metadata jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (sma_process_id, content_hash, parser_version),
  check (end_date is null or end_date >= start_date)
);

create table public.sma_sanctioning_detail_heads (
  sma_process_id bigint primary key references public.sma_sanctioning_proceedings(sma_process_id) on delete restrict,
  current_version_id uuid not null unique references public.sma_sanctioning_detail_versions(id) on delete restrict,
  updated_at timestamptz not null default now()
);

commit;
