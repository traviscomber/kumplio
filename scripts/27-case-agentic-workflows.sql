-- KUMPLIO Case Agentic Workflows

begin;

alter table public.agent_workflows drop constraint if exists agent_workflows_workflow_type_check;
alter table public.agent_workflows add constraint agent_workflows_workflow_type_check
  check (workflow_type in ('compliance_assessment', 'contract_review', 'control_assessment'));

create unique index if not exists agent_workflows_case_type_active_uidx
  on public.agent_workflows (case_id, workflow_type)
  where status in ('draft', 'running', 'paused', 'pending_review');

-- Workflow creation is a server transaction; client roles retain read/update paths used by execution and review.
revoke insert on table public.agent_workflows from authenticated;
revoke insert on table public.agent_workflow_stages from authenticated;

create or replace function public.create_case_workflow_record(
  p_actor_id uuid,
  p_organization_id uuid,
  p_case_id uuid,
  p_workflow_type text,
  p_input_payload jsonb,
  p_stages jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  workflow_id uuid;
  case_title text;
  case_project_id uuid;
  stage_record jsonb;
  stage_count integer;
  expected_index integer := 0;
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  select compliance_case.title, compliance_case.project_id
    into case_title, case_project_id
  from public.compliance_cases compliance_case
  where compliance_case.id = p_case_id
    and compliance_case.organization_id = p_organization_id;

  if case_title is null then
    raise exception using errcode = '23503', message = 'Compliance case not found';
  end if;

  if p_workflow_type not in ('compliance_assessment', 'contract_review', 'control_assessment') then
    raise exception using errcode = '22023', message = 'Unsupported workflow type';
  end if;

  if jsonb_typeof(p_stages) <> 'array' then
    raise exception using errcode = '22023', message = 'Workflow stages must be an array';
  end if;

  stage_count := jsonb_array_length(p_stages);
  if stage_count < 1 or stage_count > 20 then
    raise exception using errcode = '22023', message = 'Invalid workflow stage count';
  end if;

  for stage_record in select value from jsonb_array_elements(p_stages)
  loop
    if (stage_record->>'index')::integer <> expected_index then
      raise exception using errcode = '22023', message = 'Workflow stage indexes must be sequential';
    end if;
    if coalesce(stage_record->>'task', '') = '' or coalesce(stage_record->>'agentId', '') = '' then
      raise exception using errcode = '22023', message = 'Workflow stage definition is incomplete';
    end if;
    expected_index := expected_index + 1;
  end loop;

  insert into public.agent_workflows (
    organization_id,
    case_id,
    created_by,
    workflow_type,
    status,
    current_stage,
    total_stages,
    input_payload
  ) values (
    p_organization_id,
    p_case_id,
    p_actor_id,
    p_workflow_type,
    'draft',
    0,
    stage_count,
    coalesce(p_input_payload, '{}'::jsonb)
  )
  returning id into workflow_id;

  insert into public.agent_workflow_stages (
    workflow_id,
    organization_id,
    stage_index,
    agent_id,
    status,
    task_template,
    context_snapshot
  )
  select
    workflow_id,
    p_organization_id,
    (stage.value->>'index')::integer,
    stage.value->>'agentId',
    'queued',
    stage.value->>'task',
    jsonb_build_object(
      'workflowType', p_workflow_type,
      'label', stage.value->>'label',
      'dependsOn', coalesce(stage.value->'dependsOn', '[]'::jsonb)
    )
  from jsonb_array_elements(p_stages) stage(value);

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
    'workflow_created',
    'Workflow agentic creado',
    jsonb_build_object(
      'workflow_id', workflow_id,
      'workflow_type', p_workflow_type,
      'total_stages', stage_count,
      'project_id', case_project_id
    )
  );

  return workflow_id;
end;
$$;

revoke all on function public.create_case_workflow_record(uuid,uuid,uuid,text,jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function public.create_case_workflow_record(uuid,uuid,uuid,text,jsonb,jsonb)
  to service_role;

commit;
