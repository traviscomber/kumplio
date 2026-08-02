-- Extend regulatory source ingestion methods for official structured endpoints.

begin;

alter table public.regulatory_sources
  drop constraint if exists regulatory_sources_ingestion_method_check;

alter table public.regulatory_sources
  add constraint regulatory_sources_ingestion_method_check
  check (ingestion_method in (
    'api',
    'feed',
    'json',
    'official_json',
    'html',
    'pdf',
    'manual'
  ));

commit;
