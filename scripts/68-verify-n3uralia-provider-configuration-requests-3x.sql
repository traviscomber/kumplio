begin transaction read only;

do $$
declare
  v_total integer;
  v_open integer;
  v_supabase integer;
  v_openai integer;
  v_owner_mismatch integer;
  v_due_invalid integer;
begin
  select
    count(*),
    count(*) filter (where r.status in ('open','changes_requested','submitted','under_review')),
    count(*) filter (where p.attributes ->> 'providerTenantConfigurationVendor'='Supabase'),
    count(*) filter (where p.attributes ->> 'providerTenantConfigurationVendor'='OpenAI'),
    count(*) filter (where r.requested_from is distinct from p.owner_user_id),
    count(*) filter (where r.due_at is null or r.due_at <= r.created_at)
  into v_total,v_open,v_supabase,v_openai,v_owner_mismatch,v_due_invalid
  from public.organization_processes p
  join public.evidence_requests r
    on r.id=(p.attributes ->> 'providerTenantConfigurationEvidenceRequestId')::uuid
   and r.organization_id=p.organization_id
  where p.id in (
    '26233189-3335-43e6-b382-99fcf2cc4090'::uuid,
    'a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1'::uuid,
    'f3cd212a-3e27-4f27-a722-545e4c44c8b1'::uuid
  );

  if v_total <> 3 then raise exception 'Expected 3 provider configuration evidence requests, got %',v_total; end if;
  if v_open <> 3 then raise exception 'Expected 3 active provider configuration requests, got %',v_open; end if;
  if v_supabase <> 2 then raise exception 'Expected 2 Supabase configuration requests, got %',v_supabase; end if;
  if v_openai <> 1 then raise exception 'Expected 1 OpenAI configuration request, got %',v_openai; end if;
  if v_owner_mismatch <> 0 then raise exception 'Provider configuration request owner mismatch count %',v_owner_mismatch; end if;
  if v_due_invalid <> 0 then raise exception 'Provider configuration request invalid due date count %',v_due_invalid; end if;

  raise notice 'PASS provider configuration requests 3/3: Supabase 2, OpenAI 1, all active with owner and due date';
end $$;

rollback;
