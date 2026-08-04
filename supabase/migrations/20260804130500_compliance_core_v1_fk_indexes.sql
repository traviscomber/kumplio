create index if not exists organization_obligation_assignments_profile_id_idx
  on public.organization_obligation_assignments (profile_id);

create index if not exists organization_obligation_assignments_applicability_rule_id_idx
  on public.organization_obligation_assignments (applicability_rule_id);

create index if not exists regulatory_impact_runs_profile_id_idx
  on public.regulatory_impact_runs (profile_id);

create index if not exists regulatory_impact_changes_assignment_id_idx
  on public.regulatory_impact_changes (assignment_id);
