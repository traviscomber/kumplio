-- KUMPLIO — fix guided-case bootstrap variable ambiguity
-- Replaces PL/pgSQL locals that collided with table column names.

create or replace function private.start_guided_case_record(
  p_actor_id uuid,
  p_organization_id uuid,
  p_idempotency_key text,
  p_title text,
  p_description text,
  p_priority text,
  p_project_id uuid,
  p_workflow_type text,
  p_input_payload jsonb,
  p_stages jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_actor uuid := (select auth.uid());
  v_case_id uuid;
  v_workflow_id uuid;
  v_case_created boolean := false;
  v_workflow_created boolean := false;
begin
  if p_actor_id is null then
    raise exception using errcode = '22023', message = 'Actor required';
  end if;

  if session_actor is not null and session_actor <> p_actor_id then
    raise exception using errcode = '42501', message = 'Actor mismatch';
  end if;

  if not exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = p_organization_id
      and membership.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  if p_idempotency_key is null
     or length(trim(p_idempotency_key)) < 8
     or length(trim(p_idempotency_key)) > 128 then
    raise exception using errcode = '22023', message = 'Invalid idempotency key';
  end if;

  if p_title is null or length(trim(p_title)) < 3 or length(trim(p_title)) > 160 then
    raise exception using errcode = '22023', message = 'Invalid case title';
  end if;

  if coalesce(length(p_description), 0) > 3000 then
    raise exception using errcode = '22023', message = 'Invalid case description';
  end if;

  if p_priority not in ('low', 'medium', 'high', 'critical') then
    raise exception using errcode = '22023', message = 'Invalid case priority';
  end if;

  if p_project_id is not null and not exists (
    select 1
    from public.projects project
    where project.id = p_project_id
      and project.organization_id = p_organization_id
  ) then
    raise exception using errcode = '23503', message = 'Project not found';
  end if;

  if p_workflow_type not in ('compliance_assessment', 'contract_review', 'control_assessment') then
    raise exception using errcode = '22023', message = 'Unsupported workflow type';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_organization_id::text || ':' || trim(p_idempotency_key), 0)
  );

  select compliance_case.id
    into v_case_id
  from public.compliance_cases compliance_case
  where compliance_case.organization_id = p_organization_id
    and compliance_case.metadata ->> 'guided_start_key' = trim(p_idempotency_key)
  order by compliance_case.created_at asc
  limit 1;

  if v_case_id is null then
    insert into public.compliance_cases (
      organization_id,
      project_id,
      title,
      description,
      status,
      priority,
      created_by,
      owner_id,
      metadata
    ) values (
      p_organization_id,
      p_project_id,
      trim(p_title),
      nullif(trim(coalesce(p_description, '')), ''),
      'active',
      p_priority,
      p_actor_id,
      p_actor_id,
      jsonb_build_object(
        'source', 'guided_resolution',
        'guided_start_key', trim(p_idempotency_key),
        'guided_start_version', 1
      )
    )
    returning id into v_case_id;
    v_case_created := true;
  end if;

  select workflow.id
    into v_workflow_id
  from public.agent_workflows workflow
  where workflow.organization_id = p_organization_id
    and workflow.case_id = v_case_id
    and workflow.workflow_type = p_workflow_type
  order by workflow.created_at asc
  limit 1;

  if v_workflow_id is null then
    v_workflow_id := public.create_case_workflow_record(
      p_actor_id,
      p_organization_id,
      v_case_id,
      p_workflow_type,
      coalesce(p_input_payload, '{}'::jsonb) || jsonb_build_object(
        'guidedStartKey', trim(p_idempotency_key),
        'guidedStartVersion', 1
      ),
      p_stages
    );
    v_workflow_created := true;
  end if;

  return jsonb_build_object(
    'caseId', v_case_id,
    'workflowId', v_workflow_id,
    'caseCreated', v_case_created,
    'workflowCreated', v_workflow_created,
    'resumed', not (v_case_created and v_workflow_created)
  );
end;
$$;

revoke all on function private.start_guided_case_record(uuid, uuid, text, text, text, text, uuid, text, jsonb, jsonb) from public, anon;
grant execute on function private.start_guided_case_record(uuid, uuid, text, text, text, text, uuid, text, jsonb, jsonb) to authenticated, service_role;
