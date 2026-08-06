-- KUMPLIO — active workspace context
-- Uses profiles.organization_id as the canonical active workspace.

create schema if not exists private;

-- Defensive cleanup: an active workspace must always be one of the user's memberships.
update public.profiles profile
set organization_id = null,
    updated_at = now()
where profile.organization_id is not null
  and not exists (
    select 1
    from public.organization_members membership
    where membership.user_id = profile.id
      and membership.organization_id = profile.organization_id
  );

create or replace function private.list_my_workspaces()
returns table (
  organization_id uuid,
  organization_name text,
  role text,
  is_active boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    membership.organization_id,
    organization.name as organization_name,
    coalesce(membership.role, 'member') as role,
    profile.organization_id = membership.organization_id as is_active
  from public.organization_members membership
  join public.organizations organization
    on organization.id = membership.organization_id
  left join public.profiles profile
    on profile.id = (select auth.uid())
  where membership.user_id = (select auth.uid())
  order by
    case when profile.organization_id = membership.organization_id then 0 else 1 end,
    lower(organization.name),
    membership.joined_at;
$$;

create or replace function public.list_my_workspaces()
returns table (
  organization_id uuid,
  organization_name text,
  role text,
  is_active boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.list_my_workspaces();
$$;

create or replace function private.set_active_workspace(target_organization uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  if target_organization is null then
    raise exception 'workspace_required';
  end if;

  if not exists (
    select 1
    from public.organization_members membership
    where membership.user_id = actor_id
      and membership.organization_id = target_organization
  ) then
    raise exception 'workspace_forbidden';
  end if;

  update public.profiles profile
  set organization_id = target_organization,
      updated_at = now()
  where profile.id = actor_id;

  if not found then
    raise exception 'profile_not_found';
  end if;

  return true;
end;
$$;

create or replace function public.set_active_workspace(target_organization uuid)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.set_active_workspace(target_organization);
$$;

revoke all on function private.list_my_workspaces() from public;
revoke all on function private.set_active_workspace(uuid) from public;
revoke all on function public.list_my_workspaces() from public;
revoke all on function public.set_active_workspace(uuid) from public;

revoke all on function private.list_my_workspaces() from anon;
revoke all on function private.set_active_workspace(uuid) from anon;
revoke all on function public.list_my_workspaces() from anon;
revoke all on function public.set_active_workspace(uuid) from anon;

grant execute on function private.list_my_workspaces() to authenticated, service_role;
grant execute on function private.set_active_workspace(uuid) to authenticated, service_role;
grant execute on function public.list_my_workspaces() to authenticated, service_role;
grant execute on function public.set_active_workspace(uuid) to authenticated, service_role;

-- Existing pages that read organization_members with limit(1) now receive the
-- explicitly selected workspace. When no active workspace exists yet, all of
-- the user's authorized memberships remain visible so onboarding can bootstrap.
drop policy if exists organization_members_select_member on public.organization_members;
drop policy if exists organization_members_select_active_workspace on public.organization_members;

create policy organization_members_select_active_workspace
on public.organization_members
for select
to authenticated
using (
  (select public.is_organization_member(organization_members.organization_id))
  and (
    (select profile.organization_id from public.profiles profile where profile.id = (select auth.uid())) is null
    or organization_members.organization_id = (
      select profile.organization_id
      from public.profiles profile
      where profile.id = (select auth.uid())
    )
  )
);

comment on function public.list_my_workspaces() is
  'Lists only organizations where the authenticated user has a membership, including the active workspace flag.';
comment on function public.set_active_workspace(uuid) is
  'Changes profiles.organization_id only when the authenticated user belongs to the target organization.';
