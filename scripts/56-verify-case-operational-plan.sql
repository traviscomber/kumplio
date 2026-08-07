begin;

do $verify$
declare
  v_case public.compliance_cases;
  v_project_id uuid;
  v_playbook_id uuid;
  v_actor_id uuid;
  v_result jsonb;
  v_repeat jsonb;
  v_mission_id uuid;
  v_request_id uuid;
  v_title text := 'Verificación reversible de evidencia inicial';
begin
  select compliance_case.*
  into v_case
  from public.compliance_cases compliance_case
  where compliance_case.status not in ('closed', 'cancelled', 'archived')
    and not exists (select 1 from public.missions mission where mission.case_id = compliance_case.id)
  order by compliance_case.created_at desc
  limit 1;

  if v_case.id is null then
    raise exception 'No operational case without a mission is available for verification';
  end if;

  select project.id
  into v_project_id
  from public.projects project
  where project.organization_id = v_case.organization_id
    and project.status = 'active'
  order by project.created_at
  limit 1;

  select playbook.id
  into v_playbook_id
  from public.mission_playbooks playbook
  where playbook.status = 'published'
  order by playbook.created_at
  limit 1;

  select member.user_id
  into v_actor_id
  from public.organization_members member
  where member.organization_id = v_case.organization_id
    and member.role in ('owner', 'admin', 'compliance')
  order by member.joined_at
  limit 1;

  if v_project_id is null or v_playbook_id is null or v_actor_id is null then
    raise exception 'Verification prerequisites are incomplete';
  end if;

  v_result := public.create_case_operational_plan_record(
    v_actor_id,
    v_case.organization_id,
    v_case.id,
    v_project_id,
    v_playbook_id,
    'Verificación reversible del plan operativo',
    'Comprobar misión, responsable, plazo, evidencia, auditoría e idempotencia.',
    'high',
    v_actor_id,
    now() + interval '14 days',
    v_title,
    'Evidencia creada únicamente dentro de una transacción reversible.',
    now() + interval '7 days'
  );

  v_mission_id := (v_result ->> 'missionId')::uuid;
  v_request_id := (v_result ->> 'evidenceRequestId')::uuid;

  if v_mission_id is null or not exists (
    select 1 from public.missions mission
    where mission.id = v_mission_id
      and mission.case_id = v_case.id
      and mission.owner_id = v_actor_id
      and mission.due_at is not null
  ) then
    raise exception 'Mission verification failed';
  end if;

  if v_request_id is null or not exists (
    select 1 from public.evidence_requests request
    where request.id = v_request_id
      and request.case_id = v_case.id
      and request.requested_from = v_actor_id
      and request.due_at is not null
      and request.status = 'open'
  ) then
    raise exception 'Evidence request verification failed';
  end if;

  if not exists (
    select 1 from public.compliance_case_events event
    where event.case_id = v_case.id
      and event.event_type = 'operational_plan_ready'
      and event.changes ->> 'mission_id' = v_mission_id::text
      and event.changes ->> 'evidence_request_id' = v_request_id::text
  ) then
    raise exception 'Operational audit event verification failed';
  end if;

  v_repeat := public.create_case_operational_plan_record(
    v_actor_id,
    v_case.organization_id,
    v_case.id,
    v_project_id,
    v_playbook_id,
    'Verificación reversible del plan operativo',
    'Comprobar misión, responsable, plazo, evidencia, auditoría e idempotencia.',
    'high',
    v_actor_id,
    now() + interval '14 days',
    v_title,
    'Evidencia creada únicamente dentro de una transacción reversible.',
    now() + interval '7 days'
  );

  if (v_repeat ->> 'missionId')::uuid <> v_mission_id
    or (v_repeat ->> 'evidenceRequestId')::uuid <> v_request_id
    or coalesce((v_repeat ->> 'resumed')::boolean, false) is not true then
    raise exception 'Operational plan idempotency verification failed';
  end if;

  raise notice 'Case operational plan verification passed: mission %, request %', v_mission_id, v_request_id;
end;
$verify$;

rollback;
