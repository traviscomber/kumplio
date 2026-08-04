create table if not exists public.evidence_ai_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  assessment_version integer not null default 1,
  status text not null default 'pending_review' check (status in ('pending_review','accepted','rejected','superseded')),
  relevance_score numeric(5,2) check (relevance_score between 0 and 100),
  sufficiency_score numeric(5,2) check (sufficiency_score between 0 and 100),
  completeness_score numeric(5,2) check (completeness_score between 0 and 100),
  freshness_score numeric(5,2) check (freshness_score between 0 and 100),
  integrity_score numeric(5,2) check (integrity_score between 0 and 100),
  overall_score numeric(5,2) check (overall_score between 0 and 100),
  detected_document_type text,
  detected_issues jsonb not null default '[]'::jsonb,
  extracted_metadata jsonb not null default '{}'::jsonb,
  rationale jsonb not null default '{}'::jsonb,
  model_provider text,
  model_name text,
  prompt_version text,
  input_hash text not null,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  unique (evidence_id, assessment_version)
);

create index if not exists evidence_ai_assessments_org_created_idx on public.evidence_ai_assessments(organization_id, created_at desc);
create index if not exists evidence_ai_assessments_evidence_idx on public.evidence_ai_assessments(evidence_id, created_at desc);
create index if not exists evidence_ai_assessments_status_idx on public.evidence_ai_assessments(status, created_at desc);
create unique index if not exists evidence_ai_assessments_input_version_uidx on public.evidence_ai_assessments(evidence_id, input_hash, prompt_version) where status <> 'superseded';
create index if not exists evidence_ai_assessments_reviewed_by_idx on public.evidence_ai_assessments(reviewed_by);

create table if not exists public.dynamic_risk_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  risk_id uuid references public.risks(id) on delete set null,
  obligation_assignment_id uuid references public.organization_obligation_assignments(id) on delete set null,
  score_version integer not null default 1,
  inherent_score numeric(5,2) not null check (inherent_score between 0 and 100),
  control_effectiveness_score numeric(5,2) not null check (control_effectiveness_score between 0 and 100),
  evidence_confidence_score numeric(5,2) not null check (evidence_confidence_score between 0 and 100),
  incident_modifier numeric(5,2) not null default 0 check (incident_modifier between 0 and 100),
  regulatory_modifier numeric(5,2) not null default 0 check (regulatory_modifier between 0 and 100),
  residual_score numeric(5,2) not null check (residual_score between 0 and 100),
  severity text not null check (severity in ('low','medium','high','critical')),
  factor_snapshot jsonb not null default '{}'::jsonb,
  calculation_version text not null default 'risk-v1',
  status text not null default 'current' check (status in ('current','superseded','review_required')),
  calculated_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text
);

create unique index if not exists dynamic_risk_scores_current_risk_uidx on public.dynamic_risk_scores(organization_id, risk_id) where status='current' and risk_id is not null;
create unique index if not exists dynamic_risk_scores_current_assignment_uidx on public.dynamic_risk_scores(organization_id, obligation_assignment_id) where status='current' and obligation_assignment_id is not null;
create index if not exists dynamic_risk_scores_org_severity_idx on public.dynamic_risk_scores(organization_id, severity, residual_score desc);
create index if not exists dynamic_risk_scores_reviewed_by_idx on public.dynamic_risk_scores(reviewed_by);

create table if not exists public.compliance_benchmark_snapshots (
  id uuid primary key default gen_random_uuid(),
  benchmark_key text not null,
  industry_code text not null,
  size_band text not null default 'all',
  country_code text not null default 'CL',
  metric_name text not null,
  cohort_size integer not null check (cohort_size >= 0),
  minimum_cohort_size integer not null default 5 check (minimum_cohort_size >= 3),
  p25 numeric,
  median numeric,
  p75 numeric,
  average numeric,
  standard_deviation numeric,
  methodology_version text not null default 'benchmark-v1',
  period_start date not null,
  period_end date not null,
  status text not null default 'withheld' check (status in ('withheld','published','superseded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (benchmark_key, industry_code, size_band, country_code, metric_name, period_start, period_end),
  constraint compliance_benchmark_publishable_cohort_check check (status <> 'published' or cohort_size >= minimum_cohort_size)
);

create index if not exists compliance_benchmark_lookup_idx on public.compliance_benchmark_snapshots(industry_code, size_band, metric_name, period_end desc);
create index if not exists compliance_benchmark_status_idx on public.compliance_benchmark_snapshots(status, period_end desc);

create table if not exists public.organization_benchmark_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  benchmark_snapshot_id uuid not null references public.compliance_benchmark_snapshots(id) on delete cascade,
  organization_value numeric not null,
  percentile_rank numeric(5,2) check (percentile_rank between 0 and 100),
  delta_to_median numeric,
  result_status text not null default 'available' check (result_status in ('available','withheld','insufficient_data')),
  calculated_at timestamptz not null default now(),
  unique (organization_id, benchmark_snapshot_id)
);

create index if not exists organization_benchmark_results_org_idx on public.organization_benchmark_results(organization_id, calculated_at desc);
create index if not exists organization_benchmark_results_snapshot_idx on public.organization_benchmark_results(benchmark_snapshot_id);

create or replace function public.calculate_dynamic_risk_score_v1(
  p_inherent_score numeric,
  p_control_effectiveness_score numeric,
  p_evidence_confidence_score numeric,
  p_incident_modifier numeric default 0,
  p_regulatory_modifier numeric default 0
) returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_residual numeric;
  v_severity text;
begin
  v_residual := greatest(0, least(100,
    p_inherent_score * (1 - (greatest(0, least(100, p_control_effectiveness_score)) / 100) * 0.6)
    * (1 - (greatest(0, least(100, p_evidence_confidence_score)) / 100) * 0.25)
    + greatest(0, least(100, p_incident_modifier)) * 0.10
    + greatest(0, least(100, p_regulatory_modifier)) * 0.05
  ));
  v_severity := case when v_residual >= 80 then 'critical' when v_residual >= 60 then 'high' when v_residual >= 35 then 'medium' else 'low' end;
  return jsonb_build_object('residual_score', round(v_residual,2), 'severity', v_severity, 'calculation_version', 'risk-v1');
end;
$$;

revoke all on function public.calculate_dynamic_risk_score_v1(numeric,numeric,numeric,numeric,numeric) from public, anon, authenticated;
grant execute on function public.calculate_dynamic_risk_score_v1(numeric,numeric,numeric,numeric,numeric) to service_role;

alter table public.evidence_ai_assessments enable row level security;
alter table public.dynamic_risk_scores enable row level security;
alter table public.compliance_benchmark_snapshots enable row level security;
alter table public.organization_benchmark_results enable row level security;

revoke all on public.evidence_ai_assessments from public, anon, authenticated;
revoke all on public.dynamic_risk_scores from public, anon, authenticated;
revoke all on public.compliance_benchmark_snapshots from public, anon, authenticated;
revoke all on public.organization_benchmark_results from public, anon, authenticated;
grant all on public.evidence_ai_assessments to service_role;
grant all on public.dynamic_risk_scores to service_role;
grant all on public.compliance_benchmark_snapshots to service_role;
grant all on public.organization_benchmark_results to service_role;
