-- KUMPLIO LeyChile official JSON connector — production stabilization

begin;

alter table public.regulatory_sources
  drop constraint if exists regulatory_sources_ingestion_method_check;
alter table public.regulatory_sources
  add constraint regulatory_sources_ingestion_method_check
  check (ingestion_method in ('api','feed','json','official_json','html','pdf','manual'));

drop index if exists public.regulatory_source_fetches_hash_uidx;
create index if not exists regulatory_source_fetches_hash_idx
  on public.regulatory_source_fetches (source_id, content_hash, fetched_at desc)
  where content_hash is not null;

alter table public.regulatory_document_sections
  drop constraint if exists regulatory_document_sections_version_id_section_hash_key;
create index if not exists regulatory_document_sections_version_hash_idx
  on public.regulatory_document_sections (version_id, section_hash);

create or replace function public.record_regulatory_source_capture(
  p_source_id uuid,
  p_requested_url text,
  p_final_url text,
  p_status text,
  p_http_status integer,
  p_mime_type text,
  p_content_hash text,
  p_raw_content text,
  p_storage_path text,
  p_response_headers jsonb,
  p_connector_version text,
  p_error_code text,
  p_error_message text,
  p_document_identifier text,
  p_document_title text,
  p_document_type text,
  p_document_url text,
  p_external_reference text,
  p_publication_date date,
  p_effective_from date,
  p_effective_to date,
  p_document_status text,
  p_version_label text,
  p_version_date date,
  p_normalized_content text,
  p_parser_version text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_variable
declare
  source_record public.regulatory_sources;
  previous_fetch public.regulatory_source_fetches;
  effective_status text := p_status;
  computed_hash text;
  fetch_id uuid;
  document_id uuid;
  existing_version_id uuid;
  previous_version public.regulatory_document_versions;
  version_id uuid;
  next_version integer;
  change_id uuid;
  change_type text;
  clean_raw text := p_raw_content;
begin
  select * into source_record
  from public.regulatory_sources source_row
  where source_row.id = p_source_id
  for update;

  if source_record.id is null then
    raise exception using errcode = '23503', message = 'Regulatory source not found';
  end if;

  if not source_record.is_active or source_record.terms_review_status = 'prohibited' then
    raise exception using errcode = '23514', message = 'Regulatory source is not available for capture';
  end if;

  if p_status not in ('succeeded', 'failed', 'blocked') then
    raise exception using errcode = '22023', message = 'Invalid capture status';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_source_id::text, 0));

  select * into previous_fetch
  from public.regulatory_source_fetches source_fetch
  where source_fetch.source_id = p_source_id
    and source_fetch.status in ('succeeded', 'unchanged')
  order by source_fetch.fetched_at desc
  limit 1;

  if p_status = 'succeeded' then
    if p_content_hash is null or p_content_hash !~ '^[0-9a-f]{64}$' then
      raise exception using errcode = '22023', message = 'A valid SHA-256 content hash is required';
    end if;

    if clean_raw is null and nullif(btrim(p_storage_path), '') is null then
      raise exception using errcode = '22023', message = 'Successful capture requires raw content or storage path';
    end if;

    if clean_raw is not null then
      if octet_length(convert_to(clean_raw, 'UTF8')) > 5242880 then
        raise exception using errcode = '22023', message = 'Raw content exceeds 5 MB; use immutable storage';
      end if;
      computed_hash := encode(extensions.digest(convert_to(clean_raw, 'UTF8'), 'sha256'), 'hex');
      if computed_hash <> p_content_hash then
        raise exception using errcode = '23514', message = 'Raw content does not match the supplied hash';
      end if;
    end if;

    if previous_fetch.id is not null and previous_fetch.content_hash = p_content_hash then
      effective_status := 'unchanged';
    end if;
  end if;

  insert into public.regulatory_source_fetches (
    source_id, previous_fetch_id, requested_url, final_url, status,
    http_status, mime_type, byte_size, content_hash, raw_content,
    storage_path, response_headers, connector_version, error_code, error_message
  ) values (
    p_source_id,
    previous_fetch.id,
    btrim(p_requested_url),
    nullif(btrim(p_final_url), ''),
    effective_status,
    p_http_status,
    nullif(btrim(p_mime_type), ''),
    case when clean_raw is null then null else octet_length(convert_to(clean_raw, 'UTF8')) end,
    case when p_status = 'succeeded' then p_content_hash else null end,
    clean_raw,
    nullif(btrim(p_storage_path), ''),
    coalesce(p_response_headers, '{}'::jsonb),
    nullif(btrim(p_connector_version), ''),
    nullif(btrim(p_error_code), ''),
    nullif(btrim(p_error_message), '')
  ) returning id into fetch_id;

  if effective_status in ('succeeded', 'unchanged') then
    update public.regulatory_sources
    set health_status = 'healthy',
        last_successful_fetch_at = now(),
        last_error_at = null,
        last_error_code = null,
        connector_version = coalesce(nullif(btrim(p_connector_version), ''), connector_version),
        updated_at = now()
    where id = p_source_id;
  else
    update public.regulatory_sources
    set health_status = case when effective_status = 'blocked' then 'disabled' else 'failed' end,
        last_error_at = now(),
        last_error_code = nullif(btrim(p_error_code), ''),
        updated_at = now()
    where id = p_source_id;

    return jsonb_build_object(
      'fetchId', fetch_id,
      'status', effective_status,
      'documentId', null,
      'versionId', null,
      'changeId', null
    );
  end if;

  if nullif(btrim(p_document_identifier), '') is null
    or nullif(btrim(p_document_title), '') is null
    or nullif(btrim(p_document_type), '') is null then
    raise exception using errcode = '22023', message = 'Document identity is required for a successful capture';
  end if;

  insert into public.regulatory_documents (
    source_id, canonical_identifier, title, document_type, canonical_url,
    external_reference, publication_date, effective_from, effective_to, status
  ) values (
    p_source_id,
    btrim(p_document_identifier),
    btrim(p_document_title),
    btrim(p_document_type),
    nullif(btrim(p_document_url), ''),
    nullif(btrim(p_external_reference), ''),
    p_publication_date,
    p_effective_from,
    p_effective_to,
    coalesce(nullif(btrim(p_document_status), ''), 'unknown')
  )
  on conflict (source_id, canonical_identifier) do update
    set title = excluded.title,
        document_type = excluded.document_type,
        canonical_url = coalesce(excluded.canonical_url, public.regulatory_documents.canonical_url),
        external_reference = coalesce(excluded.external_reference, public.regulatory_documents.external_reference),
        publication_date = coalesce(excluded.publication_date, public.regulatory_documents.publication_date),
        effective_from = coalesce(excluded.effective_from, public.regulatory_documents.effective_from),
        effective_to = excluded.effective_to,
        status = excluded.status,
        updated_at = now()
  returning id into document_id;

  select document_version.id into existing_version_id
  from public.regulatory_document_versions document_version
  where document_version.document_id = document_id
    and document_version.content_hash = p_content_hash;

  if existing_version_id is not null then
    return jsonb_build_object(
      'fetchId', fetch_id,
      'status', 'unchanged',
      'documentId', document_id,
      'versionId', existing_version_id,
      'changeId', null
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(document_id::text, 1));

  select * into previous_version
  from public.regulatory_document_versions document_version
  where document_version.document_id = document_id
  order by document_version.version_number desc
  limit 1;

  next_version := coalesce(previous_version.version_number, 0) + 1;

  insert into public.regulatory_document_versions (
    document_id, source_fetch_id, version_number, version_label, version_date,
    valid_from, valid_to, content_hash, normalized_content, parser_version, status
  ) values (
    document_id,
    fetch_id,
    next_version,
    nullif(btrim(p_version_label), ''),
    p_version_date,
    p_effective_from,
    p_effective_to,
    p_content_hash,
    p_normalized_content,
    nullif(btrim(p_parser_version), ''),
    case when p_normalized_content is null then 'captured' else 'parsed' end
  ) returning id into version_id;

  change_type := case when previous_version.id is null then 'initial' else 'modified' end;

  insert into public.regulatory_source_changes (
    document_id, from_version_id, to_version_id, change_type, change_hash,
    summary, deterministic_diff, validation_status
  ) values (
    document_id,
    previous_version.id,
    version_id,
    change_type,
    encode(extensions.digest(
      convert_to(coalesce(previous_version.content_hash, 'initial') || ':' || p_content_hash, 'UTF8'),
      'sha256'
    ), 'hex'),
    case
      when previous_version.id is null then 'Primera versión capturada'
      else 'Nueva versión pendiente de comparación determinística'
    end,
    jsonb_build_object(
      'fromHash', previous_version.content_hash,
      'toHash', p_content_hash,
      'diffStatus', case when previous_version.id is null then 'not_applicable' else 'pending' end
    ),
    case when previous_version.id is null then 'verified' else 'requires_review' end
  ) returning id into change_id;

  return jsonb_build_object(
    'fetchId', fetch_id,
    'status', effective_status,
    'documentId', document_id,
    'versionId', version_id,
    'changeId', change_id,
    'versionNumber', next_version
  );
end;
$$;

revoke all on function public.record_regulatory_source_capture(
  uuid,text,text,text,integer,text,text,text,text,jsonb,text,text,text,text,text,text,text,text,date,date,date,text,text,date,text,text
) from public, anon, authenticated;
grant execute on function public.record_regulatory_source_capture(
  uuid,text,text,text,integer,text,text,text,text,jsonb,text,text,text,text,text,text,text,text,date,date,date,text,text,date,text,text
) to service_role;

update public.regulatory_sources
set ingestion_method = 'official_json',
    terms_review_status = 'approved',
    connector_version = 'leychile-official-json-v1',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'captureEnabled', true,
      'approvedMethod', 'official_json',
      'officialEndpoint', 'https://servicios-leychile.bcn.cl/Navegar/get_norma_json',
      'initialNormId', '1209272',
      'initialVersion', '2026-12-01'
    ),
    updated_at = now()
where canonical_url = 'https://www.bcn.cl/leychile/';

update public.scraper_connectors
set connector_key = 'leychile-official-json',
    display_name = 'LeyChile / BCN — JSON oficial',
    connector_version = 'leychile-official-json-v1',
    adapter_type = 'json',
    status = 'scheduled',
    allowed_hosts = array['servicios-leychile.bcn.cl'],
    allowed_path_patterns = array['/Navegar/get_norma_json'],
    allowed_mime_types = array['application/json'],
    user_agent = 'KUMPLIO-Regulatory-Connector/1.0 (+https://www.kumplio.app/regulatory)',
    terms_reference = 'BCN LeyChile official application JSON service and public interoperability documentation',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'officialEndpoint', 'https://servicios-leychile.bcn.cl/Navegar/get_norma_json',
      'initialNormId', '1209272',
      'initialVersion', '2026-12-01'
    ),
    updated_at = now()
where connector_key = 'leychile-controlled-html';

commit;
