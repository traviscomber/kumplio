-- KUMPLIO — Política explícita para catálogo privado agente–capacidad
begin;

drop policy if exists agent_capabilities_no_client_access on public.agent_capabilities;
create policy agent_capabilities_no_client_access
  on public.agent_capabilities
  for select to authenticated
  using (false);

commit;
