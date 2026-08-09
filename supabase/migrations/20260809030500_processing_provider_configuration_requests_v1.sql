-- Block 16: materialize tenant-specific provider configuration gaps as real
-- evidence requests with owner, due date and acceptance criteria.

create or replace function public.prepare_processing_provider_configuration_request_v1(
  p_actor_id uuid,
  p_organization_id uuid,
  p_process_id uuid
)
returns jsonb
language plpgsql
set search_path to ''
as $function$
declare
  v_process public.organization_processes;
  v_project_id uuid;
  v_case_id uuid;
  v_control_id uuid;
  v_request_id uuid;
  v_vendor_name text;
  v_title text;
  v_description text;
  v_existing_id uuid;
begin
  if p_actor_id is null or not exists (
    select 1 from public.organization_members member
    where member.organization_id=p_organization_id
      and member.user_id=p_actor_id
      and member.role in ('owner','admin','compliance')
  ) then
    raise exception using errcode='42501', message='Owner, admin or compliance membership required';
  end if;

  select process.* into v_process
  from public.organization_processes process
  where process.id=p_process_id
    and process.organization_id=p_organization_id
    and process.process_type='processing_activity'
    and process.lifecycle_status <> 'retired';

  if v_process.id is null then
    raise exception using errcode='23514', message='Processing activity must belong to the organization';
  end if;

  if v_process.owner_user_id is null then
    raise exception using errcode='23514', message='Processing activity owner is required';
  end if;

  if v_process.attributes ->> 'providerRetentionAssuranceStatus' <> 'partial_policy_verified' then
    raise exception using errcode='23514', message='Provider retention assurance must be reviewed first';
  end if;

  if coalesce(v_process.attributes ->> 'providerTenantConfigurationStatus','unverified')='verified' then
    raise exception using errcode='23514', message='Provider tenant configuration is already verified';
  end if;

  select review.project_id, review.case_id, review.control_id
    into v_project_id, v_case_id, v_control_id
  from public.processing_activity_reviews review
  where review.organization_id=p_organization_id
    and review.process_id=p_process_id
  order by review.reviewed_at desc, review.created_at desc
  limit 1;

  if v_project_id is null then
    raise exception using errcode='23514', message='Reviewed processing activity is required';
  end if;

  begin
    v_existing_id := nullif(v_process.attributes ->> 'providerTenantConfigurationEvidenceRequestId','')::uuid;
  exception when others then
    v_existing_id := null;
  end;

  if v_existing_id is not null and exists (
    select 1 from public.evidence_requests request
    where request.id=v_existing_id and request.organization_id=p_organization_id
  ) then
    return jsonb_build_object(
      'processId',p_process_id,
      'requestId',v_existing_id,
      'status','already_prepared',
      'resumed',true
    );
  end if;

  if v_process.code in ('TRT-E6956B3825E1','TRT-24200B1DEC5E') then
    v_vendor_name := 'Supabase';
    v_title := left('Configuración efectiva de backups/PITR — Supabase — ' || v_process.name,180);
    v_description := 'Adjuntar evidencia tenant-specific del proyecto Supabase usado por esta actividad. Debe mostrar, como mínimo: plan o capacidad de backup aplicable; backups diarios y/o PITR habilitado/deshabilitado; ventana de recuperación/retención; fecha de captura; identificación inequívoca del proyecto; y fuente administrable o contractual. No basta documentación pública general. La evidencia debe permitir determinar cuándo un registro eliminado deja de ser recuperable desde copias administradas por el proveedor.';
  elsif v_process.code='TRT-EBDC661160F2' then
    v_vendor_name := 'OpenAI';
    v_title := left('Configuración efectiva de Data Retention — OpenAI — ' || v_process.name,180);
    v_description := 'Adjuntar evidencia tenant-specific de la organización/proyecto OpenAI usado por Kumplio. Debe mostrar el modo efectivo de retención aplicable (estándar, Modified Abuse Monitoring o Zero Data Retention), alcance del proyecto/API, fecha de captura y fuente administrable o contractual. Debe permitir distinguir store:false de ZDR/MAM y acreditar qué retención externa aplica realmente al tráfico de Responses API.';
  else
    raise exception using errcode='23514', message='No provider configuration request template exists for this activity';
  end if;

  select public.create_evidence_request_record(
    p_actor_id,
    p_organization_id,
    v_project_id,
    v_case_id,
    v_control_id,
    v_title,
    v_description,
    v_process.owner_user_id,
    now() + interval '14 days'
  ) into v_request_id;

  update public.organization_processes process
  set attributes=coalesce(process.attributes,'{}'::jsonb) || jsonb_build_object(
        'providerTenantConfigurationEvidenceRequestId',v_request_id,
        'providerTenantConfigurationEvidenceRequestStatus','open',
        'providerTenantConfigurationVendor',v_vendor_name,
        'providerTenantConfigurationDueAt',now()+interval '14 days'
      ),
      updated_at=now()
  where process.id=p_process_id
    and process.organization_id=p_organization_id;

  return jsonb_build_object(
    'processId',p_process_id,
    'requestId',v_request_id,
    'vendorName',v_vendor_name,
    'status','open',
    'dueAt',now()+interval '14 days',
    'resumed',false
  );
end;
$function$;

revoke all on function public.prepare_processing_provider_configuration_request_v1(
  uuid,uuid,uuid
) from public,anon,authenticated;

grant execute on function public.prepare_processing_provider_configuration_request_v1(
  uuid,uuid,uuid
) to service_role,postgres;
