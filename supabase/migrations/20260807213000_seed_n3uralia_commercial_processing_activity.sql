-- Supervised production seed for the first real processing activity.
-- Portable by design: it becomes a no-op when the named pilot organization,
-- its workspace or a real commercial lead are not present.

do $seed$
declare
  v_organization_id uuid;
  v_actor_id uuid;
  v_project_id uuid;
  v_case_id uuid;
  v_control_id uuid;
  v_request_key uuid;
  v_organization_count integer;
  v_lead_count integer;
  v_payload jsonb;
  v_first jsonb;
  v_second jsonb;
begin
  select count(*)
  into v_organization_count
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia';

  if v_organization_count <> 1 then
    raise notice 'Skipping supervised processing seed: expected exactly one N3uralia organization, found %.', v_organization_count;
    return;
  end if;

  select organization.id
  into v_organization_id
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia'
  limit 1;

  select member.user_id
  into v_actor_id
  from public.organization_members member
  where member.organization_id = v_organization_id
    and member.role in ('owner', 'admin', 'compliance')
  order by case member.role when 'owner' then 1 when 'admin' then 2 else 3 end, member.joined_at
  limit 1;

  select project.id
  into v_project_id
  from public.projects project
  where project.organization_id = v_organization_id
    and project.status = 'active'
    and project.compliance_law = 'Ley 21.719'
  order by project.created_at
  limit 1;

  select count(*)
  into v_lead_count
  from public.commercial_leads;

  if v_actor_id is null or v_project_id is null or v_lead_count = 0 then
    raise notice 'Skipping supervised processing seed: actor %, project %, commercial leads %.', v_actor_id, v_project_id, v_lead_count;
    return;
  end if;

  select compliance_case.id
  into v_case_id
  from public.compliance_cases compliance_case
  where compliance_case.organization_id = v_organization_id
    and compliance_case.project_id = v_project_id
    and compliance_case.title ilike 'Preparar N3uralia para la Ley 21.719%'
  order by compliance_case.created_at
  limit 1;

  select control.id
  into v_control_id
  from public.controls control
  where control.organization_id = v_organization_id
    and control.project_id = v_project_id
    and control.lifecycle_status = 'active'
    and control.code like 'BASE-INVENTORY-%'
  order by control.created_at
  limit 1;

  v_request_key := md5(v_organization_id::text || ':commercial-contact-v1')::uuid;
  v_payload := jsonb_build_object(
    'name', 'Gestión de contactos comerciales y solicitudes de demostración',
    'description', 'Recepción y seguimiento de solicitudes realizadas mediante el formulario comercial de Kumplio.',
    'purpose', 'Recibir, responder y dar seguimiento a solicitudes de contacto, evaluación o demostración de Kumplio.',
    'proposedLegalBasis', 'Solicitud del titular y medidas precontractuales; pendiente de validación jurídica para usos adicionales.',
    'ownerId', v_actor_id,
    'criticality', 'medium',
    'dataSubjects', jsonb_build_array('Prospectos', 'Contactos de empresas interesadas'),
    'dataCategories', jsonb_build_array('Identificación', 'Contacto', 'Empresa e industria', 'Mensaje y necesidad declarada', 'Metadatos técnicos limitados'),
    'sensitivity', 'confidential',
    'retentionRule', 'Pendiente de definir y aprobar; revisión requerida antes del siguiente ciclo.',
    'crossBorderTransfer', true,
    'containsSensitiveData', false,
    'asset', jsonb_build_object(
      'name', 'Formulario comercial y tabla commercial_leads',
      'type', 'web_application_database',
      'hostingCountry', 'Estados Unidos (us-east-1)',
      'providerName', 'Supabase'
    ),
    'vendor', jsonb_build_object(
      'name', 'Supabase',
      'serviceCategory', 'Backend, base de datos y autenticación',
      'country', 'Estados Unidos',
      'processesPersonalData', true,
      'crossBorderTransfer', true,
      'riskTier', 'medium'
    ),
    'source', jsonb_build_object(
      'type', 'code_and_database',
      'label', 'Endpoint /api/leads, tabla commercial_leads y región del proyecto Supabase',
      'reference', 'app/api/leads/route.ts · public.commercial_leads · us-east-1'
    ),
    'review', jsonb_build_object(
      'decision', 'approved',
      'completeness', 'partial',
      'note', 'Se verificó el endpoint de captura, la tabla operacional, al menos un registro existente y la región del proyecto. La revisión aprueba esta actividad como inventario inicial, no como validación legal completa.',
      'unknowns', jsonb_build_array(
        'Plazo de retención no aprobado.',
        'Base de licitud pendiente de validación jurídica.',
        'Listado completo de destinatarios y subencargados pendiente.',
        'Clasificación de riesgo del proveedor pendiente de metodología y aprobación.',
        'Versión del aviso de privacidad no adjuntada.',
        'Mecanismo de eliminación no evidenciado.'
      )
    )
  );

  select public.create_processing_activity_inventory_v1(
    v_actor_id,
    v_organization_id,
    v_project_id,
    v_request_key,
    v_payload,
    v_case_id,
    v_control_id
  ) into v_first;

  select public.create_processing_activity_inventory_v1(
    v_actor_id,
    v_organization_id,
    v_project_id,
    v_request_key,
    v_payload,
    v_case_id,
    v_control_id
  ) into v_second;

  if not coalesce((v_second ->> 'resumed')::boolean, false) then
    raise exception 'Supervised processing seed second call was not idempotent: %', v_second;
  end if;

  if v_first ->> 'processId' is distinct from v_second ->> 'processId'
     or v_first ->> 'datasetId' is distinct from v_second ->> 'datasetId'
     or v_first ->> 'assetId' is distinct from v_second ->> 'assetId'
     or v_first ->> 'vendorId' is distinct from v_second ->> 'vendorId'
     or v_first ->> 'evidenceId' is distinct from v_second ->> 'evidenceId'
     or v_first ->> 'reviewId' is distinct from v_second ->> 'reviewId' then
    raise exception 'Supervised processing seed returned different identifiers.';
  end if;

  if (select completeness from public.processing_activity_reviews where id = (v_first ->> 'reviewId')::uuid) <> 'partial' then
    raise exception 'Supervised processing activity must remain partial.';
  end if;

  if (select validation_status from public.evidence where id = (v_first ->> 'evidenceId')::uuid) <> 'accepted'
     or (select integrity_status from public.evidence where id = (v_first ->> 'evidenceId')::uuid) <> 'verified'
     or length((select integrity_hash from public.evidence where id = (v_first ->> 'evidenceId')::uuid)) <> 64 then
    raise exception 'Supervised processing evidence is not accepted and integrity-verified.';
  end if;
end;
$seed$;
