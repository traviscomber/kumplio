-- KUMPLIO — UNIT-ECONOMICS-001 hardening: denegación explícita a clientes
begin;

create policy kumplio_internal_users_deny_clients
  on public.kumplio_internal_users
  for all to anon,authenticated
  using (false)
  with check (false);

create policy fx_rates_deny_clients
  on public.fx_rates
  for all to anon,authenticated
  using (false)
  with check (false);

create policy organization_commercial_terms_deny_clients
  on public.organization_commercial_terms
  for all to anon,authenticated
  using (false)
  with check (false);

commit;
