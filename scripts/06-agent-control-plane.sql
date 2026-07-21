-- KUMPLIO Agent Control Plane
-- Additive migration. Existing tables and data are preserved.

begin;
create extension if not exists pgcrypto;

create table if not exists compliance_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','active','pending_review','approved','rejected','archived')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  created_by uuid not null references auth.users(id) on delete restrict,
  owner_id uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null check (agent_id in ('isidora','rodrigo','javier','beatriz','veronica','andres','catalina')),
  version text not null,
  prompt_hash text not null,
  model text not null,
  schema_version text not null,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(agent_id, version)
);

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  case_id uuid references compliance_cases(id) on delete cascade,
  parent_run_id uuid references agent_runs(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete restrict,
  agent_id text not null check (agent_id in ('isidora','rodrigo','javier','beatriz','veronica','andres','catalina')),
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled','pending_review','approved','rejected')),
  task text not null,
  context_text text,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb,
  output_text text,
  response_id text,
  model text,
  prompt_version text,
  schema_version text,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  estimated_cost_usd numeric(14,6),
  elapsed_ms integer,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_artifacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  case_id uuid references compliance_cases(id) on delete cascade,
  run_id uuid not null references agent_runs(id) on delete cascade,
  artifact_type text not null,
  title text not null,
  version integer not null default 1 check (version > 0),
  content jsonb not null,
  source_refs jsonb not null default '[]'::jsonb,
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  status text not null default 'draft' check (status in ('draft','pending_review','approved','rejected','superseded')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(run_id, artifact_type, version)
);

create table if not exists agent_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  case_id uuid references compliance_cases(id) on delete cascade,
  run_id uuid references agent_runs(id) on delete cascade,
  artifact_id uuid references agent_artifacts(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision text not null check (decision in ('approved','rejected','changes_requested','commented')),
  comment text,
  checklist jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (run_id is not null or artifact_id is not null)
);

create table if not exists agent_usage_limits (
  organization_id uuid primary key references organizations(id) on delete cascade,
  daily_run_limit integer not null default 100 check (daily_run_limit > 0),
  monthly_run_limit integer not null default 2000 check (monthly_run_limit > 0),
  concurrent_run_limit integer not null default 3 check (concurrent_run_limit > 0),
  monthly_token_limit bigint not null default 50000000 check (monthly_token_limit > 0),
  monthly_cost_limit_usd numeric(14,2) not null default 1000 check (monthly_cost_limit_usd > 0),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists agent_eval_cases (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null check (agent_id in ('isidora','rodrigo','javier','beatriz','veronica','andres','catalina')),
  name text not null,
  task text not null,
  context_text text not null,
  expected jsonb not null default '{}'::jsonb,
  forbidden_claims text[] not null default '{}',
  rubric jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(agent_id, name)
);

create table if not exists agent_eval_results (
  id uuid primary key default gen_random_uuid(),
  eval_case_id uuid not null references agent_eval_cases(id) on delete cascade,
  run_id uuid references agent_runs(id) on delete set null,
  model text not null,
  prompt_version text,
  score numeric(6,3) check (score is null or (score >= 0 and score <= 100)),
  passed boolean not null default false,
  findings jsonb not null default '[]'::jsonb,
  elapsed_ms integer,
  total_tokens integer,
  created_at timestamptz not null default now()
);

create index if not exists compliance_cases_org_status_idx on compliance_cases(organization_id, status, created_at desc);
create index if not exists agent_runs_org_created_idx on agent_runs(organization_id, created_at desc);
create index if not exists agent_runs_case_idx on agent_runs(case_id, created_at);
create index if not exists agent_runs_user_status_idx on agent_runs(user_id, status, created_at desc);
create index if not exists agent_artifacts_case_idx on agent_artifacts(case_id, artifact_type, created_at desc);
create index if not exists agent_reviews_case_idx on agent_reviews(case_id, created_at desc);
create index if not exists agent_eval_results_case_idx on agent_eval_results(eval_case_id, created_at desc);

alter table compliance_cases enable row level security;
alter table agent_prompt_versions enable row level security;
alter table agent_runs enable row level security;
alter table agent_artifacts enable row level security;
alter table agent_reviews enable row level security;
alter table agent_usage_limits enable row level security;
alter table agent_eval_cases enable row level security;
alter table agent_eval_results enable row level security;

commit;
