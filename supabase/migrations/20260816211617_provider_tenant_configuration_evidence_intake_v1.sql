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
  v_backup_mode text;
  v_pitr_state text;
  v_recovery_window_days integer;
  v_openai_mode text;
  v_project_binding_observed boolean;
  v_snapshot_hash text;
  v_existing_evidence_id text;
begin
  if p_actor_id is null or not exists (
    select 1 from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
      and member.role in ('owner','admin','compliance')
  ) then
    raise exception using errcode='42501', message='Owner, admin or compliance membership required';
  end if;

  select process.* into v_process
  from public.organization_processes process
  where process.id=p_process_id
    and process.organization_id=p_organization_id
    and process.process_type='processing_activity'
    and process.lifecycle_status <> 'retired'
  for update;
  if v_process.id is null then raise exception using errcode='23514', message='Processing activity must belong to the organization'; end if;

  select request.* into v_request
  from public.evidence_requests request
  where request.id=p_request_id and request.organization_id=p_organization_id
  for update;
  if v_request.id is null then raise exception using errcode='23503', message='Tenant configuration evidence request not found'; end if;
  if v_request.status <> 'accepted' or v_request.submitted_evidence_id is distinct from p_evidence_id then
    raise exception using errcode='23514', message='Tenant configuration evidence must be accepted before promotion';
  end if;

  select evidence.* into v_evidence
  from public.evidence evidence
  where evidence.id=p_evidence_id
    and evidence.organization_id=p_organization_id
    and evidence.project_id=v_request.project_id
  for update;
  if v_evidence.id is null then raise exception using errcode='23503', message='Accepted tenant configuration evidence not found'; end if;
  if v_evidence.validation_status <> 'accepted' or v_evidence.integrity_status <> 'verified' or nullif(v_evidence.integrity_hash,'') is null then
    raise exception using errcode='23514', message='Tenant configuration evidence must be accepted with verified integrity';
  end if;
  if coalesce(v_evidence.metadata->>'scope','') <> 'processing_provider_tenant_configuration'
     or coalesce(v_evidence.metadata->>'processId','') <> p_process_id::text
     or coalesce(v_evidence.metadata->>'tenantConfigurationStatus','') <> 'verified'
     or coalesce((v_evidence.metadata->>'effectiveConfigurationObserved')::boolean,false) is not true then
    raise exception using errcode='23514', message='Evidence does not prove verified tenant configuration for this process';
  end if;

  v_kind := nullif(btrim(coalesce(v_evidence.metadata->>'configurationKind','')), '');
  v_vendor_name := nullif(btrim(coalesce(v_evidence.metadata->>'vendorName','')), '');
  v_source_refs := coalesce(v_evidence.metadata->'sourceRefs','[]'::jsonb);
  v_limitations := coalesce(v_evidence.metadata->'limitations','[]'::jsonb);
  v_snapshot_hash := v_evidence.integrity_hash;
  begin v_configuration_as_of := (v_evidence.metadata->>'configurationAsOf')::timestamptz;
  exception when others then raise exception using errcode='22023', message='configurationAsOf must be a valid timestamp'; end;

  if v_configuration_as_of is null or v_configuration_as_of > now()+interval '5 minutes' then
    raise exception using errcode='22023', message='configurationAsOf must describe an observed configuration';
  end if;
  if v_kind not in ('supabase_backup_pitr','openai_data_retention') or v_vendor_name is null
     or jsonb_typeof(v_source_refs) <> 'array' or jsonb_array_length(v_source_refs) < 1
     or jsonb_typeof(v_limitations) <> 'array' then
    raise exception using errcode='22023', message='Tenant configuration evidence requires kind, vendor, sources and limitations';
  end if;
  if exists (
    select 1 from jsonb_array_elements(v_source_refs) source_ref
    where source_ref->>'type' not in ('management_api','provider_dashboard','provider_contract')
       or nullif(btrim(coalesce(source_ref->>'label','')), '') is null
       or nullif(btrim(coalesce(source_ref->>'reference','')), '') is null
       or nullif(btrim(coalesce(source_ref->>'capturedAt','')), '') is null
  ) then
    raise exception using errcode='22023', message='Tenant configuration sources must be administrative or contractual and fully identified';
  end if;

  select vendor.* into v_vendor
  from public.organization_vendors vendor
  where vendor.organization_id=p_organization_id
    and lower(vendor.name)=lower(v_vendor_name)
    and vendor.attributes->>'sourceProcessId'=p_process_id::text
  order by vendor.created_at limit 1 for update;
  if v_vendor.id is null then raise exception using errcode='23514', message='Provider must be linked to the processing activity'; end if;

  if v_kind='supabase_backup_pitr' then
    if lower(v_vendor.name) <> 'supabase' then raise exception using errcode='23514', message='Supabase configuration evidence must belong to Supabase'; end if;
    v_backup_mode := nullif(btrim(coalesce(v_evidence.metadata->>'backupModeObserved','')), '');
    v_pitr_state := nullif(btrim(coalesce(v_evidence.metadata->>'pitrState','')), '');
    begin v_recovery_window_days := nullif(v_evidence.metadata->>'effectiveRecoveryWindowDays','')::integer;
    exception when others then raise exception using errcode='22023', message='effectiveRecoveryWindowDays must be an integer'; end;
    if v_pitr_state not in ('enabled','disabled') or v_recovery_window_days is null or v_recovery_window_days < 0 or v_recovery_window_days > 90 then
      raise exception using errcode='23514', message='Supabase evidence must observe PITR state and effective recovery window';
    end if;
    if (v_pitr_state='enabled' and v_backup_mode <> 'pitr') or (v_pitr_state='disabled' and v_backup_mode <> 'daily') then
      raise exception using errcode='23514', message='Supabase backup mode must be consistent with the observed PITR state';
    end if;
  else
    if lower(v_vendor.name) <> 'openai' then raise exception using errcode='23514', message='OpenAI configuration evidence must belong to OpenAI'; end if;
    v_openai_mode := nullif(btrim(coalesce(v_evidence.metadata->>'dataRetentionMode','')), '');
    v_project_binding_observed := coalesce((v_evidence.metadata->>'projectBindingObserved')::boolean,false);
    if v_openai_mode not in ('standard','modified_abuse_monitoring','zero_data_retention') or v_project_binding_observed is not true
       or nullif(btrim(coalesce(v_evidence.metadata->>'projectReference','')), '') is null
       or nullif(btrim(coalesce(v_evidence.metadata->>'organizationReference','')), '') is null then
      raise exception using errcode='23514', message='OpenAI evidence must observe project binding, organization and effective Data Retention mode';
    end if;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_organization_id::text||':provider-tenant-config:'||p_process_id::text,21719));
  v_existing_evidence_id := v_process.attributes->>'providerTenantConfigurationEvidenceId';
  if coalesce(v_process.attributes->>'providerTenantConfigurationStatus','unverified')='verified' then
    if v_existing_evidence_id=p_evidence_id::text then
      return jsonb_build_object('processId',p_process_id,'vendorId',v_vendor.id,'evidenceId',p_evidence_id,'tenantConfigurationStatus','verified','configurationKind',v_kind,'resumed',true);
    end if;
    raise exception using errcode='23514', message='Tenant configuration is already verified by different evidence';
  end if;

  update public.organization_processes process set
    attributes=coalesce(process.attributes,'{}'::jsonb)||jsonb_build_object(
      'providerTenantConfigurationStatus','verified','providerTenantConfigurationEvidenceId',p_evidence_id,
      'providerTenantConfigurationSnapshotHash',v_snapshot_hash,'providerTenantConfigurationKind',v_kind,
      'providerTenantConfigurationObservedAt',v_configuration_as_of,'providerTenantConfigurationReviewedAt',now()), updated_at=now()
  where process.id=p_process_id and process.organization_id=p_organization_id;

  update public.organization_vendors vendor set
    attributes=coalesce(vendor.attributes,'{}'::jsonb)||jsonb_build_object(
      'tenantConfigurationStatus','verified','tenantConfigurationEvidenceId',p_evidence_id,
      'tenantConfigurationSnapshotHash',v_snapshot_hash,'tenantConfigurationKind',v_kind,
      'tenantConfigurationObservedAt',v_configuration_as_of,'tenantConfigurationReviewedAt',now()), updated_at=now()
  where vendor.id=v_vendor.id and vendor.organization_id=p_organization_id;

  if v_request.case_id is not null then
    insert into public.compliance_case_events(organization_id,case_id,actor_id,event_type,summary,changes)
    values (p_organization_id,v_request.case_id,p_actor_id,'processing_provider_tenant_configuration_verified',
      'Configuración tenant del proveedor verificada con evidencia aceptada',
      jsonb_build_object('process_id',p_process_id,'vendor_id',v_vendor.id,'evidence_id',p_evidence_id,'configuration_kind',v_kind,'configuration_as_of',v_configuration_as_of,'snapshot_hash',v_snapshot_hash));
  end if;
  return jsonb_build_object('processId',p_process_id,'vendorId',v_vendor.id,'evidenceId',p_evidence_id,'tenantConfigurationStatus','verified','configurationKind',v_kind,'resumed',false);
end;
$function$;

create or replace function public.submit_processing_provider_tenant_configuration_evidence_v1(
  p_actor_id uuid,
  p_organization_id uuid,
  p_process_id uuid,
  p_request_key uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path=''
as $function$
declare
  v_process public.organization_processes;
  v_request public.evidence_requests;
  v_project_id uuid;
  v_vendor_name text;
  v_kind text;
  v_source_refs jsonb := coalesce(p_payload->'sourceRefs','[]'::jsonb);
  v_limitations jsonb := coalesce(p_payload->'limitations','[]'::jsonb);
  v_snapshot jsonb;
  v_hash text;
  v_evidence_id uuid;
  v_existing public.evidence;
begin
  if p_actor_id is null or not exists (select 1 from public.organization_members m where m.organization_id=p_organization_id and m.user_id=p_actor_id and m.role in ('owner','admin','compliance')) then
    raise exception using errcode='42501', message='Owner, admin or compliance membership required';
  end if;
  if p_request_key is null then raise exception using errcode='22023', message='Request key is required'; end if;
  select * into v_process from public.organization_processes p where p.id=p_process_id and p.organization_id=p_organization_id and p.process_type='processing_activity' and p.lifecycle_status<>'retired' for update;
  if v_process.id is null then raise exception using errcode='23514', message='Processing activity must belong to organization'; end if;

  select * into v_request from public.evidence_requests r
  where r.id=nullif(v_process.attributes->>'providerTenantConfigurationEvidenceRequestId','')::uuid and r.organization_id=p_organization_id
  for update;
  if v_request.id is null then raise exception using errcode='23514', message='Provider tenant configuration request is missing'; end if;
  if v_request.status not in ('open','changes_requested') then raise exception using errcode='23514', message='Provider configuration request cannot accept a submission in current state'; end if;
  v_project_id := v_request.project_id;
  v_vendor_name := v_process.attributes->>'providerTenantConfigurationVendor';
  v_kind := case when lower(coalesce(v_vendor_name,''))='supabase' then 'supabase_backup_pitr' when lower(coalesce(v_vendor_name,''))='openai' then 'openai_data_retention' else null end;
  if v_kind is null then raise exception using errcode='23514', message='Unsupported provider configuration request'; end if;

  if coalesce((p_payload->>'effectiveConfigurationObserved')::boolean,false) is not true then raise exception using errcode='23514', message='Effective provider configuration must be directly observed'; end if;
  if jsonb_typeof(v_source_refs)<>'array' or jsonb_array_length(v_source_refs)<1 or jsonb_typeof(v_limitations)<>'array' then raise exception using errcode='22023', message='Sources and limitations are required'; end if;
  if exists (select 1 from jsonb_array_elements(v_source_refs) s where s->>'type' not in ('management_api','provider_dashboard','provider_contract') or nullif(btrim(coalesce(s->>'label','')),'') is null or nullif(btrim(coalesce(s->>'reference','')),'') is null or nullif(btrim(coalesce(s->>'capturedAt','')),'') is null) then
    raise exception using errcode='22023', message='Only management API, provider dashboard or provider contract sources qualify';
  end if;

  if v_kind='supabase_backup_pitr' then
    if p_payload->>'backupModeObserved' not in ('daily','pitr') or p_payload->>'pitrState' not in ('enabled','disabled') then raise exception using errcode='22023', message='Supabase backup mode and PITR state are required'; end if;
    if (p_payload->>'pitrState'='enabled' and p_payload->>'backupModeObserved'<>'pitr') or (p_payload->>'pitrState'='disabled' and p_payload->>'backupModeObserved'<>'daily') then raise exception using errcode='23514', message='Supabase backup mode conflicts with PITR state'; end if;
    if coalesce((p_payload->>'effectiveRecoveryWindowDays')::int,-1) < 0 or coalesce((p_payload->>'effectiveRecoveryWindowDays')::int,91)>90 then raise exception using errcode='22023', message='Effective recovery window must be 0-90 days'; end if;
  else
    if p_payload->>'dataRetentionMode' not in ('standard','modified_abuse_monitoring','zero_data_retention') or coalesce((p_payload->>'projectBindingObserved')::boolean,false) is not true
       or nullif(btrim(coalesce(p_payload->>'projectReference','')),'') is null or nullif(btrim(coalesce(p_payload->>'organizationReference','')),'') is null then
      raise exception using errcode='23514', message='OpenAI project binding, organization and exact retention mode are required';
    end if;
  end if;

  v_snapshot := jsonb_build_object('schemaVersion',1,'scope','processing_provider_tenant_configuration','requestKey',p_request_key,'organizationId',p_organization_id,'processId',p_process_id,'requestId',v_request.id,'projectId',v_project_id,'vendorName',v_vendor_name,'configurationKind',v_kind,'tenantConfigurationStatus','verified','effectiveConfigurationObserved',true,'configurationAsOf',p_payload->>'configurationAsOf','sourceRefs',v_source_refs,'limitations',v_limitations)
    || (p_payload - 'sourceRefs' - 'limitations' - 'effectiveConfigurationObserved');
  v_hash := pg_catalog.encode(extensions.digest(v_snapshot::text,'sha256'),'hex');

  select * into v_existing from public.evidence e where e.organization_id=p_organization_id and e.metadata->>'scope'='processing_provider_tenant_configuration' and e.metadata->>'requestKey'=p_request_key::text limit 1 for update;
  if v_existing.id is not null then
    if v_existing.integrity_hash is distinct from v_hash then raise exception using errcode='23514', message='Request key already used with different provider configuration evidence'; end if;
    return jsonb_build_object('processId',p_process_id,'requestId',v_request.id,'evidenceId',v_existing.id,'snapshotHash',v_hash,'resumed',true);
  end if;

  select public.create_evidence_record(p_actor_id,p_organization_id,v_project_id,left('Configuración tenant — '||v_vendor_name||' — '||v_process.name,180),'Configuración efectiva del proveedor observada desde una fuente administrable o contractual. Requiere revisión humana antes de promover el gate.','attestation',v_vendor_name,null,now(),current_date,current_date,now()+interval '90 days',v_hash,'restricted',v_request.control_id) into v_evidence_id;
  update public.evidence set integrity_status='verified', validation_status='pending', metadata=v_snapshot, updated_at=now() where id=v_evidence_id and organization_id=p_organization_id;
  insert into public.processing_activity_evidence(organization_id,project_id,process_id,evidence_id,relationship_type,linked_by) values(p_organization_id,v_project_id,p_process_id,v_evidence_id,'supporting',p_actor_id) on conflict do nothing;
  perform public.submit_evidence_request_record(p_actor_id,p_organization_id,v_request.id,v_evidence_id,'Configuración tenant entregada para revisión humana.');
  update public.organization_processes set attributes=coalesce(attributes,'{}'::jsonb)||jsonb_build_object('providerTenantConfigurationEvidenceRequestStatus','submitted','providerTenantConfigurationCandidateEvidenceId',v_evidence_id,'providerTenantConfigurationCandidateSnapshotHash',v_hash),updated_at=now() where id=p_process_id and organization_id=p_organization_id;
  return jsonb_build_object('processId',p_process_id,'requestId',v_request.id,'evidenceId',v_evidence_id,'snapshotHash',v_hash,'status','submitted','resumed',false);
end;
$function$;

create or replace function public.review_processing_provider_tenant_configuration_evidence_v1(
  p_actor_id uuid,
  p_organization_id uuid,
  p_process_id uuid,
  p_decision text,
  p_comment text
)
returns jsonb
language plpgsql
security invoker
set search_path=''
as $function$
declare
  v_process public.organization_processes;
  v_request public.evidence_requests;
  v_evidence public.evidence;
  v_promoted jsonb;
begin
  if p_actor_id is null or not exists (select 1 from public.organization_members m where m.organization_id=p_organization_id and m.user_id=p_actor_id and m.role in ('owner','admin','compliance')) then raise exception using errcode='42501', message='Owner, admin or compliance membership required'; end if;
  if p_decision not in ('accepted','rejected','changes_requested') then raise exception using errcode='22023', message='Invalid decision'; end if;
  if char_length(btrim(coalesce(p_comment,'')))<20 then raise exception using errcode='22023', message='Provider configuration review requires a substantive comment'; end if;
  select * into v_process from public.organization_processes p where p.id=p_process_id and p.organization_id=p_organization_id and p.process_type='processing_activity' and p.lifecycle_status<>'retired' for update;
  if v_process.id is null then raise exception using errcode='23514', message='Processing activity not found'; end if;
  select * into v_request from public.evidence_requests r where r.id=nullif(v_process.attributes->>'providerTenantConfigurationEvidenceRequestId','')::uuid and r.organization_id=p_organization_id for update;
  if v_request.id is null or v_request.status not in ('submitted','under_review') or v_request.submitted_evidence_id is null then raise exception using errcode='23514', message='No reviewable provider configuration evidence submission'; end if;
  select * into v_evidence from public.evidence e where e.id=v_request.submitted_evidence_id and e.organization_id=p_organization_id and e.project_id=v_request.project_id for update;
  if v_evidence.id is null or v_evidence.integrity_status<>'verified' or v_evidence.metadata->>'scope'<>'processing_provider_tenant_configuration' or v_evidence.metadata->>'processId'<>p_process_id::text then raise exception using errcode='23514', message='Submitted evidence does not satisfy provider configuration contract'; end if;

  if p_decision='accepted' then
    update public.evidence set validation_status='accepted',updated_at=now() where id=v_evidence.id and organization_id=p_organization_id;
    perform public.review_evidence_request_record(p_actor_id,p_organization_id,v_request.id,'accepted',p_comment);
    v_promoted := public.promote_processing_provider_tenant_configuration_v1(p_actor_id,p_organization_id,p_process_id,v_request.id,v_evidence.id);
    update public.organization_processes set attributes=coalesce(attributes,'{}'::jsonb)||jsonb_build_object('providerTenantConfigurationEvidenceRequestStatus','accepted'),updated_at=now() where id=p_process_id and organization_id=p_organization_id;
    return jsonb_build_object('decision','accepted','evidenceId',v_evidence.id,'promotion',v_promoted);
  end if;

  perform public.review_evidence_request_record(p_actor_id,p_organization_id,v_request.id,p_decision,p_comment);
  update public.organization_processes set attributes=coalesce(attributes,'{}'::jsonb)||jsonb_build_object('providerTenantConfigurationEvidenceRequestStatus',p_decision),updated_at=now() where id=p_process_id and organization_id=p_organization_id;
  return jsonb_build_object('decision',p_decision,'evidenceId',v_evidence.id,'tenantConfigurationStatus',coalesce(v_process.attributes->>'providerTenantConfigurationStatus','unverified'));
end;
$function$;

revoke all on function public.promote_processing_provider_tenant_configuration_v1(uuid,uuid,uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.submit_processing_provider_tenant_configuration_evidence_v1(uuid,uuid,uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.review_processing_provider_tenant_configuration_evidence_v1(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.promote_processing_provider_tenant_configuration_v1(uuid,uuid,uuid,uuid,uuid) to service_role,postgres;
grant execute on function public.submit_processing_provider_tenant_configuration_evidence_v1(uuid,uuid,uuid,uuid,jsonb) to service_role,postgres;
grant execute on function public.review_processing_provider_tenant_configuration_evidence_v1(uuid,uuid,uuid,text,text) to service_role,postgres;
