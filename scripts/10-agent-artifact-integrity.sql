-- KUMPLIO artifact lineage and review integrity
-- Depends on scripts/06-agent-control-plane.sql through 09-agent-tools.sql.
-- Additive rollout for the existing production schema.

begin;

create extension if not exists pgcrypto;

alter table public.agent_artifacts
  add column if not exists lineage_id uuid,
  add column if not exists supersedes_artifact_id uuid references public.agent_artifacts(id) on delete set null,
  add column if not exists content_hash text,
  add column if not exists integrity_version text not null default 'postgres-jsonb-sha256-v1';

update public.agent_artifacts
set
  lineage_id = coalesce(lineage_id, id),
  content_hash = coalesce(content_hash, encode(digest(content::text, 'sha256'), 'hex')),
  integrity_version = coalesce(nullif(integrity_version, ''), 'postgres-jsonb-sha256-v1')
where lineage_id is null or content_hash is null or integrity_version is null or integrity_version = '';

alter table public.agent_artifacts
  alter column lineage_id set not null,
  alter column content_hash set not null;

create unique index if not exists agent_artifacts_lineage_version_uidx
  on public.agent_artifacts(lineage_id, version);
create index if not exists agent_artifacts_supersedes_idx
  on public.agent_artifacts(supersedes_artifact_id)
  where supersedes_artifact_id is not null;
create index if not exists agent_artifacts_content_hash_idx
  on public.agent_artifacts(content_hash);

create or replace function public.prepare_agent_artifact_integrity()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  previous_artifact public.agent_artifacts%rowtype;
begin
  if tg_op = 'UPDATE' then
    if new.content is distinct from old.content
      or new.content_hash is distinct from old.content_hash
      or new.lineage_id is distinct from old.lineage_id
      or new.version is distinct from old.version
      or new.supersedes_artifact_id is distinct from old.supersedes_artifact_id
      or new.run_id is distinct from old.run_id
      or new.organization_id is distinct from old.organization_id
      or new.case_id is distinct from old.case_id
      or new.artifact_type is distinct from old.artifact_type then
      raise exception 'Artifact integrity fields are immutable';
    end if;
    return new;
  end if;

  if new.supersedes_artifact_id is not null then
    select * into previous_artifact
    from public.agent_artifacts
    where id = new.supersedes_artifact_id;

    if not found then
      raise exception 'Superseded artifact was not found';
    end if;

    if previous_artifact.organization_id <> new.organization_id
      or previous_artifact.artifact_type <> new.artifact_type
      or previous_artifact.case_id is distinct from new.case_id then
      raise exception 'Artifact lineage scope mismatch';
    end if;

    new.lineage_id := previous_artifact.lineage_id;
    new.version := previous_artifact.version + 1;
  else
    new.lineage_id := coalesce(new.lineage_id, new.id);
    new.version := coalesce(new.version, 1);
  end if;

  new.content_hash := encode(digest(new.content::text, 'sha256'), 'hex');
  new.integrity_version := 'postgres-jsonb-sha256-v1';
  return new;
end;
$$;

revoke all on function public.prepare_agent_artifact_integrity() from public;

 drop trigger if exists agent_artifact_integrity_guard on public.agent_artifacts;
create trigger agent_artifact_integrity_guard
before insert or update on public.agent_artifacts
for each row execute function public.prepare_agent_artifact_integrity();

alter table public.agent_reviews
  add column if not exists previous_review_id uuid references public.agent_reviews(id) on delete set null,
  add column if not exists decision_hash text,
  add column if not exists integrity_version text not null default 'sha256-chain-v1',
  add column if not exists signed_at timestamptz,
  add column if not exists reviewer_snapshot jsonb not null default '{}'::jsonb;

update public.agent_reviews
set
  signed_at = coalesce(signed_at, created_at),
  integrity_version = case when decision_hash is null then 'sha256-backfill-v1' else integrity_version end,
  reviewer_snapshot = case
    when reviewer_snapshot = '{}'::jsonb then jsonb_build_object('reviewerId', reviewer_id, 'backfilled', true)
    else reviewer_snapshot
  end,
  decision_hash = coalesce(
    decision_hash,
    encode(
      digest(
        jsonb_build_object(
          'id', id,
          'organizationId', organization_id,
          'caseId', case_id,
          'runId', run_id,
          'artifactId', artifact_id,
          'reviewerId', reviewer_id,
          'decision', decision,
          'comment', comment,
          'checklist', checklist,
          'createdAt', created_at
        )::text,
        'sha256'
      ),
      'hex'
    )
  )
where decision_hash is null or signed_at is null or reviewer_snapshot = '{}'::jsonb;

alter table public.agent_reviews
  alter column decision_hash set not null,
  alter column signed_at set not null;

create unique index if not exists agent_reviews_decision_hash_uidx
  on public.agent_reviews(decision_hash);
create index if not exists agent_reviews_previous_idx
  on public.agent_reviews(previous_review_id)
  where previous_review_id is not null;
create index if not exists agent_reviews_signed_at_idx
  on public.agent_reviews(organization_id, signed_at desc);

create or replace function public.prevent_agent_review_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  raise exception 'Agent reviews are append-only';
end;
$$;

revoke all on function public.prevent_agent_review_mutation() from public;

drop trigger if exists agent_review_append_only on public.agent_reviews;
create trigger agent_review_append_only
before update or delete on public.agent_reviews
for each row execute function public.prevent_agent_review_mutation();

create or replace function public.record_agent_review(
  target_run uuid,
  target_artifact uuid,
  target_decision text,
  target_comment text,
  target_checklist jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := (select auth.uid());
  run_record public.agent_runs%rowtype;
  artifact_record public.agent_artifacts%rowtype;
  previous_review public.agent_reviews%rowtype;
  inserted_review public.agent_reviews%rowtype;
  signed_timestamp timestamptz := clock_timestamp();
  actor_snapshot jsonb;
  hash_payload jsonb;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if target_decision not in ('approved', 'rejected', 'changes_requested', 'commented') then
    raise exception 'Invalid review decision';
  end if;

  select * into run_record
  from public.agent_runs
  where id = target_run;

  if not found then
    raise exception 'Agent run not found';
  end if;

  if target_artifact is not null then
    select * into artifact_record
    from public.agent_artifacts
    where id = target_artifact
      and run_id = target_run
      and organization_id = run_record.organization_id;

    if not found then
      raise exception 'Artifact does not belong to this run';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_run::text, 0));

  select * into previous_review
  from public.agent_reviews
  where run_id = target_run
  order by created_at desc, id desc
  limit 1;

  actor_snapshot := jsonb_build_object(
    'reviewerId', actor_id,
    'sessionId', (select auth.jwt() ->> 'session_id'),
    'authenticated', true,
    'signedAt', signed_timestamp
  );

  hash_payload := jsonb_build_object(
    'organizationId', run_record.organization_id,
    'caseId', run_record.case_id,
    'runId', target_run,
    'artifactId', target_artifact,
    'artifactHash', case when target_artifact is null then null else artifact_record.content_hash end,
    'reviewerId', actor_id,
    'decision', target_decision,
    'comment', target_comment,
    'checklist', coalesce(target_checklist, '{}'::jsonb),
    'previousReviewId', previous_review.id,
    'previousDecisionHash', previous_review.decision_hash,
    'signedAt', signed_timestamp
  );

  insert into public.agent_reviews (
    organization_id,
    case_id,
    run_id,
    artifact_id,
    reviewer_id,
    decision,
    comment,
    checklist,
    previous_review_id,
    decision_hash,
    integrity_version,
    signed_at,
    reviewer_snapshot
  ) values (
    run_record.organization_id,
    run_record.case_id,
    target_run,
    target_artifact,
    actor_id,
    target_decision,
    nullif(target_comment, ''),
    coalesce(target_checklist, '{}'::jsonb),
    previous_review.id,
    encode(digest(hash_payload::text, 'sha256'), 'hex'),
    'sha256-chain-v1',
    signed_timestamp,
    actor_snapshot
  )
  returning * into inserted_review;

  return jsonb_build_object(
    'id', inserted_review.id,
    'decision', inserted_review.decision,
    'comment', inserted_review.comment,
    'createdAt', inserted_review.created_at,
    'signedAt', inserted_review.signed_at,
    'decisionHash', inserted_review.decision_hash,
    'previousReviewId', inserted_review.previous_review_id,
    'integrityVersion', inserted_review.integrity_version
  );
end;
$$;

revoke all on function public.record_agent_review(uuid, uuid, text, text, jsonb) from public;
revoke all on function public.record_agent_review(uuid, uuid, text, text, jsonb) from anon;
grant execute on function public.record_agent_review(uuid, uuid, text, text, jsonb) to authenticated;
grant execute on function public.record_agent_review(uuid, uuid, text, text, jsonb) to service_role;

comment on column public.agent_artifacts.content_hash is
  'SHA-256 digest of PostgreSQL jsonb canonical text. Integrity fingerprint; not a legal electronic signature.';
comment on column public.agent_reviews.decision_hash is
  'SHA-256 chained digest of the authenticated review decision. Tamper-evident metadata; not a legal electronic signature.';

commit;
