begin;

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef(
    'public.record_dt_pronouncement_metadata(uuid,jsonb,jsonb,jsonb,jsonb,jsonb)'::regprocedure
  ) into function_definition;

  function_definition := replace(
    function_definition,
    'raise exception ''dt_metadata_already_exists_with_different_content'';',
    'raise exception ''dt_metadata_already_exists_with_different_content:%'', p_version_id;'
  );

  execute function_definition;
end;
$$;

revoke all on function public.record_dt_pronouncement_metadata(uuid,jsonb,jsonb,jsonb,jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function public.record_dt_pronouncement_metadata(uuid,jsonb,jsonb,jsonb,jsonb,jsonb)
  to service_role;

commit;
