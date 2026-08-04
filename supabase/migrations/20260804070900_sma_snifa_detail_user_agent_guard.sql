begin;

create or replace function private.normalize_sma_snifa_detail_user_agent()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.connector_key = 'sma-snifa-detail' and new.user_agent is null then
    new.user_agent := 'SNIFA origin requires omitting the User-Agent request header';
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_sma_snifa_detail_user_agent
  on public.scraper_connectors;
create trigger normalize_sma_snifa_detail_user_agent
  before insert or update on public.scraper_connectors
  for each row execute function private.normalize_sma_snifa_detail_user_agent();

commit;
