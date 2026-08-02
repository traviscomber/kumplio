-- KUMPLIO Artifact Versioning lineage inference and lock hardening

begin;

create or replace function private.prepare_agent_artifact_version()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  parent_record public.agent_artifacts;
  inferred_parent_id uuid;
  next_version integer;
  current_workflow_id text;
  current_stage_index text;
begin
  if new.parent_artifact_id is null then
    select
      run.input_payload->>'workflowId',
      run.input_payload->>'stageIndex'
    into current_workflow_id, current_stage_index
    from public.agent_runs run
    where run.id = new.run_id
      and run.organization_id = new.organization_id;

    if current_workflow_id is not null and current_stage_index is not null then
      select artifact.id
        into inferred_parent_id
      from public.agent_artifacts artifact
      join public.agent_runs previous_run on previous_run.id = artifact.run_id
      where artifact.organization_id = new.organization_id
        and artifact.case_id is not distinct from new.case_id
        and artifact.artifact_type = new.artifact_type
        and previous_run.organization_id = new.organization_id
        and previous_run.input_payload->>'workflowId' = current_workflow_id
        and previous_run.input_payload->>'stageIndex' = current_stage_index
      order by artifact.version desc, artifact.created_at desc
      limit 1;

      new.parent_artifact_id := inferred_parent_id;
    end if;
  end if;

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

create or replace function private.protect_agent_artifact_version()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  replacement_lineage_id uuid;
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

  if old.status = 'superseded' then
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

    select artifact.lineage_id into replacement_lineage_id
    from public.agent_artifacts artifact
    where artifact.id = new.superseded_by_artifact_id;

    if replacement_lineage_id is null or replacement_lineage_id <> old.lineage_id then
      raise exception using errcode = '23514', message = 'Approved artifact can only be superseded by the same lineage';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_agent_artifact_version()
  from public, anon, authenticated;

commit;
