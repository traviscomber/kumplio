-- Allow authenticated reviewers to change only the lifecycle status of artifacts.
-- Content, hash, version, lineage and approval metadata remain protected by
-- column privileges, RLS and private.protect_agent_artifact_version().

revoke update on table public.agent_artifacts from authenticated;
grant update (status) on table public.agent_artifacts to authenticated;
