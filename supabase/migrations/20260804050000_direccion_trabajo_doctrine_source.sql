begin;

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
) values (
  'Dirección del Trabajo',
  'Dictámenes y Normativa 3.0',
  'https://www.dt.gob.cl/legislacion/1624/w3-channel.html',
  'www.dt.gob.cl',
  'CL',
  'jurisprudence',
  'official_interpretation',
  'html',
  'pending',
  'unknown',
  'direccion-trabajo-doctrina-v1',
  true,
  jsonb_build_object(
    'officialPublicSource', true,
    'captureScope', jsonb_build_array('dictamenes', 'ordinarios'),
    'initialPeriod', '2026-07',
    'lowFrequency', true,
    'humanReviewRequired', true,
    'claimsAreNotAutoValidated', true,
    'sourceRole', 'official_administrative_interpretation'
  )
)
on conflict (canonical_url) do update
set authority_name = excluded.authority_name,
    source_name = excluded.source_name,
    domain = excluded.domain,
    jurisdiction = excluded.jurisdiction,
    source_type = excluded.source_type,
    authority_level = excluded.authority_level,
    ingestion_method = excluded.ingestion_method,
    connector_version = excluded.connector_version,
    is_active = true,
    metadata = coalesce(public.regulatory_sources.metadata, '{}'::jsonb) || excluded.metadata,
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
  user_agent,
  robots_reference,
  metadata
)
select
  source.id,
  'direccion-trabajo-doctrina',
  'Dirección del Trabajo — Doctrina administrativa',
  'direccion-trabajo-doctrina-v1',
  'html',
  'manual',
  array['www.dt.gob.cl', 'dt.gob.cl'],
  array[
    '/legislacion/1624/w3-multipropertyvalues-',
    '/legislacion/1624/w3-article-'
  ],
  array['text/html', 'application/xhtml+xml'],
  30000,
  3145728,
  0,
  3,
  array[60, 300, 1800],
  3,
  3600,
  'KUMPLIO-Regulatory-Connector/1.0 (+https://kumplio.app/regulatory)',
  'https://www.dt.gob.cl/robots.txt',
  jsonb_build_object(
    'discoveryPages', jsonb_build_object(
      'dictamenes', 'https://www.dt.gob.cl/legislacion/1624/w3-multipropertyvalues-22762-193891.html',
      'ordinarios', 'https://www.dt.gob.cl/legislacion/1624/w3-multipropertyvalues-147182-193891.html'
    ),
    'initialPeriod', '2026-07',
    'expectedInitialDocuments', 15,
    'schedulingReadiness', 'not_verified',
    'schedulingStatus', 'manual_until_two_verified_captures',
    'requestDelayMs', 350,
    'humanReviewRequired', true
  )
from public.regulatory_sources source
where source.canonical_url = 'https://www.dt.gob.cl/legislacion/1624/w3-channel.html'
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
    user_agent = excluded.user_agent,
    robots_reference = excluded.robots_reference,
    metadata = coalesce(public.scraper_connectors.metadata, '{}'::jsonb) || excluded.metadata,
    updated_at = now();

create table if not exists public.dt_document_details (
  version_id uuid primary key references public.regulatory_document_versions(id) on delete restrict,
  document_id uuid not null references public.regulatory_documents(id) on delete restrict,
  pronouncement_type text not null
    check (pronouncement_type in ('dictamen', 'ordinario', 'circular', 'orden_servicio', 'resolucion', 'otro')),
  official_number text not null,
  normalized_number text not null,
  internal_reference text,
  issuing_unit text,
  action_text text,
  summary text,
  pdf_url text,
  source_page_url text not null,
  details_hash text not null check (details_hash ~ '^[0-9a-f]{64}$'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (document_id, details_hash),
  check (source_page_url ~ '^https://(www[.])?dt[.]gob[.]cl/legislacion/1624/w3-article-[0-9]+[.]html$'),
  check (pdf_url is null or pdf_url ~ '^https://(www[.])?dt[.]gob[.]cl/legislacion/1624/articles-[0-9]+_recurso_[0-9]+[.]pdf$')
);

create index if not exists dt_document_details_document_idx
  on public.dt_document_details(document_id);
create index if not exists dt_document_details_number_idx
  on public.dt_document_details(pronouncement_type, normalized_number);

create table if not exists public.dt_document_blocks (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.regulatory_document_versions(id) on delete restrict,
  block_key text not null,
  block_type text not null
    check (block_type in ('actuacion', 'materias', 'resumen', 'antecedentes', 'fuentes', 'concordancia', 'cuerpo', 'catalogacion', 'otro')),
  ordinal integer not null check (ordinal > 0),
  heading text,
  body_text text not null,
  normalized_text text not null,
  block_hash text not null check (block_hash ~ '^[0-9a-f]{64}$'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (version_id, block_key),
  unique (version_id, block_hash)
);

create index if not exists dt_document_blocks_version_ordinal_idx
  on public.dt_document_blocks(version_id, ordinal);

create table if not exists public.dt_document_topics (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.regulatory_document_versions(id) on delete restrict,
  topic text not null,
  normalized_topic text not null,
  topic_hash text not null check (topic_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  unique (version_id, topic_hash)
);

create index if not exists dt_document_topics_normalized_idx
  on public.dt_document_topics(normalized_topic, version_id);

create table if not exists public.dt_document_legal_references (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.regulatory_document_versions(id) on delete restrict,
  reference_type text not null
    check (reference_type in ('constitucion', 'codigo_trabajo', 'ley', 'decreto', 'reglamento', 'tratado', 'dictamen', 'ordinario', 'otro')),
  reference_text text not null,
  normalized_reference text not null,
  reference_hash text not null check (reference_hash ~ '^[0-9a-f]{64}$'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (version_id, reference_hash)
);

create index if not exists dt_document_legal_references_normalized_idx
  on public.dt_document_legal_references(normalized_reference, version_id);

create table if not exists public.dt_document_relations (
  id uuid primary key default gen_random_uuid(),
  source_version_id uuid not null references public.regulatory_document_versions(id) on delete restrict,
  source_document_id uuid not null references public.regulatory_documents(id) on delete restrict,
  target_document_id uuid references public.regulatory_documents(id) on delete restrict,
  relation_type text not null
    check (relation_type in ('leaves_without_effect', 'reconsiders', 'complements', 'reiterates', 'confirms', 'concordance', 'cites', 'other')),
  target_label text not null,
  target_identifier text,
  target_publication_date date,
  relation_hash text not null check (relation_hash ~ '^[0-9a-f]{64}$'),
  confidence numeric(4,3) not null default 1.000 check (confidence >= 0 and confidence <= 1),
  validation_status text not null default 'pending'
    check (validation_status in ('pending', 'supported', 'partial', 'unsupported', 'contradictory')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_version_id, relation_hash)
);

create index if not exists dt_document_relations_source_idx
  on public.dt_document_relations(source_document_id, relation_type);
create index if not exists dt_document_relations_target_idx
  on public.dt_document_relations(target_document_id)
  where target_document_id is not null;
create index if not exists dt_document_relations_identifier_idx
  on public.dt_document_relations(target_identifier)
  where target_identifier is not null;

alter table public.dt_document_details enable row level security;
alter table public.dt_document_blocks enable row level security;
alter table public.dt_document_topics enable row level security;
alter table public.dt_document_legal_references enable row level security;
alter table public.dt_document_relations enable row level security;

revoke all on table public.dt_document_details from anon, authenticated;
revoke all on table public.dt_document_blocks from anon, authenticated;
revoke all on table public.dt_document_topics from anon, authenticated;
revoke all on table public.dt_document_legal_references from anon, authenticated;
revoke all on table public.dt_document_relations from anon, authenticated;

grant select on table public.dt_document_details to authenticated;
grant select on table public.dt_document_blocks to authenticated;
grant select on table public.dt_document_topics to authenticated;
grant select on table public.dt_document_legal_references to authenticated;
grant select on table public.dt_document_relations to authenticated;

grant all on table public.dt_document_details to service_role;
grant all on table public.dt_document_blocks to service_role;
grant all on table public.dt_document_topics to service_role;
grant all on table public.dt_document_legal_references to service_role;
grant all on table public.dt_document_relations to service_role;

drop policy if exists dt_document_details_read_authenticated on public.dt_document_details;
create policy dt_document_details_read_authenticated
  on public.dt_document_details for select to authenticated using (true);

drop policy if exists dt_document_blocks_read_authenticated on public.dt_document_blocks;
create policy dt_document_blocks_read_authenticated
  on public.dt_document_blocks for select to authenticated using (true);

drop policy if exists dt_document_topics_read_authenticated on public.dt_document_topics;
create policy dt_document_topics_read_authenticated
  on public.dt_document_topics for select to authenticated using (true);

drop policy if exists dt_document_legal_references_read_authenticated on public.dt_document_legal_references;
create policy dt_document_legal_references_read_authenticated
  on public.dt_document_legal_references for select to authenticated using (true);

drop policy if exists dt_document_relations_read_authenticated on public.dt_document_relations;
create policy dt_document_relations_read_authenticated
  on public.dt_document_relations for select to authenticated using (true);

drop trigger if exists prevent_dt_document_details_change on public.dt_document_details;
create trigger prevent_dt_document_details_change
  before update or delete on public.dt_document_details
  for each row execute function private.prevent_regulatory_immutable_change();

drop trigger if exists prevent_dt_document_blocks_change on public.dt_document_blocks;
create trigger prevent_dt_document_blocks_change
  before update or delete on public.dt_document_blocks
  for each row execute function private.prevent_regulatory_immutable_change();

drop trigger if exists prevent_dt_document_topics_change on public.dt_document_topics;
create trigger prevent_dt_document_topics_change
  before update or delete on public.dt_document_topics
  for each row execute function private.prevent_regulatory_immutable_change();

drop trigger if exists prevent_dt_document_legal_references_change on public.dt_document_legal_references;
create trigger prevent_dt_document_legal_references_change
  before update or delete on public.dt_document_legal_references
  for each row execute function private.prevent_regulatory_immutable_change();

drop trigger if exists prevent_dt_document_relations_change on public.dt_document_relations;
create trigger prevent_dt_document_relations_change
  before update or delete on public.dt_document_relations
  for each row execute function private.prevent_regulatory_immutable_change();

create or replace function public.record_dt_pronouncement_metadata(
  p_version_id uuid,
  p_details jsonb,
  p_blocks jsonb default '[]'::jsonb,
  p_topics jsonb default '[]'::jsonb,
  p_legal_references jsonb default '[]'::jsonb,
  p_relations jsonb default '[]'::jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_variable
declare
  version_row public.regulatory_document_versions;
  document_row public.regulatory_documents;
  source_row public.regulatory_sources;
  existing_details public.dt_document_details;
  item jsonb;
  target_document uuid;
  inserted_blocks integer := 0;
  inserted_topics integer := 0;
  inserted_references integer := 0;
  inserted_relations integer := 0;
  existing_blocks integer;
  existing_topics integer;
  existing_references integer;
  existing_relations integer;
begin
  if jsonb_typeof(p_details) <> 'object'
    or jsonb_typeof(p_blocks) <> 'array'
    or jsonb_typeof(p_topics) <> 'array'
    or jsonb_typeof(p_legal_references) <> 'array'
    or jsonb_typeof(p_relations) <> 'array' then
    raise exception 'invalid_dt_metadata_payload';
  end if;

  if jsonb_array_length(p_blocks) > 30
    or jsonb_array_length(p_topics) > 100
    or jsonb_array_length(p_legal_references) > 200
    or jsonb_array_length(p_relations) > 200 then
    raise exception 'dt_metadata_payload_too_large';
  end if;

  select * into version_row
  from public.regulatory_document_versions version_record
  where version_record.id = p_version_id;

  if version_row.id is null then
    raise exception 'dt_version_not_found';
  end if;

  select * into document_row
  from public.regulatory_documents document_record
  where document_record.id = version_row.document_id;

  select * into source_row
  from public.regulatory_sources source_record
  where source_record.id = document_row.source_id;

  if source_row.canonical_url <> 'https://www.dt.gob.cl/legislacion/1624/w3-channel.html' then
    raise exception 'dt_source_mismatch';
  end if;

  if coalesce(p_details->>'pronouncementType', '') not in ('dictamen', 'ordinario', 'circular', 'orden_servicio', 'resolucion', 'otro')
    or nullif(btrim(p_details->>'officialNumber'), '') is null
    or nullif(btrim(p_details->>'normalizedNumber'), '') is null
    or coalesce(p_details->>'sourcePageUrl', '') !~ '^https://(www[.])?dt[.]gob[.]cl/legislacion/1624/w3-article-[0-9]+[.]html$'
    or coalesce(p_details->>'hash', '') !~ '^[0-9a-f]{64}$'
    or (
      nullif(p_details->>'pdfUrl', '') is not null
      and p_details->>'pdfUrl' !~ '^https://(www[.])?dt[.]gob[.]cl/legislacion/1624/articles-[0-9]+_recurso_[0-9]+[.]pdf$'
    ) then
    raise exception 'invalid_dt_details';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_version_id::text, 96)
  );

  select * into existing_details
  from public.dt_document_details details
  where details.version_id = p_version_id;

  if existing_details.version_id is not null then
    select count(*) into existing_blocks from public.dt_document_blocks where version_id = p_version_id;
    select count(*) into existing_topics from public.dt_document_topics where version_id = p_version_id;
    select count(*) into existing_references from public.dt_document_legal_references where version_id = p_version_id;
    select count(*) into existing_relations from public.dt_document_relations where source_version_id = p_version_id;

    if existing_details.details_hash <> p_details->>'hash'
      or existing_blocks <> jsonb_array_length(p_blocks)
      or existing_topics <> jsonb_array_length(p_topics)
      or existing_references <> jsonb_array_length(p_legal_references)
      or existing_relations <> jsonb_array_length(p_relations)
      or exists (
        select 1 from jsonb_array_elements(p_blocks) payload(value)
        where not exists (
          select 1 from public.dt_document_blocks stored
          where stored.version_id = p_version_id and stored.block_hash = payload.value->>'hash'
        )
      )
      or exists (
        select 1 from jsonb_array_elements(p_topics) payload(value)
        where not exists (
          select 1 from public.dt_document_topics stored
          where stored.version_id = p_version_id and stored.topic_hash = payload.value->>'hash'
        )
      )
      or exists (
        select 1 from jsonb_array_elements(p_legal_references) payload(value)
        where not exists (
          select 1 from public.dt_document_legal_references stored
          where stored.version_id = p_version_id and stored.reference_hash = payload.value->>'hash'
        )
      )
      or exists (
        select 1 from jsonb_array_elements(p_relations) payload(value)
        where not exists (
          select 1 from public.dt_document_relations stored
          where stored.source_version_id = p_version_id and stored.relation_hash = payload.value->>'hash'
        )
      ) then
      raise exception 'dt_metadata_already_exists_with_different_content';
    end if;

    return jsonb_build_object(
      'status', 'unchanged',
      'versionId', p_version_id,
      'blocks', existing_blocks,
      'topics', existing_topics,
      'legalReferences', existing_references,
      'relations', existing_relations
    );
  end if;

  insert into public.dt_document_details (
    version_id,
    document_id,
    pronouncement_type,
    official_number,
    normalized_number,
    internal_reference,
    issuing_unit,
    action_text,
    summary,
    pdf_url,
    source_page_url,
    details_hash,
    metadata
  ) values (
    p_version_id,
    document_row.id,
    p_details->>'pronouncementType',
    btrim(p_details->>'officialNumber'),
    btrim(p_details->>'normalizedNumber'),
    nullif(btrim(p_details->>'internalReference'), ''),
    nullif(btrim(p_details->>'issuingUnit'), ''),
    nullif(btrim(p_details->>'actionText'), ''),
    nullif(btrim(p_details->>'summary'), ''),
    nullif(btrim(p_details->>'pdfUrl'), ''),
    p_details->>'sourcePageUrl',
    p_details->>'hash',
    coalesce(p_details->'metadata', '{}'::jsonb)
  );

  for item in select value from jsonb_array_elements(p_blocks) loop
    if nullif(btrim(item->>'key'), '') is null
      or coalesce(item->>'type', '') not in ('actuacion', 'materias', 'resumen', 'antecedentes', 'fuentes', 'concordancia', 'cuerpo', 'catalogacion', 'otro')
      or coalesce((item->>'ordinal')::integer, 0) < 1
      or nullif(item->>'bodyText', '') is null
      or nullif(item->>'normalizedText', '') is null
      or coalesce(item->>'hash', '') !~ '^[0-9a-f]{64}$' then
      raise exception 'invalid_dt_block';
    end if;

    insert into public.dt_document_blocks (
      version_id, block_key, block_type, ordinal, heading,
      body_text, normalized_text, block_hash, metadata
    ) values (
      p_version_id,
      item->>'key',
      item->>'type',
      (item->>'ordinal')::integer,
      nullif(btrim(item->>'heading'), ''),
      item->>'bodyText',
      item->>'normalizedText',
      item->>'hash',
      coalesce(item->'metadata', '{}'::jsonb)
    );
    inserted_blocks := inserted_blocks + 1;
  end loop;

  for item in select value from jsonb_array_elements(p_topics) loop
    if nullif(btrim(item->>'topic'), '') is null
      or nullif(btrim(item->>'normalizedTopic'), '') is null
      or coalesce(item->>'hash', '') !~ '^[0-9a-f]{64}$' then
      raise exception 'invalid_dt_topic';
    end if;

    insert into public.dt_document_topics (
      version_id, topic, normalized_topic, topic_hash
    ) values (
      p_version_id,
      btrim(item->>'topic'),
      btrim(item->>'normalizedTopic'),
      item->>'hash'
    );
    inserted_topics := inserted_topics + 1;
  end loop;

  for item in select value from jsonb_array_elements(p_legal_references) loop
    if coalesce(item->>'type', '') not in ('constitucion', 'codigo_trabajo', 'ley', 'decreto', 'reglamento', 'tratado', 'dictamen', 'ordinario', 'otro')
      or nullif(btrim(item->>'text'), '') is null
      or nullif(btrim(item->>'normalizedText'), '') is null
      or coalesce(item->>'hash', '') !~ '^[0-9a-f]{64}$' then
      raise exception 'invalid_dt_legal_reference';
    end if;

    insert into public.dt_document_legal_references (
      version_id, reference_type, reference_text,
      normalized_reference, reference_hash, metadata
    ) values (
      p_version_id,
      item->>'type',
      btrim(item->>'text'),
      btrim(item->>'normalizedText'),
      item->>'hash',
      coalesce(item->'metadata', '{}'::jsonb)
    );
    inserted_references := inserted_references + 1;
  end loop;

  for item in select value from jsonb_array_elements(p_relations) loop
    if coalesce(item->>'type', '') not in ('leaves_without_effect', 'reconsiders', 'complements', 'reiterates', 'confirms', 'concordance', 'cites', 'other')
      or nullif(btrim(item->>'targetLabel'), '') is null
      or coalesce(item->>'hash', '') !~ '^[0-9a-f]{64}$' then
      raise exception 'invalid_dt_relation';
    end if;

    target_document := null;
    if nullif(btrim(item->>'targetIdentifier'), '') is not null then
      select target.id into target_document
      from public.regulatory_documents target
      where target.source_id = document_row.source_id
        and target.canonical_identifier = btrim(item->>'targetIdentifier')
      limit 1;
    end if;

    insert into public.dt_document_relations (
      source_version_id,
      source_document_id,
      target_document_id,
      relation_type,
      target_label,
      target_identifier,
      target_publication_date,
      relation_hash,
      confidence,
      validation_status,
      metadata
    ) values (
      p_version_id,
      document_row.id,
      target_document,
      item->>'type',
      btrim(item->>'targetLabel'),
      nullif(btrim(item->>'targetIdentifier'), ''),
      nullif(item->>'targetPublicationDate', '')::date,
      item->>'hash',
      coalesce((item->>'confidence')::numeric, 1.000),
      'pending',
      coalesce(item->'metadata', '{}'::jsonb)
    );
    inserted_relations := inserted_relations + 1;
  end loop;

  return jsonb_build_object(
    'status', 'recorded',
    'versionId', p_version_id,
    'blocks', inserted_blocks,
    'topics', inserted_topics,
    'legalReferences', inserted_references,
    'relations', inserted_relations,
    'humanReviewRequired', true
  );
end;
$$;

revoke all on function public.record_dt_pronouncement_metadata(uuid,jsonb,jsonb,jsonb,jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function public.record_dt_pronouncement_metadata(uuid,jsonb,jsonb,jsonb,jsonb,jsonb)
  to service_role;

commit;
