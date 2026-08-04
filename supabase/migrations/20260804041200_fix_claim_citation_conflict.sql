begin;

do $$
declare
  function_definition text;
begin
  select pg_catalog.pg_get_functiondef(
    'public.extract_regulatory_claims_deterministic(uuid,text)'::regprocedure
  ) into function_definition;

  function_definition := replace(
    function_definition,
    'on conflict (claim_id, section_id, quote_hash) do nothing',
    'on conflict on constraint regulatory_claim_citations_claim_id_section_id_quote_hash_key do nothing'
  );

  if position(
    'on conflict on constraint regulatory_claim_citations_claim_id_section_id_quote_hash_key do nothing'
    in function_definition
  ) = 0 then
    raise exception 'claim_citation_conflict_patch_not_applied';
  end if;

  execute function_definition;
end $$;

revoke all on function public.extract_regulatory_claims_deterministic(uuid,text)
  from public, anon, authenticated;
grant execute on function public.extract_regulatory_claims_deterministic(uuid,text)
  to service_role;

commit;
