create or replace function public.close_compliance_case_record(
  p_actor_id uuid,
  p_organization_id uuid,
  p_case_id uuid,
  p_workflow_id uuid
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  current_status text;
  current_updated_at timestamptz;
  final_stage_id uuid;
  final_run_id uuid;
  final_stage_status text;
  final_review_id uuid;
  final_review_decision text;
  closed_at timestamptz := now();
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  select compliance_case.status, compliance_case.updated_at
    into current_status, current_updated_at
  from public.compliance_cases compliance_case
  where compliance_case.id = p_case_id
    and compliance_case.organization_id = p_organization_id
  for update;

  if current_status is null then
    raise exception using errcode = 'P0002', message = 'Compliance case not found';
  end if;

  if current_status in ('approved', 'archived') then
    return jsonb_build_object(
      'case', jsonb_build_object(
        'id', p_case_id,
        'status', current_status,
        'updated_at', current_updated_at
      ),
      'alreadyClosed', true
    );
  end if;

  if not exists (
    select 1
    from public.agent_workflows workflow
    where workflow.id = p_workflow_id
      and workflow.case_id = p_case_id
      and workflow.organization_id = p_organization_id
      and workflow.status = 'completed'
  ) then
    raise exception using errcode = '22023', message = 'Workflow is not completed';
  end if;

  select stage.id, stage.run_id, stage.status
    into final_stage_id, final_run_id, final_stage_status
  from public.agent_workflow_stages stage
  where stage.workflow_id = p_workflow_id
    and stage.organization_id = p_organization_id
  order by stage.stage_index desc
  limit 1;

  if final_stage_id is null or final_run_id is null or final_stage_status <> 'approved' then
    raise exception using errcode = '22023', message = 'Final stage is not approved';
  end if;

  select review.id, review.decision
    into final_review_id, final_review_decision
  from public.agent_reviews review
  where review.organization_id = p_organization_id
    and review.case_id = p_case_id
    and review.run_id = final_run_id
  order by review.created_at desc
  limit 1;

  if final_review_id is null or final_review_decision <> 'approved' then
    raise exception using errcode = '22023', message = 'Final review is not approved';
  end if;

  update public.compliance_cases
  set status = 'approved', updated_at = closed_at
  where id = p_case_id
    and organization_id = p_organization_id;

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
    'case_closed',
    'Caso marcado como resuelto',
    jsonb_build_object(
      'workflow_id', p_workflow_id,
      'final_stage_id', final_stage_id,
      'final_review_id', final_review_id,
      'status', 'approved',
      'closed_at', closed_at
    )
  );

  return jsonb_build_object(
    'case', jsonb_build_object(
      'id', p_case_id,
      'status', 'approved',
      'updated_at', closed_at
    ),
    'alreadyClosed', false
  );
end;
$$;

create or replace function public.archive_compliance_case_record(
  p_actor_id uuid,
  p_organization_id uuid,
  p_case_id uuid
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  current_status text;
  current_updated_at timestamptz;
  archived_at timestamptz := now();
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  select compliance_case.status, compliance_case.updated_at
    into current_status, current_updated_at
  from public.compliance_cases compliance_case
  where compliance_case.id = p_case_id
    and compliance_case.organization_id = p_organization_id
  for update;

  if current_status is null then
    raise exception using errcode = 'P0002', message = 'Compliance case not found';
  end if;

  if current_status = 'archived' then
    return jsonb_build_object(
      'case', jsonb_build_object(
        'id', p_case_id,
        'status', 'archived',
        'updated_at', current_updated_at
      ),
      'alreadyArchived', true
    );
  end if;

  if current_status <> 'approved' then
    raise exception using errcode = '22023', message = 'Only resolved cases can be archived';
  end if;

  update public.compliance_cases
  set status = 'archived', updated_at = archived_at
  where id = p_case_id
    and organization_id = p_organization_id;

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
    'case_archived',
    'Caso archivado después de su resolución',
    jsonb_build_object(
      'previous_status', 'approved',
      'status', 'archived',
      'archived_at', archived_at
    )
  );

  return jsonb_build_object(
    'case', jsonb_build_object(
      'id', p_case_id,
      'status', 'archived',
      'updated_at', archived_at
    ),
    'alreadyArchived', false
  );
end;
$$;

revoke all on function public.close_compliance_case_record(uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.archive_compliance_case_record(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.close_compliance_case_record(uuid, uuid, uuid, uuid) to service_role;
grant execute on function public.archive_compliance_case_record(uuid, uuid, uuid) to service_role;
