-- KUMPLIO multi-agent orchestration
-- Depends on scripts/06-agent-control-plane.sql and 07-agent-control-plane-rls.sql.

begin;

create table if not exists agent_workflows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  case_id uuid not null references compliance_cases(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  workflow_type text not null default 'compliance_assessment',
  status text not null default 'draft' check (status in ('draft','running','paused','pending_review','completed','failed','cancelled')),
  current_stage integer not null default 0 check (current_stage >= 0),
  total_stages integer not null default 5 check (total_stages > 0),
  input_payload jsonb not null default '{}'::jsonb,
  final_payload jsonb,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_workflow_stages (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references agent_workflows(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  stage_index integer not null check (stage_index >= 0),
  agent_id text not null check (agent_id in ('isidora','rodrigo','javier','beatriz','veronica','andres','catalina')),
  status text not null default 'queued' check (status in ('queued','running','pending_review','approved','changes_requested','failed','skipped','cancelled')),
  run_id uuid references agent_runs(id) on delete set null,
  source_artifact_ids uuid[] not null default '{}',
  output_artifact_id uuid references agent_artifacts(id) on delete set null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  task_template text not null,
  context_snapshot jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workflow_id, stage_index)
);

create index if not exists agent_workflows_org_status_idx on agent_workflows(organization_id, status, created_at desc);
create index if not exists agent_workflows_case_idx on agent_workflows(case_id, created_at desc);
create index if not exists agent_workflow_stages_workflow_idx on agent_workflow_stages(workflow_id, stage_index);
create index if not exists agent_workflow_stages_status_idx on agent_workflow_stages(organization_id, status, updated_at);

alter table agent_workflows enable row level security;
alter table agent_workflow_stages enable row level security;

grant select, insert, update on table agent_workflows to authenticated;
grant select, insert, update on table agent_workflow_stages to authenticated;
grant all on table agent_workflows to service_role;
grant all on table agent_workflow_stages to service_role;

create policy agent_workflows_select_member on agent_workflows
  for select to authenticated
  using (public.is_organization_member(organization_id));
create policy agent_workflows_insert_self on agent_workflows
  for insert to authenticated
  with check (public.is_organization_member(organization_id) and created_by = auth.uid());
create policy agent_workflows_update_creator on agent_workflows
  for update to authenticated
  using (public.is_organization_member(organization_id) and created_by = auth.uid())
  with check (public.is_organization_member(organization_id) and created_by = auth.uid());

create policy agent_workflow_stages_select_member on agent_workflow_stages
  for select to authenticated
  using (public.is_organization_member(organization_id));
create policy agent_workflow_stages_insert_member on agent_workflow_stages
  for insert to authenticated
  with check (
    public.is_organization_member(organization_id)
    and exists (
      select 1 from agent_workflows workflow
      where workflow.id = workflow_id
        and workflow.organization_id = organization_id
        and workflow.created_by = auth.uid()
    )
  );
create policy agent_workflow_stages_update_creator on agent_workflow_stages
  for update to authenticated
  using (
    public.is_organization_member(organization_id)
    and exists (
      select 1 from agent_workflows workflow
      where workflow.id = workflow_id
        and workflow.created_by = auth.uid()
    )
  )
  with check (public.is_organization_member(organization_id));

commit;
