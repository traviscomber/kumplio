-- KUMPLIO Agent Control Plane RLS
-- Tenant isolation and minimum-authority policies for migration 06.

begin;

create or replace function public.is_organization_member(target_organization uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from organization_members membership
    where membership.organization_id = target_organization
      and membership.user_id = auth.uid()
  );
$$;

