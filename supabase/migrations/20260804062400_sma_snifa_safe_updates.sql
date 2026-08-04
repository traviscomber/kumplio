begin;

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef(
    'public.complete_sma_sanctioning_snapshot(uuid)'::regprocedure
  ) into function_definition;

  function_definition := replace(
    function_definition,
    'update public.sma_sanctioning_proceedings set is_current = false, updated_at = now();',
    'update public.sma_sanctioning_proceedings set is_current = false, updated_at = now() where is_current;'
  );
  function_definition := replace(
    function_definition,
    'update public.sma_fiscalizable_units set is_current = false, updated_at = now();',
    'update public.sma_fiscalizable_units set is_current = false, updated_at = now() where is_current;'
  );
  function_definition := replace(
    function_definition,
    'delete from public.sma_proceeding_units;',
    'delete from public.sma_proceeding_units where source_snapshot_id is not null;'
  );

  execute function_definition;
end;
$$;

revoke all on function public.complete_sma_sanctioning_snapshot(uuid)
  from public, anon, authenticated;
grant execute on function public.complete_sma_sanctioning_snapshot(uuid)
  to service_role;

commit;
