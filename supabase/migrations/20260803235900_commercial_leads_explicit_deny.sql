create policy "commercial_leads_deny_public_access"
on public.commercial_leads
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
