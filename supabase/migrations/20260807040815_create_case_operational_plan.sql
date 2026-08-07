create or replace function public.create_case_operational_plan_record(
  p_actor_id uuid,
  p_organization_id uuid,
  p_case_id uuid,
  p_project_id uuid,
  p_playbook_id uuid,
  p_mission_title text,
  p_mission_objective text,
  p_priority text,
  p_owner_id uuid,
  p_mission_due_at timestamptz,
  p_evidence_title text,
  p_evidence_description text,
  p_evidence_due_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_case public.compliance_cases;
  v_project_organization_id uuid;
  v_mission_id uuid;
  v_request_id uuid;
  v_mission_created boolean := false;
  v_request_created boolean := false;
  v_project_assigned boolean := false;
  v_mission_title text := btrim(p_mission_title);
  v_evidence_title text := btrim(p_evidence_title);
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  if p_owner_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_owner_id
  ) then
    raise exception using errcode = '23514', message = 'Mission owner must belong to the organization';
  end if;

  select compliance_case.*
  into v_case
  from public.compliance_cases compliance_case
  where compliance_case.id = p_case_id
    and compliance_case.organization_id = p_organization_id
  for update;

  if v_case.id is null then
    raise exception using errcode = 'P0002', message = 'Case not found';
  end if;

  if v_case.status in ('closed', 'cancelled', 'archived') then
    raise exception using errcode = '23514', message = 'Case is not operationally available';
  end if;

  select project.organization_id
  into v_project_organization_id
  from public.projects project
  where project.id = p_project_id;

  if v_project_organization_id is null or v_project_organization_id <> p_organization_id then
    raise exception using errcode = '23514', message = 'Project must belong to the organization';
  end if;

  if v_case.project_id is not null and v_case.project_id <> p_project_id then
    raise exception using errcode = '23514', message = 'Case already belongs to another project';
  end if;

  if char_length(v_mission_title) < 3 or char_length(v_mission_title) > 160 then
    raise exception using errcode = '22023', message = 'Invalid mission title';
  end if;

  if char_length(v_evidence_title) < 3 or char_length(v_evidence_title) > 180 then
    raise exception using errcode = '22023', message = 'Invalid evidence request title';
  end if;

  if p_priority not in ('low', 'medium', 'high', 'critical') then
    raise exception using errcode = '22023', message = 'Invalid mission priority';
  end if;

  if p_mission_due_at is null or p_mission_due_at <= now() then
    raise exception using errcode = '22023', message = 'Mission due date must be in the future';
  end if;

  if p_evidence_due_at is null or p_evidence_due_at <= now() then
    raise exception using errcode = '22023', message = 'Evidence due date must be in the future';
  end if;

  if p_evidence_due_at > p_mission_due_at then
    raise exception using errcode = '22023', message = 'Evidence must be due no later than the mission';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':case-operational-plan:' || p_case_id::text, 173)
  );

  if v_case.project_id is null then
    update public.compliance_cases
    set project_id = p_project_id,
        updated_at = now()
    where id = p_case_id
      and organization_id = p_organization_id;

    v_project_assigned := true;

    insert into public.compliance_case_events (
      organization_id, case_id, actor_id, event_type, summary, changes
    ) values (
      p_organization_id,
      p_case_id,
      p_actor_id,
      'case_project_assigned',
      'Expediente vinculado a un ámbito de cumplimiento',
      jsonb_build_object('project_id', p_project_id)
    );
  end if;

  select mission.id
  into v_mission_id
  from public.missions mission
  where mission.organization_id = p_organization_id
    and mission.case_id = p_case_id
  order by mission.created_at desc
  limit 1;

  if v_mission_id is null then
    select public.create_mission_from_playbook(
      p_organization_id,
      p_playbook_id,
      p_actor_id,
      v_mission_title,
      nullif(btrim(p_mission_objective), ''),
      p_case_id,
      p_priority,
      p_owner_id,
      p_mission_due_at,
      jsonb_build_object(
        'source', 'case_operational_plan',
        'caseId', p_case_id,
        'projectId', p_project_id,
        'locale', 'es-CL'
      )
    ) into v_mission_id;
    v_mission_created := true;
  end if;

  select request.id
  into v_request_id
  from public.evidence_requests request
  where request.organization_id = p_organization_id
    and request.case_id = p_case_id
    and lower(request.title) = lower(v_evidence_title)
    and request.status not in ('cancelled', 'rejected')
  order by request.created_at desc
  limit 1;

  if v_request_id is null then
    select public.create_evidence_request_record(
      p_actor_id,
      p_organization_id,
      p_project_id,
      p_case_id,
      null,
      v_evidence_title,
      nullif(btrim(p_evidence_description), ''),
      p_owner_id,
      p_evidence_due_at
    ) into v_request_id;
    v_request_created := true;
  end if;

  if v_mission_created or v_request_created or v_project_assigned then
    insert into public.compliance_case_events (
      organization_id, case_id, actor_id, event_type, summary, changes
    ) values (
      p_organization_id,
      p_case_id,
      p_actor_id,
      'operational_plan_ready',
      'Plan operativo creado desde el expediente',
      jsonb_build_object(
        'project_id', p_project_id,
        'mission_id', v_mission_id,
        'evidence_request_id', v_request_id,
        'mission_created', v_mission_created,
        'evidence_request_created', v_request_created,
        'project_assigned', v_project_assigned,
        'owner_id', p_owner_id,
        'mission_due_at', p_mission_due_at,
        'evidence_due_at', p_evidence_due_at
      )
    );
  end if;

  return jsonb_build_object(
    'missionId', v_mission_id,
    'evidenceRequestId', v_request_id,
    'missionCreated', v_mission_created,
    'evidenceRequestCreated', v_request_created,
    'projectAssigned', v_project_assigned,
    'resumed', not (v_mission_created or v_request_created or v_project_assigned)
  );
end;
$function$;

comment on function public.create_case_operational_plan_record(
  uuid, uuid, uuid, uuid, uuid, text, text, text, uuid, timestamptz, text, text, timestamptz
) is 'Atomically links a case to a project and creates or resumes its mission and first evidence request.';

revoke all on function public.create_case_operational_plan_record(
  uuid, uuid, uuid, uuid, uuid, text, text, text, uuid, timestamptz, text, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.create_case_operational_plan_record(
  uuid, uuid, uuid, uuid, uuid, text, text, text, uuid, timestamptz, text, text, timestamptz
) to service_role;
