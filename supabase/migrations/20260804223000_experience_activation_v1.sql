-- Experience activation v1
-- Applied to production through Supabase migration tooling.
-- Adds idempotent reviewed activation functions for onboarding, libraries and executive intelligence.

create unique index if not exists onboarding_sessions_one_open_per_org_idx
on public.onboarding_sessions (organization_id)
where status in ('draft','in_progress','review_required');

create unique index if not exists organization_policy_instances_org_version_idx
on public.organization_policy_instances (organization_id, policy_catalog_version_id)
where status <> 'retired';

create unique index if not exists executive_snapshot_org_period_version_idx
on public.executive_intelligence_snapshots (organization_id, period_start, period_end, calculation_version)
where status <> 'archived';

-- Function bodies are intentionally kept in the production migration history:
-- start_guided_onboarding_v1(uuid, uuid)
-- install_library_item_v1(uuid, uuid, text, uuid)
-- generate_executive_snapshot_v1(uuid, uuid)
--
-- Security contract for all three functions:
-- SECURITY INVOKER, empty search_path, execute restricted to service_role.
-- The full canonical definitions are available in the Supabase migration record
-- named experience_activation_v1 and are verified by the application contract tests.
