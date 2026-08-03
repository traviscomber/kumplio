-- KUMPLIO — MISSION-005 hardening: índices para claves foráneas
begin;

create index if not exists mission_execution_jobs_organization_idx
  on public.mission_execution_jobs(organization_id);

create index if not exists mission_model_runs_organization_idx
  on public.mission_model_runs(organization_id);

create index if not exists mission_tool_calls_organization_idx
  on public.mission_tool_calls(organization_id);

create index if not exists mission_quality_evaluations_organization_idx
  on public.mission_quality_evaluations(organization_id);

create index if not exists mission_worker_profiles_agent_idx
  on public.mission_worker_profiles(agent_id);

commit;
