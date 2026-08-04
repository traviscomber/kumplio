-- Executive Intelligence, accelerated onboarding and Kumplio Studio v1

create table if not exists public.executive_intelligence_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft','review_required','approved','published','archived')),
  overall_risk_score numeric(6,2),
  critical_risks integer not null default 0,
  open_impacts integer not null default 0,
  overdue_actions integer not null default 0,
  expiring_evidence integer not null default 0,
  control_coverage_pct numeric(6,2),
  evidence_confidence_pct numeric(6,2),
  benchmark_percentile numeric(6,2),
  estimated_financial_exposure_clp numeric,
  executive_summary jsonb not null default '{}'::jsonb,
  source_metrics jsonb not null default '{}'::jsonb,
  calculation_version text not null default 'executive-v1',
  generated_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, period_start, period_end, calculation_version),
  check (period_end >= period_start),
  check (status not in ('approved','published') or (reviewed_by is not null and reviewed_at is not null)),
  check (status <> 'published' or published_at is not null)
);

create table if not exists public.executive_priorities (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.executive_intelligence_snapshots(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  priority_rank integer not null check (priority_rank > 0),
  priority_type text not null check (priority_type in ('risk','impact','evidence','control','action','incident','policy')),
  title text not null,
  rationale text,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  source_type text,
  source_id uuid,
  recommended_action jsonb not null default '{}'::jsonb,
  owner_user_id uuid references auth.users(id),
  due_date date,
  status text not null default 'proposed' check (status in ('proposed','accepted','in_progress','resolved','dismissed')),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (snapshot_id, priority_rank),
  check (status = 'proposed' or accepted_by is not null)
);

create table if not exists public.onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  started_by uuid references auth.users(id),
  mode text not null default 'guided' check (mode in ('guided','connector_assisted','import_assisted','hybrid')),
  status text not null default 'draft' check (status in ('draft','in_progress','review_required','completed','cancelled')),
  current_stage text not null default 'organization' check (current_stage in ('organization','processes','assets','datasets','vendors','controls','policies','connectors','review','complete')),
  progress_pct numeric(6,2) not null default 0 check (progress_pct between 0 and 100),
  discovery_scope jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'completed' or (completed_at is not null and reviewed_by is not null and reviewed_at is not null))
);

create table if not exists public.onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  onboarding_session_id uuid not null references public.onboarding_sessions(id) on delete cascade,
  step_key text not null,
  title text not null,
  sequence integer not null check (sequence > 0),
  status text not null default 'pending' check (status in ('pending','in_progress','review_required','completed','skipped')),
  required boolean not null default true,
  input_snapshot jsonb not null default '{}'::jsonb,
  output_snapshot jsonb not null default '{}'::jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  completed_by uuid references auth.users(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (onboarding_session_id, step_key),
  unique (onboarding_session_id, sequence)
);

create table if not exists public.discovery_candidates (
  id uuid primary key default gen_random_uuid(),
  onboarding_session_id uuid not null references public.onboarding_sessions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_kind text not null check (source_kind in ('connector','upload','manual','import','inference')),
  source_reference text,
  candidate_type text not null check (candidate_type in ('process','asset','dataset','vendor','control','policy','role','obligation')),
  proposed_name text not null,
  proposed_payload jsonb not null default '{}'::jsonb,
  confidence numeric(6,4) check (confidence between 0 and 1),
  fingerprint text not null,
  status text not null default 'proposed' check (status in ('proposed','accepted','rejected','merged','superseded')),
  accepted_entity_type text,
  accepted_entity_id uuid,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  unique (organization_id, candidate_type, fingerprint),
  check (status = 'proposed' or (reviewed_by is not null and reviewed_at is not null))
);

create table if not exists public.studio_definitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  definition_type text not null check (definition_type in ('rule','agent','workflow','playbook','policy_generator','risk_model')),
  description text,
  visibility text not null default 'private' check (visibility in ('private','organization','marketplace')),
  organization_id uuid references public.organizations(id) on delete cascade,
  lifecycle_status text not null default 'draft' check (lifecycle_status in ('draft','review','approved','deprecated','archived')),
  current_version integer not null default 1 check (current_version > 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((visibility = 'organization' and organization_id is not null) or visibility <> 'organization')
);

create table if not exists public.studio_definition_versions (
  id uuid primary key default gen_random_uuid(),
  studio_definition_id uuid not null references public.studio_definitions(id) on delete cascade,
  version integer not null check (version > 0),
  schema_version text not null default 'studio-v1',
  definition_json jsonb not null,
  input_schema jsonb not null default '{}'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  permissions text[] not null default '{}',
  prohibited_actions text[] not null default '{}',
  test_cases jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','validation_failed','validated','review','approved','rejected')),
  content_hash text not null,
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (studio_definition_id, version),
  unique (studio_definition_id, content_hash),
  check (status <> 'approved' or (approved_by is not null and approved_at is not null))
);

create table if not exists public.studio_validation_runs (
  id uuid primary key default gen_random_uuid(),
  studio_definition_version_id uuid not null references public.studio_definition_versions(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','running','passed','failed','cancelled')),
  validation_type text not null check (validation_type in ('schema','policy','permissions','test_suite','simulation')),
  results jsonb not null default '{}'::jsonb,
  error_summary text,
  started_at timestamptz,
  finished_at timestamptz,
  requested_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.studio_deployments (
  id uuid primary key default gen_random_uuid(),
  studio_definition_version_id uuid not null references public.studio_definition_versions(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete cascade,
  environment text not null default 'preview' check (environment in ('preview','sandbox','production')),
  status text not null default 'pending_review' check (status in ('pending_review','approved','deploying','active','failed','disabled','rolled_back')),
  configuration jsonb not null default '{}'::jsonb,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  deployed_by uuid references auth.users(id),
  deployed_at timestamptz,
  rollback_of uuid references public.studio_deployments(id),
  created_at timestamptz not null default now(),
  check (status not in ('approved','deploying','active') or (approved_by is not null and approved_at is not null)),
  check (status <> 'active' or deployed_at is not null)
);

create index if not exists executive_snapshots_org_period_idx on public.executive_intelligence_snapshots (organization_id, period_end desc);
create index if not exists executive_priorities_org_status_idx on public.executive_priorities (organization_id, status, severity);
create index if not exists onboarding_sessions_org_status_idx on public.onboarding_sessions (organization_id, status, updated_at desc);
create index if not exists onboarding_steps_session_status_idx on public.onboarding_steps (onboarding_session_id, status, sequence);
create index if not exists discovery_candidates_session_status_idx on public.discovery_candidates (onboarding_session_id, status, candidate_type);
create index if not exists discovery_candidates_org_status_idx on public.discovery_candidates (organization_id, status, candidate_type);
create index if not exists studio_definitions_org_type_idx on public.studio_definitions (organization_id, definition_type, lifecycle_status);
create index if not exists studio_versions_definition_status_idx on public.studio_definition_versions (studio_definition_id, status, version desc);
create index if not exists studio_validation_version_status_idx on public.studio_validation_runs (studio_definition_version_id, status, created_at desc);
create index if not exists studio_deployments_org_status_idx on public.studio_deployments (organization_id, status, environment);

alter table public.executive_intelligence_snapshots enable row level security;
alter table public.executive_priorities enable row level security;
alter table public.onboarding_sessions enable row level security;
alter table public.onboarding_steps enable row level security;
alter table public.discovery_candidates enable row level security;
alter table public.studio_definitions enable row level security;
alter table public.studio_definition_versions enable row level security;
alter table public.studio_validation_runs enable row level security;
alter table public.studio_deployments enable row level security;

revoke all on public.executive_intelligence_snapshots from public, anon, authenticated;
revoke all on public.executive_priorities from public, anon, authenticated;
revoke all on public.onboarding_sessions from public, anon, authenticated;
revoke all on public.onboarding_steps from public, anon, authenticated;
revoke all on public.discovery_candidates from public, anon, authenticated;
revoke all on public.studio_definitions from public, anon, authenticated;
revoke all on public.studio_definition_versions from public, anon, authenticated;
revoke all on public.studio_validation_runs from public, anon, authenticated;
revoke all on public.studio_deployments from public, anon, authenticated;

grant all on public.executive_intelligence_snapshots to service_role;
grant all on public.executive_priorities to service_role;
grant all on public.onboarding_sessions to service_role;
grant all on public.onboarding_steps to service_role;
grant all on public.discovery_candidates to service_role;
grant all on public.studio_definitions to service_role;
grant all on public.studio_definition_versions to service_role;
grant all on public.studio_validation_runs to service_role;
grant all on public.studio_deployments to service_role;

insert into public.studio_definitions (slug,name,definition_type,description,visibility,lifecycle_status,current_version)
values
 ('privacy-impact-rule-builder','Regla de impacto de privacidad','rule','Plantilla para diseñar reglas de impacto con revisión humana.','private','draft',1),
 ('evidence-review-workflow','Workflow de revisión de evidencia','workflow','Flujo visual para análisis IA, revisión humana y decisión final.','private','draft',1),
 ('executive-risk-agent','Agente ejecutivo de riesgo','agent','Agente grounded para sintetizar riesgos sin aprobar decisiones.','private','draft',1)
on conflict (slug) do nothing;

insert into public.studio_definition_versions (studio_definition_id,version,definition_json,input_schema,output_schema,permissions,prohibited_actions,test_cases,status,content_hash)
select d.id,1,
  case d.slug
    when 'privacy-impact-rule-builder' then '{"nodes":[{"type":"trigger"},{"type":"condition"},{"type":"impact"},{"type":"review"}],"requires_human_review":true}'::jsonb
    when 'evidence-review-workflow' then '{"nodes":[{"type":"evidence_input"},{"type":"ai_assessment"},{"type":"human_review"},{"type":"decision"}],"auto_approve":false}'::jsonb
    else '{"role":"executive_risk","tools":["risk_scores","impact_runs","evidence"],"grounded":true}'::jsonb
  end,
  '{}'::jsonb,
  '{}'::jsonb,
  case d.slug when 'executive-risk-agent' then array['risk:read','impact:read','evidence:read'] else array['studio:design'] end,
  array['approve_compliance','publish_policy','validate_evidence_officially','send_external_message'],
  '[]'::jsonb,
  'draft',
  encode(digest(d.slug || ':v1','sha256'),'hex')
from public.studio_definitions d
where d.slug in ('privacy-impact-rule-builder','evidence-review-workflow','executive-risk-agent')
on conflict do nothing;