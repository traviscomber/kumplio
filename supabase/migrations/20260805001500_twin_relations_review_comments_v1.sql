create table if not exists public.digital_twin_relations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_type text not null check (source_type in ('process','asset','dataset','vendor')),
  source_id uuid not null,
  relation_type text not null check (relation_type in ('uses','processes','stores','supports','provided_by','depends_on')),
  target_type text not null check (target_type in ('process','asset','dataset','vendor')),
  target_id uuid not null,
  status text not null default 'draft' check (status in ('draft','active','retired')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, source_type, source_id, relation_type, target_type, target_id)
);
create index if not exists digital_twin_relations_org_idx on public.digital_twin_relations(organization_id, created_at desc);
create index if not exists digital_twin_relations_source_idx on public.digital_twin_relations(source_type, source_id);
create index if not exists digital_twin_relations_target_idx on public.digital_twin_relations(target_type, target_id);
alter table public.digital_twin_relations enable row level security;
revoke all on public.digital_twin_relations from public, anon, authenticated;
grant all on public.digital_twin_relations to service_role;

create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('control','policy','snapshot','evidence')),
  entity_id uuid not null,
  comment_type text not null default 'comment' check (comment_type in ('comment','change_request','decision_note')),
  body text not null check (length(trim(body)) between 1 and 4000),
  author_user_id uuid references auth.users(id),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists review_comments_entity_idx on public.review_comments(organization_id, entity_type, entity_id, created_at desc);
alter table public.review_comments enable row level security;
revoke all on public.review_comments from public, anon, authenticated;
grant all on public.review_comments to service_role;

create or replace function public.add_review_comment_v1(p_organization_id uuid,p_entity_type text,p_entity_id uuid,p_comment_type text,p_body text,p_actor_user_id uuid) returns uuid
language plpgsql security invoker set search_path='' as $$
declare v_id uuid;
begin
  if p_entity_type not in ('control','policy','snapshot','evidence') then raise exception 'invalid_entity_type'; end if;
  if p_comment_type not in ('comment','change_request','decision_note') then raise exception 'invalid_comment_type'; end if;
  insert into public.review_comments(organization_id,entity_type,entity_id,comment_type,body,author_user_id)
  values(p_organization_id,p_entity_type,p_entity_id,p_comment_type,trim(p_body),p_actor_user_id) returning id into v_id;
  return v_id;
end;$$;
revoke all on function public.add_review_comment_v1(uuid,text,uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.add_review_comment_v1(uuid,text,uuid,text,text,uuid) to service_role;
