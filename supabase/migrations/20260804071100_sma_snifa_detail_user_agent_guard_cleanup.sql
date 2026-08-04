begin;

drop trigger if exists normalize_sma_snifa_detail_user_agent
  on public.scraper_connectors;
drop function if exists private.normalize_sma_snifa_detail_user_agent();

commit;
