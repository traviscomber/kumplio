-- KUMPLIO Agent Tools and Retrieval Audit
-- Additive migration. Requires migrations 06-08.

begin;

create table if not exists agent_tool_calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  case_id uuid references compliance_cases(id) on delete cascade,
  workflow_id uuid references agent_workflows(id) on delete cascade,
  stage_id uuid references agent_workflow_stages(id) on delete cascade,
  run_id uuid references