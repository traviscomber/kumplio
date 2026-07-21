-- KUMPLIO continuous compliance core (part 1)
-- Additive migration. Existing tables and data are preserved.

begin;
create extension if not exists pgcrypto;

create table if not exists controls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  obligation_id uuid references obligations(id) on delete set null,
  name text not null,
  description text,
  control_type text not null default 'hybrid' check (control_type in ('preventive','detective','corrective','manual','automatic','hybrid')),
  frequency text,
  owner_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','compliant','partial','non_compliant','not_applicable','review_required')),
  last_evaluated_at timestamptz,
  next_evaluation_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  document_id uuid references documents(id) on delete set null,
  name text not null,
  evidence_type text not null default 'document',
  source text,
  issued_at timestamptz,
  expires_at timestamptz,
  validation_status text not null default 'pending' check (validation_status in ('pending','valid','expiring','expired','incomplete','rejected')),
  integrity_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists control_evidence (
  control_id uuid not null references controls(id) on delete cascade,
  evidence_id uuid not null references evidence(id) on delete cascade,
  linked_at timestamptz not null default now(),
  primary key (control_id, evidence_id)
);

create table if not exists findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  obligation_id uuid references obligations(id) on delete set null,
  control_id uuid references controls(id) on delete set null,
  evidence_id uuid references evidence(id) on delete set null,
  title text not null,
  description text,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','assigned','in_progress','pending_validation','resolved','risk_accepted','false_positive','closed')),
  owner_id uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists action_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  finding_id uuid references findings(id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  status text not null default 'pending' check (status in ('pending','in_progress','blocked','pending_validation','completed','cancelled')),
  owner_id uuid references auth.users(id) on delete set null,
  starts_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists controls_org_idx on controls(organization_id);
create index if not exists evidence_org_idx on evidence(organization_id);
create index if not exists findings_org_status_idx on findings(organization_id, status);
create index if not exists action_items_org_status_idx on action_items(organization_id, status);

alter table controls enable row level security;
alter table evidence enable row level security;
alter table control_evidence enable row level security;
alter table findings enable row level security;
alter table action_items enable row level security;

commit;
