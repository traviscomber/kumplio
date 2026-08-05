create table if not exists public.compliance_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null,
  source_type text not null,
  source_id uuid,
  subject_type text,
  subject_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','processed','failed','ignored')),
  occurred_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists compliance_events_queue_idx on public.compliance_events(status, occurred_at);
create index if not exists compliance_events_org_idx on public.compliance_events(organization_id, occurred_at desc);

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  rule_key text not null,
  name text not null,
  description text,
  event_type text not null,
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  priority integer not null default 100,
  enabled boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, rule_key, version)
);
create index if not exists automation_rules_lookup_idx on public.automation_rules(event_type, enabled, priority);

create table if not exists public.compliance_situations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid references public.compliance_events(id) on delete set null,
  situation_type text not null,
  title text not null,
  summary text,
  status text not null default 'open' check (status in ('open','analyzing','waiting_decision','in_progress','resolved','dismissed')),
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  confidence numeric(5,4),
  context jsonb not null default '{}'::jsonb,
  evidence_ids uuid[] not null default '{}',
  recommendation text,
  mission_id uuid references public.missions(id) on delete set null,
  decision_id uuid references public.mission_decisions(id) on delete set null,
  owner_id uuid,
  due_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists compliance_situations_org_status_idx on public.compliance_situations(organization_id, status, severity, created_at desc);
create index if not exists compliance_situations_event_idx on public.compliance_situations(event_id);

insert into public.automation_rules (organization_id, rule_key, name, description, event_type, conditions, actions, priority)
select null, 'mission_completed_recalculate', 'Recalcular estado al completar una misión', 'Actualiza el estado diario después de cerrar una acción.', 'mission.completed', '[]'::jsonb, '[{"type":"create_situation","situation_type":"verification","title":"Verificar resultado de misión","severity":"medium"}]'::jsonb, 50
where not exists (select 1 from public.automation_rules where organization_id is null and rule_key = 'mission_completed_recalculate' and version = 1);

insert into public.automation_rules (organization_id, rule_key, name, description, event_type, conditions, actions, priority)
select null, 'vendor_personal_data_review', 'Revisar proveedor que procesa datos', 'Crea una situación cuando un proveedor declara tratamiento de datos personales.', 'vendor.updated', '[{"path":"payload.processes_personal_data","operator":"eq","value":true}]'::jsonb, '[{"type":"create_situation","situation_type":"vendor_privacy","title":"Revisar tratamiento de datos del proveedor","severity":"high"}]'::jsonb, 20
where not exists (select 1 from public.automation_rules where organization_id is null and rule_key = 'vendor_personal_data_review' and version = 1);