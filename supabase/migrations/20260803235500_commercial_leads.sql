create table if not exists public.commercial_leads (
  id uuid primary key default gen_random_uuid(),
  request_key uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254),
  empresa text not null check (char_length(empresa) between 2 and 160),
  industria text not null check (char_length(industria) between 2 and 80),
  empleados text not null check (char_length(empleados) between 1 and 40),
  telefono text not null default '' check (char_length(telefono) <= 40),
  mensaje text not null default '' check (char_length(mensaje) <= 3000),
  source text not null default 'contact-page' check (char_length(source) between 1 and 80),
  status text not null default 'received' check (status in ('received', 'qualified', 'contacted', 'closed')),
  sync_status text not null default 'pending' check (sync_status in ('pending', 'synced', 'failed', 'not_configured')),
  sync_attempts integer not null default 0 check (sync_attempts >= 0),
  synced_at timestamptz,
  last_sync_error text check (last_sync_error is null or char_length(last_sync_error) <= 500),
  ip_hash text check (ip_hash is null or char_length(ip_hash) = 64),
  user_agent text check (user_agent is null or char_length(user_agent) <= 500)
);

alter table public.commercial_leads enable row level security;

revoke all on table public.commercial_leads from public, anon, authenticated;
grant select, insert, update on table public.commercial_leads to service_role;

create index if not exists commercial_leads_created_at_idx
  on public.commercial_leads (created_at desc);

create index if not exists commercial_leads_email_created_at_idx
  on public.commercial_leads (lower(email), created_at desc);

create index if not exists commercial_leads_ip_hash_created_at_idx
  on public.commercial_leads (ip_hash, created_at desc)
  where ip_hash is not null;

create index if not exists commercial_leads_sync_status_created_at_idx
  on public.commercial_leads (sync_status, created_at)
  where sync_status in ('pending', 'failed');

comment on table public.commercial_leads is
  'Solicitudes comerciales recibidas por el backend de Kumplio. Acceso exclusivo para service_role; no expuesta a anon ni authenticated.';
