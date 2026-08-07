-- KUMPLIO Block 5 — reversible assurance chain verification
-- Replace the four UUID placeholders with a valid tenant member/project/case before execution.
-- Expected chain: control -> request -> evidence -> accepted review -> design+operating evaluation -> rollback.

begin;

do $$
declare
  v_org uuid := :'organization_id';
  v_user uuid := :'user_id';
  v_project uuid := :'project_id';
  v_case uuid := :'case_id';
  v_control uuid;
  v_evidence uuid;
  v_request uuid;
  v_design uuid;
  v_operating uuid;
  v_status text;
  v_sufficiency text;
  v_design_result text;
  v_operating_result text;
begin
  v_control := public.create_control_record(v_user, v_org, v_project,
    '[TEST BLOCK 5] Control de acceso y revisión periódica',
    'Control sintético reversible para validar el circuito de evidencia.',
    'Asegurar que los accesos a información personal sean autorizados y revisados.',
    'preventive', 'manual', 'quarterly', v_user, now() + interval '90 days', null);

  v_request := public.create_evidence_request_record(v_user, v_org, v_project, v_case, v_control,
    '[TEST BLOCK 5] Registro de altas y bajas de acceso',
    'Demostrar que las altas y bajas de acceso fueron gestionadas y revisadas.',
    v_user, now() + interval '7 days');

  v_evidence := public.create_evidence_record(v_user, v_org, v_project,
    '[TEST BLOCK 5] Registro de accesos', 'Evidencia sintética reversible.',
    'record', 'Sistema IAM', null, now(), current_date - 30, current_date,
    now() + interval '365 days', null, 'confidential', v_control);

  perform public.submit_evidence_request_record(v_user, v_org, v_request, v_evidence, 'Entrega de prueba.');
  perform public.review_evidence_request_record(v_user, v_org, v_request, 'accepted', 'Evidencia suficiente para el período revisado.');

  v_design := public.create_control_evaluation_record(v_user, v_org, v_control, v_case, 'design', 'effective',
    'El diseño define responsable, objetivo, frecuencia y evidencia verificable suficiente.', null, null, null, array[v_evidence]);
  v_operating := public.create_control_evaluation_record(v_user, v_org, v_control, v_case, 'operating', 'effective',
    'La evidencia aceptada demuestra operación efectiva durante el período seleccionado.', 1, current_date - 30, current_date, array[v_evidence]);

  select status into v_status from public.evidence_requests where id = v_request;
  select sufficiency_status into v_sufficiency from public.control_evidence where control_id = v_control and evidence_id = v_evidence;
  select design_effectiveness, operating_effectiveness into v_design_result, v_operating_result from public.controls where id = v_control;

  if v_status <> 'accepted' then raise exception 'request_not_accepted'; end if;
  if v_sufficiency <> 'sufficient' then raise exception 'evidence_not_sufficient'; end if;
  if v_design_result <> 'effective' or v_operating_result <> 'effective' then raise exception 'control_not_effective'; end if;
  if not exists (select 1 from public.compliance_case_events where case_id = v_case and event_type = 'evidence_reviewed' and changes->>'request_id' = v_request::text) then raise exception 'missing_evidence_review_event'; end if;
  if (select count(*) from public.control_evaluation_evidence where evaluation_id in (v_design, v_operating) and evidence_id = v_evidence) <> 2 then raise exception 'evaluation_evidence_links_incomplete'; end if;
end $$;

rollback;
