create or replace function private.supersede_parent_agent_artifact()
returns trigger
language plpgsql
security definer
set search_path = 'pg_catalog', 'public'
as $$
begin
  if new.parent_artifact_id is null then
    return new;
  end if;

  update public.agent_artifacts
  set status = 'superseded',
      superseded_by_artifact_id = new.id,
      superseded_at = now()
  where id = new.parent_artifact_id
    and organization_id = new.organization_id
    and lineage_id = new.lineage_id
    and status in ('draft', 'pending_review', 'changes_requested', 'rejected');

  return new;
end;
$$;

drop trigger if exists supersede_parent_agent_artifact on public.agent_artifacts;
create trigger supersede_parent_agent_artifact
after insert on public.agent_artifacts
for each row execute function private.supersede_parent_agent_artifact();
