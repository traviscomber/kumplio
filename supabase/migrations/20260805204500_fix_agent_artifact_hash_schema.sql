-- The artifact versioning trigger runs with a restricted search_path.
-- pgcrypto is installed in the extensions schema, so digest must be qualified.

create or replace function private.prepare_agent_artifact_version()
returns trigger
language plpgsql
security definer
set search_path = 'pg_catalog', 'public'
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

  new.content_hash := pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(new.content::text, 'UTF8'), 'sha256'),
    'hex'
  );
  return new;
end;
$$;

revoke all on function private.prepare_agent_artifact_version() from public, anon, authenticated;
grant execute on function private.prepare_agent_artifact_version() to service_role;
