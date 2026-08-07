create or replace function public.finalize_case_baseline_assurance(
  p_actor_id uuid,
  p_organization_id uuid,
  p_case_id uuid,
  p_mission_id uuid,
  p_request_id uuid,
  p_review_comment text,
  p_completion_notes text
)
returns jsonb
language plpgsql
set search_path = ''
as $function$
declare
  v_role text;
  v_assets jsonb;
  v_project_id uuid;
  v_obligation_id uuid;
  v_control_id uuid;
  v_evidence_id uuid;
  v_request public.evidence_requests%rowtype;
  v_mission public.missions%rowtype;
  v_design_id uuid;
  v_operating_id uuid;
  v_result_id uuid;
  v_completion jsonb;
  v_reconciled integer := 0;
  v_design_created boolean := false;
  v_operating_created boolean := false;
  v_result_created boolean := false;
  v_mission_completed boolean := false;
  v_review text := btrim(p_review_comment);
  v_notes text := btrim(p_completion_notes);
begin
  select member.role into v_role
  from public.organization_members member
  where member.organization_id = p_organization_id
    and member.user_id = p_actor_id;

  if v_role is null then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;
  if v_role not in ('owner', 'admin', 'compliance') then
    raise exception using errcode = '42501', message = 'Baseline closure requires owner, admin or compliance role';
  end if;
  if char_length(v_review) < 10 or char_length(v_review) > 2000 then
    raise exception using errcode = '22023', message = 'Review comment must contain between 10 and 2000 characters';
  end if;
  if char_length(v_notes) < 10 or char_length(v_notes) > 2000 then
    raise exception using errcode = '22023', message = 'Completion notes must contain between 10 and 2000 characters';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':baseline-finalize:' || p_case_id::text, 212)
  );

  select item.* into v_mission
  from public.missions item
  where item.id = p_mission_id
    and item.organization_id = p_organization_id
    and item.case_id = p_case_id
  for update;
  if v_mission.id is null then
    raise exception using errcode = 'P0002', message = 'Mission not found';
  end if;
  if v_mission.owner_id <> p_actor_id then
    raise exception using errcode = '42501', message = 'Mission owner must close the baseline';
  end if;

  v_assets := public.ensure_case_baseline_assets(
    p_actor_id, p_organization_id, p_case_id, p_mission_id, p_request_id
  );
  v_project_id := (v_assets ->> 'projectId')::uuid;
  v_obligation_id := (v_assets ->> 'obligationId')::uuid;
  v_control_id := (v_assets ->> 'controlId')::uuid;
  v_evidence_id := (v_assets ->> 'evidenceId')::uuid;

  select item.* into v_request
  from public.evidence_requests item
  where item.id = p_request_id and item.organization_id = p_organization_id
  for update;

  if v_request.status in ('open', 'changes_requested') then
    perform public.submit_evidence_request_record(
      p_actor_id, p_organization_id, p_request_id, v_evidence_id,
      'Línea base inicial entregada con desconocidos y limitaciones explícitas.'
    );
    select item.* into v_request
    from public.evidence_requests item
    where item.id = p_request_id
    for update;
  elsif v_request.submitted_evidence_id is not null and v_request.submitted_evidence_id <> v_evidence_id then
    raise exception using errcode = '23514', message = 'Evidence request contains another submission';
  end if;

  if v_request.status in ('submitted', 'under_review') then
    perform public.review_evidence_request_record(
      p_actor_id, p_organization_id, p_request_id, 'accepted', v_review
    );
    select item.* into v_request
    from public.evidence_requests item
    where item.id = p_request_id
    for update;
  elsif v_request.status <> 'accepted' then
    raise exception using errcode = '23514', message = 'Evidence request is not closable';
  end if;

  update public.evidence
  set validation_status = 'accepted',
      integrity_status = case when integrity_hash is null then integrity_status else 'verified' end,
      updated_at = now()
  where id = v_evidence_id;

  update public.control_evidence
  set sufficiency_status = 'sufficient', note = v_review,
      reviewed_by = p_actor_id, reviewed_at = coalesce(reviewed_at, now())
  where control_id = v_control_id
    and evidence_id = v_evidence_id
    and organization_id = p_organization_id
    and project_id = v_project_id;

  select item.id into v_design_id
  from public.control_evaluations item
  where item.organization_id = p_organization_id
    and item.control_id = v_control_id
    and item.case_id = p_case_id
    and item.evaluation_type = 'design'
  order by item.evaluated_at desc limit 1;

  if v_design_id is null then
    select public.create_control_evaluation_record(
      p_actor_id, p_organization_id, v_control_id, p_case_id,
      'design', 'effective',
      'El diseño define objetivo, propietario, frecuencia, evidencia esperada, vigencia y desconocidos. Declara expresamente que la línea base no acredita completitud ni cumplimiento.',
      1, current_date, current_date, array[v_evidence_id]::uuid[]
    ) into v_design_id;
    v_design_created := true;
  end if;

  select item.id into v_operating_id
  from public.control_evaluations item
  where item.organization_id = p_organization_id
    and item.control_id = v_control_id
    and item.case_id = p_case_id
    and item.evaluation_type = 'operating'
  order by item.evaluated_at desc limit 1;

  if v_operating_id is null then
    select public.create_control_evaluation_record(
      p_actor_id, p_organization_id, v_control_id, p_case_id,
      'operating', 'partial',
      'El control produjo una línea base con hash, responsable y revisión. La operación es parcial porque aún no existen procesos, activos, conjuntos de datos, terceros ni documentos validados dentro del ámbito.',
      1, current_date, current_date, array[v_evidence_id]::uuid[]
    ) into v_operating_id;
    v_operating_created := true;
  end if;

  update public.mission_capability_runs run
  set status = case when capability.capability_key = 'monitor_regulatory_change' then 'skipped' else 'completed' end,
      started_at = coalesce(run.started_at, now()),
      completed_at = coalesce(run.completed_at, now()),
      output_payload = jsonb_build_object(
        'source', 'baseline_assurance',
        'capabilityKey', capability.capability_key,
        'caseId', p_case_id,
        'obligationId', v_obligation_id,
        'controlId', v_control_id,
        'evidenceId', v_evidence_id,
        'designEvaluationId', v_design_id,
        'operatingEvaluationId', v_operating_id,
        'operatingResult', 'partial',
        'limitationsPreserved', true
      ),
      error_code = null,
      error_message = null,
      updated_at = now()
  from public.mission_capabilities capability
  where run.mission_id = p_mission_id
    and run.organization_id = p_organization_id
    and capability.id = run.capability_id
    and run.status not in ('completed', 'skipped', 'cancelled');
  get diagnostics v_reconciled = row_count;

  select item.id into v_result_id
  from public.mission_results item
  where item.organization_id = p_organization_id
    and item.mission_id = p_mission_id
    and item.result_type = 'baseline_assurance'
    and item.version = 1
  limit 1;

  if v_result_id is null then
    insert into public.mission_results (
      organization_id, mission_id, result_type, version, status,
      title, summary, payload, evidence_ids, reviewed_by, reviewed_at,
      review_notes, created_by_type, created_by_user_id
    ) values (
      p_organization_id, p_mission_id, 'baseline_assurance', 1, 'approved',
      'Línea base inicial de inventario y aseguramiento',
      'Se registró un requerimiento interno, control, evidencia con hash, revisión humana y evaluaciones separadas. La operación permanece parcial.',
      jsonb_build_object(
        'caseId', p_case_id, 'projectId', v_project_id,
        'obligationId', v_obligation_id, 'controlId', v_control_id,
        'evidenceId', v_evidence_id, 'requestId', p_request_id,
        'designEvaluationId', v_design_id,
        'operatingEvaluationId', v_operating_id,
        'operatingResult', 'partial',
        'scope', 'initial_readiness_only'
      ),
      array[v_evidence_id]::uuid[], p_actor_id, now(), v_review,
      'user', p_actor_id
    ) returning id into v_result_id;
    v_result_created := true;
  end if;

  select item.* into v_mission
  from public.missions item
  where item.id = p_mission_id
  for update;

  if v_mission.status <> 'completed' then
    select public.apply_assigned_mission_action(
      p_actor_id, p_organization_id, p_mission_id, 'complete', null, v_notes
    ) into v_completion;
    v_mission_completed := true;
  end if;

  if not exists (
    select 1 from public.compliance_case_events item
    where item.organization_id = p_organization_id
      and item.case_id = p_case_id
      and item.event_type = 'baseline_assurance_closed'
  ) then
    insert into public.compliance_case_events (
      organization_id, case_id, actor_id, event_type, summary, changes
    ) values (
      p_organization_id, p_case_id, p_actor_id,
      'baseline_assurance_closed',
      'Línea base inicial cerrada con control, evidencia y evaluación',
      jsonb_build_object(
        'mission_id', p_mission_id, 'request_id', p_request_id,
        'obligation_id', v_obligation_id, 'control_id', v_control_id,
        'evidence_id', v_evidence_id, 'mission_result_id', v_result_id,
        'design_evaluation_id', v_design_id,
        'operating_evaluation_id', v_operating_id,
        'operating_result', 'partial'
      )
    );
  end if;

  return jsonb_build_object(
    'caseId', p_case_id, 'missionId', p_mission_id, 'requestId', p_request_id,
    'projectId', v_project_id, 'obligationId', v_obligation_id,
    'controlId', v_control_id, 'evidenceId', v_evidence_id,
    'designEvaluationId', v_design_id,
    'operatingEvaluationId', v_operating_id,
    'missionResultId', v_result_id,
    'operatingResult', 'partial',
    'requestAccepted', (select item.status = 'accepted' from public.evidence_requests item where item.id = p_request_id),
    'missionCompleted', (select item.status = 'completed' from public.missions item where item.id = p_mission_id),
    'reconciledCapabilities', v_reconciled,
    'created', (v_assets -> 'created') || jsonb_build_object(
      'designEvaluation', v_design_created,
      'operatingEvaluation', v_operating_created,
      'missionResult', v_result_created,
      'missionCompletion', v_mission_completed
    ),
    'resumed', not (
      coalesce((v_assets -> 'created' ->> 'obligation')::boolean, false)
      or coalesce((v_assets -> 'created' ->> 'control')::boolean, false)
      or coalesce((v_assets -> 'created' ->> 'evidence')::boolean, false)
      or v_design_created or v_operating_created or v_result_created
      or v_mission_completed or v_reconciled > 0
    )
  );
end;
$function$;

revoke all on function public.finalize_case_baseline_assurance(uuid, uuid, uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.finalize_case_baseline_assurance(uuid, uuid, uuid, uuid, uuid, text, text) to service_role;
