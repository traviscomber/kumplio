-- KUMPLIO LeyChile official JSON production verification

do $$
#variable_conflict use_variable
declare
  v_source public.regulatory_sources;
  v_document_id uuid;
  v_version_id uuid;
  v_version_count integer;
  v_fetch_count integer;
  v_unchanged_count integer;
  v_section_count integer;
  v_article_count integer;
  v_inciso_count integer;
  v_connector public.scraper_connectors;
begin
  select * into v_source
  from public.regulatory_sources source_row
  where source_row.canonical_url = 'https://www.bcn.cl/leychile/';

  if v_source.id is null
    or v_source.ingestion_method <> 'official_json'
    or v_source.terms_review_status <> 'approved'
    or v_source.health_status <> 'healthy'
    or v_source.connector_version <> 'leychile-official-json-v1' then
    raise exception 'LeyChile source is not approved, healthy and configured for official JSON';
  end if;

  select * into v_connector
  from public.scraper_connectors connector_row
  where connector_row.connector_key = 'leychile-official-json';

  if v_connector.id is null
    or v_connector.adapter_type <> 'json'
    or v_connector.status <> 'scheduled'
    or v_connector.connector_version <> 'leychile-official-json-v1' then
    raise exception 'LeyChile scraper connector is not scheduled as official JSON';
  end if;

  select document_row.id into v_document_id
  from public.regulatory_documents document_row
  where document_row.source_id = v_source.id
    and document_row.canonical_identifier = 'LEY-21719';

  if v_document_id is null then
    raise exception 'Ley 21.719 document was not captured';
  end if;

  select count(*) into v_version_count
  from public.regulatory_document_versions version_row
  where version_row.document_id = v_document_id;

  select version_row.id into v_version_id
  from public.regulatory_document_versions version_row
  where version_row.document_id = v_document_id
  order by version_row.version_number desc
  limit 1;

  if v_version_count <> 1 or v_version_id is null then
    raise exception 'Expected exactly one captured Ley 21.719 version, found %', v_version_count;
  end if;

  select count(*) into v_fetch_count
  from public.regulatory_source_fetches fetch_row
  where fetch_row.source_id = v_source.id
    and fetch_row.status in ('succeeded', 'unchanged');

  select count(*) into v_unchanged_count
  from public.regulatory_source_fetches fetch_row
  where fetch_row.source_id = v_source.id
    and fetch_row.status = 'unchanged';

  if v_fetch_count < 2 or v_unchanged_count < 1 then
    raise exception 'LeyChile idempotency was not verified';
  end if;

  select
    count(*),
    count(*) filter (where section_row.section_type = 'article'),
    count(*) filter (where section_row.section_type = 'inciso')
  into v_section_count, v_article_count, v_inciso_count
  from public.regulatory_document_sections section_row
  where section_row.version_id = v_version_id;

  if v_section_count < 700 or v_article_count < 80 or v_inciso_count < 600 then
    raise exception 'Captured LeyChile structure is incomplete: sections %, articles %, incisos %',
      v_section_count, v_article_count, v_inciso_count;
  end if;

  if exists (
    select 1
    from public.regulatory_document_sections section_row
    where section_row.version_id = v_version_id
      and section_row.section_type = 'inciso'
      and section_row.parent_section_id is null
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

  raise notice 'LeyChile official JSON verified: % fetches, % version, % sections (% articles, % incisos)',
    v_fetch_count, v_version_count, v_section_count, v_article_count, v_inciso_count;
end;
$$;
