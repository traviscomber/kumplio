begin;

create table if not exists public.regulatory_parse_revisions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.regulatory_documents(id) on delete restrict,
  from_version_id uuid not null references public.regulatory_document_versions(id) on delete restrict,
  to_version_id uuid not null references public.regulatory_document_versions(id) on delete restrict,
  source_content_hash text not null check (source_content_hash ~ '^[a-f0-9]{64}$'),
  from_parser_version text,
  to_parser_version text not null,
  section_count integer not null check (section_count > 0),
  status text not null default 'created' check (status in ('created','projected','failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  projected_at timestamptz,
  unique (to_version_id)
);

create index if not exists regulatory_parse_revisions_document_idx
  on public.regulatory_parse_revisions(document_id, created_at desc);
create index if not exists regulatory_parse_revisions_from_version_idx
  on public.regulatory_parse_revisions(from_version_id);

alter table public.regulatory_parse_revisions enable row level security;
revoke all on public.regulatory_parse_revisions from anon, authenticated;
grant select on public.regulatory_parse_revisions to authenticated;
grant all on public.regulatory_parse_revisions to service_role;

drop policy if exists regulatory_parse_revisions_read_authenticated on public.regulatory_parse_revisions;
create policy regulatory_parse_revisions_read_authenticated
  on public.regulatory_parse_revisions
  for select to authenticated
  using (status in ('created','projected'));

alter table public.regulatory_document_versions
  drop constraint if exists regulatory_document_versions_document_id_content_hash_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.regulatory_document_versions'::regclass
      and conname = 'regulatory_document_versions_document_hash_parser_key'
  ) then
    alter table public.regulatory_document_versions
      add constraint regulatory_document_versions_document_hash_parser_key
      unique (document_id, content_hash, parser_version);
  end if;
end;
$$;

create or replace function public.record_regulatory_parser_revision(
  p_document_id uuid,
  p_source_fetch_id uuid,
  p_source_content_hash text,
  p_parser_version text,
  p_normalized_content text,
  p_sections jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source_version public.regulatory_document_versions;
  existing_version public.regulatory_document_versions;
  new_version_id uuid;
  next_version integer;
  parsed_count integer;
  revision_id uuid;
begin
  if p_source_content_hash is null or p_source_content_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid_source_content_hash';
  end if;
  if nullif(pg_catalog.btrim(p_parser_version), '') is null then
    raise exception 'parser_version_required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_document_id::text, 71));

  select * into existing_version
  from public.regulatory_document_versions v
  where v.document_id = p_document_id
    and v.content_hash = p_source_content_hash
    and v.parser_version = p_parser_version
  order by v.version_number desc
  limit 1;

  if existing_version.id is not null then
    parsed_count := public.record_regulatory_parsed_sections(
      existing_version.id,
      p_parser_version,
      p_sections
    );
    return jsonb_build_object(
      'status', 'unchanged',
      'versionId', existing_version.id,
      'versionNumber', existing_version.version_number,
      'parsedSectionCount', parsed_count,
      'parseRevisionId', null
    );
  end if;

  select * into source_version
  from public.regulatory_document_versions v
  where v.document_id = p_document_id
    and v.content_hash = p_source_content_hash
  order by v.version_number desc
  limit 1;

  if source_version.id is null then
    raise exception 'source_parser_version_not_found';
  end if;

  select coalesce(max(v.version_number), 0) + 1
    into next_version
  from public.regulatory_document_versions v
  where v.document_id = p_document_id;

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
    p_document_id,
    coalesce(p_source_fetch_id, source_version.source_fetch_id),
    next_version,
    source_version.version_label,
    source_version.version_date,
    source_version.valid_from,
    source_version.valid_to,
    p_source_content_hash,
    p_normalized_content,
    p_parser_version,
    'parsed'
  ) returning id into new_version_id;

  parsed_count := public.record_regulatory_parsed_sections(
    new_version_id,
    p_parser_version,
    p_sections
  );

  insert into public.regulatory_parse_revisions (
    document_id,
    from_version_id,
    to_version_id,
    source_content_hash,
    from_parser_version,
    to_parser_version,
    section_count,
    status,
    metadata
  ) values (
    p_document_id,
    source_version.id,
    new_version_id,
    p_source_content_hash,
    source_version.parser_version,
    p_parser_version,
    parsed_count,
    'created',
    jsonb_build_object('reason', 'parser_bugfix', 'sourceUnchanged', true)
  ) returning id into revision_id;

  return jsonb_build_object(
    'status', 'reparsed',
    'versionId', new_version_id,
    'versionNumber', next_version,
    'parsedSectionCount', parsed_count,
    'parseRevisionId', revision_id,
    'fromVersionId', source_version.id
  );
end;
$$;

revoke all on function public.record_regulatory_parser_revision(uuid,uuid,text,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.record_regulatory_parser_revision(uuid,uuid,text,text,text,jsonb)
  to service_role;

create or replace function public.record_leychile_capture_bundle(
  p_source_id uuid,
  p_requested_url text,
  p_final_url text,
  p_http_status integer,
  p_mime_type text,
  p_content_hash text,
  p_raw_content text,
  p_connector_version text,
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
  p_parser_version text,
  p_sections jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  capture_result jsonb;
  revision_result jsonb;
  version_id uuid;
  current_parser text;
  parsed_section_count integer;
begin
  capture_result := public.record_regulatory_source_capture(
    p_source_id := p_source_id,
    p_requested_url := p_requested_url,
    p_final_url := p_final_url,
    p_status := 'succeeded',
    p_http_status := p_http_status,
    p_mime_type := p_mime_type,
    p_content_hash := p_content_hash,
    p_raw_content := p_raw_content,
    p_storage_path := null,
    p_response_headers := '{}'::jsonb,
    p_connector_version := p_connector_version,
    p_error_code := null,
    p_error_message := null,
    p_document_identifier := p_document_identifier,
    p_document_title := p_document_title,
    p_document_type := p_document_type,
    p_document_url := p_document_url,
    p_external_reference := p_external_reference,
    p_publication_date := p_publication_date,
    p_effective_from := p_effective_from,
    p_effective_to := p_effective_to,
    p_document_status := p_document_status,
    p_version_label := p_version_label,
    p_version_date := p_version_date,
    p_normalized_content := p_normalized_content,
    p_parser_version := p_parser_version
  );

  version_id := (capture_result->>'versionId')::uuid;
  if version_id is null then
    raise exception 'leychile_version_not_resolved';
  end if;

  select v.parser_version into current_parser
  from public.regulatory_document_versions v
  where v.id = version_id;

  if current_parser is distinct from p_parser_version then
    revision_result := public.record_regulatory_parser_revision(
      (capture_result->>'documentId')::uuid,
      (capture_result->>'fetchId')::uuid,
      p_content_hash,
      p_parser_version,
      p_normalized_content,
      p_sections
    );

    return capture_result
      || revision_result
      || jsonb_build_object('changeId', null);
  end if;

  parsed_section_count := public.record_regulatory_parsed_sections(
    version_id,
    p_parser_version,
    p_sections
  );

  return capture_result || jsonb_build_object(
    'parsedSectionCount', parsed_section_count
  );
end;
$$;

revoke all on function public.record_leychile_capture_bundle(
  uuid,text,text,integer,text,text,text,text,text,text,text,text,text,date,date,date,text,text,date,text,text,jsonb
) from public, anon, authenticated;
grant execute on function public.record_leychile_capture_bundle(
  uuid,text,text,integer,text,text,text,text,text,text,text,text,text,date,date,date,text,text,date,text,text,jsonb
) to service_role;

create or replace function public.supersede_regulatory_knowledge_projection(
  p_document_id uuid,
  p_keep_version_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  obsolete_node_ids uuid[];
  node_count integer := 0;
  edge_count integer := 0;
begin
  select coalesce(array_agg(n.id), '{}'::uuid[])
    into obsolete_node_ids
  from public.public_knowledge_nodes n
  where n.source_entity_type = 'regulatory_document_section'
    and n.source_entity_id in (
      select s.id
      from public.regulatory_document_sections s
      join public.regulatory_document_versions v on v.id = s.version_id
      where v.document_id = p_document_id
        and v.id <> p_keep_version_id
    )
    and n.lifecycle_status not in ('superseded','archived');

  if cardinality(obsolete_node_ids) = 0 then
    return jsonb_build_object('nodesSuperseded', 0, 'edgesSuperseded', 0);
  end if;

  update public.public_knowledge_node_versions nv
  set review_status = 'superseded'
  where nv.id in (
    select n.current_version_id
    from public.public_knowledge_nodes n
    where n.id = any(obsolete_node_ids)
      and n.current_version_id is not null
  );

  update public.public_knowledge_edge_versions ev
  set review_status = 'superseded'
  where ev.id in (
    select e.current_version_id
    from public.public_knowledge_edges e
    where (e.source_node_id = any(obsolete_node_ids) or e.target_node_id = any(obsolete_node_ids))
      and e.current_version_id is not null
  );

  update public.public_knowledge_edges e
  set lifecycle_status = 'superseded', updated_at = now()
  where e.source_node_id = any(obsolete_node_ids)
     or e.target_node_id = any(obsolete_node_ids);
  get diagnostics edge_count = row_count;

  update public.public_knowledge_nodes n
  set lifecycle_status = 'superseded', updated_at = now()
  where n.id = any(obsolete_node_ids);
  get diagnostics node_count = row_count;

  return jsonb_build_object(
    'nodesSuperseded', node_count,
    'edgesSuperseded', edge_count
  );
end;
$$;

revoke all on function public.supersede_regulatory_knowledge_projection(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.supersede_regulatory_knowledge_projection(uuid,uuid)
  to service_role;

create or replace function public.reproject_regulatory_document_to_knowledge_graph(
  p_document_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  latest_version_id uuid;
  supersede_result jsonb;
  projection_result jsonb;
begin
  select v.id into latest_version_id
  from public.regulatory_document_versions v
  where v.document_id = p_document_id
    and v.status = 'parsed'
  order by v.version_number desc
  limit 1;

  if latest_version_id is null then
    raise exception 'parsed_regulatory_version_not_found';
  end if;

  supersede_result := public.supersede_regulatory_knowledge_projection(
    p_document_id,
    latest_version_id
  );

  projection_result := public.project_regulatory_document_to_knowledge_graph(p_document_id);

  update public.regulatory_parse_revisions r
  set status = 'projected', projected_at = now()
  where r.to_version_id = latest_version_id;

  return projection_result || supersede_result;
end;
$$;

revoke all on function public.reproject_regulatory_document_to_knowledge_graph(uuid)
  from public, anon, authenticated;
grant execute on function public.reproject_regulatory_document_to_knowledge_graph(uuid)
  to service_role;

update public.regulatory_sources
set connector_version = 'leychile-official-json-v2',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'parserVersion', 'leychile-official-json-v2',
      'parserFix', 'latin_suffixes_and_amendment_boundaries'
    ),
    updated_at = now()
where canonical_url = 'https://www.bcn.cl/leychile/';

update public.scraper_connectors
set connector_version = 'leychile-official-json-v2',
    user_agent = 'KUMPLIO-Regulatory-Connector/2.0 (+https://www.kumplio.app/regulatory)',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'parserVersion', 'leychile-official-json-v2',
      'parserFix', 'latin_suffixes_and_amendment_boundaries'
    ),
    updated_at = now()
where connector_key = 'leychile-official-json';

commit;
