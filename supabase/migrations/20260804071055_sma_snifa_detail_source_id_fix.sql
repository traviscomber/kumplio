begin;

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef(
    'public.record_sma_sanctioning_detail(bigint,uuid,text,text,text,text,date,date,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb)'::regprocedure
  ) into function_definition;

  function_definition := replace(
    function_definition,
    'source_id uuid;',
    'target_source_id uuid;'
  );
  function_definition := replace(
    function_definition,
    'select source.id into source_id',
    'select source.id into target_source_id'
  );
  function_definition := replace(
    function_definition,
    'if source_id is null then',
    'if target_source_id is null then'
  );
  function_definition := replace(
    function_definition,
    'source_fetch.source_id = source_id',
    'source_fetch.source_id = target_source_id'
  );

  execute function_definition;
end;
$$;

revoke all on function public.record_sma_sanctioning_detail(
  bigint,uuid,text,text,text,text,date,date,text,
  jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb
) from public,anon,authenticated;

grant execute on function public.record_sma_sanctioning_detail(
  bigint,uuid,text,text,text,text,date,date,text,
  jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb
) to service_role;

commit;
