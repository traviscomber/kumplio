-- Audit closure wave 2: keep privileged implementations outside the exposed API schema.
create schema if not exists private;

create or replace function private.is_organization_member(target_organization uuid)
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

revoke all on function private.is_organization_member(uuid) from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;
grant execute on function private.is_organization_member(uuid) to authenticated, service_role;

create or replace function public.is_organization_member(target_organization uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_organization_member(target_organization);
$$;

revoke all on function public.is_organization_member(uuid) from public, anon;
grant execute on function public.is_organization_member(uuid) to authenticated, service_role;

create or replace function private.create_document_record(
  p_project_id uuid,
  p_name text,
  p_file_url text,
  p_document_type text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  subscription_tier text;
  created_document_id uuid;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(pg_catalog.hashtextextended(current_user_id::text, 0));

  if not exists (
    select 1
    from public.projects
    where projects.id = p_project_id
      and (
        projects.user_id = current_user_id
        or projects.organization_id in (
          select organization_members.organization_id
          from public.organization_members
          where organization_members.user_id = current_user_id
        )
      )
  ) then
    raise exception 'project_not_accessible' using errcode = '42501';
  end if;

  select coalesce(profiles.subscription_tier, 'free')
    into subscription_tier
  from public.profiles
  where profiles.id = current_user_id;

  subscription_tier := coalesce(subscription_tier, 'free');

  if subscription_tier = 'free' and exists (
    select 1
    from public.documents
    where documents.user_id = current_user_id
      and documents.upload_date >= pg_catalog.now() - interval '7 days'
  ) then
    raise exception 'document_limit_exceeded' using errcode = 'P0001';
  end if;

  if p_file_url not like current_user_id::text || '/%' then
    raise exception 'invalid_storage_path' using errcode = '22023';
  end if;

  if pg_catalog.char_length(pg_catalog.btrim(p_name)) not between 1 and 255 then
    raise exception 'invalid_document_name' using errcode = '22023';
  end if;

  if p_document_type not in ('contrato', 'politica', 'rat', 'otro') then
    raise exception 'invalid_document_type' using errcode = '22023';
  end if;

  insert into public.documents (
    project_id,
    user_id,
    name,
    file_url,
    document_type,
    upload_date,
    status
  ) values (
    p_project_id,
    current_user_id,
    pg_catalog.btrim(p_name),
    p_file_url,
    p_document_type,
    pg_catalog.now(),
    'pending'
  )
  returning id into created_document_id;

  return created_document_id;
end;
$$;

revoke all on function private.create_document_record(uuid, text, text, text) from public, anon, authenticated;
grant execute on function private.create_document_record(uuid, text, text, text) to authenticated, service_role;

create or replace function public.create_document_record(
  p_project_id uuid,
  p_name text,
  p_file_url text,
  p_document_type text
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.create_document_record(p_project_id, p_name, p_file_url, p_document_type);
$$;

revoke all on function public.create_document_record(uuid, text, text, text) from public, anon;
grant execute on function public.create_document_record(uuid, text, text, text) to authenticated, service_role;

comment on function public.is_organization_member(uuid) is
  'Security-invoker Data API wrapper. Membership lookup is implemented in private.is_organization_member.';

comment on function public.create_document_record(uuid, text, text, text) is
  'Security-invoker Data API wrapper. Privileged validation and insert run in private.create_document_record.';
