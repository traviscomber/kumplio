-- KUMPLIO — Motor de Misiones, Playbooks y Capacidades
-- Capa de objetivos y resultados sobre expedientes y workflows existentes.
begin;

create table if not exists public.mission_playbooks (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  version integer not null default 1 check (version > 0),
  name text not null,
  description text,
  objective text not null,
  vertical text not null default 'general',
  status text not null default 'draft' check (status in ('draft','published','retired')),
  outcome_schema jsonb not null default '{}'::jsonb,
  closing_criteria jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(slug, version)
);

create table if not exists public.mission_capabilities (
  id uuid primary key default gen_random_uuid(),
  capability_key text not null unique,
  name text not null,
  description text,
  customer_outcome text not null,
  input_schema jsonb not null default '{}'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  review_required boolean not null default true,
  status text not null default 'active' check (status in ('active','deprecated','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mission_playbook_capabilities (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid not null references public.mission_playbooks(id) on delete cascade,
  capability_id uuid not null references public.mission_capabilities(id) on delete restrict,
  sequence integer not null check (sequence > 0),
  required boolean not null default true,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(playbook_id, capability_id),
  unique(playbook_id, sequence)
);

create table if not exists public.agent_capabilities (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  capability_id uuid not null references public.mission_capabilities(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','retired')),
  priority integer not null default 100 check (priority > 0),
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(agent_id, capability_id)
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid references public.compliance_cases(id) on delete restrict,
  playbook_id uuid not null references public.mission_playbooks(id) on delete restrict,
  title text not null,
  objective text not null,
  status text not null default 'draft' check (status in ('draft','ready','active','blocked','in_review','completed','cancelled')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  owner_id uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  started_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists missions_case_unique_idx
  on public.missions(case_id) where case_id is not null;

create table if not exists public.mission_capability_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  playbook_capability_id uuid not null references public.mission_playbook_capabilities(id) on delete restrict,
  capability_id uuid not null references public.mission_capabilities(id) on delete restrict,
  sequence integer not null check (sequence > 0),
  assigned_agent_id text,
  workflow_stage_id uuid references public.agent_workflow_stages(id) on delete set null,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','ready','running','blocked','review_required','completed','failed','skipped','cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(mission_id, playbook_capability_id)
);

create table if not exists public.mission_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  event_type text not null,
  actor_type text not null check (actor_type in ('user','agent','system')),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_agent_id text,
  from_status text,
  to_status text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (
    (actor_type='user' and actor_user_id is not null and actor_agent_id is null)
    or (actor_type='agent' and actor_agent_id is not null and actor_user_id is null)
    or (actor_type='system' and actor_user_id is null and actor_agent_id is null)
  )
);

create table if not exists public.mission_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  result_type text not null,
  version integer not null check (version > 0),
  status text not null default 'proposed' check (status in ('proposed','in_review','approved','rejected','superseded')),
  title text not null,
  summary text,
  payload jsonb not null default '{}'::jsonb,
  evidence_ids uuid[] not null default '{}'::uuid[],
  source_artifact_id uuid references public.agent_artifacts(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_by_type text not null check (created_by_type in ('user','agent','system')),
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_by_agent_id text,
  created_at timestamptz not null default now(),
  unique(mission_id, result_type, version),
  check (
    (created_by_type='user' and created_by_user_id is not null and created_by_agent_id is null)
    or (created_by_type='agent' and created_by_agent_id is not null and created_by_user_id is null)
    or (created_by_type='system' and created_by_user_id is null and created_by_agent_id is null)
  )
);

-- Índices de claves foráneas y consultas operacionales.
create index if not exists mission_playbook_capabilities_capability_idx on public.mission_playbook_capabilities(capability_id);
create index if not exists agent_capabilities_capability_idx on public.agent_capabilities(capability_id, status, priority);
create index if not exists missions_organization_idx on public.missions(organization_id, status, updated_at desc);
create index if not exists missions_playbook_idx on public.missions(playbook_id);
create index if not exists missions_owner_idx on public.missions(owner_id) where owner_id is not null;
create index if not exists mission_capability_runs_org_idx on public.mission_capability_runs(organization_id, status, sequence);
create index if not exists mission_capability_runs_capability_idx on public.mission_capability_runs(capability_id);
create index if not exists mission_capability_runs_playbook_capability_idx on public.mission_capability_runs(playbook_capability_id);
create index if not exists mission_capability_runs_workflow_stage_idx on public.mission_capability_runs(workflow_stage_id) where workflow_stage_id is not null;
create index if not exists mission_capability_runs_agent_run_idx on public.mission_capability_runs(agent_run_id) where agent_run_id is not null;
create index if not exists mission_events_mission_idx on public.mission_events(mission_id, created_at desc);
create index if not exists mission_events_org_idx on public.mission_events(organization_id, created_at desc);
create index if not exists mission_results_mission_idx on public.mission_results(mission_id, result_type, version desc);
create index if not exists mission_results_org_idx on public.mission_results(organization_id, status, created_at desc);
create index if not exists mission_results_artifact_idx on public.mission_results(source_artifact_id) where source_artifact_id is not null;

-- RLS.
alter table public.mission_playbooks enable row level security;
alter table public.mission_capabilities enable row level security;
alter table public.mission_playbook_capabilities enable row level security;
alter table public.agent_capabilities enable row level security;
alter table public.missions enable row level security;
alter table public.mission_capability_runs enable row level security;
alter table public.mission_events enable row level security;
alter table public.mission_results enable row level security;

revoke all on public.mission_playbooks, public.mission_capabilities, public.mission_playbook_capabilities,
  public.agent_capabilities, public.missions, public.mission_capability_runs, public.mission_events,
  public.mission_results from anon, authenticated;

grant select on public.mission_playbooks, public.mission_capabilities, public.mission_playbook_capabilities to authenticated;
grant select on public.missions, public.mission_capability_runs, public.mission_events, public.mission_results to authenticated;
grant all on public.mission_playbooks, public.mission_capabilities, public.mission_playbook_capabilities,
  public.agent_capabilities, public.missions, public.mission_capability_runs, public.mission_events,
  public.mission_results to service_role;

create policy mission_playbooks_read_published on public.mission_playbooks
  for select to authenticated using (status='published');
create policy mission_capabilities_read_active on public.mission_capabilities
  for select to authenticated using (status='active');
create policy mission_playbook_capabilities_read_published on public.mission_playbook_capabilities
  for select to authenticated using (exists (
    select 1 from public.mission_playbooks p where p.id=playbook_id and p.status='published'
  ));

create policy missions_read_members on public.missions
  for select to authenticated using (exists (
    select 1 from public.organization_members m
    where m.organization_id=missions.organization_id and m.user_id=(select auth.uid())
  ));
create policy mission_capability_runs_read_members on public.mission_capability_runs
  for select to authenticated using (exists (
    select 1 from public.organization_members m
    where m.organization_id=mission_capability_runs.organization_id and m.user_id=(select auth.uid())
  ));
create policy mission_events_read_members on public.mission_events
  for select to authenticated using (exists (
    select 1 from public.organization_members m
    where m.organization_id=mission_events.organization_id and m.user_id=(select auth.uid())
  ));
create policy mission_results_read_members on public.mission_results
  for select to authenticated using (exists (
    select 1 from public.organization_members m
    where m.organization_id=mission_results.organization_id and m.user_id=(select auth.uid())
  ));

-- Eventos y resultados aprobados son históricos.
create or replace function public.prevent_mission_event_mutation()
returns trigger language plpgsql security invoker set search_path=''
as $$ begin raise exception 'mission_events_are_immutable'; end; $$;

drop trigger if exists mission_events_immutable on public.mission_events;
create trigger mission_events_immutable before update or delete on public.mission_events
for each row execute function public.prevent_mission_event_mutation();

create or replace function public.protect_approved_mission_result()
returns trigger language plpgsql security invoker set search_path=''
as $$
begin
  if old.status in ('approved','superseded') then
    raise exception 'approved_mission_results_are_immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists mission_results_protect_approved on public.mission_results;
create trigger mission_results_protect_approved before update or delete on public.mission_results
for each row execute function public.protect_approved_mission_result();

-- Catálogo inicial de capacidades, orientado a outcomes.
insert into public.mission_capabilities(capability_key,name,customer_outcome,description,review_required)
values
  ('detect_obligations','Encontrar obligaciones','Obligaciones aplicables, priorizadas y citables','Transforma fuentes y documentos en obligaciones trazables.',true),
  ('monitor_regulatory_change','Detectar cambios regulatorios','Cambios relevantes explicados antes de que generen riesgo','Compara fuentes oficiales y determina qué cambió.',true),
  ('prioritize_risk_controls','Priorizar riesgos y controles','Riesgos ordenados y controles que requieren atención','Evalúa impacto, brechas y urgencia operacional.',true),
  ('build_action_plan','Construir plan de trabajo','Responsables, dependencias y próximos pasos claros','Convierte análisis en trabajo ejecutable.',true),
  ('review_decision','Revisar antes de decidir','Propuestas fortalecidas antes de aprobación humana','Verifica respaldo, límites y evidencia faltante.',true),
  ('prepare_audit','Preparar auditoría','Brechas y evidencia pendientes visibles antes de una auditoría','Simula preparación y comprueba demostrabilidad.',true)
on conflict (capability_key) do update set
  name=excluded.name,
  customer_outcome=excluded.customer_outcome,
  description=excluded.description,
  review_required=excluded.review_required,
  updated_at=now();

commit;
