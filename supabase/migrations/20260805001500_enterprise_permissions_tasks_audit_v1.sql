create table if not exists public.organization_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  role_key text not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, role_key)
);

create table if not exists public.organization_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.organization_roles(id) on delete cascade,
  permission_key text not null,
  allowed boolean not null default true,
  scope_type text not null default 'organization' check (scope_type in ('organization','area','process','project')),
  scope_id uuid,
  created_at timestamptz not null default now(),
  unique (role_id, permission_key, scope_type, scope_id)
);

create table if not exists public.organization_member_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.organization_roles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  delegated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (valid_until is null or valid_until > valid_from)
);

create table if not exists public.work_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  description text,
  item_type text not null default 'task' check (item_type in ('task','review','approval','evidence','control','policy','impact','incident')),
  source_type text,
  source_id uuid,
  assignee_user_id uuid references auth.users(id),
  reviewer_user_id uuid references auth.users(id),
  approver_user_id uuid references auth.users(id),
  observer_user_ids uuid[] not null default '{}',
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  status text not null default 'pending' check (status in ('pending','accepted','in_progress','blocked','completed','cancelled')),
  due_at timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz,
  sla_minutes integer check (sla_minutes is null or sla_minutes > 0),
  escalation_user_id uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text,
  source_type text,
  source_id uuid,
  severity text not null default 'info' check (severity in ('info','warning','high','critical')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  actor_type text not null default 'user' check (actor_type in ('user','agent','system','connector')),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before_state jsonb not null default '{}',
  after_state jsonb not null default '{}',
  metadata jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);

create table if not exists public.audit_export_packages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft','building','ready','failed','expired')),
  manifest jsonb not null default '{}',
  package_hash text,
  requested_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz,
  check (period_end >= period_start)
);

create table if not exists public.evidence_custody_events (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null check (event_type in ('uploaded','hashed','validated','linked','exported','superseded')),
  actor_user_id uuid references auth.users(id),
  integrity_hash text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists organization_member_roles_org_user_idx on public.organization_member_roles(organization_id,user_id,status);
create index if not exists work_items_org_status_due_idx on public.work_items(organization_id,status,due_at);
create index if not exists work_items_assignee_idx on public.work_items(assignee_user_id,status,due_at);
create index if not exists organization_notifications_user_idx on public.organization_notifications(user_id,read_at,created_at desc);
create index if not exists organization_audit_events_org_idx on public.organization_audit_events(organization_id,occurred_at desc);
create index if not exists evidence_custody_events_evidence_idx on public.evidence_custody_events(evidence_id,created_at desc);

alter table public.organization_roles enable row level security;
alter table public.organization_role_permissions enable row level security;
alter table public.organization_member_roles enable row level security;
alter table public.work_items enable row level security;
alter table public.organization_notifications enable row level security;
alter table public.organization_audit_events enable row level security;
alter table public.audit_export_packages enable row level security;
alter table public.evidence_custody_events enable row level security;

revoke all on public.organization_roles, public.organization_role_permissions, public.organization_member_roles, public.work_items, public.organization_notifications, public.organization_audit_events, public.audit_export_packages, public.evidence_custody_events from public, anon, authenticated;
grant all on public.organization_roles, public.organization_role_permissions, public.organization_member_roles, public.work_items, public.organization_notifications, public.organization_audit_events, public.audit_export_packages, public.evidence_custody_events to service_role;

create or replace function public.create_audit_export_manifest_v1(p_organization_id uuid,p_actor_user_id uuid,p_period_start date,p_period_end date) returns uuid
language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_manifest jsonb;
begin
 if p_period_end < p_period_start then raise exception 'invalid_period'; end if;
 select jsonb_build_object(
   'audit_events',(select count(*) from public.organization_audit_events where organization_id=p_organization_id and occurred_at::date between p_period_start and p_period_end),
   'evidence',(select count(*) from public.evidence where organization_id=p_organization_id),
   'policies',(select count(*) from public.organization_policy_instances where organization_id=p_organization_id),
   'snapshots',(select count(*) from public.executive_intelligence_snapshots where organization_id=p_organization_id and period_end between p_period_start and p_period_end)
 ) into v_manifest;
 insert into public.audit_export_packages(organization_id,title,period_start,period_end,status,manifest,requested_by,completed_at)
 values(p_organization_id,'Paquete de auditoría '||p_period_start||' a '||p_period_end,p_period_start,p_period_end,'ready',v_manifest,p_actor_user_id,now()) returning id into v_id;
 return v_id;
end;$$;
revoke all on function public.create_audit_export_manifest_v1(uuid,uuid,date,date) from public,anon,authenticated;
grant execute on function public.create_audit_export_manifest_v1(uuid,uuid,date,date) to service_role;