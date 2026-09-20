-- Outcome -> Action -> Verified Closure v1 FK index hardening
-- Adds covering indexes only for foreign keys introduced by outcome_verified_closure_v1.

create index if not exists compliance_action_plans_case_id_idx
  on public.compliance_action_plans(case_id)
  where case_id is not null;

create index if not exists compliance_action_plans_project_id_idx
  on public.compliance_action_plans(project_id)
  where project_id is not null;

create index if not exists compliance_action_plan_tasks_completed_by_idx
  on public.compliance_action_plan_tasks(completed_by)
  where completed_by is not null;

create index if not exists compliance_action_plan_tasks_verified_by_idx
  on public.compliance_action_plan_tasks(verified_by)
  where verified_by is not null;

create index if not exists compliance_action_task_evidence_linked_by_idx
  on public.compliance_action_task_evidence(linked_by)
  where linked_by is not null;
