begin;

alter table public.dt_document_details
  drop constraint if exists dt_document_details_pdf_url_check;

alter table public.dt_document_details
  add constraint dt_document_details_pdf_url_check
    check (
      pdf_url is null
      or pdf_url ~ '^https://(www[.])?dt[.]gob[.]cl/legislacion/1624/articles-[0-9]+_recurso_([0-9]+|pdf)[.]pdf$'
    );

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef(
    'public.record_dt_pronouncement_metadata(uuid,jsonb,jsonb,jsonb,jsonb,jsonb)'::regprocedure
  ) into function_definition;

  function_definition := replace(
    function_definition,
    '_recurso_[0-9]+[.]pdf',
    '_recurso_([0-9]+|pdf)[.]pdf'
  );

  execute function_definition;
end;
$$;

revoke all on function public.record_dt_pronouncement_metadata(uuid,jsonb,jsonb,jsonb,jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function public.record_dt_pronouncement_metadata(uuid,jsonb,jsonb,jsonb,jsonb,jsonb)
  to service_role;

commit;
