-- KUMPLIO Control Assurance
-- Records immutable control evaluations together with the evidence used.

begin;

create table if not exists public.control_evaluation_evidence (
  evaluation_id uuid not null references public.control_evaluations(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  linked_by uuid references auth.users(id) on delete set null,
  linked_at timestamptz not null default now(),
  primary key (evaluation_id, evidence_id)
);

create index if not exists control_evaluation_evidence_evidence_idx
  on public.control_evaluation_evidence (evidence_id);
create index if not exists control_evaluation_evidence_org_project_idx
  on public.control_evaluation_evidence (organization_id, project_id);
create index if not exists control_evaluation_evidence_linked_by_idx
  on public.control_evaluation_evidence (linked_by);

alter table public.control_evaluation_evidence enable row level security;

revoke all on table public.control_evaluation_evidence from anon, authenticated;
grant select on table public.control_evaluation_evidence to authenticated;
grant all on table public.control_evaluation_evidence to service_role;

-- Evaluations are now created only through the audited server transaction.
revoke insert, update, delete on table public.control_evaluations from authenticated;
grant select on table public.control_evaluations to authenticated;

drop policy if exists control_evaluations_insert_member on public.control_evaluations;
drop policy if exists control_evaluation_evidence_select_member on public.control_evaluation_evidence;
create policy control_evaluation_evidence_select_member
  on public.control_evaluation_evidence
  for select
  to authenticated
  using ((select public.is_organization_member(organization_id)));

create or replace function private.validate_control_evaluation_evidence()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  evaluation_organization_id uuid;
  evaluation_project_id uuid;
  evidence_organization_id uuid;
  evidence_project_id uuid;
begin
  select evaluation.organization_id, evaluation.project_id
    into evaluation_organization_id, evaluation_project_id
  from public.control_evaluations evaluation
  where evaluation.id = new.evaluation_id;

  select item.organization_id, item.project_id
    into evidence_organization_id, evidence_project_id
  from public.evidence item
  where item.id = new.evidence_id;

  if evaluation_organization_id is null or evidence_organization_id is null then
    raise exception using errcode = '23503', message = 'Evaluation or evidence not found';
  end if;

  if evaluation_organization_id <> evidence_organization_id
    or evaluation_project_id <> evidence_project_id then
    raise exception using errcode = '23514', message = 'Evaluation evidence must belong to the same project';
  end if;

  new.organization_id := evaluation_organization_id;
  new.project_id := evaluation_project_id;
  return new;
end;
$$;

revoke all on function private.validate_control_evaluation_evidence()
  from public, anon, authenticated;

drop trigger if exists validate_control_evaluation_evidence
  on public.control_evaluation_evidence;
create trigger validate_control_evaluation_evidence
  before insert on public.control_evaluation_evidence
  for each row
  execute function private.validate_control_evaluation_evidence();

create or replace function public.create_control_evaluation_record(
  p_actor_id uuid,
  p_organization_id uuid,
  p_control_id uuid,
  p_case_id uuid,
  p_evaluation_type text,
  p_result text,
  p_summary text,
  p_sample_size integer default null,
  p_period_start date default null,
  p_period_end date default null,
  p_evidence_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  control_project_id uuid;
  case_project_id uuid;
  created_evaluation_id uuid;
  evidence_id uuid;
  clean_summary text := btrim(p_summary);
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  select control.project_id
    into control_project_id
  from public.controls control
  where control.id = p_control_id
    and control.organization_id = p_organization_id;

  if control_project_id is null then
    raise exception using errcode = '23503', message = 'Control not found';
  end if;

  if p_evaluation_type not in ('design', 'operating') then
    raise exception using errcode = '22023', message = 'Invalid evaluation type';
  end if;

  if p_result not in ('effective', 'partial', 'ineffective', 'not_applicable') then
    raise exception using errcode = '22023', message = 'Invalid evaluation result';
  end if;

  if char_length(clean_summary) < 10 or char_length(clean_summary) > 4000 then
    raise exception using errcode = '22023', message = 'Evaluation summary must contain between 10 and 4000 characters';
  end if;

  if p_sample_size is not null and (p_sample_size < 1 or p_sample_size > 1000000) then
    raise exception using errcode = '22023', message = 'Invalid sample size';
  end if;

  if p_period_start is not null and p_period_end is not null and p_period_end < p_period_start then
    raise exception using errcode = '22023', message = 'Evaluation period end cannot precede period start';
  end if;

  if p_case_id is not null then
    select compliance_case.project_id
      into case_project_id
    from public.compliance_cases compliance_case
    where compliance_case.id = p_case_id
      and compliance_case.organization_id = p_organization_id;

    if case_project_id is null or case_project_id <> control_project_id then
      raise exception using errcode = '23514', message = 'Evaluation case must belong to the control project';
    end if;
  end if;

  if cardinality(coalesce(p_evidence_ids, '{}'::uuid[])) > 100 then
    raise exception using errcode = '22023', message = 'Too many evidence items';
  end if;

  for evidence_id in
    select distinct unnest(coalesce(p_evidence_ids, '{}'::uuid[]))
  loop
    if not exists (
      select 1
      from public.control_evidence link
      join public.evidence item on item.id = link.evidence_id
      where link.control_id = p_control_id
        and link.evidence_id = evidence_id
        and link.organization_id = p_organization_id
        and link.project_id = control_project_id
        and item.organization_id = p_organization_id
        and item.project_id = control_project_id
    ) then
      raise exception using errcode = '23514', message = 'Evaluation evidence must already be linked to the control';
    end if;
  end loop;

  insert into public.control_evaluations (
    organization_id,
    project_id,
    control_id,
    case_id,
    evaluation_type,
    result,
    summary,
    sample_size,
    period_start,
    period_end,
    evaluated_by
  ) values (
    p_organization_id,
    control_project_id,
    p_control_id,
    p_case_id,
    p_evaluation_type,
    p_result,
    clean_summary,
    p_sample_size,
    p_period_start,
    p_period_end,
    p_actor_id
  )
  returning id into created_evaluation_id;

  insert into public.control_evaluation_evidence (
    evaluation_id,
    evidence_id,
    organization_id,
    project_id,
    linked_by
  )
  select
    created_evaluation_id,
    selected_evidence_id,
    p_organization_id,
    control_project_id,
    p_actor_id
  from (
    select distinct unnest(coalesce(p_evidence_ids, '{}'::uuid[])) as selected_evidence_id
  ) selected;

  if p_case_id is not null then
    insert into public.compliance_case_events (
      organization_id,
      case_id,
      actor_id,
      event_type,
      summary,
      changes
    ) values (
      p_organization_id,
      p_case_id,
      p_actor_id,
      'control_evaluated',
      'Control evaluado dentro del expediente',
      jsonb_build_object(
        'control_id', p_control_id,
        'evaluation_id', created_evaluation_id,
        'evaluation_type', p_evaluation_type,
        'result', p_result,
        'evidence_count', cardinality(coalesce(p_evidence_ids, '{}'::uuid[]))
      )
    );
  end if;

  return created_evaluation_id;
end;
$$;

revoke all on function public.create_control_evaluation_record(
  uuid, uuid, uuid, uuid, text, text, text, integer, date, date, uuid[]
) from public, anon, authenticated;
grant execute on function public.create_control_evaluation_record(
  uuid, uuid, uuid, uuid, text, text, text, integer, date, date, uuid[]
) to service_role;

commit;
