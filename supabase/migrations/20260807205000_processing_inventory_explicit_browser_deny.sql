-- Make the internal-only boundary explicit to the Security Advisor as well as Postgres grants.
-- service_role remains the only application role with table privileges.

create policy "processing activity evidence browser deny"
on public.processing_activity_evidence
for all
to anon, authenticated
using (false)
with check (false);

create policy "processing activity reviews browser deny"
on public.processing_activity_reviews
for all
to anon, authenticated
using (false)
with check (false);
