create index if not exists agent_workflow_outcome_snapshots_case_idx
  on public.agent_workflow_outcome_snapshots(case_id);

create index if not exists agent_workflow_outcome_snapshots_review_idx
  on public.agent_workflow_outcome_snapshots(review_id);

create index if not exists agent_workflow_outcome_snapshots_reviewer_idx
  on public.agent_workflow_outcome_snapshots(reviewer_id)
  where reviewer_id is not null;
