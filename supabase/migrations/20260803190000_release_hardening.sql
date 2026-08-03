begin;

create schema if not exists private;
revoke all on schema private from public;

alter function public.initialize_workspace(text, text, text, text, text, text, text)
  set schema private;

revoke all on function private.initialize_workspace(text, text, text, text, text, text, text) from public;
grant usage on schema private to authenticated, service_role;
grant execute on function private.initialize_workspace(text, text, text, text, text, text, text) to authenticated, service_role;

create function public.initialize_workspace(
  organization_name text,
  industry_code text,
  organization_size text,
  first_name text default null,
  last_name text default null,
  project_name text default 'Ley 21.719 y protección de datos',
  first_case_title text default 'Preparación para la Ley 21.719'
)
returns table(
  organization_id uuid,
  project_id uuid,
  case_id uuid,
  initialized boolean
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.initialize_workspace(
    organization_name,
    industry_code,
    organization_size,
    first_name,
    last_name,
    project_name,
    first_case_title
  );
$$;

revoke all on function public.initialize_workspace(text, text, text, text, text, text, text) from public;
grant execute on function public.initialize_workspace(text, text, text, text, text, text, text) to authenticated, service_role;

comment on function public.initialize_workspace(text, text, text, text, text, text, text)
is 'API segura de onboarding. Delega en implementación privada y conserva auth.uid() como identidad del llamador.';

-- Esta tabla contiene decisiones internas sobre fuentes regulatorias.
-- Se declara explícitamente inaccesible desde la API de usuario.
drop policy if exists regulatory_source_review_decisions_private_only
  on public.regulatory_source_review_decisions;
create policy regulatory_source_review_decisions_private_only
  on public.regulatory_source_review_decisions
  as restrictive
  for all
  to public
  using (false)
  with check (false);

-- Las dos políticas existentes eran idénticas; conservar una evita evaluar dos veces la misma condición.
drop policy if exists members_read_own_org on public.organization_members;

create index if not exists mission_execution_artifacts_organization_id_idx
  on public.mission_execution_artifacts (organization_id);

create index if not exists regulatory_applicability_assessments_case_id_idx
  on public.regulatory_applicability_assessments (case_id);

commit;
