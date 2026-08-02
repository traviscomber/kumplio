-- KUMPLIO real workspace onboarding verification
-- Read-only checks for authentication triggers, RPC privileges and reduced grants.

do $$
declare
  onboarding_definition text;
begin
  if to_regprocedure('public.initialize_workspace(text,text,text,text,text,text,text)') is null then
    raise exception 'Missing public.initialize_workspace(...)';
  end if;

  if exists (
    select 1
    from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'auto_confirm_email_on_signup'
      and not tgisinternal
  ) then
    raise exception 'Unsafe auto_confirm_email_on_signup trigger is still installed';
  end if;

  if exists (
    select 1
    from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'on_auth_user_created_profile'
      and not tgisinternal
  ) then
    raise exception 'Duplicate profile creation trigger is still installed';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'on_auth_user_created'
      and not tgisinternal
  ) then
    raise exception 'Missing canonical auth profile trigger';
  end if;

  if has_function_privilege('anon', 'public.initialize_workspace(text,text,text,text,text,text,text)', 'execute') then
    raise exception 'Anonymous role can execute initialize_workspace';
  end if;

  if not has_function_privilege('authenticated', 'public.initialize_workspace(text,text,text,text,text,text,text)', 'execute') then
    raise exception 'Authenticated role cannot execute initialize_workspace';
  end if;

  if has_table_privilege('anon', 'public.organizations', 'select')
    or has_table_privilege('anon', 'public.organization_members', 'select')
    or has_table_privilege('anon', 'public.profiles', 'select')
    or has_table_privilege('anon', 'public.projects', 'select') then
    raise exception 'Anonymous role unexpectedly has workspace table access';
  end if;

  if has_table_privilege('authenticated', 'public.organizations', 'insert')
    or has_table_privilege('authenticated', 'public.organization_members', 'insert')
    or has_table_privilege('authenticated', 'public.organization_members', 'update')
    or has_table_privilege('authenticated', 'public.organization_members', 'delete') then
    raise exception 'Authenticated role can bypass controlled workspace or membership creation';
  end if;

  if not has_table_privilege('authenticated', 'public.organizations', 'select')
    or not has_table_privilege('authenticated', 'public.organization_members', 'select')
    or not has_table_privilege('authenticated', 'public.profiles', 'select,update')
    or not has_table_privilege('authenticated', 'public.projects', 'select,insert,update,delete') then
    raise exception 'Authenticated role is missing required workspace privileges';
  end if;

  select pg_get_functiondef('public.initialize_workspace(text,text,text,text,text,text,text)'::regprocedure)
    into onboarding_definition;

  if onboarding_definition not like '%SECURITY DEFINER%'
    or onboarding_definition not like '%SET search_path TO%'
    or onboarding_definition not like '%auth.uid()%'
    or onboarding_definition not like '%pg_advisory_xact_lock%'
    or onboarding_definition not like '%organization_members%'
    or onboarding_definition not like '%compliance_cases%' then
    raise exception 'initialize_workspace is missing required security or atomicity controls';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organizations'
      and policyname = 'org_insert_authenticated'
  ) then
    raise exception 'Unsafe direct organization insert policy remains';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_members'
      and policyname = 'members_insert_authenticated'
  ) then
    raise exception 'Unsafe direct membership insert policy remains';
  end if;

  raise notice 'KUMPLIO workspace onboarding verification passed.';
end;
$$;

select
  routine_schema,
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('handle_new_user', 'initialize_workspace')
order by routine_name;
