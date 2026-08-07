begin;

do $verify$
declare
  v_organization_id uuid;
  v_actor_id uuid;
  v_project_id uuid;
  v_case_id uuid;
  v_control_id uuid;
  v_request_key uuid;
  v_payload jsonb;
  v_first jsonb;
  v_second jsonb;
  v_process_id uuid;
  v_dataset_id uuid;
  v_asset_id uuid;
  v_vendor_id uuid;
  v_evidence_id uuid;
  v_review_id uuid;
begin
  select organization.id
  into v_organization_id
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia'
  order by organization.created_at
  limit 1;

  if v_organization_id is null then
    raise notice 'Processing inventory verification skipped: no N3uralia pilot organization.';
    return;
  end if;

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
  order by project.created_at
  limit 1;

  if v_actor_id is null or v_project_id is null then
    raise exception 'Processing inventory verification needs an actor and project.';
  end if;

  select compliance_case.id
  into v_case_id
  from public.compliance_cases compliance_case
  where compliance_case.organization_id = v_organization_id
    and compliance_case.project_id = v_project_id
  order by compliance_case.created_at
  limit 1;

  select control.id
  into v_control_id
  from public.controls control
  where control.organization_id = v_organization_id
    and control.project_id = v_project_id
    and control.lifecycle_status = 'active'
  order by control.created_at
  limit 1;

  v_request_key := md5(v_organization_id::text || ':processing-inventory-verification')::uuid;
  v_payload := jsonb_build_object(
    'name', 'Actividad sintética reversible de inventario',
    'description', 'Registro utilizado únicamente dentro de una transacción que termina en rollback.',
    'purpose', 'Verificar la creación atómica e idempotente del inventario de actividades de tratamiento.',
    'proposedLegalBasis', 'Hipótesis sintética pendiente de validación; no es una conclusión jurídica.',
    'ownerId', v_actor_id,
    'criticality', 'low',
    'dataSubjects', jsonb_build_array('Titulares sintéticos'),
    'dataCategories', jsonb_build_array('Dato sintético de prueba'),
    'sensitivity', 'internal',
    'retentionRule', 'Eliminar al finalizar la transacción reversible.',
    'crossBorderTransfer', false,
    'containsSensitiveData', false,
    'asset', jsonb_build_object(
      'name', 'Sistema sintético reversible',
      'type', 'test_system',
      'hostingCountry', 'Chile',
      'providerName', 'Kumplio QA'
    ),
    'vendor', jsonb_build_object(
      'name', 'Proveedor sintético reversible',
      'serviceCategory', 'QA',
      'country', 'Chile',
      'processesPersonalData', false,
      'crossBorderTransfer', false,
      'riskTier', 'low'
    ),
    'source', jsonb_build_object(
      'type', 'other',
      'label', 'scripts/58-verify-processing-inventory.sql',
      'reference', 'Transacción reversible BEGIN/ROLLBACK'
    ),
    'review', jsonb_build_object(
      'decision', 'approved',
      'completeness', 'partial',
      'note', 'Revisión sintética destinada a comprobar atomicidad, hash, relaciones, unknowns e idempotencia.',
      'unknowns', jsonb_build_array('Universo organizacional no forma parte de esta prueba sintética.')
    )
  );

  select public.create_processing_activity_inventory_v1(
    v_actor_id, v_organization_id, v_project_id, v_request_key,
    v_payload, v_case_id, v_control_id
  ) into v_first;

  select public.create_processing_activity_inventory_v1(
    v_actor_id, v_organization_id, v_project_id, v_request_key,
    v_payload, v_case_id, v_control_id
  ) into v_second;

  if not coalesce((v_second ->> 'resumed')::boolean, false) then
    raise exception 'Second verification call was not idempotent: %', v_second;
  end if;

  v_process_id := (v_first ->> 'processId')::uuid;
  v_dataset_id := (v_first ->> 'datasetId')::uuid;
  v_asset_id := (v_first ->> 'assetId')::uuid;
  v_vendor_id := (v_first ->> 'vendorId')::uuid;
  v_evidence_id := (v_first ->> 'evidenceId')::uuid;
  v_review_id := (v_first ->> 'reviewId')::uuid;

  if v_first ->> 'processId' is distinct from v_second ->> 'processId'
     or v_first ->> 'datasetId' is distinct from v_second ->> 'datasetId'
     or v_first ->> 'assetId' is distinct from v_second ->> 'assetId'
     or v_first ->> 'vendorId' is distinct from v_second ->> 'vendorId'
     or v_first ->> 'evidenceId' is distinct from v_second ->> 'evidenceId'
     or v_first ->> 'reviewId' is distinct from v_second ->> 'reviewId' then
    raise exception 'Verification identifiers changed between retries.';
  end if;

  if not exists (select 1 from public.organization_process_datasets where process_id = v_process_id and dataset_id = v_dataset_id)
     or not exists (select 1 from public.organization_process_assets where process_id = v_process_id and asset_id = v_asset_id)
     or not exists (select 1 from public.organization_vendor_assets where vendor_id = v_vendor_id and asset_id = v_asset_id)
     or not exists (select 1 from public.processing_activity_evidence where process_id = v_process_id and evidence_id = v_evidence_id) then
    raise exception 'Processing inventory relationships are incomplete.';
  end if;

  if (select completeness from public.processing_activity_reviews where id = v_review_id) <> 'partial'
     or (select cardinality(unknowns) from public.processing_activity_reviews where id = v_review_id) <> 1 then
    raise exception 'Verification review did not preserve its partial scope.';
  end if;

  if (select validation_status from public.evidence where id = v_evidence_id) <> 'accepted'
     or (select integrity_status from public.evidence where id = v_evidence_id) <> 'verified'
     or length((select integrity_hash from public.evidence where id = v_evidence_id)) <> 64 then
    raise exception 'Verification evidence lacks accepted integrity.';
  end if;
end;
$verify$;

rollback;
