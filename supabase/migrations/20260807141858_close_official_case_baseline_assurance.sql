-- Data migration for the supervised Kumplio pilot case.
-- It intentionally closes only an initial readiness baseline. It does not
-- assert a complete inventory, legal applicability or global compliance.
--
-- Clean databases and non-production environments may not contain this
-- supervised pilot identity/case. In those environments the migration is a
-- deliberate no-op so a full migration replay remains reproducible.

do $close$
declare
  v_actor uuid := '05a0536f-2f8b-438f-b945-e685f40af447';
  v_organization uuid := 'ab928c42-b8f0-44f8-bcf0-d8267398f9b1';
  v_case uuid := '91ae9174-be4c-4ddd-8980-4a671571afdc';
  v_mission uuid := '9664d365-4fbe-4b6e-aaee-54e7e1360add';
  v_request uuid := '92355634-91ce-4ae8-92ba-a3ae7ab5655a';
  v_target_exists boolean := false;
  v_preexisting boolean := false;
  v_first jsonb;
  v_second jsonb;
  v_control uuid;
  v_evidence uuid;
  v_obligation uuid;
  v_result uuid;
begin
  select exists (
    select 1
    from public.organization_members member
    join public.compliance_cases compliance_case
      on compliance_case.organization_id = member.organization_id
    join public.missions mission
      on mission.organization_id = compliance_case.organization_id
     and mission.case_id = compliance_case.id
    join public.evidence_requests request
      on request.organization_id = compliance_case.organization_id
     and request.case_id = compliance_case.id
    where member.organization_id = v_organization
      and member.user_id = v_actor
      and compliance_case.id = v_case
      and mission.id = v_mission
      and request.id = v_request
  ) into v_target_exists;

  if not v_target_exists then
    raise notice 'Skipping supervised baseline closure: target pilot data is not present in this environment.';
  else
    select exists (
      select 1
      from public.missions mission
      join public.evidence_requests request
        on request.organization_id = mission.organization_id
       and request.case_id = mission.case_id
      join public.mission_results result
        on result.organization_id = mission.organization_id
       and result.mission_id = mission.id
       and result.result_type = 'baseline_assurance'
      where mission.id = v_mission
        and mission.status = 'completed'
        and request.id = v_request
        and request.status = 'accepted'
    ) into v_preexisting;

    select public.finalize_case_baseline_assurance(
      v_actor,
      v_organization,
      v_case,
      v_mission,
      v_request,
      'Aceptada únicamente como línea base inicial de readiness: demuestra trazabilidad, responsable, hash y desconocidos explícitos; no acredita inventario completo ni cumplimiento legal.',
      'Se cerró la misión de instalación de la línea base inicial. Permanecen abiertos el levantamiento corporativo, la validación jurídica y la prueba de completitud.'
    ) into v_first;

    select public.finalize_case_baseline_assurance(
      v_actor,
      v_organization,
      v_case,
      v_mission,
      v_request,
      'Aceptada únicamente como línea base inicial de readiness: demuestra trazabilidad, responsable, hash y desconocidos explícitos; no acredita inventario completo ni cumplimiento legal.',
      'Se cerró la misión de instalación de la línea base inicial. Permanecen abiertos el levantamiento corporativo, la validación jurídica y la prueba de completitud.'
    ) into v_second;

    v_control := (v_first ->> 'controlId')::uuid;
    v_evidence := (v_first ->> 'evidenceId')::uuid;
    v_obligation := (v_first ->> 'obligationId')::uuid;
    v_result := (v_first ->> 'missionResultId')::uuid;

    if not v_preexisting and coalesce((v_first ->> 'resumed')::boolean, true) then
      raise exception 'official baseline first call did not create the lifecycle';
    end if;
    if not coalesce((v_second ->> 'resumed')::boolean, false) then
      raise exception 'official baseline second call was not idempotent';
    end if;
    if v_first ->> 'controlId' <> v_second ->> 'controlId'
      or v_first ->> 'evidenceId' <> v_second ->> 'evidenceId'
      or v_first ->> 'missionResultId' <> v_second ->> 'missionResultId' then
      raise exception 'official baseline returned different identifiers';
    end if;
    if (select status from public.missions where id = v_mission) <> 'completed' then
      raise exception 'official mission was not completed';
    end if;
    if (select status from public.evidence_requests where id = v_request) <> 'accepted' then
      raise exception 'official evidence request was not accepted';
    end if;
    if (select design_effectiveness from public.controls where id = v_control) <> 'effective' then
      raise exception 'official control design is not effective';
    end if;
    if (select operating_effectiveness from public.controls where id = v_control) <> 'partial' then
      raise exception 'official control operation must remain partial';
    end if;
    if length((select integrity_hash from public.evidence where id = v_evidence)) <> 64 then
      raise exception 'official evidence hash is invalid';
    end if;
    if (select count(*) from public.control_evaluations where control_id = v_control and case_id = v_case) <> 2 then
      raise exception 'official baseline requires two evaluations';
    end if;
    if (select count(*) from public.mission_capability_runs where mission_id = v_mission and status in ('completed', 'skipped')) <> 6 then
      raise exception 'official baseline did not reconcile six capabilities';
    end if;
    if (select count(*) from public.mission_results where id = v_result and result_type = 'baseline_assurance') <> 1 then
      raise exception 'official baseline result was not created';
    end if;
    if (select count(*) from public.obligations where id = v_obligation and obligation_text like 'Requerimiento interno de preparación (no obligación legal validada):%') <> 1 then
      raise exception 'official requirement is not explicitly internal';
    end if;
  end if;
end;
$close$;
