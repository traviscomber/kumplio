-- Block 14: minimum real processing inventory.
-- Adds a reviewed, evidence-backed path over the existing organization digital twin.

create table if not exists public.processing_activity_evidence (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  process_id uuid not null references public.organization_processes(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  relationship_type text not null default 'source',
  linked_by uuid references auth.users(id) on delete set null,
  linked_at timestamptz not null default now(),
  primary key (process_id, evidence_id, relationship_type),
  constraint processing_activity_evidence_relationship_check
    check (relationship_type in ('source', 'attestation', 'supporting'))
);

create table if not exists public.processing_activity_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  case_id uuid references public.compliance_cases(id) on delete set null,
  process_id uuid not null references public.organization_processes(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete restrict,
  control_id uuid references public.controls(id) on delete set null,
  decision text not null,
  completeness text not null,
  review_note text not null,
  unknowns text[] not null default '{}'::text[],
  snapshot jsonb not null,
  snapshot_hash text not null,
  reviewed_by uuid not null references auth.users(id) on delete restrict,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint processing_activity_reviews_decision_check
    check (decision in ('approved', 'changes_requested', 'rejected')),
  constraint processing_activity_reviews_completeness_check
    check (completeness in ('partial', 'complete')),
  constraint processing_activity_reviews_hash_check
    check (snapshot_hash ~ '^[0-9a-f]{64}$'),
  constraint processing_activity_reviews_unique_snapshot
    unique (process_id, snapshot_hash, decision)
);

create index if not exists processing_activity_evidence_org_project_idx
  on public.processing_activity_evidence (organization_id, project_id, process_id);
create index if not exists processing_activity_evidence_evidence_idx
  on public.processing_activity_evidence (evidence_id);
create index if not exists processing_activity_reviews_org_process_idx
  on public.processing_activity_reviews (organization_id, process_id, reviewed_at desc);
create index if not exists processing_activity_reviews_project_idx
  on public.processing_activity_reviews (project_id, reviewed_at desc);
create index if not exists processing_activity_reviews_evidence_idx
  on public.processing_activity_reviews (evidence_id);

alter table public.processing_activity_evidence enable row level security;
alter table public.processing_activity_reviews enable row level security;

revoke all on table public.processing_activity_evidence from public, anon, authenticated;
revoke all on table public.processing_activity_reviews from public, anon, authenticated;
grant select, insert on table public.processing_activity_evidence to service_role;
grant select, insert on table public.processing_activity_reviews to service_role;

create or replace function public.create_processing_activity_inventory_v1(
  p_actor_id uuid,
  p_organization_id uuid,
  p_project_id uuid,
  p_request_key uuid,
  p_payload jsonb,
  p_case_id uuid default null,
  p_control_id uuid default null
)
returns jsonb
language plpgsql
set search_path to ''
as $function$
declare
  v_name text := btrim(coalesce(p_payload ->> 'name', ''));
  v_description text := nullif(btrim(coalesce(p_payload ->> 'description', '')), '');
  v_purpose text := btrim(coalesce(p_payload ->> 'purpose', ''));
  v_legal_basis text := btrim(coalesce(p_payload ->> 'proposedLegalBasis', ''));
  v_owner_id uuid;
  v_criticality text := coalesce(nullif(p_payload ->> 'criticality', ''), 'medium');
  v_sensitivity text := coalesce(nullif(p_payload ->> 'sensitivity', ''), 'confidential');
  v_retention_rule text := btrim(coalesce(p_payload ->> 'retentionRule', ''));
  v_cross_border boolean := coalesce((p_payload ->> 'crossBorderTransfer')::boolean, false);
  v_contains_sensitive boolean := coalesce((p_payload ->> 'containsSensitiveData')::boolean, false);
  v_review_note text := btrim(coalesce(p_payload #>> '{review,note}', ''));
  v_decision text := coalesce(nullif(p_payload #>> '{review,decision}', ''), 'approved');
  v_completeness text := coalesce(nullif(p_payload #>> '{review,completeness}', ''), 'partial');
  v_source_label text := btrim(coalesce(p_payload #>> '{source,label}', ''));
  v_source_reference text := nullif(btrim(coalesce(p_payload #>> '{source,reference}', '')), '');
  v_source_type text := coalesce(nullif(p_payload #>> '{source,type}', ''), 'system');
  v_asset_name text := btrim(coalesce(p_payload #>> '{asset,name}', ''));
  v_asset_type text := btrim(coalesce(p_payload #>> '{asset,type}', ''));
  v_hosting_country text := nullif(btrim(coalesce(p_payload #>> '{asset,hostingCountry}', '')), '');
  v_provider_name text := nullif(btrim(coalesce(p_payload #>> '{asset,providerName}', '')), '');
  v_vendor_name text := nullif(btrim(coalesce(p_payload #>> '{vendor,name}', '')), '');
  v_vendor_service text := nullif(btrim(coalesce(p_payload #>> '{vendor,serviceCategory}', '')), '');
  v_vendor_country text := nullif(btrim(coalesce(p_payload #>> '{vendor,country}', '')), '');
  v_vendor_personal boolean := coalesce((p_payload #>> '{vendor,processesPersonalData}')::boolean, false);
  v_vendor_cross_border boolean := coalesce((p_payload #>> '{vendor,crossBorderTransfer}')::boolean, false);
  v_vendor_risk text := coalesce(nullif(p_payload #>> '{vendor,riskTier}', ''), 'medium');
  v_data_subjects text[];
  v_data_categories text[];
  v_unknowns text[];
  v_suffix text := upper(substr(replace(p_request_key::text, '-', ''), 1, 12));
  v_process_code text;
  v_dataset_code text;
  v_asset_code text;
  v_vendor_code text;
  v_process_id uuid;
  v_dataset_id uuid;
  v_asset_id uuid;
  v_vendor_id uuid;
  v_evidence_id uuid;
  v_review_id uuid;
  v_evaluation_id uuid;
  v_control_id uuid := p_control_id;
  v_snapshot jsonb;
  v_snapshot_hash text;
  v_existing_hash text;
  v_created_process boolean := false;
  v_created_dataset boolean := false;
  v_created_asset boolean := false;
  v_created_vendor boolean := false;
  v_created_evidence boolean := false;
  v_created_review boolean := false;
  v_created_evaluation boolean := false;
  v_event_created boolean := false;
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  if p_request_key is null then
    raise exception using errcode = '22023', message = 'Processing inventory request key is required';
  end if;

  select (p_payload ->> 'ownerId')::uuid into v_owner_id;
  if v_owner_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = v_owner_id
  ) then
    raise exception using errcode = '23514', message = 'Processing activity owner must belong to the organization';
  end if;

  if not exists (
    select 1
    from public.projects project
    where project.id = p_project_id
      and project.organization_id = p_organization_id
  ) then
    raise exception using errcode = '23514', message = 'Project must belong to the organization';
  end if;

  if p_case_id is not null and not exists (
    select 1
    from public.compliance_cases compliance_case
    where compliance_case.id = p_case_id
      and compliance_case.organization_id = p_organization_id
      and compliance_case.project_id = p_project_id
  ) then
    raise exception using errcode = '23514', message = 'Case must belong to the organization and project';
  end if;

  if v_control_id is not null and not exists (
    select 1
    from public.controls control
    where control.id = v_control_id
      and control.organization_id = p_organization_id
      and control.project_id = p_project_id
  ) then
    raise exception using errcode = '23514', message = 'Control must belong to the organization and project';
  end if;

  if char_length(v_name) < 3 or char_length(v_name) > 180 then
    raise exception using errcode = '22023', message = 'Invalid processing activity name';
  end if;
  if char_length(v_purpose) < 10 or char_length(v_purpose) > 2000 then
    raise exception using errcode = '22023', message = 'Processing purpose must contain between 10 and 2000 characters';
  end if;
  if char_length(v_legal_basis) < 3 or char_length(v_legal_basis) > 1000 then
    raise exception using errcode = '22023', message = 'Proposed legal basis is required';
  end if;
  if char_length(v_retention_rule) < 3 or char_length(v_retention_rule) > 1000 then
    raise exception using errcode = '22023', message = 'Retention rule or explicit unknown is required';
  end if;
  if char_length(v_asset_name) < 2 or char_length(v_asset_name) > 180
     or char_length(v_asset_type) < 2 or char_length(v_asset_type) > 120 then
    raise exception using errcode = '22023', message = 'A system or repository is required';
  end if;
  if char_length(v_review_note) < 10 or char_length(v_review_note) > 4000 then
    raise exception using errcode = '22023', message = 'Human review note must contain between 10 and 4000 characters';
  end if;
  if char_length(v_source_label) < 3 or char_length(v_source_label) > 300 then
    raise exception using errcode = '22023', message = 'A real source label is required';
  end if;
  if v_decision not in ('approved', 'changes_requested', 'rejected') then
    raise exception using errcode = '22023', message = 'Invalid review decision';
  end if;
  if v_completeness not in ('partial', 'complete') then
    raise exception using errcode = '22023', message = 'Invalid completeness state';
  end if;
  if v_criticality not in ('low', 'medium', 'high', 'critical')
     or v_vendor_risk not in ('low', 'medium', 'high', 'critical') then
    raise exception using errcode = '22023', message = 'Invalid risk classification';
  end if;
  if v_sensitivity not in ('public', 'internal', 'confidential', 'restricted') then
    raise exception using errcode = '22023', message = 'Invalid dataset sensitivity';
  end if;

  select coalesce(array_agg(value order by value), '{}'::text[])
  into v_data_subjects
  from (
    select distinct btrim(subject.value) as value
    from jsonb_array_elements_text(coalesce(p_payload -> 'dataSubjects', '[]'::jsonb)) subject(value)
    where btrim(subject.value) <> ''
  ) normalized;

  select coalesce(array_agg(value order by value), '{}'::text[])
  into v_data_categories
  from (
    select distinct btrim(category.value) as value
    from jsonb_array_elements_text(coalesce(p_payload -> 'dataCategories', '[]'::jsonb)) category(value)
    where btrim(category.value) <> ''
  ) normalized;

  select coalesce(array_agg(value order by value), '{}'::text[])
  into v_unknowns
  from (
    select distinct btrim(item.value) as value
    from jsonb_array_elements_text(coalesce(p_payload #> '{review,unknowns}', '[]'::jsonb)) item(value)
    where btrim(item.value) <> ''
  ) normalized;

  if cardinality(v_data_subjects) = 0 or cardinality(v_data_categories) = 0 then
    raise exception using errcode = '22023', message = 'Data subjects and categories are required';
  end if;
  if v_completeness = 'complete' and cardinality(v_unknowns) > 0 then
    raise exception using errcode = '22023', message = 'A complete activity cannot retain unresolved unknowns';
  end if;
  if v_completeness = 'partial' and cardinality(v_unknowns) = 0 then
    raise exception using errcode = '22023', message = 'A partial activity must preserve at least one unresolved unknown';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_organization_id::text || ':processing-inventory:' || p_request_key::text,
      21719
    )
  );

  v_process_code := 'TRT-' || v_suffix;
  v_dataset_code := 'DAT-' || v_suffix;
  v_asset_code := 'SYS-' || v_suffix;
  v_vendor_code := 'VEN-' || v_suffix;

  select process.id
  into v_process_id
  from public.organization_processes process
  where process.organization_id = p_organization_id
    and process.code = v_process_code
  for update;

  if v_process_id is null then
    insert into public.organization_processes (
      organization_id, code, name, description, process_type, criticality,
      owner_user_id, lifecycle_status, attributes, created_by
    ) values (
      p_organization_id, v_process_code, v_name, v_description, 'processing_activity', v_criticality,
      v_owner_id, 'active',
      jsonb_build_object(
        'purpose', v_purpose,
        'proposedLegalBasis', v_legal_basis,
        'basisStatus', 'proposed',
        'projectId', p_project_id,
        'caseId', p_case_id,
        'processingRequestKey', p_request_key,
        'reviewDecision', v_decision,
        'completeness', v_completeness,
        'unknowns', to_jsonb(v_unknowns),
        'source', jsonb_build_object('type', v_source_type, 'label', v_source_label, 'reference', v_source_reference)
      ),
      p_actor_id
    )
    returning id into v_process_id;
    v_created_process := true;
  else
    update public.organization_processes
    set name = v_name,
        description = v_description,
        criticality = v_criticality,
        owner_user_id = v_owner_id,
        lifecycle_status = 'active',
        attributes = coalesce(attributes, '{}'::jsonb) || jsonb_build_object(
          'purpose', v_purpose,
          'proposedLegalBasis', v_legal_basis,
          'basisStatus', 'proposed',
          'projectId', p_project_id,
          'caseId', p_case_id,
          'processingRequestKey', p_request_key,
          'reviewDecision', v_decision,
          'completeness', v_completeness,
          'unknowns', to_jsonb(v_unknowns),
          'source', jsonb_build_object('type', v_source_type, 'label', v_source_label, 'reference', v_source_reference)
        ),
        updated_at = now()
    where id = v_process_id;
  end if;

  select dataset.id
  into v_dataset_id
  from public.organization_datasets dataset
  where dataset.organization_id = p_organization_id
    and dataset.code = v_dataset_code
  for update;

  if v_dataset_id is null then
    insert into public.organization_datasets (
      organization_id, code, name, data_subjects, data_categories, sensitivity,
      legal_basis, retention_rule, cross_border_transfer, owner_user_id,
      lifecycle_status, attributes, created_by
    ) values (
      p_organization_id, v_dataset_code, v_name || ' — datos tratados',
      v_data_subjects, v_data_categories, v_sensitivity,
      v_legal_basis, v_retention_rule, v_cross_border, v_owner_id,
      'active',
      jsonb_build_object(
        'basisStatus', 'proposed',
        'processingRequestKey', p_request_key,
        'sourceProcessId', v_process_id
      ),
      p_actor_id
    )
    returning id into v_dataset_id;
    v_created_dataset := true;
  else
    update public.organization_datasets
    set name = v_name || ' — datos tratados',
        data_subjects = v_data_subjects,
        data_categories = v_data_categories,
        sensitivity = v_sensitivity,
        legal_basis = v_legal_basis,
        retention_rule = v_retention_rule,
        cross_border_transfer = v_cross_border,
        owner_user_id = v_owner_id,
        lifecycle_status = 'active',
        attributes = coalesce(attributes, '{}'::jsonb) || jsonb_build_object(
          'basisStatus', 'proposed',
          'processingRequestKey', p_request_key,
          'sourceProcessId', v_process_id
        ),
        updated_at = now()
    where id = v_dataset_id;
  end if;

  select asset.id
  into v_asset_id
  from public.organization_assets asset
  where asset.organization_id = p_organization_id
    and asset.code = v_asset_code
  for update;

  if v_asset_id is null then
    insert into public.organization_assets (
      organization_id, code, name, asset_type, description, criticality,
      owner_user_id, provider_name, hosting_country,
      contains_personal_data, contains_sensitive_data,
      lifecycle_status, attributes, created_by
    ) values (
      p_organization_id, v_asset_code, v_asset_name, v_asset_type,
      'Sistema o repositorio vinculado a ' || v_name, v_criticality,
      v_owner_id, coalesce(v_provider_name, v_vendor_name), v_hosting_country,
      true, v_contains_sensitive,
      'active',
      jsonb_build_object('processingRequestKey', p_request_key, 'sourceProcessId', v_process_id),
      p_actor_id
    )
    returning id into v_asset_id;
    v_created_asset := true;
  else
    update public.organization_assets
    set name = v_asset_name,
        asset_type = v_asset_type,
        criticality = v_criticality,
        owner_user_id = v_owner_id,
        provider_name = coalesce(v_provider_name, v_vendor_name),
        hosting_country = v_hosting_country,
        contains_personal_data = true,
        contains_sensitive_data = v_contains_sensitive,
        lifecycle_status = 'active',
        attributes = coalesce(attributes, '{}'::jsonb) || jsonb_build_object(
          'processingRequestKey', p_request_key,
          'sourceProcessId', v_process_id
        ),
        updated_at = now()
    where id = v_asset_id;
  end if;

  if v_vendor_name is not null then
    select vendor.id
    into v_vendor_id
    from public.organization_vendors vendor
    where vendor.organization_id = p_organization_id
      and vendor.code = v_vendor_code
    for update;

    if v_vendor_id is null then
      insert into public.organization_vendors (
        organization_id, code, name, service_category, country,
        processes_personal_data, cross_border_transfer, risk_tier,
        lifecycle_status, attributes, created_by
      ) values (
        p_organization_id, v_vendor_code, v_vendor_name, v_vendor_service, v_vendor_country,
        v_vendor_personal, v_vendor_cross_border, v_vendor_risk,
        'active',
        jsonb_build_object('processingRequestKey', p_request_key, 'sourceProcessId', v_process_id),
        p_actor_id
      )
      returning id into v_vendor_id;
      v_created_vendor := true;
    else
      update public.organization_vendors
      set name = v_vendor_name,
          service_category = v_vendor_service,
          country = v_vendor_country,
          processes_personal_data = v_vendor_personal,
          cross_border_transfer = v_vendor_cross_border,
          risk_tier = v_vendor_risk,
          lifecycle_status = 'active',
          attributes = coalesce(attributes, '{}'::jsonb) || jsonb_build_object(
            'processingRequestKey', p_request_key,
            'sourceProcessId', v_process_id
          ),
          updated_at = now()
      where id = v_vendor_id;
    end if;
  end if;

  insert into public.organization_process_datasets (process_id, dataset_id, relationship_type)
  values (v_process_id, v_dataset_id, 'processes')
  on conflict do nothing;

  insert into public.organization_process_assets (process_id, asset_id, relationship_type)
  values (v_process_id, v_asset_id, 'uses')
  on conflict do nothing;

  insert into public.organization_asset_datasets (asset_id, dataset_id, relationship_type)
  values (v_asset_id, v_dataset_id, 'stores')
  on conflict do nothing;

  insert into public.digital_twin_relations (
    organization_id, source_type, source_id, relation_type, target_type, target_id,
    status, created_by
  ) values
    (p_organization_id, 'process', v_process_id, 'processes', 'dataset', v_dataset_id, 'active', p_actor_id),
    (p_organization_id, 'process', v_process_id, 'uses', 'asset', v_asset_id, 'active', p_actor_id),
    (p_organization_id, 'asset', v_asset_id, 'stores', 'dataset', v_dataset_id, 'active', p_actor_id)
  on conflict (organization_id, source_type, source_id, relation_type, target_type, target_id)
  do update set status = 'active';

  if v_vendor_id is not null then
    insert into public.organization_vendor_assets (vendor_id, asset_id, relationship_type)
    values (v_vendor_id, v_asset_id, 'provides')
    on conflict do nothing;

    insert into public.digital_twin_relations (
      organization_id, source_type, source_id, relation_type, target_type, target_id,
      status, created_by
    ) values
      (p_organization_id, 'asset', v_asset_id, 'provided_by', 'vendor', v_vendor_id, 'active', p_actor_id),
      (p_organization_id, 'process', v_process_id, 'depends_on', 'vendor', v_vendor_id, 'active', p_actor_id)
    on conflict (organization_id, source_type, source_id, relation_type, target_type, target_id)
    do update set status = 'active';
  end if;

  if v_control_id is null then
    select control.id
    into v_control_id
    from public.controls control
    where control.organization_id = p_organization_id
      and control.project_id = p_project_id
      and control.lifecycle_status = 'active'
      and control.code like 'BASE-INVENTORY-%'
    order by control.created_at
    limit 1;
  end if;

  v_snapshot := jsonb_build_object(
    'version', 1,
    'requestKey', p_request_key,
    'organizationId', p_organization_id,
    'projectId', p_project_id,
    'caseId', p_case_id,
    'process', jsonb_build_object(
      'id', v_process_id,
      'name', v_name,
      'description', v_description,
      'purpose', v_purpose,
      'proposedLegalBasis', v_legal_basis,
      'ownerId', v_owner_id,
      'criticality', v_criticality
    ),
    'dataset', jsonb_build_object(
      'id', v_dataset_id,
      'dataSubjects', to_jsonb(v_data_subjects),
      'dataCategories', to_jsonb(v_data_categories),
      'sensitivity', v_sensitivity,
      'retentionRule', v_retention_rule,
      'crossBorderTransfer', v_cross_border
    ),
    'asset', jsonb_build_object(
      'id', v_asset_id,
      'name', v_asset_name,
      'type', v_asset_type,
      'hostingCountry', v_hosting_country,
      'providerName', coalesce(v_provider_name, v_vendor_name),
      'containsSensitiveData', v_contains_sensitive
    ),
    'vendor', case when v_vendor_id is null then null else jsonb_build_object(
      'id', v_vendor_id,
      'name', v_vendor_name,
      'serviceCategory', v_vendor_service,
      'country', v_vendor_country,
      'processesPersonalData', v_vendor_personal,
      'crossBorderTransfer', v_vendor_cross_border,
      'riskTier', v_vendor_risk
    ) end,
    'review', jsonb_build_object(
      'decision', v_decision,
      'completeness', v_completeness,
      'unknowns', to_jsonb(v_unknowns),
      'note', v_review_note
    ),
    'source', jsonb_build_object(
      'type', v_source_type,
      'label', v_source_label,
      'reference', v_source_reference
    )
  );

  v_snapshot_hash := pg_catalog.encode(extensions.digest(v_snapshot::text, 'sha256'), 'hex');

  select evidence.id, evidence.integrity_hash
  into v_evidence_id, v_existing_hash
  from public.evidence evidence
  where evidence.organization_id = p_organization_id
    and evidence.project_id = p_project_id
    and evidence.metadata ->> 'processingRequestKey' = p_request_key::text
  order by evidence.created_at
  limit 1
  for update;

  if v_evidence_id is null then
    select public.create_evidence_record(
      p_actor_id,
      p_organization_id,
      p_project_id,
      'Declaración revisada — ' || v_name,
      'Snapshot estructurado y revisado de la actividad de tratamiento. Demuestra la declaración y su procedencia, no cumplimiento legal ni completitud del universo.',
      'attestation',
      v_source_label,
      null,
      now(),
      current_date,
      current_date,
      now() + interval '90 days',
      v_snapshot_hash,
      'confidential',
      v_control_id
    ) into v_evidence_id;

    update public.evidence
    set validation_status = case when v_decision = 'approved' then 'accepted' else 'pending' end,
        integrity_status = 'verified',
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
          'processingRequestKey', p_request_key,
          'processId', v_process_id,
          'snapshotHash', v_snapshot_hash,
          'snapshot', v_snapshot,
          'scope', 'processing_activity_inventory',
          'sourceType', v_source_type,
          'sourceReference', v_source_reference,
          'completeness', v_completeness,
          'unknowns', to_jsonb(v_unknowns),
          'limitationsPreserved', true
        ),
        updated_at = now()
    where id = v_evidence_id;

    v_created_evidence := true;
  elsif v_existing_hash is distinct from v_snapshot_hash then
    raise exception using errcode = '23514', message = 'Request key already exists with a different reviewed snapshot';
  end if;

  insert into public.processing_activity_evidence (
    organization_id, project_id, process_id, evidence_id, relationship_type, linked_by
  ) values (
    p_organization_id, p_project_id, v_process_id, v_evidence_id, 'attestation', p_actor_id
  )
  on conflict do nothing;

  if v_control_id is not null then
    update public.control_evidence
    set sufficiency_status = 'partial',
        reviewed_by = p_actor_id,
        reviewed_at = now(),
        note = 'Evidencia suficiente para esta actividad registrada; el inventario organizacional permanece parcial.'
    where control_id = v_control_id
      and evidence_id = v_evidence_id
      and organization_id = p_organization_id
      and project_id = p_project_id;

    select evaluation.id
    into v_evaluation_id
    from public.control_evaluations evaluation
    where evaluation.control_id = v_control_id
      and evaluation.organization_id = p_organization_id
      and evaluation.summary like '[processing:' || p_request_key::text || ']%'
    order by evaluation.created_at
    limit 1;

    if v_evaluation_id is null then
      select public.create_control_evaluation_record(
        p_actor_id,
        p_organization_id,
        v_control_id,
        p_case_id,
        'operating',
        'partial',
        '[processing:' || p_request_key::text || '] Se revisó una actividad real con propósito, titulares, categorías, sistema, dataset, tercero y fuente. La operación permanece parcial porque aún existen desconocidos y no se ha conciliado el universo completo.',
        1,
        current_date,
        current_date,
        array[v_evidence_id]
      ) into v_evaluation_id;
      v_created_evaluation := true;
    end if;
  end if;

  select review.id
  into v_review_id
  from public.processing_activity_reviews review
  where review.process_id = v_process_id
    and review.snapshot_hash = v_snapshot_hash
    and review.decision = v_decision
  limit 1;

  if v_review_id is null then
    insert into public.processing_activity_reviews (
      organization_id, project_id, case_id, process_id, evidence_id, control_id,
      decision, completeness, review_note, unknowns, snapshot, snapshot_hash,
      reviewed_by
    ) values (
      p_organization_id, p_project_id, p_case_id, v_process_id, v_evidence_id, v_control_id,
      v_decision, v_completeness, v_review_note, v_unknowns, v_snapshot, v_snapshot_hash,
      p_actor_id
    )
    returning id into v_review_id;
    v_created_review := true;
  end if;

  update public.organization_processes
  set attributes = coalesce(attributes, '{}'::jsonb) || jsonb_build_object(
        'latestReviewId', v_review_id,
        'latestReviewAt', now(),
        'latestEvidenceId', v_evidence_id,
        'latestSnapshotHash', v_snapshot_hash,
        'reviewDecision', v_decision,
        'completeness', v_completeness,
        'unknowns', to_jsonb(v_unknowns),
        'controlId', v_control_id
      ),
      updated_at = now()
  where id = v_process_id;

  if p_case_id is not null and not exists (
    select 1
    from public.compliance_case_events event
    where event.case_id = p_case_id
      and event.organization_id = p_organization_id
      and event.event_type = 'processing_activity_reviewed'
      and event.changes ->> 'processing_request_key' = p_request_key::text
  ) then
    insert into public.compliance_case_events (
      organization_id, case_id, actor_id, event_type, summary, changes
    ) values (
      p_organization_id,
      p_case_id,
      p_actor_id,
      'processing_activity_reviewed',
      'Actividad de tratamiento registrada y revisada',
      jsonb_build_object(
        'processing_request_key', p_request_key,
        'process_id', v_process_id,
        'dataset_id', v_dataset_id,
        'asset_id', v_asset_id,
        'vendor_id', v_vendor_id,
        'evidence_id', v_evidence_id,
        'review_id', v_review_id,
        'control_id', v_control_id,
        'completeness', v_completeness,
        'unknown_count', cardinality(v_unknowns)
      )
    );
    v_event_created := true;
  end if;

  return jsonb_build_object(
    'requestKey', p_request_key,
    'processId', v_process_id,
    'datasetId', v_dataset_id,
    'assetId', v_asset_id,
    'vendorId', v_vendor_id,
    'evidenceId', v_evidence_id,
    'reviewId', v_review_id,
    'controlId', v_control_id,
    'evaluationId', v_evaluation_id,
    'snapshotHash', v_snapshot_hash,
    'completeness', v_completeness,
    'unknownCount', cardinality(v_unknowns),
    'created', jsonb_build_object(
      'process', v_created_process,
      'dataset', v_created_dataset,
      'asset', v_created_asset,
      'vendor', v_created_vendor,
      'evidence', v_created_evidence,
      'review', v_created_review,
      'evaluation', v_created_evaluation,
      'caseEvent', v_event_created
    ),
    'resumed', not (
      v_created_process or v_created_dataset or v_created_asset or v_created_vendor
      or v_created_evidence or v_created_review or v_created_evaluation or v_event_created
    )
  );
end;
$function$;

revoke all on function public.create_processing_activity_inventory_v1(
  uuid, uuid, uuid, uuid, jsonb, uuid, uuid
) from public, anon, authenticated;
grant execute on function public.create_processing_activity_inventory_v1(
  uuid, uuid, uuid, uuid, jsonb, uuid, uuid
) to service_role;
