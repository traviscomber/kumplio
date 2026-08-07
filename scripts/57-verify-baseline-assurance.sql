begin;

do $verify$
declare
  v_actor uuid := '05a0536f-2f8b-438f-b945-e685f40af447';
  v_organization uuid := 'ab928c42-b8f0-44f8-bcf0-d8267398f9b1';
  v_case uuid := '91ae9174-be4c-4ddd-8980-4a671571afdc';
  v_mission uuid := '9664d365-4fbe-4b6e-aaee-54e7e1360add';
  v_request uuid := '92355634-91ce-4ae8-92ba-a3ae7ab5655a';
  v_first jsonb;
  v_second jsonb;
  v_control uuid;
  v_evidence uuid;
  v_obligation uuid;
  v_project uuid;
begin
  select public.finalize_case_baseline_assurance(
    v_actor,
    v_organization,
    v_case,
    v_mission,
    v_request,
    'Aceptada solo como línea base inicial; no acredita inventario completo ni cumplimiento legal.',
    'Misión cerrada para la línea base inicial; continúan el levantamiento y la validación jurídica.'
  ) into v_first;

  select public.finalize_case_baseline_assurance(
    v_actor,
    v_organization,
    v_case,
    v_mission,
    v_request,
    'Aceptada solo como línea base inicial; no acredita inventario completo ni cumplimiento legal.',
    'Misión cerrada para la línea base inicial; continúan el levantamiento y la validación jurídica.'
  ) into v_second;

  v_control := (v_first ->> 'controlId')::uuid;
  v_evidence := (v_first ->> 'evidenceId')::uuid;
  v_obligation := (v_first ->> 'obligationId')::uuid;
  v_project := (v_first ->> 'projectId')::uuid;

  if coalesce((v_first ->> 'resumed')::boolean, true) then
    raise exception 'first baseline call should create the lifecycle';
  end if;
  if not coalesce((v_second ->> 'resumed')::boolean, false) then
    raise exception 'second baseline call should resume the lifecycle';
  end if;
  if v_first ->> 'controlId' <> v_second ->> 'controlId'
    or v_first ->> 'evidenceId' <> v_second ->> 'evidenceId'
    or v_first ->> 'missionResultId' <> v_second ->> 'missionResultId' then
    raise exception 'idempotent calls returned different identifiers';
  end if;

  if (select status from public.missions where id = v_mission) <> 'completed' then
    raise exception 'mission was not completed';
  end if;
  if (select status from public.evidence_requests where id = v_request) <> 'accepted' then
    raise exception 'evidence request was not accepted';
  end if;
  if (select design_effectiveness from public.controls where id = v_control) <> 'effective' then
    raise exception 'control design should be effective';
  end if;
  if (select operating_effectiveness from public.controls where id = v_control) <> 'partial' then
    raise exception 'control operation should remain partial';
  end if;
  if (select validation_status from public.evidence where id = v_evidence) <> 'accepted'
    or (select integrity_status from public.evidence where id = v_evidence) <> 'verified'
    or length((select integrity_hash from public.evidence where id = v_evidence)) <> 64 then
    raise exception 'evidence validation or integrity is incomplete';
  end if;
  if (select count(*) from public.control_evaluations where control_id = v_control and case_id = v_case) <> 2 then
    raise exception 'expected separate design and operating evaluations';
  end if;
  if (select count(*) from public.mission_capability_runs where mission_id = v_mission and status in ('completed', 'skipped')) <> 6 then
    raise exception 'all six capabilities must be reconciled';
  end if;
  if (select count(*) from public.mission_results where mission_id = v_mission and result_type = 'baseline_assurance') <> 1 then
    raise exception 'expected one baseline assurance result';
  end if;
  if (select count(*) from public.compliance_case_events where case_id = v_case and event_type = 'baseline_assurance_closed') <> 1 then
    raise exception 'expected one baseline assurance event';
  end if;
  if (select count(*) from public.obligations where id = v_obligation and project_id = v_project and obligation_text like 'Requerimiento interno de preparación (no obligación legal validada):%') <> 1 then
    raise exception 'internal requirement must be explicitly distinguished from legal obligations';
  end if;
end;
$verify$;

rollback;
