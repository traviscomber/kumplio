begin;

create table if not exists public.organization_compliance_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  profile_version integer not null default 1 check (profile_version > 0),
  legal_name text,
  tax_id text,
  industry_codes text[] not null default '{}',
  regions text[] not null default '{}',
  employee_count integer check (employee_count is null or employee_count >= 0),
  annual_revenue_clp numeric check (annual_revenue_clp is null or annual_revenue_clp >= 0),
  activities jsonb not null default '[]'::jsonb,
  processes jsonb not null default '[]'::jsonb,
  permits jsonb not null default '[]'::jsonb,
  attributes jsonb not null default '{}'::jsonb,
  source text not null default 'organization_onboarding',
  status text not null default 'draft' check (status in ('draft','active','superseded','archived')),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_version),
  check (effective_to is null or effective_to > effective_from)
);

create unique index if not exists organization_compliance_profiles_one_active
  on public.organization_compliance_profiles (organization_id)
  where status = 'active';

create index if not exists organization_compliance_profiles_industry_codes_gin
  on public.organization_compliance_profiles using gin (industry_codes);
create index if not exists organization_compliance_profiles_regions_gin
  on public.organization_compliance_profiles using gin (regions);
create index if not exists organization_compliance_profiles_attributes_gin
  on public.organization_compliance_profiles using gin (attributes);

create table if not exists public.compliance_applicability_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  rule_version integer not null default 1 check (rule_version > 0),
  claim_id uuid,
  source_kind text not null default 'regulatory_claim',
  title text not null,
  description text,
  conditions jsonb not null,
  outcome jsonb not null default '{"applies":true}'::jsonb,
  validation_status text not null default 'pending' check (validation_status in ('pending','validated','rejected','superseded')),
  requires_human_review boolean not null default true,
  effective_from date,
  effective_to date,
  content_hash text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (rule_key, rule_version),
  unique (content_hash),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create index if not exists compliance_applicability_rules_claim_id_idx
  on public.compliance_applicability_rules (claim_id);
create index if not exists compliance_applicability_rules_conditions_gin
  on public.compliance_applicability_rules using gin (conditions);

create table if not exists public.organization_obligation_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  profile_id uuid not null references public.organization_compliance_profiles(id) on delete restrict,
  claim_id uuid,
  applicability_rule_id uuid not null references public.compliance_applicability_rules(id) on delete restrict,
  assignment_key text not null,
  applicability_status text not null default 'pending' check (applicability_status in ('pending','applicable','not_applicable','needs_review','superseded')),
  compliance_status text not null default 'not_assessed' check (compliance_status in ('not_assessed','compliant','partially_compliant','non_compliant','not_applicable')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  due_date date,
  recurrence_rule text,
  responsible_user_id uuid,
  applicability_reason jsonb not null default '{}'::jsonb,
  source_snapshot jsonb not null default '{}'::jsonb,
  first_detected_at timestamptz not null default now(),
  last_evaluated_at timestamptz not null default now(),
  superseded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, assignment_key)
);

create index if not exists organization_obligation_assignments_org_status_idx
  on public.organization_obligation_assignments (organization_id, applicability_status, compliance_status);
create index if not exists organization_obligation_assignments_claim_id_idx
  on public.organization_obligation_assignments (claim_id);
create index if not exists organization_obligation_assignments_due_date_idx
  on public.organization_obligation_assignments (due_date)
  where due_date is not null and applicability_status = 'applicable';

create table if not exists public.regulatory_impact_runs (
  id uuid primary key default gen_random_uuid(),
  trigger_kind text not null check (trigger_kind in ('regulatory_version','claim_revision','profile_change','manual_recalculation')),
  trigger_reference jsonb not null,
  organization_id uuid,
  profile_id uuid references public.organization_compliance_profiles(id) on delete restrict,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','unchanged')),
  idempotency_key text not null unique,
  engine_version text not null default 'compliance-impact-v1',
  metrics jsonb not null default '{}'::jsonb,
  error_code text,
  error_detail jsonb,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  check (finished_at is null or started_at is null or finished_at >= started_at)
);

create index if not exists regulatory_impact_runs_org_created_idx
  on public.regulatory_impact_runs (organization_id, created_at desc);
create index if not exists regulatory_impact_runs_status_idx
  on public.regulatory_impact_runs (status, queued_at);

create table if not exists public.regulatory_impact_changes (
  id uuid primary key default gen_random_uuid(),
  impact_run_id uuid not null references public.regulatory_impact_runs(id) on delete cascade,
  organization_id uuid not null,
  assignment_id uuid references public.organization_obligation_assignments(id) on delete set null,
  change_kind text not null check (change_kind in ('assignment_created','assignment_updated','assignment_removed','priority_changed','due_date_changed','review_required')),
  before_state jsonb,
  after_state jsonb,
  reason jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists regulatory_impact_changes_run_idx
  on public.regulatory_impact_changes (impact_run_id);
create index if not exists regulatory_impact_changes_org_created_idx
  on public.regulatory_impact_changes (organization_id, created_at desc);

alter table public.organization_compliance_profiles enable row level security;
alter table public.compliance_applicability_rules enable row level security;
alter table public.organization_obligation_assignments enable row level security;
alter table public.regulatory_impact_runs enable row level security;
alter table public.regulatory_impact_changes enable row level security;

revoke all on public.organization_compliance_profiles from public, anon, authenticated;
revoke all on public.compliance_applicability_rules from public, anon, authenticated;
revoke all on public.organization_obligation_assignments from public, anon, authenticated;
revoke all on public.regulatory_impact_runs from public, anon, authenticated;
revoke all on public.regulatory_impact_changes from public, anon, authenticated;

grant select on public.organization_compliance_profiles to authenticated;
grant select on public.compliance_applicability_rules to authenticated;
grant select on public.organization_obligation_assignments to authenticated;
grant select on public.regulatory_impact_runs to authenticated;
grant select on public.regulatory_impact_changes to authenticated;

grant all on public.organization_compliance_profiles to service_role;
grant all on public.compliance_applicability_rules to service_role;
grant all on public.organization_obligation_assignments to service_role;
grant all on public.regulatory_impact_runs to service_role;
grant all on public.regulatory_impact_changes to service_role;

create or replace function public.queue_regulatory_impact_run(
  p_trigger_kind text,
  p_trigger_reference jsonb,
  p_organization_id uuid default null,
  p_profile_id uuid default null,
  p_engine_version text default 'compliance-impact-v1'
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_key text;
  v_id uuid;
begin
  if p_trigger_kind not in ('regulatory_version','claim_revision','profile_change','manual_recalculation') then
    raise exception 'invalid_trigger_kind';
  end if;

  v_key := encode(extensions.digest(
    concat_ws('|', p_trigger_kind, coalesce(p_organization_id::text,''), coalesce(p_profile_id::text,''), p_engine_version, p_trigger_reference::text),
    'sha256'
  ), 'hex');

  insert into public.regulatory_impact_runs (
    trigger_kind, trigger_reference, organization_id, profile_id, idempotency_key, engine_version
  ) values (
    p_trigger_kind, p_trigger_reference, p_organization_id, p_profile_id, v_key, p_engine_version
  )
  on conflict (idempotency_key) do update
    set idempotency_key = excluded.idempotency_key
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.queue_regulatory_impact_run(text,jsonb,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.queue_regulatory_impact_run(text,jsonb,uuid,uuid,text) to service_role;

comment on table public.organization_compliance_profiles is 'Versioned organization facts used to evaluate regulatory applicability.';
comment on table public.compliance_applicability_rules is 'Auditable deterministic rules linking regulatory claims to organization profiles.';
comment on table public.organization_obligation_assignments is 'Organization-specific obligation assignments derived from claims and applicability rules.';
comment on table public.regulatory_impact_runs is 'Idempotent recalculation runs triggered by regulatory or profile changes.';
comment on table public.regulatory_impact_changes is 'Immutable change log produced by regulatory impact runs.';

commit;
