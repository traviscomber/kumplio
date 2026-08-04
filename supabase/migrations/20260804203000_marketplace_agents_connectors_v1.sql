-- Marketplace, Multi-Agent Runtime and Enterprise Connectors v1
-- Applied to production through Supabase migrations marketplace_agents_connectors_v1
-- and marketplace_agents_connectors_guards_v1.

create table if not exists public.marketplace_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  item_type text not null check (item_type in ('control_pack','policy_pack','playbook','workflow','agent','connector_pack')),
  name text not null,
  summary text,
  domain text not null,
  publisher_kind text not null default 'kumplio' check (publisher_kind in ('kumplio','partner','customer')),
  publisher_name text not null default 'Kumplio',
  lifecycle_status text not null default 'draft' check (lifecycle_status in ('draft','review','published','deprecated','withdrawn')),
  visibility text not null default 'private' check (visibility in ('private','unlisted','public')),
  current_version integer not null default 1 check (current_version > 0),
  pricing_model text not null default 'included' check (pricing_model in ('included','free','one_time','subscription','custom')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_item_versions (
  id uuid primary key default gen_random_uuid(),
  marketplace_item_id uuid not null references public.marketplace_items(id) on delete cascade,
  version integer not null check (version > 0),
  release_status text not null default 'draft' check (release_status in ('draft','review','approved','released','rejected','superseded')),
  changelog text,
  manifest jsonb not null default '{}'::jsonb,
  required_permissions text[] not null default '{}',
  dependencies jsonb not null default '[]'::jsonb,
  compatibility jsonb not null default '{}'::jsonb,
  content_hash text not null,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  unique (marketplace_item_id, version)
);

create table if not exists public.organization_marketplace_installations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  marketplace_item_version_id uuid not null references public.marketplace_item_versions(id),
  installation_status text not null default 'pending_review' check (installation_status in ('pending_review','approved','installing','installed','update_available','suspended','uninstalled','failed')),
  configuration jsonb not null default '{}'::jsonb,
  granted_permissions text[] not null default '{}',
  installed_resources jsonb not null default '[]'::jsonb,
  installed_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  installed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, marketplace_item_version_id),
  constraint marketplace_installation_requires_review check (
    installation_status in ('pending_review','failed') or (reviewed_by is not null and reviewed_at is not null)
  )
);

create table if not exists public.agent_definitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  specialty text not null,
  description text,
  lifecycle_status text not null default 'draft' check (lifecycle_status in ('draft','review','active','paused','deprecated')),
  current_version integer not null default 1,
  default_model_policy jsonb not null default '{}'::jsonb,
  default_tool_policy jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_definition_versions (
  id uuid primary key default gen_random_uuid(),
  agent_definition_id uuid not null references public.agent_definitions(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft','review','approved','active','rejected','superseded')),
  instructions text not null,
  input_schema jsonb not null default '{}'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  allowed_tools text[] not null default '{}',
  denied_actions text[] not null default '{}',
  escalation_policy jsonb not null default '{}'::jsonb,
  content_hash text not null,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (agent_definition_id, version)
);

create table if not exists public.organization_agent_installations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_definition_version_id uuid not null references public.agent_definition_versions(id),
  status text not null default 'pending_review' check (status in ('pending_review','active','paused','revoked','failed')),
  model_policy jsonb not null default '{}'::jsonb,
  tool_policy jsonb not null default '{}'::jsonb,
  memory_policy jsonb not null default '{}'::jsonb,
  installed_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, agent_definition_version_id),
  constraint agent_installation_requires_approval check (
    status in ('pending_review','failed') or (approved_by is not null and approved_at is not null)
  )
);

create table if not exists public.agent_teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  purpose text,
  supervisor_installation_id uuid references public.organization_agent_installations(id),
  status text not null default 'draft' check (status in ('draft','review','active','paused','archived')),
  coordination_policy jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_team_members (
  agent_team_id uuid not null references public.agent_teams(id) on delete cascade,
  agent_installation_id uuid not null references public.organization_agent_installations(id) on delete cascade,
  member_role text not null default 'specialist' check (member_role in ('supervisor','specialist','reviewer')),
  sequence integer not null default 0,
  primary key (agent_team_id, agent_installation_id)
);

create table if not exists public.multi_agent_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  agent_team_id uuid references public.agent_teams(id),
  requested_by uuid references auth.users(id),
  intent text not null,
  status text not null default 'queued' check (status in ('queued','planning','running','awaiting_review','succeeded','failed','cancelled')),
  input_fingerprint text,
  plan jsonb not null default '[]'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error_code text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.multi_agent_run_steps (
  id uuid primary key default gen_random_uuid(),
  multi_agent_run_id uuid not null references public.multi_agent_runs(id) on delete cascade,
  agent_installation_id uuid references public.organization_agent_installations(id),
  sequence integer not null,
  step_kind text not null check (step_kind in ('plan','delegate','tool_call','analysis','review','synthesis','escalation')),
  status text not null default 'queued' check (status in ('queued','running','awaiting_review','succeeded','failed','skipped','cancelled')),
  input_summary jsonb not null default '{}'::jsonb,
  output_summary jsonb not null default '{}'::jsonb,
  tool_names text[] not null default '{}',
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  unique (multi_agent_run_id, sequence)
);

create table if not exists public.connector_catalog (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  category text not null check (category in ('productivity','storage','hris','erp','crm','dev','cloud','communication','custom')),
  provider text not null,
  auth_type text not null check (auth_type in ('oauth2','service_account','api_key','webhook','custom')),
  supported_capabilities text[] not null default '{}',
  lifecycle_status text not null default 'draft' check (lifecycle_status in ('draft','review','active','deprecated')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_connectors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connector_catalog_id uuid not null references public.connector_catalog(id),
  status text not null default 'pending_authorization' check (status in ('pending_authorization','connected','paused','error','revoked')),
  credential_reference text,
  granted_scopes text[] not null default '{}',
  sync_policy jsonb not null default '{}'::jsonb,
  data_policy jsonb not null default '{}'::jsonb,
  last_health_status text,
  last_health_checked_at timestamptz,
  connected_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, connector_catalog_id),
  constraint connector_requires_approval check (
    status in ('pending_authorization','error','revoked') or (approved_by is not null and approved_at is not null)
  )
);

create table if not exists public.connector_sync_runs (
  id uuid primary key default gen_random_uuid(),
  organization_connector_id uuid not null references public.organization_connectors(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','running','awaiting_review','succeeded','partial','failed','cancelled')),
  sync_mode text not null default 'incremental' check (sync_mode in ('discovery','incremental','full','webhook')),
  cursor_before jsonb not null default '{}'::jsonb,
  cursor_after jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  error_code text,
  requested_by uuid references auth.users(id),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.connector_resources (
  id uuid primary key default gen_random_uuid(),
  organization_connector_id uuid not null references public.organization_connectors(id) on delete cascade,
  external_id text not null,
  resource_type text not null,
  name text,
  external_url text,
  parent_external_id text,
  content_fingerprint text,
  classification_status text not null default 'unclassified' check (classification_status in ('unclassified','proposed','reviewed','accepted','rejected','ignored')),
  proposed_classification jsonb not null default '{}'::jsonb,
  accepted_classification jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  discovered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (organization_connector_id, external_id)
);

-- All tables use RLS and service-role-only access in production.
-- Seeded in draft/private state: 3 marketplace items, 6 agents and 8 connector definitions.
-- No organization installation, active agent, connection or sync is created automatically.
