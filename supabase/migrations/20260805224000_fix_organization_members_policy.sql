-- The previous policy queried organization_members from inside its own RLS
-- expression, producing infinite recursion for authenticated requests.

drop policy if exists members_read_own on public.organization_members;
drop policy if exists organization_members_select_member on public.organization_members;

create policy organization_members_select_member
on public.organization_members
for select
to authenticated
using ((select public.is_organization_member(organization_id)));

revoke all on table public.organization_members from anon;
revoke all on table public.organization_members from authenticated;
grant select on table public.organization_members to authenticated;
grant all on table public.organization_members to service_role;
