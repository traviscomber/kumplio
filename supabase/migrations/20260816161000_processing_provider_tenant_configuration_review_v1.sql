create or replace function public.promote_processing_provider_tenant_configuration_v1(
  p_actor_id uuid,
  p_organization_id uuid,
  p_process_id uuid,
  p_request_id uuid,
  p_evidence_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_process public.organization_processes;
  v_request public.evidence_requests;
  v_evidence public.evidence;
  v_vendor public.organization_vendors;
  v_kind text;
  v_vendor_name text;
  v_configuration_as_of timestamptz;
  v_source_refs jsonb;
  v_limitations jsonb;
  v_daily_backups_observed boolean;
  v_pitr_state text;
  v_recovery_window_days integer;
  v_openai_mode text;
  v_project_binding_observed boolean;
  v_snapshot_hash text;
  v_existing_evidence_id text;
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
      and member.role in ('owner','admin','compliance')
  ) then
    raise exception using errcode = '42501', message = 'Owner, admin or compliance membership required';
  end if;

  select process.* into v_process
  from public.organization_processes process
  where process.id = p_process_id
    and process.organization_id = p_organization_id
    and process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired'
  for update;

  if v_process.id is null then
    raise exception using errcode = '23514', message = 'Processing activity must belong to the organization';
  end if;

  select request.* into v_request
  from public.evidence_requests request
  where request.id = p_request_id
    and request.organization_id = p_organization_id
  for update;

  if v_request.id is null then
    raise exception using errcode = '23503', message = 'Tenant configuration evidence request not found';
  end if;

  if v_request.status <> 'accepted' or v_request.submitted_evidence_id is distinct from p_evidence_id then
    raise exception using errcode = '23514', message = 'Tenant configuration evidence must be accepted before promotion';
  end if;

  select evidence.* into v_evidence
  from public.evidence evidence
  where evidence.id = p_evidence_id
    and evidence.organization_id = p_organization_id
    and evidence.project_id = v_request.project_id
  for update;

  if v_evidence.id is null then
    raise exception using errcode = '23503', message = 'Accepted tenant configuration evidence not found';
  end if;

  if v_evidence.validation_status <> 'accepted'
     or v_evidence.integrity_status <> 'verified'
     or nullif(v_evidence.integrity_hash, '') is null then
    raise exception using errcode = '23514', message = 'Tenant configuration evidence must be accepted with verified integrity';
  end if;

  if coalesce(v_evidence.metadata ->> 'scope', '') <> 'processing_provider_tenant_configuration'
     or coalesce(v_evidence.metadata ->> 'processId', '') <> p_process_id::text
     or coalesce(v_evidence.metadata ->> 'tenantConfigurationStatus', '') <> 'verified'
     or coalesce((v_evidence.metadata ->> 'effectiveConfigurationObserved')::boolean, false) is not true then
    raise exception using errcode = '23514', message = 'Evidence does not prove verified tenant configuration for this process';
  end if;

  v_kind := nullif(btrim(coalesce(v_evidence.metadata ->> 'configurationKind', '')), '');
  v_vendor_name := nullif(btrim(coalesce(v_evidence.metadata ->> 'vendorName', '')), '');
  v_source_refs := coalesce(v_evidence.metadata -> 'sourceRefs', '[]'::jsonb);
  v_limitations := coalesce(v_evidence.metadata -> 'limitations', '[]'::jsonb);
  v_snapshot_hash := v_evidence.integrity_hash;

  begin
    v_configuration_as_of := (v_evidence.metadata ->> 'configurationAsOf')::timestamptz;
  exception when others then
    raise exception using errcode = '22023', message = 'configurationAsOf must be a valid timestamp';
  end;

  if v_configuration_as_of is null or v_configuration_as_of > now() + interval '5 minutes' then
    raise exception using errcode = '22023', message = 'configurationAsOf must describe an observed configuration';
  end if;

  if v_kind not in ('supabase_backup_pitr','openai_data_retention')
     or v_vendor_name is null
     or jsonb_typeof(v_source_refs) <> 'array'
     or jsonb_array_length(v_source_refs) < 1
     or jsonb_typeof(v_limitations) <> 'array' then
    raise exception using errcode = '22023', message = 'Tenant configuration evidence requires kind, vendor, sources and limitations';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_source_refs) source_ref
    where nullif(btrim(coalesce(source_ref ->> 'type','')), '') is null
       or nullif(btrim(coalesce(source_ref ->> 'label','')), '') is null
       or nullif(btrim(coalesce(source_ref ->> 'reference','')), '') is null
       or nullif(btrim(coalesce(source_ref ->> 'capturedAt','')), '') is null
  ) then
    raise exception using errcode = '22023', message = 'Every tenant configuration source requires type, label, reference and capturedAt';
  end if;

  select vendor.* into v_vendor
  from public.organization_vendors vendor
  where vendor.organization_id = p_organization_id
    and lower(vendor.name) = lower(v_vendor_name)
    and vendor.attributes ->> 'sourceProcessId' = p_process_id::text
  order by vendor.created_at
  limit 1
  for update;

  if v_vendor.id is null then
    raise exception using errcode = '23514', message = 'Provider must be linked to the processing activity';
  end if;

  if v_kind = 'supabase_backup_pitr' then
    if lower(v_vendor.name) <> 'supabase' then
      raise exception using errcode = '23514', message = 'Supabase configuration evidence must belong to Supabase';
    end if;

    v_daily_backups_observed := coalesce((v_evidence.metadata ->> 'dailyBackupsObserved')::boolean, false);
    v_pitr_state := nullif(btrim(coalesce(v_evidence.metadata ->> 'pitrState','')), '');

    begin
      v_recovery_window_days := nullif(v_evidence.metadata ->> 'effectiveRecoveryWindowDays','')::integer;
    exception when others then
      raise exception using errcode = '22023', message = 'effectiveRecoveryWindowDays must be an integer';
    end;

    if v_daily_backups_observed is not true
       or v_pitr_state not in ('enabled','disabled')
       or v_recovery_window_days is null
       or v_recovery_window_days < 0
       or v_recovery_window_days > 90 then
      raise exception using errcode = '23514', message = 'Supabase evidence must observe backups, PITR state and effective recovery window';
    end if;
  else
    if lower(v_vendor.name) <> 'openai' then
      raise exception using errcode = '23514', message = 'OpenAI configuration evidence must belong to OpenAI';
    end if;

    v_openai_mode := nullif(btrim(coalesce(v_evidence.metadata ->> 'dataRetentionMode','')), '');
    v_project_binding_observed := coalesce((v_evidence.metadata ->> 'projectBindingObserved')::boolean, false);

    if v_openai_mode not in ('standard','modified_abuse_monitoring','zero_data_retention')
       or v_project_binding_observed is not true then
      raise exception using errcode = '23514', message = 'OpenAI evidence must observe project binding and effective Data Retention mode';
    end if;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':provider-tenant-config:' || p_process_id::text, 21719)
  );

  v_existing_evidence_id := v_process.attributes ->> 'providerTenantConfigurationEvidenceId';
  if coalesce(v_process.attributes ->> 'providerTenantConfigurationStatus','unverified') = 'verified' then
    if v_existing_evidence_id = p_evidence_id::text then
      return jsonb_build_object(
        'processId', p_process_id,
        'vendorId', v_vendor.id,
        'evidenceId', p_evidence_id,
        'tenantConfigurationStatus', 'verified',
        'configurationKind', v_kind,
        'resumed', true
      );
    end if;
    raise exception using errcode = '23514', message = 'Tenant configuration is already verified by different evidence';
  end if;

  update public.organization_processes process
  set attributes = coalesce(process.attributes,'{}'::jsonb) || jsonb_build_object(
        'providerTenantConfigurationStatus','verified',
        'providerTenantConfigurationEvidenceId',p_evidence_id,
        'providerTenantConfigurationSnapshotHash',v_snapshot_hash,
        'providerTenantConfigurationKind',v_kind,
        'providerTenantConfigurationObservedAt',v_configuration_as_of,
        'providerTenantConfigurationReviewedAt',now()
      ),
      updated_at = now()
  where process.id = p_process_id
    and process.organization_id = p_organization_id;

  update public.organization_vendors vendor
  set attributes = coalesce(vendor.attributes,'{}'::jsonb) || jsonb_build_object(
        'tenantConfigurationStatus','verified',
        'tenantConfigurationEvidenceId',p_evidence_id,
        'tenantConfigurationSnapshotHash',v_snapshot_hash,
        'tenantConfigurationKind',v_kind,
        'tenantConfigurationObservedAt',v_configuration_as_of,
        'tenantConfigurationReviewedAt',now()
      ),
      updated_at = now()
  where vendor.id = v_vendor.id
    and vendor.organization_id = p_organization_id;

  if v_request.case_id is not null then
    insert into public.compliance_case_events(
      organization_id,case_id,actor_id,event_type,summary,changes
    ) values (
      p_organization_id,
      v_request.case_id,
      p_actor_id,
      'processing_provider_tenant_configuration_verified',
      'Configuración tenant del proveedor verificada con evidencia aceptada',
      jsonb_build_object(
        'process_id',p_process_id,
        'vendor_id',v_vendor.id,
        'evidence_id',p_evidence_id,
        'configuration_kind',v_kind,
        'configuration_as_of',v_configuration_as_of,
        'snapshot_hash',v_snapshot_hash
      )
    );
  end if;

  return jsonb_build_object(
    'processId',p_process_id,
    'vendorId',v_vendor.id,
    'evidenceId',p_evidence_id,
    'tenantConfigurationStatus','verified',
    'configurationKind',v_kind,
    'resumed',false
  );
end;
$function$;

revoke all on function public.promote_processing_provider_tenant_configuration_v1(uuid,uuid,uuid,uuid,uuid) from public;
revoke all on function public.promote_processing_provider_tenant_configuration_v1(uuid,uuid,uuid,uuid,uuid) from anon;
revoke all on function public.promote_processing_provider_tenant_configuration_v1(uuid,uuid,uuid,uuid,uuid) from authenticated;
grant execute on function public.promote_processing_provider_tenant_configuration_v1(uuid,uuid,uuid,uuid,uuid) to service_role;

grant execute on function public.promote_processing_provider_tenant_configuration_v1(uuid,uuid,uuid,uuid,uuid) to postgres;

comment on function public.promote_processing_provider_tenant_configuration_v1(uuid,uuid,uuid,uuid,uuid) is
'Promotes provider tenant configuration to verified only after an accepted evidence request with integrity-verified, provider-specific effective configuration evidence. Does not prove final deletion or provider backup purge.';
