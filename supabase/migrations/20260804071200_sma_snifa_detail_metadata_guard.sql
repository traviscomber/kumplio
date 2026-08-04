begin;

create or replace function private.merge_sma_snifa_detail_connector_metadata()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.connector_key = 'sma-snifa-detail' then
    new.metadata := coalesce(old.metadata, '{}'::jsonb) || coalesce(new.metadata, '{}'::jsonb);
    new.status := 'manual';
  end if;
  return new;
end;
$$;

drop trigger if exists merge_sma_snifa_detail_connector_metadata
  on public.scraper_connectors;
create trigger merge_sma_snifa_detail_connector_metadata
  before update on public.scraper_connectors
  for each row execute function private.merge_sma_snifa_detail_connector_metadata();

commit;
