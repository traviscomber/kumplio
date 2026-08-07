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
set search_path = ''
as $function$
declare
  control_project_id uuid;
  case_project_id uuid;
  created_evaluation_id uuid;
  v_evidence_id uuid;
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

  select control.project_id into control_project_id
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
    select compliance_case.project_id into case_project_id
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

  for v_evidence_id in
    select distinct selected.id
    from unnest(coalesce(p_evidence_ids, '{}'::uuid[])) as selected(id)
  loop
    if not exists (
      select 1
      from public.control_evidence link
      join public.evidence item on item.id = link.evidence_id
      where link.control_id = p_control_id
        and link.evidence_id = v_evidence_id
        and link.organization_id = p_organization_id
        and link.project_id = control_project_id
        and item.organization_id = p_organization_id
        and item.project_id = control_project_id
    ) then
      raise exception using errcode = '23514', message = 'Evaluation evidence must already be linked to the control';
    end if;
  end loop;

  insert into public.control_evaluations (
    organization_id, project_id, control_id, case_id,
    evaluation_type, result, summary, sample_size,
    period_start, period_end, evaluated_by
  ) values (
    p_organization_id, control_project_id, p_control_id, p_case_id,
    p_evaluation_type, p_result, clean_summary, p_sample_size,
    p_period_start, p_period_end, p_actor_id
  ) returning id into created_evaluation_id;

  insert into public.control_evaluation_evidence (
    evaluation_id, evidence_id, organization_id, project_id, linked_by
  )
  select
    created_evaluation_id, selected.id, p_organization_id,
    control_project_id, p_actor_id
  from (
    select distinct item.id
    from unnest(coalesce(p_evidence_ids, '{}'::uuid[])) as item(id)
  ) selected;

  if p_case_id is not null then
    insert into public.compliance_case_events (
      organization_id, case_id, actor_id, event_type, summary, changes
    ) values (
      p_organization_id, p_case_id, p_actor_id,
      'control_evaluated', 'Control evaluado dentro del expediente',
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
$function$;

revoke all on function public.create_control_evaluation_record(uuid, uuid, uuid, uuid, text, text, text, integer, date, date, uuid[]) from public, anon, authenticated;
grant execute on function public.create_control_evaluation_record(uuid, uuid, uuid, uuid, text, text, text, integer, date, date, uuid[]) to service_role;
