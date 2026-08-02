-- KUMPLIO LeyChile production verification
-- Run after scripts 37, 38, 40, 41 and the first official capture.

do $$
declare
  source_record public.regulatory_sources;
  document_id uuid;
  version_id uuid;
  version_count integer;
  fetch_count integer;
  unchanged_count integer;
  section_count integer;
  article_count integer;
  inciso_count integer;
begin
  select * into source_record
  from public.regulatory_sources
  where canonical_url = 'https://www.bcn.cl/leychile/';

  if source_record.id is null
    or source_record.terms_review_status <> 'approved'
    or source_record.health_status <> 'healthy'
    or source_record.connector_version <> 'leychile-official-json-v1' then
    raise exception 'LeyChile source is not approved and healthy';
  end if;

  select document.id into document_id
  from public.regulatory_documents document
  where document.source_id = source_record.id
    and document.canonical_identifier = 'LEY-21719';

  if document_id is null then
    raise exception 'Ley 21.719 document was not captured';
  end if;

  select count(*) into version_count
  from public.regulatory_document_versions version
  where version.document_id = document_id;

  select version.id into version_id
  from public.regulatory_document_versions version
  where version.document_id = document_id
  order by version.version_number desc
  limit 1;

  if version_count <> 1 or version_id is null then
    raise exception 'Expected exactly one captured Ley 21.719 version, found %', version_count;
  end if;

  select count(*) into fetch_count
  from public.regulatory_source_fetches source_fetch
  where source_fetch.source_id = source_record.id
    and source_fetch.status in ('succeeded', 'unchanged');

  select count(*) into unchanged_count
  from public.regulatory_source_fetches source_fetch
  where source_fetch.source_id = source_record.id
    and source_fetch.status = 'unchanged';

  if fetch_count < 2 or unchanged_count < 1 then
    raise exception 'LeyChile idempotency was not verified';
  end if;

  select
    count(*),
    count(*) filter (where section.section_type = 'article'),
    count(*) filter (where section.section_type = 'inciso')
  into section_count, article_count, inciso_count
  from public.regulatory_document_sections section
  where section.version_id = version_id;

  if section_count < 700 or article_count < 80 or inciso_count < 600 then
    raise exception 'Captured LeyChile structure is incomplete: sections %, articles %, incisos %',
      section_count, article_count, inciso_count;
  end if;

  if exists (
    select 1
    from public.regulatory_document_sections section
    where section.version_id = version_id
      and section.section_type = 'inciso'
      and section.parent_section_id is null
  ) then
    raise exception 'At least one inciso is missing its article parent';
  end if;

  if not exists (
    select 1
    from pg_proc function_record
    join pg_namespace namespace_record on namespace_record.oid = function_record.pronamespace
    where namespace_record.nspname = 'public'
      and function_record.proname = 'record_regulatory_source_capture'
      and function_record.prosecdef = false
  ) then
    raise exception 'record_regulatory_source_capture is missing or SECURITY DEFINER';
  end if;

  if exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'regulatory_source_fetches_hash_uidx'
  ) then
    raise exception 'Legacy unique regulatory fetch hash index still exists';
  end if;

  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.regulatory_document_sections'::regclass
      and conname = 'regulatory_document_sections_version_id_section_hash_key'
  ) then
    raise exception 'Legacy unique section hash constraint still exists';
  end if;

  raise notice 'LeyChile production verified: % fetches, % version, % sections (% articles, % incisos)',
    fetch_count, version_count, section_count, article_count, inciso_count;
end;
$$;
