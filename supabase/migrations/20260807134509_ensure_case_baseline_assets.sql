create or replace function public.ensure_case_baseline_assets(
  p_actor_id uuid,
  p_organization_id uuid,
  p_case_id uuid,
  p_mission_id uuid,
  p_request_id uuid
)
returns jsonb
language plpgsql
set search_path = ''
as $function$
declare
  v_role text;
  v_case public.compliance_cases%rowtype;
  v_mission public.missions%rowtype;
  v_request public.evidence_requests%rowtype;
  v_project public.projects%rowtype;
  v_organization public.organizations%rowtype;
  v_obligation_id uuid;
  v_control_id uuid;
  v_evidence_id uuid;
  v_control_code text;
  v_obligation_text text;
  v_baseline jsonb;
  v_hash text;
  v_unknowns jsonb := '[]'::jsonb;
  v_artifact_ids jsonb := '[]'::jsonb;
  v_processes integer := 0;
  v_assets integer := 0;
  v_datasets integer := 0;
  v_vendors integer := 0;
  v_documents integer := 0;
  v_artifacts integer := 0;
  v_obligation_created boolean := false;
  v_control_created boolean := false;
  v_evidence_created boolean := false;
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

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':baseline-assets:' || p_case_id::text, 211)
  );

  select item.* into v_case
  from public.compliance_cases item
  where item.id = p_case_id and item.organization_id = p_organization_id
  for update;
  if v_case.id is null or v_case.project_id is null then
    raise exception using errcode = '23514', message = 'Case and project are required';
  end if;

  select item.* into v_mission
  from public.missions item
  where item.id = p_mission_id
    and item.organization_id = p_organization_id
    and item.case_id = p_case_id
  for update;
  if v_mission.id is null or v_mission.owner_id is null then
    raise exception using errcode = '23514', message = 'Mission and owner are required';
  end if;

  select item.* into v_request
  from public.evidence_requests item
  where item.id = p_request_id
    and item.organization_id = p_organization_id
    and item.case_id = p_case_id
    and item.project_id = v_case.project_id
  for update;
  if v_request.id is null or v_request.requested_from is null then
    raise exception using errcode = '23514', message = 'Evidence request and owner are required';
  end if;

  select item.* into v_project
  from public.projects item
  where item.id = v_case.project_id and item.organization_id = p_organization_id;
  select item.* into v_organization
  from public.organizations item
  where item.id = p_organization_id;
  if v_project.id is null or v_organization.id is null then
    raise exception using errcode = '23514', message = 'Organization project is invalid';
  end if;

  v_obligation_text := 'Requerimiento interno de preparación (no obligación legal validada): mantener una línea base versionada de datos personales, tratamientos, finalidades, sistemas, ubicaciones y terceros, registrando hechos conocidos, información pendiente, responsables y fecha de revisión.';

  select item.id into v_obligation_id
  from public.obligations item
  where item.project_id = v_project.id and item.obligation_text = v_obligation_text
  order by item.created_at limit 1;

  if v_obligation_id is null then
    insert into public.obligations (
      project_id, obligation_text, responsible_party, due_date,
      priority, status, is1dora_confidence
    ) values (
      v_project.id, v_obligation_text, 'Responsable del expediente',
      v_mission.due_at::date, 'high', 'in_progress', 0.96
    ) returning id into v_obligation_id;
    v_obligation_created := true;
  end if;

  v_control_code := 'BASE-INVENTORY-' || upper(substr(replace(p_case_id::text, '-', ''), 1, 10));
  select item.id into v_control_id
  from public.controls item
  where item.organization_id = p_organization_id
    and item.project_id = v_project.id
    and item.code = v_control_code
  limit 1;

  if v_control_id is null then
    select public.create_control_record(
      p_actor_id, p_organization_id, v_project.id,
      'Línea base trazable del inventario de datos y terceros',
      'Control inicial de readiness. Registra hechos disponibles, campos desconocidos, responsable, vigencia y próxima revisión. No demuestra que el inventario corporativo esté completo ni que exista cumplimiento legal.',
      'Mantener una fotografía verificable y versionada del alcance conocido y de la información pendiente.',
      'preventive', 'manual', 'monthly', v_mission.owner_id,
      now() + interval '30 days', v_obligation_id
    ) into v_control_id;

    update public.controls
    set code = v_control_code, status = 'active', updated_at = now()
    where id = v_control_id;
    v_control_created := true;
  end if;

  if v_request.control_id is not null and v_request.control_id <> v_control_id then
    raise exception using errcode = '23514', message = 'Evidence request belongs to another control';
  end if;
  if v_request.control_id is null then
    update public.evidence_requests
    set control_id = v_control_id, updated_at = now()
    where id = v_request.id;
  end if;

  select count(*) into v_processes from public.organization_processes x where x.organization_id = p_organization_id;
  select count(*) into v_assets from public.organization_assets x where x.organization_id = p_organization_id;
  select count(*) into v_datasets from public.organization_datasets x where x.organization_id = p_organization_id;
  select count(*) into v_vendors from public.organization_vendors x where x.organization_id = p_organization_id;
  select count(*) into v_documents from public.documents x where x.project_id = v_project.id;
  select count(*), coalesce(jsonb_agg(x.id order by x.created_at), '[]'::jsonb)
    into v_artifacts, v_artifact_ids
  from public.agent_artifacts x
  where x.organization_id = p_organization_id
    and x.case_id = p_case_id
    and x.status = 'approved'
    and x.superseded_at is null;

  if v_processes = 0 then v_unknowns := v_unknowns || jsonb_build_array('Procesos y tratamientos no registrados en Kumplio.'); end if;
  if v_assets = 0 then v_unknowns := v_unknowns || jsonb_build_array('Sistemas, repositorios y activos no registrados en Kumplio.'); end if;
  if v_datasets = 0 then v_unknowns := v_unknowns || jsonb_build_array('Categorías y conjuntos de datos no registrados en Kumplio.'); end if;
  if v_vendors = 0 then v_unknowns := v_unknowns || jsonb_build_array('Terceros, proveedores y destinatarios no registrados en Kumplio.'); end if;
  if v_documents = 0 then v_unknowns := v_unknowns || jsonb_build_array('No existen documentos fuente cargados en el ámbito.'); end if;

  v_baseline := jsonb_build_object(
    'schemaVersion', 1,
    'baselineKind', 'case_inventory_baseline',
    'caseId', p_case_id,
    'missionId', p_mission_id,
    'requestId', p_request_id,
    'projectId', v_project.id,
    'controlId', v_control_id,
    'obligationId', v_obligation_id,
    'observedAt', now(),
    'nextReviewAt', now() + interval '30 days',
    'organization', jsonb_build_object(
      'id', v_organization.id, 'name', v_organization.name,
      'country', v_organization.country, 'size', v_organization.size,
      'industry', v_organization.industry
    ),
    'case', jsonb_build_object(
      'title', v_case.title, 'status', v_case.status,
      'priority', v_case.priority, 'ownerId', v_case.owner_id
    ),
    'registeredInventory', jsonb_build_object(
      'processes', v_processes, 'assets', v_assets, 'datasets', v_datasets,
      'vendors', v_vendors, 'documents', v_documents
    ),
    'approvedArtifactIds', v_artifact_ids,
    'approvedArtifactCount', v_artifacts,
    'unknowns', v_unknowns,
    'acceptanceScope', 'Suficiente solo para demostrar una línea base inicial versionada con desconocidos explícitos. No demuestra completitud, aplicabilidad jurídica ni cumplimiento.',
    'limitations', jsonb_build_array(
      'La ausencia de registros en Kumplio no demuestra inexistencia dentro de la organización.',
      'La evidencia no sustituye entrevistas, inventarios corporativos, contratos, políticas ni validación jurídica.',
      'La operación permanece parcial hasta validar el universo y probar completitud.'
    )
  );

  v_hash := pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(v_baseline::text, 'UTF8'), 'sha256'), 'hex'
  );

  select item.id into v_evidence_id
  from public.evidence item
  where item.organization_id = p_organization_id
    and item.project_id = v_project.id
    and item.metadata ->> 'baselineKind' = 'case_inventory_baseline'
    and item.metadata ->> 'caseId' = p_case_id::text
  order by item.created_at limit 1;

  if v_evidence_id is null then
    select public.create_evidence_record(
      p_actor_id, p_organization_id, v_project.id,
      left('Línea base inicial del inventario — ' || v_case.title, 180),
      'Fotografía estructurada del estado registrado en Kumplio, con hechos, desconocidos y limitaciones. No certifica inventario completo ni cumplimiento.',
      'record', 'Kumplio · expediente y registros disponibles', null,
      now(), current_date, current_date, now() + interval '30 days',
      v_hash, 'internal', v_control_id
    ) into v_evidence_id;

    update public.evidence
    set validation_status = 'accepted', integrity_status = 'verified',
        metadata = v_baseline, updated_at = now()
    where id = v_evidence_id;
    v_evidence_created := true;
  else
    select item.integrity_hash into v_hash from public.evidence item where item.id = v_evidence_id;
  end if;

  return jsonb_build_object(
    'caseId', p_case_id,
    'missionId', p_mission_id,
    'requestId', p_request_id,
    'projectId', v_project.id,
    'obligationId', v_obligation_id,
    'controlId', v_control_id,
    'evidenceId', v_evidence_id,
    'integrityHash', v_hash,
    'created', jsonb_build_object(
      'obligation', v_obligation_created,
      'control', v_control_created,
      'evidence', v_evidence_created
    )
  );
end;
$function$;

revoke all on function public.ensure_case_baseline_assets(uuid, uuid, uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.ensure_case_baseline_assets(uuid, uuid, uuid, uuid, uuid) to service_role;
