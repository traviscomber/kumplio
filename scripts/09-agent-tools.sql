-- KUMPLIO Agent Tools and Retrieval Audit
-- Additive migration. Requires migrations 06-08.

begin;

create table if not exists agent_tool_calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  case_id uuid references compliance_cases(id) on delete cascade,
  workflow_id uuid references agent_workflows(id) on delete cascade,
  stage_id uuid references agent_workflow_stages(id) on delete cascade,
  run_id uuid references agent_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  agent_id text not null check (agent_id in ('isidora','rodrigo','javier','beatriz','veronica','andres','catalina')),
  tool_name text not null,
  arguments jsonb not null default '{}'::jsonb,
  result_summary jsonb not null default '{}'::jsonb,
  result_count integer not null default 0 check (result_count >= 0),
  source_refs jsonb not null default '[]'::jsonb,
  status text not null default 'running' check (status in ('running','completed','failed','skipped')),
  error_code text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists agent_tool_calls_org_created_idx
  on agent_tool_calls(organization_id, created_at desc);
create index if not exists agent_tool_calls_case_idx
  on agent_tool_calls(case_id, created_at desc);
create index if not exists agent_tool_calls_run_idx
  on agent_tool_calls(run_id, created_at);
create index if not exists agent_tool_calls_workflow_idx
  on agent_tool_calls(workflow_id, stage_id, created_at);

alter table agent_tool_calls enable row level security;

drop policy if exists agent_tool_calls_select_member on agent_tool_calls;
create policy agent_tool_calls_select_member on agent_tool_calls
  for select to authenticated
  using (public.is_organization_member(organization_id));

drop policy if exists agent_tool_calls_insert_self on agent_tool_calls;
create policy agent_tool_calls_insert_self on agent_tool_calls
  for insert to authenticated
  with check (
    public.is_organization_member(organization_id)
    and user_id = (select auth.uid())
  );

drop policy if exists agent_tool_calls_update_self on agent_tool_calls;
create policy agent_tool_calls_update_self on agent_tool_calls
  for update to authenticated
  using (
    public.is_organization_member(organization_id)
    and user_id = (select auth.uid())
  )
  with check (
    public.is_organization_member(organization_id)
    and user_id = (select auth.uid())
  );

revoke all on table agent_tool_calls from anon;
grant select, insert, update on table agent_tool_calls to authenticated;
grant all on table agent_tool_calls to service_role;

commit;
