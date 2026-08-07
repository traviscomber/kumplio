-- KUMPLIO — reversible verification for guided-case idempotency
-- Run in a controlled database session. The transaction always rolls back.

begin;

do $$
declare
  actor_id uuid;
  org_id uuid;
  i integer;
  start_key text;
  first_result jsonb;
  retry_result jsonb;
  stages jsonb := '[
    {"index":0,"agentId":"isidora","label":"Obligaciones","task":"Extrae obligaciones y evidencia aplicables a protección de datos.","dependsOn":[]},
    {"index":1,"agentId":"rodrigo","label":"Riesgos","task":"Prioriza riesgos y urgencia con supuestos explícitos.","dependsOn":[0]},
    {"index":2,"agentId":"veronica","label":"Brechas y controles","task":"Evalúa brechas, controles y evidencia disponible.","dependsOn":[0,1]},
    {"index":3,"agentId":"javier","label":"Plan de acción","task":"Construye un plan ejecutable con criterios de cierre.","dependsOn":[0,1,2]},
    {"index":4,"agentId":"catalina","label":"Revisión de calidad","task":"Revisa fuentes, inferencias, reservas y decisiones humanas.","dependsOn":[0,1,2,3]}
  ]'::jsonb;
begin
  select membership.user_id, membership.organization_id
    into actor_id, org_id
  from public.organization_members membership
  order by membership.joined_at asc nulls last
  limit 1;

  if actor_id is null or org_id is null then
    raise exception 'No membership available for reversible test';
  end if;

  for i in 1..10 loop
    start_key := 'block02-test-' || i::text || '-' || gen_random_uuid()::text;

    first_result := public.start_guided_case_record(
      actor_id, org_id, start_key,
      'Preparar empresa para Ley 21.719 #' || i::text,
      'Prueba reversible de golden path para protección de datos.',
      'medium', null, 'compliance_assessment',
      jsonb_build_object('test', true, 'iteration', i), stages
    );

    retry_result := public.start_guided_case_record(
      actor_id, org_id, start_key,
      'Preparar empresa para Ley 21.719 #' || i::text,
      'Prueba reversible de golden path para protección de datos.',
      'medium', null, 'compliance_assessment',
      jsonb_build_object('test', true, 'iteration', i), stages
    );

    if first_result->>'caseId' is distinct from retry_result->>'caseId' then
      raise exception 'Iteration % duplicated case', i;
    end if;
    if first_result->>'workflowId' is distinct from retry_result->>'workflowId' then
      raise exception 'Iteration % duplicated workflow', i;
    end if;
    if coalesce((retry_result->>'resumed')::boolean, false) is not true then
      raise exception 'Iteration % did not report resume', i;
    end if;
  end loop;

  if (select count(*) from public.compliance_cases c where c.metadata->>'guided_start_key' like 'block02-test-%') <> 10 then
    raise exception 'Expected exactly 10 test cases';
  end if;
  if (
    select count(*)
    from public.agent_workflows workflow
    join public.compliance_cases compliance_case on compliance_case.id = workflow.case_id
    where compliance_case.metadata->>'guided_start_key' like 'block02-test-%'
  ) <> 10 then
    raise exception 'Expected exactly 10 test workflows';
  end if;
  if (
    select count(*)
    from public.agent_workflow_stages stage
    join public.agent_workflows workflow on workflow.id = stage.workflow_id
    join public.compliance_cases compliance_case on compliance_case.id = workflow.case_id
    where compliance_case.metadata->>'guided_start_key' like 'block02-test-%'
  ) <> 50 then
    raise exception 'Expected exactly 50 workflow stages';
  end if;
end $$;

rollback;
