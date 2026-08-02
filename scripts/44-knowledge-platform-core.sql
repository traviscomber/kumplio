-- KUMPLIO Plataforma de Conocimiento — núcleo físico
-- Grafo Nacional, Memoria Organizacional, mapeos, procedencia y eventos.
begin;

create table if not exists public.public_knowledge_nodes (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  node_type text not null,
  lifecycle_status text not null default 'draft'
    check (lifecycle_status in ('draft','pending_review','published','approved','rejected','superseded','archived')),
  current_version_id uuid,
  source_entity_type text,
  source_entity_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (canonical_key ~ '^cl\.[a-z0-9][a-z0-9._-]*$')
);

create table if not exists public.public_knowledge_node_versions (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.public_knowledge_nodes(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  display_name text not null,
  description text,
  attributes jsonb not null default '{}'::jsonb,
  effective_from date,
  effective_to date,
  review_status text not null default 'draft'
    check (review_status in ('draft','pending_review','published','approved','rejected','superseded','archived')),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (node_id, version_number),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

alter table public.public_knowledge_nodes
  drop constraint if exists public_knowledge_nodes_current_version_id_fkey;
alter table public.public_knowledge_nodes
  add constraint public_knowledge_nodes_current_version_id_fkey
  foreign key (current_version_id) references public.public_knowledge_node_versions(id) on delete set null;

create table if not exists public.public_knowledge_edges (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  source_node_id uuid not null references public.public_knowledge_nodes(id) on delete restrict,
  target_node_id uuid not null references public.public_knowledge_nodes(id) on delete restrict,
  relation_type text not null,
  lifecycle_status text not null default 'draft'
    check (lifecycle_status in ('draft','pending_review','published','approved','rejected','superseded','archived')),
  current_version_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_node_id <> target_node_id),
  check (canonical_key ~ '^cl\.rel\.[a-z0-9][a-z0-9._-]*$')
);

create table if not exists public.public_knowledge_edge_versions (
  id uuid primary key default gen_random_uuid(),
  edge_id uuid not null references public.public_knowledge_edges(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  statement text,
  attributes jsonb not null default '{}'::jsonb,
  effective_from date,
  effective_to date,
  review_status text not null default 'draft'
    check (review_status in ('draft','pending_review','published','approved','rejected','superseded','archived')),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (edge_id, version_number),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

alter table public.public_knowledge_edges
  drop constraint if exists public_knowledge_edges_current_version_id_fkey;
alter table public.public_knowledge_edges
  add constraint public_knowledge_edges_current_version_id_fkey
  foreign key (current_version_id) references public.public_knowledge_edge_versions(id) on delete set null;

create table if not exists public.organization_memory_nodes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  canonical_key text not null,
  node_type text not null,
  lifecycle_status text not null default 'active'
    check (lifecycle_status in ('draft','active','pending_review','approved','rejected','superseded','archived')),
  current_version_id uuid,
  source_entity_type text,
  source_entity_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, canonical_key),
  check (canonical_key ~ '^org\.[a-z0-9][a-z0-9._-]*$')
);

create table if not exists public.organization_memory_node_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  node_id uuid not null references public.organization_memory_nodes(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  display_name text not null,
  description text,
  attributes jsonb not null default '{}'::jsonb,
  review_status text not null default 'draft'
    check (review_status in ('draft','pending_review','approved','rejected','superseded','archived')),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (node_id, version_number)
);

alter table public.organization_memory_nodes
  drop constraint if exists organization_memory_nodes_current_version_id_fkey;
alter table public.organization_memory_nodes
  add constraint organization_memory_nodes_current_version_id_fkey
  foreign key (current_version_id) references public.organization_memory_node_versions(id) on delete set null;

create table if not exists public.organization_memory_edges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  canonical_key text not null,
  source_node_id uuid not null references public.organization_memory_nodes(id) on delete restrict,
  target_node_id uuid not null references public.organization_memory_nodes(id) on delete restrict,
  relation_type text not null,
  lifecycle_status text not null default 'active'
    check (lifecycle_status in ('draft','active','pending_review','approved','rejected','superseded','archived')),
  current_version_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, canonical_key),
  check (source_node_id <> target_node_id),
  check (canonical_key ~ '^org\.rel\.[a-z0-9][a-z0-9._-]*$')
);

create table if not exists public.organization_memory_edge_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  edge_id uuid not null references public.organization_memory_edges(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  statement text,
  attributes jsonb not null default '{}'::jsonb,
  review_status text not null default 'draft'
    check (review_status in ('draft','pending_review','approved','rejected','superseded','archived')),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (edge_id, version_number)
);

alter table public.organization_memory_edges
  drop constraint if exists organization_memory_edges_current_version_id_fkey;
alter table public.organization_memory_edges
  add constraint organization_memory_edges_current_version_id_fkey
  foreign key (current_version_id) references public.organization_memory_edge_versions(id) on delete set null;

create table if not exists public.knowledge_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  public_node_id uuid not null references public.public_knowledge_nodes(id) on delete restrict,
  organization_node_id uuid not null references public.organization_memory_nodes(id) on delete restrict,
  mapping_type text not null,
  scope text,
  assumptions text,
  applicability_status text not null default 'proposed'
    check (applicability_status in ('proposed','pending_review','applicable','partially_applicable','not_applicable','rejected','superseded')),
  confidence_components jsonb not null default '{}'::jsonb,
  proposed_by_type text not null default 'user'
    check (proposed_by_type in ('user','agent','rule','import')),
  proposed_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, public_node_id, organization_node_id, mapping_type)
);

create table if not exists public.knowledge_provenance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  object_type text not null,
  object_id uuid not null,
  source_type text not null,
  source_id uuid,
  source_locator text,
  source_hash text,
  process_type text,
  process_version text,
  agent_id text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (source_hash is null or source_hash ~ '^[a-f0-9]{64}$')
);

create table if not exists public.knowledge_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  object_type text not null,
  object_id uuid not null,
  event_type text not null,
  actor_type text not null default 'system' check (actor_type in ('user','agent','rule','system','import')),
  actor_id uuid references auth.users(id) on delete set null,
  from_status text,
  to_status text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists public_knowledge_nodes_type_status_idx on public.public_knowledge_nodes(node_type,lifecycle_status);
create index if not exists public_knowledge_nodes_source_idx on public.public_knowledge_nodes(source_entity_type,source_entity_id);
create index if not exists public_knowledge_node_versions_node_created_idx on public.public_knowledge_node_versions(node_id,created_at desc);
create index if not exists public_knowledge_edges_source_idx on public.public_knowledge_edges(source_node_id,relation_type);
create index if not exists public_knowledge_edges_target_idx on public.public_knowledge_edges(target_node_id,relation_type);
create index if not exists public_knowledge_edge_versions_edge_created_idx on public.public_knowledge_edge_versions(edge_id,created_at desc);
create index if not exists organization_memory_nodes_org_type_idx on public.organization_memory_nodes(organization_id,node_type,lifecycle_status);
create index if not exists organization_memory_nodes_source_idx on public.organization_memory_nodes(organization_id,source_entity_type,source_entity_id);
create index if not exists organization_memory_node_versions_org_node_idx on public.organization_memory_node_versions(organization_id,node_id,created_at desc);
create index if not exists organization_memory_edges_source_idx on public.organization_memory_edges(organization_id,source_node_id,relation_type);
create index if not exists organization_memory_edges_target_idx on public.organization_memory_edges(organization_id,target_node_id,relation_type);
create index if not exists organization_memory_edge_versions_org_edge_idx on public.organization_memory_edge_versions(organization_id,edge_id,created_at desc);
create index if not exists knowledge_mappings_public_idx on public.knowledge_mappings(public_node_id,mapping_type);
create index if not exists knowledge_mappings_org_private_idx on public.knowledge_mappings(organization_id,organization_node_id,mapping_type);
create index if not exists knowledge_mappings_status_idx on public.knowledge_mappings(organization_id,applicability_status,updated_at desc);
create index if not exists knowledge_provenance_object_idx on public.knowledge_provenance(object_type,object_id,created_at desc);
create index if not exists knowledge_provenance_org_idx on public.knowledge_provenance(organization_id,created_at desc);
create index if not exists knowledge_events_object_idx on public.knowledge_events(object_type,object_id,created_at desc);
create index if not exists knowledge_events_org_idx on public.knowledge_events(organization_id,created_at desc);

alter table public.public_knowledge_nodes enable row level security;
alter table public.public_knowledge_node_versions enable row level security;
alter table public.public_knowledge_edges enable row level security;
alter table public.public_knowledge_edge_versions enable row level security;
alter table public.organization_memory_nodes enable row level security;
alter table public.organization_memory_node_versions enable row level security;
alter table public.organization_memory_edges enable row level security;
alter table public.organization_memory_edge_versions enable row level security;
alter table public.knowledge_mappings enable row level security;
alter table public.knowledge_provenance enable row level security;
alter table public.knowledge_events enable row level security;

revoke all on table
  public.public_knowledge_nodes,
  public.public_knowledge_node_versions,
  public.public_knowledge_edges,
  public.public_knowledge_edge_versions,
  public.organization_memory_nodes,
  public.organization_memory_node_versions,
  public.organization_memory_edges,
  public.organization_memory_edge_versions,
  public.knowledge_mappings,
  public.knowledge_provenance,
  public.knowledge_events
from anon, authenticated;

grant select on table
  public.public_knowledge_nodes,
  public.public_knowledge_node_versions,
  public.public_knowledge_edges,
  public.public_knowledge_edge_versions,
  public.organization_memory_nodes,
  public.organization_memory_node_versions,
  public.organization_memory_edges,
  public.organization_memory_edge_versions,
  public.knowledge_mappings,
  public.knowledge_provenance,
  public.knowledge_events
to authenticated;

grant all on table
  public.public_knowledge_nodes,
  public.public_knowledge_node_versions,
  public.public_knowledge_edges,
  public.public_knowledge_edge_versions,
  public.organization_memory_nodes,
  public.organization_memory_node_versions,
  public.organization_memory_edges,
  public.organization_memory_edge_versions,
  public.knowledge_mappings,
  public.knowledge_provenance,
  public.knowledge_events
to service_role;

create policy public_knowledge_nodes_read_published on public.public_knowledge_nodes
  for select to authenticated
  using (lifecycle_status in ('published','approved','superseded','archived'));
create policy public_knowledge_node_versions_read_published on public.public_knowledge_node_versions
  for select to authenticated
  using (review_status in ('published','approved','superseded','archived'));
create policy public_knowledge_edges_read_published on public.public_knowledge_edges
  for select to authenticated
  using (lifecycle_status in ('published','approved','superseded','archived'));
create policy public_knowledge_edge_versions_read_published on public.public_knowledge_edge_versions
  for select to authenticated
  using (review_status in ('published','approved','superseded','archived'));

create policy organization_memory_nodes_read_member on public.organization_memory_nodes
  for select to authenticated using (public.is_organization_member(organization_id));
create policy organization_memory_node_versions_read_member on public.organization_memory_node_versions
  for select to authenticated using (public.is_organization_member(organization_id));
create policy organization_memory_edges_read_member on public.organization_memory_edges
  for select to authenticated using (public.is_organization_member(organization_id));
create policy organization_memory_edge_versions_read_member on public.organization_memory_edge_versions
  for select to authenticated using (public.is_organization_member(organization_id));
create policy knowledge_mappings_read_member on public.knowledge_mappings
  for select to authenticated using (public.is_organization_member(organization_id));
create policy knowledge_provenance_read_scope on public.knowledge_provenance
  for select to authenticated
  using (organization_id is null or public.is_organization_member(organization_id));
create policy knowledge_events_read_scope on public.knowledge_events
  for select to authenticated
  using (organization_id is null or public.is_organization_member(organization_id));

commit;
