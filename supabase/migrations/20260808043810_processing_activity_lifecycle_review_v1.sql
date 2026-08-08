-- Block 16 task 2: versioned legal and lifecycle review for processing activities.
create table if not exists public.processing_activity_lifecycle_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  case_id uuid references public.compliance_cases(id) on delete set null,
  process_id uuid not null references public.organization_processes(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete restrict,
  control_id uuid references public.controls(id) on delete set null,
  request_key uuid not null,
  version integer not null,
  supersedes_id uuid references public.processing_activity_lifecycle_reviews(id) on delete set null,
  decision text not null,
  basis_status text not null,
  retention_status text not null,
  recipients_status text not null,
  subprocessors_status text not null,
  transfers_status text not null,
  basis_type text,
  basis_summary text,
  retention_rule text,
  retention_trigger text,
  retention_period text,
  recipients jsonb not null default '[]'::jsonb,
  subprocessors jsonb not null default '[]'::jsonb,
  transfers jsonb not null default '[]'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  unknowns text[] not null default '{}'::text[],
  review_note text not null,
  snapshot jsonb not null,
  snapshot_hash text not null,
  reviewed_by uuid not null references auth.users(id) on delete restrict,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint processing_activity_lifecycle_request_unique unique (organization_id, request_key),
  constraint processing_activity_lifecycle_version_unique unique (process_id, version),
  constraint processing_activity_lifecycle_version_check check (version > 0),
  constraint processing_activity_lifecycle_decision_check check (decision in ('approved', 'changes_requested', 'rejected')),
  constraint processing_activity_lifecycle_basis_status_check check (basis_status in ('validated', 'needs_changes', 'pending_evidence', 'not_applicable')),
  constraint processing_activity_lifecycle_retention_status_check check (retention_status in ('validated', 'needs_changes', 'pending_evidence', 'not_applicable')),
  constraint processing_activity_lifecycle_recipients_status_check check (recipients_status in ('validated', 'needs_changes', 'pending_evidence', 'not_applicable')),
  constraint processing_activity_lifecycle_subprocessors_status_check check (subprocessors_status in ('validated', 'needs_changes', 'pending_evidence', 'not_applicable')),
  constraint processing_activity_lifecycle_transfers_status_check check (transfers_status in ('validated', 'needs_changes', 'pending_evidence', 'not_applicable')),
  constraint processing_activity_lifecycle_recipients_json_check check (jsonb_typeof(recipients) = 'array'),
  constraint processing_activity_lifecycle_subprocessors_json_check check (jsonb_typeof(subprocessors) = 'array'),
  constraint processing_activity_lifecycle_transfers_json_check check (jsonb_typeof(transfers) = 'array'),
  constraint processing_activity_lifecycle_sources_json_check check (jsonb_typeof(source_refs) = 'array'),
  constraint processing_activity_lifecycle_hash_check check (snapshot_hash ~ '^[0-9a-f]{64}$'),
  constraint processing_activity_lifecycle_approved_check check (
    decision <> 'approved' or (
      basis_status in ('validated', 'not_applicable')
      and retention_status in ('validated', 'not_applicable')
      and recipients_status in ('validated', 'not_applicable')
      and subprocessors_status in ('validated', 'not_applicable')
      and transfers_status in ('validated', 'not_applicable')
      and cardinality(unknowns) = 0
    )
  ),
  constraint processing_activity_lifecycle_changes_check check (
    decision <> 'changes_requested' or (
      cardinality(unknowns) > 0
      or basis_status not in ('validated', 'not_applicable')
      or retention_status not in ('validated', 'not_applicable')
      or recipients_status not in ('validated', 'not_applicable')
      or subprocessors_status not in ('validated', 'not_applicable')
      or transfers_status not in ('validated', 'not_applicable')
    )
  )
);

create index if not exists processing_activity_lifecycle_org_process_idx on public.processing_activity_lifecycle_reviews (organization_id, process_id, version desc);
create index if not exists processing_activity_lifecycle_project_idx on public.processing_activity_lifecycle_reviews (project_id, reviewed_at desc);
create index if not exists processing_activity_lifecycle_evidence_idx on public.processing_activity_lifecycle_reviews (evidence_id);
create index if not exists processing_activity_lifecycle_supersedes_idx on public.processing_activity_lifecycle_reviews (supersedes_id);

alter table public.processing_activity_lifecycle_reviews enable row level security;
revoke all on table public.processing_activity_lifecycle_reviews from public, anon, authenticated;
grant select, insert on table public.processing_activity_lifecycle_reviews to service_role;
drop policy if exists "processing lifecycle reviews browser deny" on public.processing_activity_lifecycle_reviews;
create policy "processing lifecycle reviews browser deny" on public.processing_activity_lifecycle_reviews for all to anon, authenticated using (false) with check (false);

create or replace function public.review_processing_activity_lifecycle_v1(
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
  v_process_name text;
  v_project_id uuid;
  v_case_id uuid;
  v_control_id uuid;
  v_decision text := coalesce(nullif(p_payload ->> 'decision', ''), 'changes_requested');
  v_basis_status text := coalesce(nullif(p_payload #>> '{basis,status}', ''), 'pending_evidence');
  v_retention_status text := coalesce(nullif(p_payload #>> '{retention,status}', ''), 'pending_evidence');
  v_recipients_status text := coalesce(nullif(p_payload #>> '{recipientsReview,status}', ''), 'pending_evidence');
  v_subprocessors_status text := coalesce(nullif(p_payload #>> '{subprocessorsReview,status}', ''), 'pending_evidence');
  v_transfers_status text := coalesce(nullif(p_payload #>> '{transfersReview,status}', ''), 'pending_evidence');
  v_basis_type text := nullif(btrim(coalesce(p_payload #>> '{basis,type}', '')), '');
  v_basis_summary text := nullif(btrim(coalesce(p_payload #>> '{basis,summary}', '')), '');
  v_retention_rule text := nullif(btrim(coalesce(p_payload #>> '{retention,rule}', '')), '');
  v_retention_trigger text := nullif(btrim(coalesce(p_payload #>> '{retention,trigger}', '')), '');
  v_retention_period text := nullif(btrim(coalesce(p_payload #>> '{retention,period}', '')), '');
  v_recipients jsonb := coalesce(p_payload -> 'recipients', '[]'::jsonb);
  v_subprocessors jsonb := coalesce(p_payload -> 'subprocessors', '[]'::jsonb);
  v_transfers jsonb := coalesce(p_payload -> 'transfers', '[]'::jsonb);
  v_source_refs jsonb := coalesce(p_payload -> 'sourceRefs', '[]'::jsonb);
  v_review_note text := btrim(coalesce(p_payload ->> 'reviewNote', ''));
  v_unknowns text[];
  v_version integer;
  v_previous_review_id uuid;
  v_existing_review_id uuid;
  v_existing_hash text;
  v_existing_evidence_id uuid;
  v_snapshot jsonb;
  v_snapshot_hash text;
  v_evidence_id uuid;
  v_review_id uuid;
  v_source_label text;
  v_event_created boolean := false;
  v_all_statuses text[] := array['validated', 'needs_changes', 'pending_evidence', 'not_applicable'];
  v_final_statuses text[] := array['validated', 'not_applicable'];
begin
  if p_actor_id is null or not exists (
    select 1 from public.organization_members member
    where member.organization_id = p_organization_id and member.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;
  if p_request_key is null then
    raise exception using errcode = '22023', message = 'Lifecycle review request key is required';
  end if;
  select process.name into v_process_name
  from public.organization_processes process
  where process.id = p_process_id and process.organization_id = p_organization_id
    and process.process_type = 'processing_activity' and process.lifecycle_status <> 'retired';
  if v_process_name is null then
    raise exception using errcode = '23514', message = 'Processing activity must belong to the organization';
  end if;
  select review.project_id, review.case_id, review.control_id
  into v_project_id, v_case_id, v_control_id
  from public.processing_activity_reviews review
  where review.organization_id = p_organization_id and review.process_id = p_process_id
  order by review.reviewed_at desc, review.created_at desc limit 1;
  if v_project_id is null then
    raise exception using errcode = '23514', message = 'A reviewed processing inventory record is required before lifecycle review';
  end if;
  if v_decision not in ('approved', 'changes_requested', 'rejected') then
    raise exception using errcode = '22023', message = 'Invalid lifecycle review decision';
  end if;
  if not (v_basis_status = any(v_all_statuses)) or not (v_retention_status = any(v_all_statuses))
     or not (v_recipients_status = any(v_all_statuses)) or not (v_subprocessors_status = any(v_all_statuses))
     or not (v_transfers_status = any(v_all_statuses)) then
    raise exception using errcode = '22023', message = 'Invalid lifecycle dimension status';
  end if;
  if jsonb_typeof(v_recipients) <> 'array' or jsonb_typeof(v_subprocessors) <> 'array'
     or jsonb_typeof(v_transfers) <> 'array' or jsonb_typeof(v_source_refs) <> 'array' then
    raise exception using errcode = '22023', message = 'Recipients, subprocessors, transfers and sources must be arrays';
  end if;
  select coalesce(array_agg(value order by value), '{}'::text[]) into v_unknowns
  from (
    select distinct btrim(item.value) as value
    from jsonb_array_elements_text(coalesce(p_payload -> 'unknowns', '[]'::jsonb)) item(value)
    where btrim(item.value) <> ''
  ) normalized;
  if char_length(v_review_note) < 20 or char_length(v_review_note) > 5000 then
    raise exception using errcode = '22023', message = 'Lifecycle review note must contain between 20 and 5000 characters';
  end if;
  if jsonb_array_length(v_source_refs) = 0 then
    raise exception using errcode = '22023', message = 'At least one reviewed source is required';
  end if;
  if v_basis_status = 'validated' and (v_basis_type is null or v_basis_summary is null or char_length(v_basis_summary) < 10) then
    raise exception using errcode = '22023', message = 'Validated legal basis requires type and summary';
  end if;
  if v_retention_status = 'validated' and (v_retention_rule is null or v_retention_trigger is null or v_retention_period is null) then
    raise exception using errcode = '22023', message = 'Validated retention requires rule, trigger and period';
  end if;
  if v_recipients_status = 'validated' and jsonb_array_length(v_recipients) = 0 then
    raise exception using errcode = '22023', message = 'Validated recipients require at least one recipient';
  end if;
  if v_subprocessors_status = 'validated' and jsonb_array_length(v_subprocessors) = 0 then
    raise exception using errcode = '22023', message = 'Validated subprocessors require at least one subprocessor';
  end if;
  if v_transfers_status = 'validated' and jsonb_array_length(v_transfers) = 0 then
    raise exception using errcode = '22023', message = 'Validated transfers require at least one transfer record';
  end if;
  if v_decision = 'approved' and (
    not (v_basis_status = any(v_final_statuses)) or not (v_retention_status = any(v_final_statuses))
    or not (v_recipients_status = any(v_final_statuses)) or not (v_subprocessors_status = any(v_final_statuses))
    or not (v_transfers_status = any(v_final_statuses)) or cardinality(v_unknowns) > 0
  ) then
    raise exception using errcode = '23514', message = 'Approved lifecycle review cannot retain unresolved dimensions or unknowns';
  end if;
  if v_decision = 'changes_requested' and cardinality(v_unknowns) = 0
     and v_basis_status = any(v_final_statuses) and v_retention_status = any(v_final_statuses)
     and v_recipients_status = any(v_final_statuses) and v_subprocessors_status = any(v_final_statuses)
     and v_transfers_status = any(v_final_statuses) then
    raise exception using errcode = '23514', message = 'Changes requested review must preserve an unresolved dimension or unknown';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    p_organization_id::text || ':processing-lifecycle:' || p_process_id::text, 21719
  ));

  select review.id, review.snapshot_hash, review.evidence_id, review.version, review.supersedes_id
  into v_existing_review_id, v_existing_hash, v_existing_evidence_id, v_version, v_previous_review_id
  from public.processing_activity_lifecycle_reviews review
  where review.organization_id = p_organization_id and review.request_key = p_request_key
  limit 1 for update;

  if v_existing_review_id is null then
    select review.id, review.version into v_previous_review_id, v_version
    from public.processing_activity_lifecycle_reviews review
    where review.organization_id = p_organization_id and review.process_id = p_process_id
    order by review.version desc limit 1 for update;
    v_version := coalesce(v_version, 0) + 1;
  end if;

  v_snapshot := jsonb_build_object(
    'schemaVersion', 1, 'requestKey', p_request_key, 'organizationId', p_organization_id,
    'projectId', v_project_id, 'caseId', v_case_id, 'controlId', v_control_id,
    'processId', p_process_id, 'processName', v_process_name, 'version', v_version,
    'supersedesId', v_previous_review_id, 'decision', v_decision,
    'basis', jsonb_build_object('status', v_basis_status, 'type', v_basis_type, 'summary', v_basis_summary),
    'retention', jsonb_build_object('status', v_retention_status, 'rule', v_retention_rule, 'trigger', v_retention_trigger, 'period', v_retention_period),
    'recipientsReview', jsonb_build_object('status', v_recipients_status),
    'subprocessorsReview', jsonb_build_object('status', v_subprocessors_status),
    'transfersReview', jsonb_build_object('status', v_transfers_status),
    'recipients', v_recipients, 'subprocessors', v_subprocessors, 'transfers', v_transfers,
    'sourceRefs', v_source_refs, 'unknowns', to_jsonb(v_unknowns), 'reviewNote', v_review_note
  );
  v_snapshot_hash := pg_catalog.encode(extensions.digest(v_snapshot::text, 'sha256'), 'hex');

  if v_existing_review_id is not null then
    if v_existing_hash is distinct from v_snapshot_hash then
      raise exception using errcode = '23514', message = 'Lifecycle review request key already exists with different content';
    end if;
    return jsonb_build_object('requestKey', p_request_key, 'reviewId', v_existing_review_id,
      'evidenceId', v_existing_evidence_id, 'processId', p_process_id, 'version', v_version,
      'decision', v_decision, 'snapshotHash', v_snapshot_hash, 'resumed', true);
  end if;

  select string_agg(coalesce(source_ref ->> 'label', 'Fuente revisada'), ' · ' order by coalesce(source_ref ->> 'label', ''))
  into v_source_label from jsonb_array_elements(v_source_refs) source_ref;

  select public.create_evidence_record(
    p_actor_id, p_organization_id, v_project_id,
    'Revisión de base y ciclo de vida — ' || v_process_name,
    'Snapshot versionado de base, retención, destinatarios, subencargados y transferencias. La evidencia acredita la revisión y sus límites, no cumplimiento integral.',
    'attestation', v_source_label, null, now(), current_date, current_date,
    now() + interval '90 days', v_snapshot_hash, 'restricted', v_control_id
  ) into v_evidence_id;

  update public.evidence
  set validation_status = 'accepted', integrity_status = 'verified',
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'scope', 'processing_activity_lifecycle_review', 'processingLifecycleRequestKey', p_request_key,
        'processId', p_process_id, 'version', v_version, 'decision', v_decision,
        'snapshotHash', v_snapshot_hash, 'snapshot', v_snapshot, 'limitationsPreserved', true
      ), updated_at = now()
  where id = v_evidence_id;

  insert into public.processing_activity_lifecycle_reviews (
    organization_id, project_id, case_id, process_id, evidence_id, control_id,
    request_key, version, supersedes_id, decision, basis_status, retention_status,
    recipients_status, subprocessors_status, transfers_status, basis_type, basis_summary,
    retention_rule, retention_trigger, retention_period, recipients, subprocessors, transfers,
    source_refs, unknowns, review_note, snapshot, snapshot_hash, reviewed_by
  ) values (
    p_organization_id, v_project_id, v_case_id, p_process_id, v_evidence_id, v_control_id,
    p_request_key, v_version, v_previous_review_id, v_decision, v_basis_status, v_retention_status,
    v_recipients_status, v_subprocessors_status, v_transfers_status, v_basis_type, v_basis_summary,
    v_retention_rule, v_retention_trigger, v_retention_period, v_recipients, v_subprocessors,
    v_transfers, v_source_refs, v_unknowns, v_review_note, v_snapshot, v_snapshot_hash, p_actor_id
  ) returning id into v_review_id;

  insert into public.processing_activity_evidence (
    organization_id, project_id, process_id, evidence_id, relationship_type, linked_by
  ) values (p_organization_id, v_project_id, p_process_id, v_evidence_id, 'supporting', p_actor_id)
  on conflict do nothing;

  update public.organization_processes process
  set attributes = coalesce(process.attributes, '{}'::jsonb) || jsonb_build_object(
        'latestLifecycleReviewId', v_review_id, 'lifecycleVersion', v_version,
        'lifecycleDecision', v_decision,
        'lifecycleStatuses', jsonb_build_object('basis', v_basis_status, 'retention', v_retention_status,
          'recipients', v_recipients_status, 'subprocessors', v_subprocessors_status, 'transfers', v_transfers_status),
        'lifecycleUnknowns', to_jsonb(v_unknowns), 'lifecycleReviewedAt', now(),
        'basisStatus', case when v_basis_status = 'validated' then 'validated' else coalesce(process.attributes ->> 'basisStatus', 'proposed') end
      ), updated_at = now()
  where process.id = p_process_id and process.organization_id = p_organization_id;

  update public.organization_datasets dataset
  set attributes = coalesce(dataset.attributes, '{}'::jsonb) || jsonb_build_object(
        'basisStatus', v_basis_status, 'retentionStatus', v_retention_status,
        'recipientsStatus', v_recipients_status, 'subprocessorsStatus', v_subprocessors_status,
        'transfersStatus', v_transfers_status, 'lifecycleReviewId', v_review_id, 'lifecycleVersion', v_version
      ),
      retention_rule = case when v_retention_status = 'validated' and v_retention_rule is not null then v_retention_rule else dataset.retention_rule end,
      updated_at = now()
  from public.organization_process_datasets process_dataset
  where process_dataset.process_id = p_process_id and dataset.id = process_dataset.dataset_id
    and dataset.organization_id = p_organization_id;

  update public.organization_vendors vendor
  set attributes = coalesce(vendor.attributes, '{}'::jsonb) || jsonb_build_object(
        'subprocessorsStatus', v_subprocessors_status, 'transfersStatus', v_transfers_status,
        'lifecycleReviewId', v_review_id, 'lifecycleVersion', v_version
      ), updated_at = now()
  from public.organization_vendor_assets vendor_asset
  join public.organization_process_assets process_asset on process_asset.asset_id = vendor_asset.asset_id
  where process_asset.process_id = p_process_id and vendor.id = vendor_asset.vendor_id
    and vendor.organization_id = p_organization_id;

  if v_case_id is not null then
    insert into public.compliance_case_events (organization_id, case_id, actor_id, event_type, summary, changes)
    values (p_organization_id, v_case_id, p_actor_id, 'processing_activity_lifecycle_reviewed',
      'Base y ciclo de vida del tratamiento revisados', jsonb_build_object(
        'process_id', p_process_id, 'review_id', v_review_id, 'evidence_id', v_evidence_id,
        'request_key', p_request_key, 'version', v_version, 'decision', v_decision,
        'basis_status', v_basis_status, 'retention_status', v_retention_status,
        'recipients_status', v_recipients_status, 'subprocessors_status', v_subprocessors_status,
        'transfers_status', v_transfers_status, 'unknown_count', cardinality(v_unknowns)
      ));
    v_event_created := true;
  end if;

  return jsonb_build_object('requestKey', p_request_key, 'reviewId', v_review_id,
    'evidenceId', v_evidence_id, 'processId', p_process_id, 'version', v_version,
    'decision', v_decision, 'snapshotHash', v_snapshot_hash,
    'unknownCount', cardinality(v_unknowns), 'eventCreated', v_event_created, 'resumed', false);
end;
$function$;

revoke all on function public.review_processing_activity_lifecycle_v1(uuid, uuid, uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.review_processing_activity_lifecycle_v1(uuid, uuid, uuid, uuid, jsonb) to service_role, postgres;
