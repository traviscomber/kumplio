begin;

create table if not exists public.diario_oficial_editions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.regulatory_sources(id) on delete restrict,
  edition_number integer not null,
  publication_date date not null,
  canonical_url text not null,
  content_hash text not null,
  parser_version text not null,
  raw_fetch_id uuid references public.regulatory_source_fetches(id) on delete set null,
  publication_count integer not null default 0,
  status text not null default 'captured' check (status in ('captured','reviewed','rejected')),
  created_at timestamptz not null default now(),
  unique (edition_number, publication_date),
  unique (content_hash)
);

create table if not exists public.diario_oficial_publications (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.diario_oficial_editions(id) on delete cascade,
  cve bigint not null unique,
  section text not null,
  power_name text,
  ministry_name text,
  agency_name text,
  title text not null,
  pdf_url text not null,
  publication_hash text not null,
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists diario_editions_date_idx on public.diario_oficial_editions(publication_date desc);
create index if not exists diario_editions_source_idx on public.diario_oficial_editions(source_id, publication_date desc);
create index if not exists diario_publications_edition_idx on public.diario_oficial_publications(edition_id);
create index if not exists diario_publications_ministry_idx on public.diario_oficial_publications(ministry_name);
create index if not exists diario_publications_review_idx on public.diario_oficial_publications(review_status, created_at);
create index if not exists diario_publications_reviewer_idx on public.diario_oficial_publications(reviewed_by);

alter table public.diario_oficial_editions enable row level security;
alter table public.diario_oficial_publications enable row level security;
revoke all on public.diario_oficial_editions, public.diario_oficial_publications from anon, authenticated;
grant select on public.diario_oficial_editions, public.diario_oficial_publications to authenticated;
grant all on public.diario_oficial_editions, public.diario_oficial_publications to service_role;

create policy diario_editions_read_authenticated on public.diario_oficial_editions for select to authenticated using (true);
create policy diario_publications_read_authenticated on public.diario_oficial_publications for select to authenticated using (true);

create or replace function public.record_diario_oficial_edition(
  target_source uuid,
  target_edition integer,
  target_date date,
  target_url text,
  target_content_hash text,
  target_parser_version text,
  target_fetch uuid,
  target_publications jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing public.diario_oficial_editions%rowtype;
  edition_id uuid;
  item jsonb;
  inserted_count integer := 0;
begin
  select * into existing from public.diario_oficial_editions
  where edition_number = target_edition and publication_date = target_date;

  if existing.id is not null then
    if existing.content_hash <> target_content_hash then
      raise exception 'diario_oficial_edition_changed_requires_review';
    end if;
    return jsonb_build_object('editionId', existing.id, 'status', 'unchanged', 'publicationCount', existing.publication_count);
  end if;

  insert into public.diario_oficial_editions(
    source_id, edition_number, publication_date, canonical_url, content_hash,
    parser_version, raw_fetch_id, publication_count
  ) values (
    target_source, target_edition, target_date, target_url, target_content_hash,
    target_parser_version, target_fetch, jsonb_array_length(target_publications)
  ) returning id into edition_id;

  for item in select * from jsonb_array_elements(target_publications)
  loop
    insert into public.diario_oficial_publications(
      edition_id,cve,section,power_name,ministry_name,agency_name,title,pdf_url,publication_hash
    ) values (
      edition_id,(item->>'cve')::bigint,item->>'section',nullif(item->>'power',''),
      nullif(item->>'ministry',''),nullif(item->>'agency',''),item->>'title',item->>'pdfUrl',item->>'hash'
    ) on conflict (cve) do nothing;
    if found then inserted_count := inserted_count + 1; end if;
  end loop;

  return jsonb_build_object('editionId', edition_id, 'status', 'captured', 'publicationCount', inserted_count);
end;
$$;

revoke all on function public.record_diario_oficial_edition(uuid,integer,date,text,text,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.record_diario_oficial_edition(uuid,integer,date,text,text,text,uuid,jsonb) to service_role;

insert into public.regulatory_sources(
  authority_name, source_name, canonical_url, source_type, authority_level,
  ingestion_method, monitoring_frequency, health_status, terms_review_status, metadata
) values (
  'Diario Oficial de la República de Chile','Diario Oficial — Edición Electrónica',
  'https://www.diariooficial.interior.gob.cl/edicionelectronica/','official_gazette','primary',
  'controlled_html','daily','unknown','approved',jsonb_build_object('scope','normas_generales','country','CL')
) on conflict (canonical_url) do nothing;

insert into public.scraper_connectors(
  source_id,connector_key,display_name,connector_version,adapter_type,status,
  allowed_hosts,allowed_path_patterns,allowed_mime_types,timeout_ms,max_response_bytes,
  max_attempts,retry_backoff_seconds,failure_threshold,circuit_open_seconds,user_agent,terms_reference,metadata
)
select id,'diario-oficial-summary','Diario Oficial — Normas Generales','diario-oficial-summary-v1','html','manual',
  array['www.diariooficial.interior.gob.cl'],array['/edicionelectronica/index.php/index.php'],
  array['text/html','application/xhtml+xml'],25000,8388608,3,array[60,300,1800],3,3600,
  'KUMPLIO-Regulatory-Connector/0.3 (+https://www.kumplio.app/regulatory)',
  'Edición electrónica pública del Diario Oficial de la República de Chile',
  jsonb_build_object('section','normas_generales','cveRequired',true)
from public.regulatory_sources where canonical_url='https://www.diariooficial.interior.gob.cl/edicionelectronica/'
on conflict (connector_key) do update set connector_version=excluded.connector_version, updated_at=now();

commit;
