-- KUMPLIO real workspace onboarding
-- Creates the first organization, owner membership, profile, project and case
-- atomically for the authenticated user.

begin;

-- Stop bypassing hosted Auth email confirmation and remove the duplicate
-- profile trigger. The remaining trigger creates one profile per auth user.
drop trigger if exists auto_confirm_email_on_signup on auth.users;
drop function if exists public.auto_confirm_email();

drop trigger if exists on_auth_user_created_profile on auth.users;
drop function if exists public.handle_new_user_profile();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    company_name,
    subscription_tier,
    role
  ) values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(new.raw_user_meta_data->>'company_name'), ''),
    'free',
    'user'
  )
  on conflict (id) do update
    set email = excluded.email,
        company_name = coalesce(public.profiles.company_name, excluded.company_name),
        updated_at = now();

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Reduce Data API privileges. Workspace creation and membership insertion are
-- available only through initialize_workspace() or a future audited invitation RPC.
revoke all on table public.organizations from anon;
revoke insert, update, delete, truncate, trigger, references on table public.organizations from authenticated;
grant select on table public.organizations to authenticated;
grant update (name, country, industry, size, updated_at)
  on table public.organizations to authenticated;

revoke all on table public.organization_members from anon;
revoke insert, update, delete, truncate, trigger, references on table public.organization_members from authenticated;
grant select on table public.organization_members to authenticated;

revoke all on table public.profiles from anon;
revoke insert, update, delete, truncate, trigger, references on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (first_name, last_name, company_name, updated_at)
  on table public.profiles to authenticated;

revoke all on table public.projects from anon;
revoke truncate, trigger, references on table public.projects from authenticated;
grant select, insert, update, delete on table public.projects to authenticated;

drop policy if exists org_insert_authenticated on public.organizations;
drop policy if exists members_insert_authenticated on public.organization_members;
drop policy if exists members_update_as_owner on public.organization_members;
drop policy if exists members_update_by_owner on public.organization_members;
drop policy if exists profiles_insert_own on public.profiles;

create or replace function public.initialize_workspace(
  organization_name text,
  industry_code text,
  organization_size text,
  first_name text default null,
  last_name text default null,
  project_name text default 'Ley 21.719 y protección de datos',
  first_case_title text default 'Preparación para la Ley 21.719'
)
returns table (
  organization_id uuid,
  project_id uuid,
  case_id uuid,
  initialized boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  existing_organization_id uuid;
  created_organization_id uuid;
  created_project_id uuid;
  created_case_id uuid;
  clean_organization_name text := trim(organization_name);
  clean_project_name text := trim(project_name);
  clean_case_title text := trim(first_case_title);
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if char_length(clean_organization_name) < 2 or char_length(clean_organization_name) > 160 then
    raise exception using errcode = '22023', message = 'Invalid organization name';
  end if;

  if industry_code not in ('general', 'transport', 'agriculture', 'mining', 'health', 'finance', 'construction', 'other') then
    raise exception using errcode = '22023', message = 'Invalid industry';
  end if;

  if organization_size not in ('micro', 'small', 'medium', 'large', 'enterprise') then
    raise exception using errcode = '22023', message = 'Invalid organization size';
  end if;

  if char_length(clean_project_name) < 3 or char_length(clean_project_name) > 160 then
    raise exception using errcode = '22023', message = 'Invalid project name';
  end if;

  if char_length(clean_case_title) < 3 or char_length(clean_case_title) > 160 then
    raise exception using errcode = '22023', message = 'Invalid case title';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(current_user_id::text, 0));

  select member.organization_id
    into existing_organization_id
  from public.organization_members member
  where member.user_id = current_user_id
  order by member.joined_at asc nulls last
  limit 1;

  if existing_organization_id is not null then
    select project.id
      into created_project_id
    from public.projects project
    where project.organization_id = existing_organization_id
    order by project.created_at asc nulls last
    limit 1;

    select compliance_case.id
      into created_case_id
    from public.compliance_cases compliance_case
    where compliance_case.organization_id = existing_organization_id
    order by compliance_case.created_at asc
    limit 1;

    return query
      select existing_organization_id, created_project_id, created_case_id, false;
    return;
  end if;

  select users.email
    into current_email
  from auth.users users
  where users.id = current_user_id;

  if current_email is null or current_email = '' then
    raise exception using errcode = '22023', message = 'Authenticated user has no email';
  end if;

  insert into public.organizations (name, country, industry, size)
  values (clean_organization_name, 'CL', industry_code, organization_size)
  returning id into created_organization_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (created_organization_id, current_user_id, 'owner');

  insert into public.profiles (
    id,
    first_name,
    last_name,
    company_name,
    email,
    role,
    subscription_tier,
    organization_id,
    updated_at
  ) values (
    current_user_id,
    nullif(trim(first_name), ''),
    nullif(trim(last_name), ''),
    clean_organization_name,
    current_email,
    'user',
    'free',
    created_organization_id,
    now()
  )
  on conflict (id) do update
    set first_name = coalesce(excluded.first_name, public.profiles.first_name),
        last_name = coalesce(excluded.last_name, public.profiles.last_name),
        company_name = excluded.company_name,
        email = excluded.email,
        organization_id = excluded.organization_id,
        updated_at = now();

  insert into public.projects (
    user_id,
    name,
    description,
    status,
    compliance_law,
    organization_id
  ) values (
    current_user_id,
    clean_project_name,
    'Primer ámbito de cumplimiento creado durante el onboarding de KUMPLIO.',
    'active',
    case
      when industry_code = 'transport' then 'Ley 21.719 y cumplimiento de transporte'
      when industry_code = 'agriculture' then 'Ley 21.719 y cumplimiento agroalimentario'
      when industry_code = 'mining' then 'Ley 21.719 y cumplimiento minero'
      else 'Ley 21.719'
    end,
    created_organization_id
  )
  returning id into created_project_id;

  insert into public.compliance_cases (
    organization_id,
    project_id,
    title,
    description,
    status,
    priority,
    owner_id,
    created_by,
    metadata
  ) values (
    created_organization_id,
    created_project_id,
    clean_case_title,
    'Expediente inicial para organizar fuentes, obligaciones, controles, evidencia, riesgos, acciones y revisiones.',
    'active',
    'medium',
    current_user_id,
    current_user_id,
    jsonb_build_object(
      'source', 'workspace_onboarding',
      'industry', industry_code,
      'organizationSize', organization_size
    )
  )
  returning id into created_case_id;

  return query
    select created_organization_id, created_project_id, created_case_id, true;
end;
$$;

revoke all on function public.initialize_workspace(text, text, text, text, text, text, text)
  from public, anon;
grant execute on function public.initialize_workspace(text, text, text, text, text, text, text)
  to authenticated;

commit;
