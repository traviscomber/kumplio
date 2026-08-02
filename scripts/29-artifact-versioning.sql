-- KUMPLIO Artifact Versioning Foundation

begin;

create extension if not exists pgcrypto;

alter table public.agent_artifacts add column if not exists lineage_id uuid;
alter table public.agent_artifacts add column if not exists parent_artifact_id uuid references public.agent_artifacts(id) on delete restrict;
alter table public.agent_artifacts add column if not exists content_hash text;
alter table public.agent_artifacts add column if not exists approved_by uuid references auth.users(id) on delete set null;
alter table public.agent_artifacts add column if not exists approved_at timestamptz;
alter table public.agent_artifacts add column if not exists locked_at timestamptz;
alter table public.agent_artifacts add column if not exists superseded_by_artifact_id uuid references public.agent_artifacts(id) on delete set null;
alter table public.agent_artifacts add column if not exists superseded_at timestamptz;

update public.agent_artifacts
set lineage_id = id
where lineage_id is null;

update public.agent_artifacts
set content_hash = encode(digest(convert_to(content::text, 'UTF8'), 'sha256'), 'hex')
where content_hash is null;

alter table public.agent_artifacts alter column lineage_id set not null;
alter table public.agent_artifacts alter column content_hash set not null;

alter table public.agent_artifacts drop constraint if exists agent_artifacts_status_check;
alter table public.agent_artifacts add constraint agent_artifacts_status_check
  check (status in ('draft', 'pending_review', 'changes_requested', 'approved', 'rejected', 'superseded'));

alter table public.agent_artifacts drop constraint if exists agent_artifacts_lineage_version_key;
alter table public.agent_artifacts add constraint agent_artifacts_lineage_version_key
  unique (lineage_id, version);

create index if not exists agent_artifacts_lineage_idx
  on public.agent_artifacts (lineage_id, version desc);
create index if not exists agent_artifacts_parent_idx
  on public.agent_artifacts (parent_artifact_id);
create index if not exists agent_artifacts_approved_by_idx
  on public.agent_artifacts (approved_by);
create index if not exists agent_artifacts_superseded_by_idx
  on public.agent_artifacts (superseded_by_artifact_id);

create or replace function private.prepare_agent_artifact_version()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  parent_record public.agent_artifacts;
  next_version integer;
begin
  if new.parent_artifact_id is null then
    new.lineage_id := coalesce(new.lineage_id, new.id);
    new.version := coalesce(new.version, 1);
  else
    select * into parent_record
    from public.agent_artifacts artifact
    where artifact.id = new.parent_artifact_id
    for share;

    if parent_record.id is null then
      raise exception using errcode = '23503', message = 'Parent artifact not found';
    end if;

    if parent_record.organization_id <> new.organization_id
      or parent_record.case_id is distinct from new.case_id
      or parent_record.artifact_type <> new.artifact_type then
      raise exception using errcode = '23514', message = 'Artifact version must remain in the same lineage context';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(parent_record.lineage_id::text, 0));

    select coalesce(max(artifact.version), 0) + 1
      into next_version
    from public.agent_artifacts artifact
    where artifact.lineage_id = parent_record.lineage_id;

    new.lineage_id := parent_record.lineage_id;
    new.version := next_version;
  end if;

  new.content_hash := encode(digest(convert_to(new.content::text, 'UTF8'), 'sha256'), 'hex');
  return new;
end;
$$;

revoke all on function private.prepare_agent_artifact_version()
  from public, anon, authenticated;

drop trigger if exists prepare_agent_artifact_version on public.agent_artifacts;
create trigger prepare_agent_artifact_version
  before insert on public.agent_artifacts
  for each row execute function private.prepare_agent_artifact_version();

create or replace function private.protect_agent_artifact_version()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.organization_id is distinct from old.organization_id
    or new.case_id is distinct from old.case_id
    or new.run_id is distinct from old.run_id
    or new.artifact_type is distinct from old.artifact_type
    or new.title is distinct from old.title
    or new.version is distinct from old.version
    or new.content is distinct from old.content
    or new.source_refs is distinct from old.source_refs
    or new.confidence is distinct from old.confidence
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
    or new.lineage_id is distinct from old.lineage_id
    or new.parent_artifact_id is distinct from old.parent_artifact_id
    or new.content_hash is distinct from old.content_hash then
    raise exception using errcode = '23514', message = 'Artifact version content and lineage are immutable';
  end if;

  if old.status = 'superseded' and row(new.*) is distinct from row(old.*) then
    raise exception using errcode = '23514', message = 'Superseded artifact versions are immutable';
  end if;

  if old.status = 'approved' then
    if new.status <> 'superseded'
      or new.approved_by is distinct from old.approved_by
      or new.approved_at is distinct from old.approved_at
      or new.locked_at is distinct from old.locked_at
      or new.superseded_by_artifact_id is null
      or new.superseded_at is null then
      raise exception using errcode = '23514', message = 'Approved artifact versions are locked';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_agent_artifact_version()
  from public, anon, authenticated;

drop trigger if exists protect_agent_artifact_version on public.agent_artifacts;
create trigger protect_agent_artifact_version
  before update on public.agent_artifacts
  for each row execute function private.protect_agent_artifact_version();

revoke update, delete on table public.agent_artifacts from authenticated;
grant select, insert on table public.agent_artifacts to authenticated;

create or replace function public.record_agent_artifact_review(
  p_actor_id uuid,
  p_organization_id uuid,
  p_run_id uuid,
  p_artifact_id uuid,
  p_decision text,
  p_comment text,
  p_checklist jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  artifact_record public.agent_artifacts;
  run_case_id uuid;
  review_id uuid;
  clean_comment text := nullif(btrim(p_comment), '');
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  if p_decision not in ('approved', 'rejected', 'changes_requested', 'commented') then
    raise exception using errcode = '22023', message = 'Invalid artifact review decision';
  end if;

  if p_decision in ('rejected', 'changes_requested')
    and (clean_comment is null or char_length(clean_comment) < 3) then
    raise exception using errcode = '22023', message = 'Review comment is required';
  end if;

  select run.case_id into run_case_id
  from public.agent_runs run
  where run.id = p_run_id
    and run.organization_id = p_organization_id;

  if not found then
    raise exception using errcode = '23503', message = 'Agent run not found';
  end if;

  select * into artifact_record
  from public.agent_artifacts artifact
  where artifact.id = p_artifact_id
    and artifact.organization_id = p_organization_id
    and artifact.run_id = p_run_id
  for update;

  if artifact_record.id is null then
    raise exception using errcode = '23503', message = 'Artifact not found';
  end if;

  if artifact_record.status in ('approved', 'superseded') then
    if artifact_record.status = 'approved' and p_decision = 'approved' then
      select review.id into review_id
      from public.agent_reviews review
      where review.organization_id = p_organization_id
        and review.artifact_id = p_artifact_id
        and review.decision = 'approved'
      order by review.created_at desc
      limit 1;
      return review_id;
    end if;
    raise exception using errcode = '23514', message = 'Locked artifact version cannot be reviewed again';
  end if;

  insert into public.agent_reviews (
    organization_id,
    case_id,
    run_id,
    artifact_id,
    reviewer_id,
    decision,
    comment,
    checklist
  ) values (
    p_organization_id,
    run_case_id,
    p_run_id,
    p_artifact_id,
    p_actor_id,
    p_decision,
    clean_comment,
    coalesce(p_checklist, '{}'::jsonb)
  )
  returning id into review_id;

  if p_decision = 'approved' then
    update public.agent_artifacts
    set status = 'approved',
        approved_by = p_actor_id,
        approved_at = now(),
        locked_at = now()
    where id = p_artifact_id;

    update public.agent_artifacts
    set status = 'superseded',
        superseded_by_artifact_id = p_artifact_id,
        superseded_at = now()
    where lineage_id = artifact_record.lineage_id
      and id <> p_artifact_id
      and status = 'approved';
  elsif p_decision in ('rejected', 'changes_requested') then
    update public.agent_artifacts
    set status = p_decision,
        approved_by = null,
        approved_at = null,
        locked_at = null
    where id = p_artifact_id;
  end if;

  return review_id;
end;
$$;

revoke all on function public.record_agent_artifact_review(uuid,uuid,uuid,uuid,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.record_agent_artifact_review(uuid,uuid,uuid,uuid,text,text,jsonb)
  to service_role;

commit;
