-- Applied to production through Supabase migration: document_gap_action_engine_v1.
-- This file preserves the schema contract in Git history.

create table if not exists public.document_intelligence (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  classification text not null check (classification in ('contract','policy','procedure','evidence','minutes','other')),
  confidence numeric(5,4) not null default 0,
  extracted_metadata jsonb not null default '{}'::jsonb,
  linked_vendor_id uuid references public.organization_vendors(id) on delete set null,
  analyzed_at timestamptz not null default now(),
  engine_version text not null default 'document-intelligence-v1',
  unique(document_id)
);

create table if not exists public.compliance_gaps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  obligation_id uuid not null references public.obligations(id) on delete cascade,
  coverage_status text not null check (coverage_status in ('covered','partial','missing')),
  priority text not null check (priority in ('low','medium','high','critical')),
  rationale text not null,
  evidence_count integer not null default 0,
  control_count integer not null default 0,
  calculated_at timestamptz not null default now(),
  engine_version text not null default 'gap-analysis-v1',
  unique(project_id, obligation_id)
);

create table if not exists public.compliance_action_plan_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  gap_id uuid not null references public.compliance_gaps(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete set null,
  sequence integer not null,
  title text not null,
  objective text not null,
  target_date date not null,
  status text not null default 'proposed' check (status in ('proposed','created','completed','dismissed')),
  created_at timestamptz not null default now(),
  unique(gap_id)
);

create index if not exists document_intelligence_project_idx on public.document_intelligence(project_id, analyzed_at desc);
create index if not exists compliance_gaps_project_idx on public.compliance_gaps(project_id, priority, coverage_status);
create index if not exists action_plan_project_idx on public.compliance_action_plan_items(project_id, sequence);

-- The production migration also defines:
-- refresh_compliance_gaps_v1(project_id)
-- generate_compliance_action_plan_v1(project_id, created_by)
