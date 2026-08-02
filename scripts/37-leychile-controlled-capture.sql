-- KUMPLIO LeyChile Controlled Capture — parsed section transaction

begin;

alter table public.regulatory_document_sections
  add column if not exists section_key text;

update public.regulatory_document_sections
set section_key = coalesce(section_key, 'legacy:' || ordinal::text)
where section_key is null;

alter table public.regulatory_document_sections
  alter column section_key set not null;

alter table public.regulatory_document_sections
  drop constraint if exists regulatory_document_sections_version_key_key;
alter table public.regulatory_document_sections
  add constraint regulatory_document_sections_version_key_key
  unique (version_id, section_key);

create or replace function public.record_regulatory_parsed_sections(
  p_version_id uuid,
  p_parser_version text,
  p_sections jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  version_record public.regulatory_document_versions;
  section_record jsonb;
  section_count integer;
  existing_count integer;
  inserted_count integer := 0;
begin
  select * into version_record
  from public.regulatory_document_versions version
  where version.id = p_version_id;

  if version_record.id is null then
    raise exception using errcode = '23503', message = 'Regulatory document version not found';
  end if;

  if jsonb_typeof(p_sections) <> 'array' then
    raise exception using errcode = '22023', message = 'Parsed sections must be an array';
  end if;

  section_count := jsonb_array_length(p_sections);
  if section_count < 1 or section_count > 10000 then
    raise exception using errcode = '22023', message = 'Invalid parsed section count';
  end if;

  select count(*) into existing_count
  from public.regulatory_document_sections section
  where section.version_id = p_version_id;

  if existing_count > 0 then
    if existing_count <> section_count or exists (
      select 1
      from jsonb_array_elements(p_sections) input(value)
      left join public.regulatory_document_sections section
        on section.version_id = p_version_id
       and section.section_key = input.value->>'key'
       and section.section_hash = input.value->>'hash'
      where section.id is null
    ) then
      raise exception using errcode = '23514', message = 'Parsed sections already exist with different content';
    end if;

    return existing_count;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_version_id::text, 2)
  );

  for section_record in
    select value
    from jsonb_array_elements(p_sections)
    order by (value->>'ordinal')::integer
  loop
    if coalesce(section_record->>'key', '') = ''
      or section_record->>'type' not in ('article', 'inciso')
      or (section_record->>'ordinal')::integer < 1
      or coalesce(section_record->>'bodyText', '') = ''
      or coalesce(section_record->>'normalizedText', '') = ''
      or coalesce(section_record->>'hash', '') !~ '^[0-9a-f]{64}$' then
      raise exception using errcode = '22023', message = 'Invalid parsed section';
    end if;

    if section_record->>'type' = 'article'
      and nullif(section_record->>'parentKey', '') is not null then
      raise exception using errcode = '23514', message = 'Article section cannot have a parent';
    end if;

    if section_record->>'type' = 'inciso'
      and nullif(section_record->>'parentKey', '') is null then
      raise exception using errcode = '23514', message = 'Inciso section requires an article parent';
    end if;

    insert into public.regulatory_document_sections (
      version_id,
      parent_section_id,
      section_key,
      section_type,
      ordinal,
      reference_label,
      heading,
      body_text,
      normalized_text,
      section_hash,
      metadata
    ) values (
      p_version_id,
      case
        when section_record->>'type' = 'inciso' then (
          select parent.id
          from public.regulatory_document_sections parent
          where parent.version_id = p_version_id
            and parent.section_key = section_record->>'parentKey'
        )
        else null
      end,
      section_record->>'key',
      section_record->>'type',
      (section_record->>'ordinal')::integer,
      nullif(section_record->>'referenceLabel', ''),
      nullif(section_record->>'heading', ''),
      section_record->>'bodyText',
      section_record->>'normalizedText',
      section_record->>'hash',
      jsonb_build_object(
        'parserVersion', nullif(btrim(p_parser_version), ''),
        'source', 'leychile-controlled-capture'
      )
    );

    if section_record->>'type' = 'inciso'
      and not exists (
        select 1
        from public.regulatory_document_sections section
        where section.version_id = p_version_id
          and section.section_key = section_record->>'key'
          and section.parent_section_id is not null
      ) then
      raise exception using errcode = '23514', message = 'Inciso parent was not resolved';
    end if;

    inserted_count := inserted_count + 1;
  end loop;

  return inserted_count;
end;
$$;

revoke all on function public.record_regulatory_parsed_sections(uuid,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.record_regulatory_parsed_sections(uuid,text,jsonb)
  to service_role;

commit;
