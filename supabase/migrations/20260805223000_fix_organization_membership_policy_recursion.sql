-- RLS policies across the product call this helper. Running it as an invoker
-- makes organization_members evaluate its own policies recursively.
-- The function returns only a boolean for auth.uid() and does not expose rows.

create or replace function public.is_organization_member(target_organization uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization
      and membership.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_organization_member(uuid) from public, anon;
grant execute on function public.is_organization_member(uuid) to authenticated, service_role;

comment on function public.is_organization_member(uuid) is
  'RLS helper: returns whether auth.uid() belongs to the target organization without exposing membership rows.';
