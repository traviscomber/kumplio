-- Block 16 final boundary: capture provider retention/deletion assurance without
-- converting public policy into proof of tenant-specific backup purge or ZDR.
--
-- This RPC creates accepted+verified evidence for the reviewed provider policy
-- and local configuration facts, but keeps control sufficiency partial whenever
-- tenant-specific backup purge / external propagation is not demonstrated.

create or replace function public.record_processing_provider_retention_assurance_v1(
  p_actor_id uuid,
  p_organization_id uuid,
  p_process_id uuid,
  p_request_key uuid,
  p_payload jsonb
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
  v_vendor public.organization_vendors;
  v_vendor_name text := nullif(btrim(coalesce(p_payload ->> 'vendorName','')), '');
  v_assurance_status text := nullif(btrim(coalesce(p_payload ->> 'assuranceStatus','')), '');
  v_backup_status text := nullif(btrim(coalesce(p_payload ->> 'backupPurgeStatus','')), '');
  v_external_status text := nullif(btrim(coalesce(p_payload ->> 'externalPropagationStatus','')), '');
  v_tenant_config_status text := nullif(btrim(coalesce(p_payload ->> 'tenantConfigurationStatus','')), '');
  v_sources jsonb := coalesce(p_payload -> 'sources', '[]'::jsonb);
  v_local_facts jsonb := coalesce(p_payload -> 'localFacts', '{}'::jsonb);
  v_limitations jsonb := coalesce(p_payload -> 'limitations', '[]'::jsonb);
  v_review_note text := btrim(coalesce(p_payload ->> 'reviewNote',''));
  v_snapshot jsonb;
  v_snapshot_hash text;
  v_existing_id uuid;
  v_existing_hash text;
  v_evidence_id uuid;
  v_source_label text;
begin
  if p_actor_id is null or not exists (
    select 1 from public.organization_members member
    where member.organization_id=p_organization_id
      and member.user_id=p_actor_id
      and member.role in ('owner','admin','compliance')
  ) then
    raise exception using errcode='42501', message='Owner, admin or compliance membership required';
  end if;

  if p_request_key is null then
    raise exception using errcode='22023', message='Provider assurance request key is required';
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

  select vendor.* into v_vendor
  from public.organization_vendors vendor
  where vendor.organization_id=p_organization_id
    and lower(vendor.name)=lower(v_vendor_name)
    and vendor.attributes ->> 'sourceProcessId'=p_process_id::text
  order by vendor.created_at
  limit 1
  for update;

  if v_vendor.id is null then
    raise exception using errcode='23514', message='Provider must be linked to the processing activity';
  end if;

  if v_assurance_status not in ('partial_policy_verified','tenant_configuration_verified')
     or v_backup_status not in ('not_demonstrated','policy_known_configuration_unverified','demonstrated')
     or v_external_status not in ('not_applicable','not_demonstrated','application_state_minimized','demonstrated')
     or v_tenant_config_status not in ('unverified','partially_verified','verified') then
    raise exception using errcode='22023', message='Invalid provider assurance status';
  end if;

  if jsonb_typeof(v_sources) <> 'array' or jsonb_array_length(v_sources) < 1
     or jsonb_typeof(v_local_facts) <> 'object'
     or jsonb_typeof(v_limitations) <> 'array' or jsonb_array_length(v_limitations) < 1 then
    raise exception using errcode='22023', message='Provider assurance requires sources, local facts and explicit limitations';
  end if;

  if exists (
    select 1 from jsonb_array_elements(v_sources) source_ref
    where nullif(btrim(coalesce(source_ref ->> 'type','')), '') is null
       or nullif(btrim(coalesce(source_ref ->> 'label','')), '') is null
       or nullif(btrim(coalesce(source_ref ->> 'reference','')), '') is null
       or nullif(btrim(coalesce(source_ref ->> 'capturedAt','')), '') is null
  ) then
    raise exception using errcode='22023', message='Every provider assurance source requires type, label, reference and capturedAt';
  end if;

  if char_length(v_review_note) < 30 or char_length(v_review_note) > 1800 then
    raise exception using errcode='22023', message='Provider assurance review note must contain between 30 and 1800 characters';
  end if;

  if v_backup_status='demonstrated' and v_tenant_config_status <> 'verified' then
    raise exception using errcode='23514', message='Backup purge cannot be demonstrated without verified tenant configuration evidence';
  end if;

  if v_external_status='demonstrated' and v_tenant_config_status <> 'verified' then
    raise exception using errcode='23514', message='External propagation cannot be demonstrated without verified tenant configuration evidence';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':provider-retention-assurance:' || p_process_id::text || ':' || lower(v_vendor_name),21719)
  );

  v_snapshot := jsonb_build_object(
    'schemaVersion',1,
    'requestKey',p_request_key,
    'organizationId',p_organization_id,
    'projectId',v_project_id,
    'caseId',v_case_id,
    'controlId',v_control_id,
    'processId',p_process_id,
    'processCode',v_process.code,
    'processName',v_process.name,
    'vendorId',v_vendor.id,
    'vendorName',v_vendor.name,
    'assuranceStatus',v_assurance_status,
    'backupPurgeStatus',v_backup_status,
    'externalPropagationStatus',v_external_status,
    'tenantConfigurationStatus',v_tenant_config_status,
    'sources',v_sources,
    'localFacts',v_local_facts,
    'limitations',v_limitations,
    'reviewNote',v_review_note
  );
  v_snapshot_hash := pg_catalog.encode(extensions.digest(v_snapshot::text,'sha256'),'hex');

  select evidence.id, evidence.integrity_hash
    into v_existing_id, v_existing_hash
  from public.evidence evidence
  where evidence.organization_id=p_organization_id
    and evidence.project_id=v_project_id
    and evidence.metadata ->> 'scope'='processing_provider_retention_assurance'
    and evidence.metadata ->> 'processId'=p_process_id::text
    and lower(evidence.metadata ->> 'vendorName')=lower(v_vendor_name)
  order by evidence.created_at
  limit 1
  for update;

  if v_existing_id is not null then
    if v_existing_hash is distinct from v_snapshot_hash then
      raise exception using errcode='23514', message='Provider assurance already exists with different content';
    end if;
    return jsonb_build_object(
      'processId',p_process_id,
      'vendorId',v_vendor.id,
      'vendorName',v_vendor.name,
      'evidenceId',v_existing_id,
      'snapshotHash',v_snapshot_hash,
      'assuranceStatus',v_assurance_status,
      'resumed',true
    );
  end if;

  select string_agg(source_ref ->> 'label',' · ' order by source_ref ->> 'label')
    into v_source_label
  from jsonb_array_elements(v_sources) source_ref;

  select public.create_evidence_record(
    p_actor_id,
    p_organization_id,
    v_project_id,
    left('Assurance de retención y eliminación — ' || v_vendor.name || ' — ' || v_process.name,180),
    'Snapshot revisado de política del proveedor y hechos locales. Acredita el análisis del boundary externo, no una purga de backup o propagación tenant-specific cuando esas capas no están demostradas.',
    'attestation',
    v_source_label,
    null,
    now(),current_date,current_date,now()+interval '90 days',
    v_snapshot_hash,
    'restricted',
    v_control_id
  ) into v_evidence_id;

  update public.evidence evidence
  set validation_status='accepted',
      integrity_status='verified',
      metadata=coalesce(evidence.metadata,'{}'::jsonb) || jsonb_build_object(
        'scope','processing_provider_retention_assurance',
        'processId',p_process_id,
        'vendorId',v_vendor.id,
        'vendorName',v_vendor.name,
        'assuranceStatus',v_assurance_status,
        'backupPurgeStatus',v_backup_status,
        'externalPropagationStatus',v_external_status,
        'tenantConfigurationStatus',v_tenant_config_status,
        'snapshotHash',v_snapshot_hash,
        'snapshot',v_snapshot,
        'backupPurgeDemonstrated',v_backup_status='demonstrated',
        'externalProcessorPropagationDemonstrated',v_external_status in ('demonstrated','not_applicable'),
        'tenantSpecificGuarantee',v_tenant_config_status='verified',
        'limitationsPreserved',true
      ),
      updated_at=now()
  where evidence.id=v_evidence_id
    and evidence.organization_id=p_organization_id;

  insert into public.processing_activity_evidence(
    organization_id,project_id,process_id,evidence_id,relationship_type,linked_by
  ) values (
    p_organization_id,v_project_id,p_process_id,v_evidence_id,'supporting',p_actor_id
  ) on conflict do nothing;

  update public.organization_vendors vendor
  set attributes=coalesce(vendor.attributes,'{}'::jsonb) || jsonb_build_object(
        'retentionAssuranceEvidenceId',v_evidence_id,
        'retentionAssuranceSnapshotHash',v_snapshot_hash,
        'retentionAssuranceStatus',v_assurance_status,
        'backupPurgeStatus',v_backup_status,
        'externalPropagationStatus',v_external_status,
        'tenantConfigurationStatus',v_tenant_config_status,
        'retentionAssuranceReviewedAt',now()
      ),
      updated_at=now()
  where vendor.id=v_vendor.id
    and vendor.organization_id=p_organization_id;

  update public.organization_processes process
  set attributes=coalesce(process.attributes,'{}'::jsonb) || jsonb_build_object(
        'providerRetentionAssuranceEvidenceId',v_evidence_id,
        'providerRetentionAssuranceSnapshotHash',v_snapshot_hash,
        'providerRetentionAssuranceStatus',v_assurance_status,
        'backupPurgeStatus',v_backup_status,
        'externalPropagationStatus',v_external_status,
        'providerTenantConfigurationStatus',v_tenant_config_status
      ),
      updated_at=now()
  where process.id=p_process_id
    and process.organization_id=p_organization_id;

  if v_control_id is not null then
    update public.control_evidence link
    set sufficiency_status=case
          when v_backup_status='demonstrated'
           and v_external_status in ('demonstrated','not_applicable')
           and v_tenant_config_status='verified' then 'sufficient'
          else 'partial'
        end,
        reviewed_by=p_actor_id,
        reviewed_at=now(),
        note='Assurance de proveedor revisado. La suficiencia sólo puede ser completa con evidencia tenant-specific de las capas aplicables.'
    where link.organization_id=p_organization_id
      and link.project_id=v_project_id
      and link.control_id=v_control_id
      and link.evidence_id=v_evidence_id;
  end if;

  if v_case_id is not null then
    insert into public.compliance_case_events(
      organization_id,case_id,actor_id,event_type,summary,changes
    ) values (
      p_organization_id,v_case_id,p_actor_id,
      'processing_provider_retention_assurance_recorded',
      'Assurance de retención y eliminación del proveedor revisado',
      jsonb_build_object(
        'process_id',p_process_id,
        'vendor_id',v_vendor.id,
        'vendor_name',v_vendor.name,
        'evidence_id',v_evidence_id,
        'assurance_status',v_assurance_status,
        'backup_purge_status',v_backup_status,
        'external_propagation_status',v_external_status,
        'tenant_configuration_status',v_tenant_config_status,
        'snapshot_hash',v_snapshot_hash
      )
    );
  end if;

  return jsonb_build_object(
    'processId',p_process_id,
    'vendorId',v_vendor.id,
    'vendorName',v_vendor.name,
    'evidenceId',v_evidence_id,
    'snapshotHash',v_snapshot_hash,
    'assuranceStatus',v_assurance_status,
    'backupPurgeStatus',v_backup_status,
    'externalPropagationStatus',v_external_status,
    'tenantConfigurationStatus',v_tenant_config_status,
    'resumed',false
  );
end;
$function$;

revoke all on function public.record_processing_provider_retention_assurance_v1(
  uuid,uuid,uuid,uuid,jsonb
) from public,anon,authenticated;

grant execute on function public.record_processing_provider_retention_assurance_v1(
  uuid,uuid,uuid,uuid,jsonb
) to service_role,postgres;
