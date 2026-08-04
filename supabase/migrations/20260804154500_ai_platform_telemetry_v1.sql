create table if not exists public.ai_platform_runs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null references auth.users(id) on delete set null,
  organization_id uuid null references public.organizations(id) on delete set null,
  surface text not null default 'copilot',
  intent text not null,
  tool_names text[] not null default '{}',
  provider text null,
  model text null,
  generation_mode text not null check (generation_mode in ('deterministic','llm_grounded')),
  fallback_reason text null,
  latency_ms integer not null check (latency_ms >= 0),
  input_tokens integer null check (input_tokens is null or input_tokens >= 0),
  output_tokens integer null check (output_tokens is null or output_tokens >= 0),
  total_tokens integer null check (total_tokens is null or total_tokens >= 0),
  estimated_cost_usd numeric(14,8) null check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  fact_count integer not null default 0,
  source_count integer not null default 0,
  action_count integer not null default 0,
  context_bytes integer not null default 0,
  query_fingerprint text not null,
  success boolean not null default true,
  error_code text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_platform_runs_created_at_idx
  on public.ai_platform_runs(created_at desc);
create index if not exists ai_platform_runs_intent_created_at_idx
  on public.ai_platform_runs(intent, created_at desc);
create index if not exists ai_platform_runs_mode_created_at_idx
  on public.ai_platform_runs(generation_mode, created_at desc);
create index if not exists ai_platform_runs_actor_created_at_idx
  on public.ai_platform_runs(actor_user_id, created_at desc)
  where actor_user_id is not null;

alter table public.ai_platform_runs enable row level security;
revoke all on public.ai_platform_runs from public, anon, authenticated;
grant select, insert on public.ai_platform_runs to service_role;

comment on table public.ai_platform_runs is
  'Privacy-preserving telemetry for AI Platform executions; stores fingerprints and operational metadata, never raw prompts or answers.';
