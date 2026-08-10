alter table public.obligations
  add column if not exists compliance_domain text not null default 'unknown';
alter table public.risks
  add column if not exists compliance_domain text not null default 'unknown';
alter table public.controls
  add column if not exists compliance_domain text not null default 'unknown';
alter table public.evidence
  add column if not exists compliance_domain text not null default 'unknown';

alter table public.obligations drop constraint if exists obligations_compliance_domain_check;
alter table public.obligations add constraint obligations_compliance_domain_check
  check (compliance_domain in ('unknown','general','privacy','sst','environment','procurement','contract'));

alter table public.risks drop constraint if exists risks_compliance_domain_check;
alter table public.risks add constraint risks_compliance_domain_check
  check (compliance_domain in ('unknown','general','privacy','sst','environment','procurement','contract'));

alter table public.controls drop constraint if exists controls_compliance_domain_check;
alter table public.controls add constraint controls_compliance_domain_check
  check (compliance_domain in ('unknown','general','privacy','sst','environment','procurement','contract'));

alter table public.evidence drop constraint if exists evidence_compliance_domain_check;
alter table public.evidence add constraint evidence_compliance_domain_check
  check (compliance_domain in ('unknown','general','privacy','sst','environment','procurement','contract'));

create index if not exists obligations_project_domain_idx on public.obligations(project_id, compliance_domain);
create index if not exists risks_project_domain_idx on public.risks(project_id, compliance_domain);
create index if not exists controls_project_domain_idx on public.controls(project_id, compliance_domain);
create index if not exists evidence_project_domain_idx on public.evidence(project_id, compliance_domain);
