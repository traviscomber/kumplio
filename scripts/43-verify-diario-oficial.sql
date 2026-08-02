do $$
begin
  if to_regclass('public.diario_oficial_editions') is null then raise exception 'missing diario_oficial_editions'; end if;
  if to_regclass('public.diario_oficial_publications') is null then raise exception 'missing diario_oficial_publications'; end if;
  if to_regprocedure('public.record_diario_oficial_edition(uuid,integer,date,text,text,text,uuid,jsonb)') is null then
    raise exception 'missing record_diario_oficial_edition';
  end if;
  if not exists(select 1 from pg_class where oid='public.diario_oficial_editions'::regclass and relrowsecurity) then
    raise exception 'RLS disabled on diario_oficial_editions';
  end if;
  if not exists(select 1 from pg_class where oid='public.diario_oficial_publications'::regclass and relrowsecurity) then
    raise exception 'RLS disabled on diario_oficial_publications';
  end if;
  if has_table_privilege('anon','public.diario_oficial_editions','select') then raise exception 'anon can read editions'; end if;
  if has_table_privilege('anon','public.diario_oficial_publications','select') then raise exception 'anon can read publications'; end if;
  if has_function_privilege('authenticated','public.record_diario_oficial_edition(uuid,integer,date,text,text,text,uuid,jsonb)','execute') then
    raise exception 'authenticated can execute record function';
  end if;
  if not exists(select 1 from public.scraper_connectors where connector_key='diario-oficial-summary' and status='manual') then
    raise exception 'Diario Oficial connector missing';
  end if;
end $$;

select connector_key,status,connector_version,adapter_type,circuit_state,parser_health
from public.scraper_connectors where connector_key='diario-oficial-summary';
