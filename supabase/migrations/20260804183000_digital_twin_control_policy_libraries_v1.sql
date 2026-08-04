-- Company Digital Twin + reusable control and policy libraries.
-- Applied additively; all new resources remain closed to end users and in draft by default.

create table if not exists public.organization_processes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  process_type text not null default 'business',
  criticality text not null default 'medium' check (criticality in ('low','medium','high','critical')),
  owner_user_id uuid references auth.users(id) on delete set null,
  lifecycle_status text not null default 'active' check (lifecycle_status in ('draft','active','inactive','retired')),
  attributes jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.organization_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  asset_type text not null,
  description text,
  criticality text not null default 'medium' check (criticality in ('low','medium','high','critical')),
  owner_user_id uuid references auth.users(id) on delete set null,
  provider_name text,
  hosting_country text,
  contains_personal_data boolean not null default false,
  contains_sensitive_data boolean not null default false,
  lifecycle_status text not null default 'active' check (lifecycle_status in ('draft','active','inactive','retired')),
  attributes jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.organization_datasets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  data_subjects text[] not null default '{}',
  data_categories text[] not null default '{}',
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  legal_basis text,
  retention_rule text,
  cross_border_transfer boolean not null default false,
  owner_user_id uuid references auth.users(id) on delete set null,
  lifecycle_status text not null default 'active' check (lifecycle_status in ('draft','active','inactive','retired')),
  attributes jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.organization_vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  service_category text,
  country text,
  processes_personal_data boolean not null default false,
  cross_border_transfer boolean not null default false,
  contract_expires_at timestamptz,
  risk_tier text not null default 'medium' check (risk_tier in ('low','medium','high','critical')),
  lifecycle_status text not null default 'active' check (lifecycle_status in ('draft','active','inactive','retired')),
  attributes jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.organization_process_assets (
  process_id uuid not null references public.organization_processes(id) on delete cascade,
  asset_id uuid not null references public.organization_assets(id) on delete cascade,
  relationship_type text not null default 'uses',
  created_at timestamptz not null default now(),
  primary key (process_id, asset_id, relationship_type)
);

create table if not exists public.organization_process_datasets (
  process_id uuid not null references public.organization_processes(id) on delete cascade,
  dataset_id uuid not null references public.organization_datasets(id) on delete cascade,
  relationship_type text not null default 'processes',
  created_at timestamptz not null default now(),
  primary key (process_id, dataset_id, relationship_type)
);

create table if not exists public.organization_asset_datasets (
  asset_id uuid not null references public.organization_assets(id) on delete cascade,
  dataset_id uuid not null references public.organization_datasets(id) on delete cascade,
  relationship_type text not null default 'stores',
  created_at timestamptz not null default now(),
  primary key (asset_id, dataset_id, relationship_type)
);

create table if not exists public.organization_vendor_assets (
  vendor_id uuid not null references public.organization_vendors(id) on delete cascade,
  asset_id uuid not null references public.organization_assets(id) on delete cascade,
  relationship_type text not null default 'provides',
  created_at timestamptz not null default now(),
  primary key (vendor_id, asset_id, relationship_type)
);

create table if not exists public.control_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  canonical_name text not null,
  domain text not null,
  lifecycle_status text not null default 'draft' check (lifecycle_status in ('draft','active','deprecated','retired')),
  current_version integer not null default 1 check (current_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.control_catalog_versions (
  id uuid primary key default gen_random_uuid(),
  control_catalog_id uuid not null references public.control_catalog(id) on delete cascade,
  version integer not null check (version > 0),
  title text not null,
  description text,
  objective text,
  control_type text not null check (control_type in ('preventive','detective','corrective','directive')),
  control_nature text not null check (control_nature in ('administrative','technical','physical')),
  execution_mode text not null check (execution_mode in ('manual','automated','hybrid')),
  default_frequency text,
  expected_evidence_types text[] not null default '{}',
  implementation_guidance jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','pending_review','approved','rejected','superseded')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  content_hash text not null,
  created_at timestamptz not null default now(),
  unique (control_catalog_id, version)
);

create table if not exists public.control_catalog_obligation_links (
  control_catalog_version_id uuid not null references public.control_catalog_versions(id) on delete cascade,
  obligation_catalog_version_id uuid not null references public.obligation_catalog_versions(id) on delete cascade,
  relationship_type text not null default 'supports',
  status text not null default 'pending' check (status in ('pending','approved','rejected','superseded')),
  created_at timestamptz not null default now(),
  primary key (control_catalog_version_id, obligation_catalog_version_id, relationship_type)
);

create table if not exists public.organization_control_catalog_links (
  control_id uuid not null references public.controls(id) on delete cascade,
  control_catalog_version_id uuid not null references public.control_catalog_versions(id) on delete restrict,
  instantiated_at timestamptz not null default now(),
  primary key (control_id, control_catalog_version_id)
);

create table if not exists public.policy_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  canonical_name text not null,
  document_type text not null,
  domain text not null,
  lifecycle_status text not null default 'draft' check (lifecycle_status in ('draft','active','deprecated','retired')),
  current_version integer not null default 1 check (current_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.policy_catalog_versions (
  id uuid primary key default gen_random_uuid(),
  policy_catalog_id uuid not null references public.policy_catalog(id) on delete cascade,
  version integer not null check (version > 0),
  title text not null,
  purpose text,
  scope text,
  sections jsonb not null default '[]'::jsonb,
  required_placeholders text[] not null default '{}',
  generation_instructions jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','pending_review','approved','rejected','superseded')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  content_hash text not null,
  created_at timestamptz not null default now(),
  unique (policy_catalog_id, version)
);

create table if not exists public.policy_catalog_obligation_links (
  policy_catalog_version_id uuid not null references public.policy_catalog_versions(id) on delete cascade,
  obligation_catalog_version_id uuid not null references public.obligation_catalog_versions(id) on delete cascade,
  relationship_type text not null default 'addresses',
  status text not null default 'pending' check (status in ('pending','approved','rejected','superseded')),
  created_at timestamptz not null default now(),
  primary key (policy_catalog_version_id, obligation_catalog_version_id, relationship_type)
);

create table if not exists public.organization_policy_instances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  policy_catalog_version_id uuid not null references public.policy_catalog_versions(id) on delete restrict,
  title text not null,
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','retired')),
  content jsonb not null default '{}'::jsonb,
  owner_user_id uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  next_review_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, policy_catalog_version_id)
);

create index if not exists organization_processes_org_idx on public.organization_processes(organization_id);
create index if not exists organization_assets_org_idx on public.organization_assets(organization_id);
create index if not exists organization_datasets_org_idx on public.organization_datasets(organization_id);
create index if not exists organization_vendors_org_idx on public.organization_vendors(organization_id);
create index if not exists organization_process_assets_asset_idx on public.organization_process_assets(asset_id);
create index if not exists organization_process_datasets_dataset_idx on public.organization_process_datasets(dataset_id);
create index if not exists organization_asset_datasets_dataset_idx on public.organization_asset_datasets(dataset_id);
create index if not exists organization_vendor_assets_asset_idx on public.organization_vendor_assets(asset_id);
create index if not exists control_catalog_versions_catalog_idx on public.control_catalog_versions(control_catalog_id);
create index if not exists control_catalog_obligation_links_obligation_idx on public.control_catalog_obligation_links(obligation_catalog_version_id);
create index if not exists organization_control_catalog_links_catalog_idx on public.organization_control_catalog_links(control_catalog_version_id);
create index if not exists policy_catalog_versions_catalog_idx on public.policy_catalog_versions(policy_catalog_id);
create index if not exists policy_catalog_obligation_links_obligation_idx on public.policy_catalog_obligation_links(obligation_catalog_version_id);
create index if not exists organization_policy_instances_org_idx on public.organization_policy_instances(organization_id);
create index if not exists organization_policy_instances_catalog_idx on public.organization_policy_instances(policy_catalog_version_id);

alter table public.organization_processes enable row level security;
alter table public.organization_assets enable row level security;
alter table public.organization_datasets enable row level security;
alter table public.organization_vendors enable row level security;
alter table public.organization_process_assets enable row level security;
alter table public.organization_process_datasets enable row level security;
alter table public.organization_asset_datasets enable row level security;
alter table public.organization_vendor_assets enable row level security;
alter table public.control_catalog enable row level security;
alter table public.control_catalog_versions enable row level security;
alter table public.control_catalog_obligation_links enable row level security;
alter table public.organization_control_catalog_links enable row level security;
alter table public.policy_catalog enable row level security;
alter table public.policy_catalog_versions enable row level security;
alter table public.policy_catalog_obligation_links enable row level security;
alter table public.organization_policy_instances enable row level security;

revoke all on public.organization_processes, public.organization_assets, public.organization_datasets, public.organization_vendors,
  public.organization_process_assets, public.organization_process_datasets, public.organization_asset_datasets, public.organization_vendor_assets,
  public.control_catalog, public.control_catalog_versions, public.control_catalog_obligation_links, public.organization_control_catalog_links,
  public.policy_catalog, public.policy_catalog_versions, public.policy_catalog_obligation_links, public.organization_policy_instances
from public, anon, authenticated;

grant select, insert, update, delete on public.organization_processes, public.organization_assets, public.organization_datasets, public.organization_vendors,
  public.organization_process_assets, public.organization_process_datasets, public.organization_asset_datasets, public.organization_vendor_assets,
  public.control_catalog, public.control_catalog_versions, public.control_catalog_obligation_links, public.organization_control_catalog_links,
  public.policy_catalog, public.policy_catalog_versions, public.policy_catalog_obligation_links, public.organization_policy_instances
to service_role;

insert into public.control_catalog (code, canonical_name, domain) values
  ('CTRL-PRIV-001','Gobernanza y roles de privacidad','privacy'),
  ('CTRL-PRIV-002','Inventario y registro de tratamientos','privacy'),
  ('CTRL-PRIV-003','Gestión de derechos de titulares','privacy'),
  ('CTRL-PRIV-004','Gestión de incidentes de datos','privacy'),
  ('CTRL-PRIV-005','Evaluación de encargados y proveedores','privacy'),
  ('CTRL-PRIV-006','Evaluación de impacto de privacidad','privacy'),
  ('CTRL-PRIV-007','Retención y eliminación segura','privacy'),
  ('CTRL-PRIV-008','Control de transferencias internacionales','privacy')
on conflict (code) do nothing;

insert into public.control_catalog_versions
  (control_catalog_id,version,title,description,objective,control_type,control_nature,execution_mode,default_frequency,expected_evidence_types,status,content_hash)
select c.id,1,c.canonical_name,
  'Control candidato reutilizable para implementar obligaciones de protección de datos.',
  'Reducir el riesgo de incumplimiento mediante una práctica verificable y trazable.',
  case when c.code='CTRL-PRIV-004' then 'detective' else 'preventive' end,
  case when c.code in ('CTRL-PRIV-003','CTRL-PRIV-004','CTRL-PRIV-007') then 'technical' else 'administrative' end,
  'hybrid', case when c.code in ('CTRL-PRIV-005','CTRL-PRIV-006') then 'annual' else 'quarterly' end,
  array['policy','procedure','record'], 'draft', encode(digest(c.code||':v1','sha256'),'hex')
from public.control_catalog c where c.code like 'CTRL-PRIV-%'
on conflict (control_catalog_id,version) do nothing;

insert into public.policy_catalog (code,canonical_name,document_type,domain) values
  ('POL-PRIV-001','Política de privacidad y protección de datos','policy','privacy'),
  ('POL-PRIV-002','Procedimiento de derechos de titulares','procedure','privacy'),
  ('POL-PRIV-003','Procedimiento de gestión de incidentes','procedure','privacy'),
  ('POL-PRIV-004','Política de retención y eliminación','policy','privacy'),
  ('POL-PRIV-005','Estándar de gestión de encargados','standard','privacy'),
  ('POL-PRIV-006','Metodología de evaluación de impacto','methodology','privacy'),
  ('POL-PRIV-007','Aviso de privacidad','notice','privacy'),
  ('POL-PRIV-008','Acuerdo de tratamiento de datos','contract_template','privacy')
on conflict (code) do nothing;

insert into public.policy_catalog_versions
  (policy_catalog_id,version,title,purpose,scope,sections,required_placeholders,status,content_hash)
select p.id,1,p.canonical_name,
  'Plantilla candidata reutilizable para apoyar el cumplimiento de protección de datos.',
  'Debe adaptarse al perfil, procesos, sistemas y terceros de cada organización.',
  jsonb_build_array(
    jsonb_build_object('key','purpose','title','Objetivo'),
    jsonb_build_object('key','scope','title','Alcance'),
    jsonb_build_object('key','roles','title','Roles y responsabilidades'),
    jsonb_build_object('key','controls','title','Controles y operación'),
    jsonb_build_object('key','evidence','title','Registros y evidencia'),
    jsonb_build_object('key','review','title','Revisión y actualización')
  ),
  array['organization_name','effective_date','owner_role'], 'draft', encode(digest(p.code||':v1','sha256'),'hex')
from public.policy_catalog p where p.code like 'POL-PRIV-%'
on conflict (policy_catalog_id,version) do nothing;
