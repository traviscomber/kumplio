-- KUMPLIO Regulatory Evidence Engine Foundation — service transactions

begin;

-- Repeated identical captures are meaningful monitoring events. Keep an index
-- for lookup, but do not enforce uniqueness across time.
drop index if exists public.regulatory_source_fetches_hash_uidx;
create index if not exists regulatory_source_fetches_hash_idx
  on public.regulatory_source_fetches (source_id, content_hash, fetched_at desc)
  where content_hash is not null;

create or replace function public.register_regulatory_source_record(
  p_actor_id uuid,
  p_authority_name text,
  p_source_name text,
  p_canonical_url text,
  p_domain text,
  p_source_type text,
  p_authority_level text,
  p_ingestion_method text,
  p_terms_review_status text,
  p_connector_version text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source_id uuid;
  clean_authority text := btrim(p_authority_name);
  clean_name text := btrim(p_source_name);
  clean_url text := btrim(p_canonical_url);
  clean_domain text := lower(btrim(p_domain));
begin
  if p_actor_id is not null and not exists (
    select 1 from auth.users users where users.id = p_actor_id
  ) then
    raise exception using errcode = '23503', message = 'Actor not found';
  end if;

  if char_length(clean_authority) < 2 or char_length(clean_authority) > 180
    or char_length(clean_name) < 2 or char_length(clean_name) > 180 then
    raise exception using errcode = '22023', message = 'Invalid source identity';
  end if;

  if clean_url !~ '^https://[^[:space:]]+$'
    or char_length(clean_url) > 2000
    or clean_domain = ''
    or position(clean_domain in lower(clean_url)) = 0 then
    raise exception using errcode = '22023', message = 'Invalid canonical source URL or domain';
  end if;

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
    metadata,
    created_by
  ) values (
    clean_authority,
    clean_name,
    clean_url,
    clean_domain,
    'CL',
    p_source_type,
    p_authority_level,
    p_ingestion_method,
    p_terms_review_status,
    'unknown',
    nullif(btrim(p_connector_version), ''),
    coalesce(p_metadata, '{}'::jsonb),
    p_actor_id
  )
  on conflict (canonical_url) do update
    set authority_name = excluded.authority_name,
        source_name = excluded.source_name,
        domain = excluded.domain,
        source_type = excluded.source_type,
        authority_level = excluded.authority_level,
        ingestion_method = excluded.ingestion_method,
        terms_review_status = excluded.terms_review_status,
        connector_version = excluded.connector_version,
        metadata = public.regulatory_sources.metadata || excluded.metadata,
        updated_at = now()
  returning id into source_id;

  return source_id;
end;
$$;

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
  from public.regulatory_sources source
  where source.id = p_source_id
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
  from public.regulatory_source_fetches fetch
  where fetch.source_id = p_source_id
    and fetch.status in ('succeeded', 'unchanged')
  order by fetch.fetched_at desc
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

      computed_hash := encode(digest(convert_to(clean_raw, 'UTF8'), 'sha256'), 'hex');
      if computed_hash <> p_content_hash then
        raise exception using errcode = '23514', message = 'Raw content does not match the supplied hash';
      end if;
    end if;

    if previous_fetch.id is not null and previous_fetch.content_hash = p_content_hash then
      effective_status := 'unchanged';
    end if;
  end if;

  insert into public.regulatory_source_fetches (
    source_id,
    previous_fetch_id,
    requested_url,
    final_url,
    status,
    http_status,
    mime_type,
    byte_size,
    content_hash,
    raw_content,
    storage_path,
    response_headers,
    connector_version,
    error_code,
    error_message
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
  )
  returning id into fetch_id;

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
    source_id,
    canonical_identifier,
    title,
    document_type,
    canonical_url,
    external_reference,
    publication_date,
    effective_from,
    effective_to,
    status
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

  select version.id into existing_version_id
  from public.regulatory_document_versions version
  where version.document_id = document_id
    and version.content_hash = p_content_hash;

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
  from public.regulatory_document_versions version
  where version.document_id = document_id
  order by version.version_number desc
  limit 1;

  next_version := coalesce(previous_version.version_number, 0) + 1;

  insert into public.regulatory_document_versions (
    document_id,
    source_fetch_id,
    version_number,
    version_label,
    version_date,
    valid_from,
    valid_to,
    content_hash,
    normalized_content,
    parser_version,
    status
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
  )
  returning id into version_id;

  change_type := case when previous_version.id is null then 'initial' else 'modified' end;

  insert into public.regulatory_source_changes (
    document_id,
    from_version_id,
    to_version_id,
    change_type,
    change_hash,
    summary,
    deterministic_diff,
    validation_status
  ) values (
    document_id,
    previous_version.id,
    version_id,
    change_type,
    encode(digest(convert_to(
      coalesce(previous_version.content_hash, 'initial') || ':' || p_content_hash,
      'UTF8'
    ), 'sha256'), 'hex'),
    case when previous_version.id is null then 'Primera versión capturada' else 'Nueva versión pendiente de comparación determinística' end,
    jsonb_build_object(
      'fromHash', previous_version.content_hash,
      'toHash', p_content_hash,
      'diffStatus', case when previous_version.id is null then 'not_applicable' else 'pending' end
    ),
    case when previous_version.id is null then 'verified' else 'requires_review' end
  )
  returning id into change_id;

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

create or replace function public.record_regulatory_claim_with_citation(
  p_actor_id uuid,
  p_version_id uuid,
  p_parent_section_id uuid,
  p_section_type text,
  p_ordinal integer,
  p_reference_label text,
  p_heading text,
  p_body_text text,
  p_claim_type text,
  p_claim_text text,
  p_subject text,
  p_conditions jsonb,
  p_effective_from date,
  p_effective_to date,
  p_extraction_method text,
  p_confidence numeric,
  p_exact_quote text,
  p_start_offset integer,
  p_end_offset integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  version_record public.regulatory_document_versions;
  section_id uuid;
  claim_id uuid;
  citation_id uuid;
  normalized_body text;
  clean_quote text := btrim(p_exact_quote);
begin
  if p_actor_id is not null and not exists (
    select 1 from auth.users users where users.id = p_actor_id
  ) then
    raise exception using errcode = '23503', message = 'Actor not found';
  end if;

  select * into version_record
  from public.regulatory_document_versions version
  where version.id = p_version_id;

  if version_record.id is null then
    raise exception using errcode = '23503', message = 'Regulatory document version not found';
  end if;

  if p_ordinal < 0 or nullif(btrim(p_body_text), '') is null then
    raise exception using errcode = '22023', message = 'Invalid regulatory section';
  end if;

  if clean_quote = '' or position(clean_quote in p_body_text) = 0 then
    raise exception using errcode = '23514', message = 'Exact quote must exist in the section body';
  end if;

  if p_start_offset is not null and p_start_offset < 0
    or p_end_offset is not null and p_end_offset < p_start_offset then
    raise exception using errcode = '22023', message = 'Invalid citation offsets';
  end if;

  normalized_body := regexp_replace(btrim(p_body_text), '[[:space:]]+', ' ', 'g');

  insert into public.regulatory_document_sections (
    version_id,
    parent_section_id,
    section_type,
    ordinal,
    reference_label,
    heading,
    body_text,
    normalized_text,
    section_hash
  ) values (
    p_version_id,
    p_parent_section_id,
    btrim(p_section_type),
    p_ordinal,
    nullif(btrim(p_reference_label), ''),
    nullif(btrim(p_heading), ''),
    p_body_text,
    normalized_body,
    encode(digest(convert_to(normalized_body, 'UTF8'), 'sha256'), 'hex')
  )
  on conflict (version_id, ordinal) do nothing
  returning id into section_id;

  if section_id is null then
    select section.id into section_id
    from public.regulatory_document_sections section
    where section.version_id = p_version_id
      and section.ordinal = p_ordinal;
  end if;

  if p_parent_section_id is not null and not exists (
    select 1
    from public.regulatory_document_sections parent
    where parent.id = p_parent_section_id
      and parent.version_id = p_version_id
  ) then
    raise exception using errcode = '23514', message = 'Parent section must belong to the same version';
  end if;

  insert into public.regulatory_claims (
    version_id,
    section_id,
    claim_type,
    claim_text,
    subject,
    conditions,
    effective_from,
    effective_to,
    extraction_method,
    confidence,
    validation_status,
    created_by
  ) values (
    p_version_id,
    section_id,
    p_claim_type,
    btrim(p_claim_text),
    nullif(btrim(p_subject), ''),
    coalesce(p_conditions, '{}'::jsonb),
    p_effective_from,
    p_effective_to,
    p_extraction_method,
    p_confidence,
    'pending',
    p_actor_id
  )
  returning id into claim_id;

  insert into public.regulatory_claim_citations (
    claim_id,
    section_id,
    exact_quote,
    quote_hash,
    start_offset,
    end_offset
  ) values (
    claim_id,
    section_id,
    clean_quote,
    encode(digest(convert_to(clean_quote, 'UTF8'), 'sha256'), 'hex'),
    p_start_offset,
    p_end_offset
  )
  returning id into citation_id;

  return jsonb_build_object(
    'sectionId', section_id,
    'claimId', claim_id,
    'citationId', citation_id
  );
end;
$$;

create or replace function public.review_regulatory_claim_record(
  p_actor_id uuid,
  p_claim_id uuid,
  p_decision text,
  p_comment text,
  p_checklist jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  review_id uuid;
  next_status text;
begin
  if p_actor_id is null or not exists (
    select 1 from auth.users users where users.id = p_actor_id
  ) then
    raise exception using errcode = '23503', message = 'Reviewer not found';
  end if;

  if not exists (
    select 1 from public.regulatory_claims claim where claim.id = p_claim_id
  ) then
    raise exception using errcode = '23503', message = 'Regulatory claim not found';
  end if;

  if p_decision not in ('approved', 'rejected', 'changes_requested', 'escalated') then
    raise exception using errcode = '22023', message = 'Invalid regulatory review decision';
  end if;

  if p_decision in ('rejected', 'changes_requested', 'escalated')
    and char_length(coalesce(nullif(btrim(p_comment), ''), '')) < 3 then
    raise exception using errcode = '22023', message = 'Review comment is required';
  end if;

  next_status := case p_decision
    when 'approved' then 'supported'
    when 'rejected' then 'unsupported'
    when 'changes_requested' then 'partial'
    else 'pending'
  end;

  insert into public.regulatory_source_review_decisions (
    claim_id,
    reviewer_id,
    decision,
    comment,
    checklist
  ) values (
    p_claim_id,
    p_actor_id,
    p_decision,
    nullif(btrim(p_comment), ''),
    coalesce(p_checklist, '{}'::jsonb)
  )
  returning id into review_id;

  update public.regulatory_claims
  set validation_status = next_status,
      updated_at = now()
  where id = p_claim_id;

  return review_id;
end;
$$;

revoke all on function public.register_regulatory_source_record(uuid,text,text,text,text,text,text,text,text,text,jsonb)
  from public, anon, authenticated;
revoke all on function public.record_regulatory_source_capture(uuid,text,text,text,integer,text,text,text,text,jsonb,text,text,text,text,text,text,text,date,date,date,text,text,date,text,text)
  from public, anon, authenticated;
revoke all on function public.record_regulatory_claim_with_citation(uuid,uuid,uuid,text,integer,text,text,text,text,text,text,jsonb,date,date,text,numeric,text,integer,integer)
  from public, anon, authenticated;
revoke all on function public.review_regulatory_claim_record(uuid,uuid,text,text,jsonb)
  from public, anon, authenticated;

grant execute on function public.register_regulatory_source_record(uuid,text,text,text,text,text,text,text,text,text,jsonb)
  to service_role;
grant execute on function public.record_regulatory_source_capture(uuid,text,text,text,integer,text,text,text,text,jsonb,text,text,text,text,text,text,text,date,date,date,text,text,date,text,text)
  to service_role;
grant execute on function public.record_regulatory_claim_with_citation(uuid,uuid,uuid,text,integer,text,text,text,text,text,text,jsonb,date,date,text,numeric,text,integer,integer)
  to service_role;
grant execute on function public.review_regulatory_claim_record(uuid,uuid,text,text,jsonb)
  to service_role;

commit;
