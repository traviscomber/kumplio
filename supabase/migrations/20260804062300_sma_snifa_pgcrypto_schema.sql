begin;

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef(
    'public.record_sma_sanctioning_batch(uuid,jsonb)'::regprocedure
  ) into function_definition;

  function_definition := replace(
    function_definition,
    'digest(',
    'extensions.digest('
  );

  execute function_definition;
end;
$$;

revoke all on function public.record_sma_sanctioning_batch(uuid,jsonb)
  from public, anon, authenticated;
grant execute on function public.record_sma_sanctioning_batch(uuid,jsonb)
  to service_role;

commit;
