-- KUMPLIO service-only controls and evidence transactions
-- Callable only by service_role from authenticated server routes.

begin;

create or replace function public.create_control_record(
  p_actor_id uuid,
  p_organization_id uuid,
  p_project_id uuid,
  p_name text,
  p_description text default null,
  p_control_objective text default null,
  p_control_nature text default 'preventive',
  p_execution_mode text default 'manual',
  p_frequency text default null,
  p_owner_id uuid default null,
  p_next_evaluation_at timestamptz default null,
  p_obligation_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_control_id uuid;
  project_organization_id uuid;
  obligation_project_id uuid;
  legacy_control_type text;
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  select project.organization_id
    into project_organization_id
  from public.projects project
  where project.id = p_project_id;

  if project_organization_id is null or project_organization_id <> p_organization_id then
    raise exception using errcode = '23514', message = 'Project must belong to the organization';
  end if;

  if char_length(btrim(p_name)) < 3 or char_length(btrim(p_name)) > 180 then
    raise exception using errcode = '22023', message = 'Invalid control name';
  end if;

  if p_owner_id is not null and not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_owner_id
  ) then
    raise exception using errcode = '23514', message = 'Control owner must belong to the organization';
  end if;

  if p_obligation_id is not null then
    select obligation.project_id
      into obligation_project_id
    from public.obligations obligation
    where obligation.id = p_obligation_id;

    if obligation_project_id is null or obligation_project_id <> p_project_id then
      raise exception using errcode = '23514', message = 'Obligation must belong to the project';
    end if;
  end if;

  legacy_control_type := case p_execution_mode
    when 'automated' then 'automatic'
    else p_execution_mode
  end;

  insert into public.controls (
    organization_id,
    project_id,
    obligation_id,
    name,
    description,
    control_objective,
    control_type,
    control_nature,
    execution_mode,
    frequency,
    owner_id,
    lifecycle_status,
    status,
    next_evaluation_at,
    created_by
  ) values (
    p_organization_id,
    p_project_id,
    p_obligation_id,
    btrim(p_name),
    nullif(btrim(p_description), ''),
    nullif(btrim(p_control_objective), ''),
    legacy_control_type,
    p_control_nature,
    p_execution_mode,
    nullif(btrim(p_frequency), ''),
    p_owner_id,
    'active',
    'pending',
    p_next_evaluation_at,
    p_actor_id
  )
  returning id into created_control_id;

  if p_obligation_id is not null then
    insert into public.control_obligations (
      control_id,
      obligation_id,
      organization_id,
      project_id,
      relationship_type,
      created_by
    ) values (
      created_control_id,
      p_obligation_id,
      p_organization_id,
      p_project_id,
      'primary',
      p_actor_id
    )
    on conflict (control_id, obligation_id) do nothing;
  end if;

  return created_control_id;
end;
$$;

create or replace function public.create_evidence_record(
  p_actor_id uuid,
  p_organization_id uuid,
  p_project_id uuid,
  p_name text,
  p_description text default null,
  p_evidence_type text default 'document',
  p_source text default null,
  p_document_id uuid default null,
  p_issued_at timestamptz default null,
  p_period_start date default null,
  p_period_end date default null,
  p_expires_at timestamptz default null,
  p_integrity_hash text default null,
  p_confidentiality text default 'internal',
  p_control_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_evidence_id uuid;
  project_organization_id uuid;
  linked_project_id uuid;
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  select project.organization_id
    into project_organization_id
  from public.projects project
  where project.id = p_project_id;

  if project_organization_id is null or project_organization_id <> p_organization_id then
    raise exception using errcode = '23514', message = 'Project must belong to the organization';
  end if;

  if char_length(btrim(p_name)) < 3 or char_length(btrim(p_name)) > 180 then
    raise exception using errcode = '22023', message = 'Invalid evidence name';
  end if;

  if p_period_start is not null and p_period_end is not null and p_period_end < p_period_start then
    raise exception using errcode = '22023', message = 'Evidence period end cannot precede period start';
  end if;

  if p_document_id is not null then
    select document.project_id
      into linked_project_id
    from public.documents document
    where document.id = p_document_id;

    if linked_project_id is null or linked_project_id <> p_project_id then
      raise exception using errcode = '23514', message = 'Document must belong to the project';
    end if;
  end if;

  if p_control_id is not null then
    select control.project_id
      into linked_project_id
    from public.controls control
    where control.id = p_control_id
      and control.organization_id = p_organization_id;

    if linked_project_id is null or linked_project_id <> p_project_id then
      raise exception using errcode = '23514', message = 'Control must belong to the project';
    end if;
  end if;

  insert into public.evidence (
    organization_id,
    project_id,
    document_id,
    name,
    description,
    evidence_type,
    source,
    issued_at,
    period_start,
    period_end,
    expires_at,
    validation_status,
    integrity_hash,
    integrity_status,
    confidentiality,
    created_by
  ) values (
    p_organization_id,
    p_project_id,
    p_document_id,
    btrim(p_name),
    nullif(btrim(p_description), ''),
    p_evidence_type,
    nullif(btrim(p_source), ''),
    p_issued_at,
    p_period_start,
    p_period_end,
    p_expires_at,
    'pending',
    nullif(btrim(p_integrity_hash), ''),
    case when nullif(btrim(p_integrity_hash), '') is null then 'pending' else 'verified' end,
    p_confidentiality,
    p_actor_id
  )
  returning id into created_evidence_id;

  if p_control_id is not null then
    insert into public.control_evidence (
      control_id,
      evidence_id,
      organization_id,
      project_id,
      relevance,
      sufficiency_status,
      linked_by
    ) values (
      p_control_id,
      created_evidence_id,
      p_organization_id,
      p_project_id,
      'primary',
      'not_evaluated',
      p_actor_id
    )
    on conflict (control_id, evidence_id) do nothing;
  end if;

  return created_evidence_id;
end;
$$;

revoke all on function public.create_control_record(
  uuid, uuid, uuid, text, text, text, text, text, text, uuid, timestamptz, uuid
) from public, anon, authenticated;
revoke all on function public.create_evidence_record(
  uuid, uuid, uuid, text, text, text, text, uuid, timestamptz, date, date, timestamptz, text, text, uuid
) from public, anon, authenticated;

grant execute on function public.create_control_record(
  uuid, uuid, uuid, text, text, text, text, text, text, uuid, timestamptz, uuid
) to service_role;
grant execute on function public.create_evidence_record(
  uuid, uuid, uuid, text, text, text, text, uuid, timestamptz, date, date, timestamptz, text, text, uuid
) to service_role;

commit;
