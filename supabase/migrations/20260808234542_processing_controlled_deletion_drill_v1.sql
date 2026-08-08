-- Block 16: controlled deletion/anonymization drill.
--
-- This proves a bounded mechanism against synthetic probe data only. It does
-- not touch production subject data, prove backup purge, or prove propagation
-- to external processors. The related deletion request remains submitted for
-- human review rather than being auto-accepted.

create table if not exists public.processing_deletion_drills (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  process_id uuid not null references public.organization_processes(id) on delete cascade,
  evidence_request_id uuid not null references public.evidence_requests(id) on delete cascade,
  evidence_id uuid references public.evidence(id) on delete set null,
  request_key uuid not null,
  status text not null default 'prepared' check (status in ('prepared','passed_controlled_test','failed_controlled_test')),
  method text not null default 'anonymization' check (method in ('anonymization','deletion')),
  provider text not null,
  target_label text not null,
  before_hash text,
  after_hash text,
  verification jsonb not null default '{}'::jsonb,
  limitations jsonb not null default '[]'::jsonb,
  executed_by uuid references auth.users(id) on delete set null,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, request_key)
);

create unique index if not exists processing_deletion_drills_process_request_idx
  on public.processing_deletion_drills(process_id, evidence_request_id);

alter table public.processing_deletion_drills enable row level security;
revoke all on table public.processing_deletion_drills from public, anon, authenticated;
grant select, insert, update, delete on table public.processing_deletion_drills to service_role, postgres;

drop policy if exists processing_deletion_drills_browser_deny on public.processing_deletion_drills;
create policy processing_deletion_drills_browser_deny
  on public.processing_deletion_drills for all to anon, authenticated
  using (false) with check (false);

create table if not exists public.processing_deletion_probe_records (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  process_id uuid not null references public.organization_processes(id) on delete cascade,
  drill_id uuid not null references public.processing_deletion_drills(id) on delete cascade,
  synthetic_payload jsonb not null,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  unique (drill_id)
);

alter table public.processing_deletion_probe_records enable row level security;
revoke all on table public.processing_deletion_probe_records from public, anon, authenticated;
grant select, insert, update, delete on table public.processing_deletion_probe_records to service_role, postgres;

drop policy if exists processing_deletion_probe_records_browser_deny on public.processing_deletion_probe_records;
create policy processing_deletion_probe_records_browser_deny
  on public.processing_deletion_probe_records for all to anon, authenticated
  using (false) with check (false);

create or replace function public.run_processing_controlled_deletion_drill_v1(
  p_actor_id uuid,
  p_organization_id uuid,
  p_process_id uuid,
  p_request_key uuid
)
returns jsonb
language plpgsql
set search_path to ''
as $function$
declare
  v_process public.organization_processes;
  v_request public.evidence_requests;
  v_project_id uuid;
  v_case_id uuid;
  v_control_id uuid;
  v_mission_id uuid;
  v_drill_id uuid;
  v_probe_id uuid;
  v_evidence_id uuid;
  v_existing_process_id uuid;
  v_existing_request_id uuid;
  v_synthetic_subject text;
  v_synthetic_email text;
  v_synthetic_secret text;
  v_before_payload jsonb;
  v_after_payload jsonb;
  v_before_hash text;
  v_after_hash text;
  v_source text;
  v_event_created boolean := false;
begin
  if p_actor_id is null or not exists (
    select 1 from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
      and member.role in ('owner','admin','compliance')
  ) then
    raise exception using errcode='42501', message='Owner, admin or compliance membership required';
  end if;

  if p_request_key is null then
    raise exception using errcode='22023', message='Controlled deletion drill request key is required';
  end if;

  select process.* into v_process
  from public.organization_processes process
  where process.id=p_process_id
    and process.organization_id=p_organization_id
    and process.process_type='processing_activity'
    and process.lifecycle_status='active';

  if v_process.id is null then
    raise exception using errcode='23514', message='Processing activity must belong to the organization';
  end if;

  if v_process.attributes ->> 'privacyNoticeMappingStatus' not in ('accepted_with_gaps','accepted_complete') then
    raise exception using errcode='23514', message='Accepted notice mapping is required before a controlled deletion drill';
  end if;

  begin
    select (v_process.attributes ->> 'privacyRemediationMissionId')::uuid,
           (v_process.attributes ->> 'deletionEvidenceRequestId')::uuid
      into v_mission_id, v_existing_request_id;
  exception when others then
    raise exception using errcode='23514', message='Privacy remediation mission and deletion request are required';
  end;

  if v_existing_request_id is null then
    raise exception using errcode='23514', message='Deletion evidence request is required';
  end if;

  select request.* into v_request
  from public.evidence_requests request
  where request.id=v_existing_request_id
    and request.organization_id=p_organization_id
  for update;

  if v_request.id is null then
    raise exception using errcode='23514', message='Deletion evidence request must belong to the organization';
  end if;

  if v_request.status not in ('open','changes_requested','submitted','under_review') then
    raise exception using errcode='23514', message='Deletion evidence request is not available for a controlled drill';
  end if;

  v_project_id := v_request.project_id;
  v_case_id := v_request.case_id;
  v_control_id := v_request.control_id;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':controlled-deletion-drill:' || p_process_id::text, 21719)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':controlled-deletion-drill-request:' || p_request_key::text, 21719)
  );

  select drill.id, drill.process_id, drill.evidence_request_id, drill.evidence_id
    into v_drill_id, v_existing_process_id, v_existing_request_id, v_evidence_id
  from public.processing_deletion_drills drill
  where drill.organization_id=p_organization_id
    and drill.request_key=p_request_key
  for update;

  if v_drill_id is not null then
    if v_existing_process_id <> p_process_id or v_existing_request_id <> v_request.id then
      raise exception using errcode='23514', message='Controlled deletion drill request key already belongs to another activity';
    end if;
    return jsonb_build_object(
      'drillId', v_drill_id,
      'evidenceId', v_evidence_id,
      'evidenceRequestId', v_request.id,
      'status', 'passed_controlled_test',
      'resumed', true
    );
  end if;

  insert into public.processing_deletion_drills(
    organization_id, project_id, process_id, evidence_request_id, request_key,
    status, method, provider, target_label, executed_by
  ) values (
    p_organization_id, v_project_id, p_process_id, v_request.id, p_request_key,
    'prepared', 'anonymization', 'Kumplio / Supabase Postgres',
    'controlled_synthetic_probe', p_actor_id
  ) returning id into v_drill_id;

  v_synthetic_subject := 'probe-subject-' || v_drill_id::text;
  v_synthetic_email := 'kumplio-deletion-probe+' || replace(v_drill_id::text,'-','') || '@example.invalid';
  v_synthetic_secret := 'synthetic-only-' || p_request_key::text;
  v_before_payload := jsonb_build_object(
    'synthetic', true,
    'subject', v_synthetic_subject,
    'email', v_synthetic_email,
    'secret', v_synthetic_secret,
    'processId', p_process_id,
    'scope', 'controlled_synthetic_probe'
  );
  v_before_hash := pg_catalog.encode(extensions.digest(v_before_payload::text,'sha256'),'hex');

  insert into public.processing_deletion_probe_records(
    organization_id, process_id, drill_id, synthetic_payload
  ) values (
    p_organization_id, p_process_id, v_drill_id, v_before_payload
  ) returning id into v_probe_id;

  v_after_payload := jsonb_build_object(
    'synthetic', true,
    'state', 'anonymized',
    'processId', p_process_id,
    'scope', 'controlled_synthetic_probe',
    'drillId', v_drill_id
  );
  v_after_hash := pg_catalog.encode(extensions.digest(v_after_payload::text,'sha256'),'hex');

  update public.processing_deletion_probe_records probe
  set synthetic_payload=v_after_payload,
      anonymized_at=now()
  where probe.id=v_probe_id
    and probe.organization_id=p_organization_id;

  if exists (
    select 1 from public.processing_deletion_probe_records probe
    where probe.id=v_probe_id
      and (
        probe.synthetic_payload::text like '%' || v_synthetic_subject || '%'
        or probe.synthetic_payload::text like '%' || v_synthetic_email || '%'
        or probe.synthetic_payload::text like '%' || v_synthetic_secret || '%'
      )
  ) then
    update public.processing_deletion_drills
    set status='failed_controlled_test', updated_at=now()
    where id=v_drill_id;
    raise exception using errcode='23514', message='Controlled deletion drill failed to remove synthetic identifiers';
  end if;

  v_source := 'kumplio://controlled-deletion-drill/' || v_drill_id::text;

  select public.create_evidence_record(
    p_actor_id,
    p_organization_id,
    v_project_id,
    left('Drill controlado de anonimización — ' || v_process.name, 180),
    'Prueba sintética del mecanismo de anonimización en la base primaria. No toca datos reales de titulares, no demuestra purga de backups y no acredita propagación a procesadores externos.',
    'attestation',
    v_source,
    null,
    now(),
    current_date,
    current_date,
    now() + interval '90 days',
    v_after_hash,
    'internal',
    v_control_id
  ) into v_evidence_id;

  update public.evidence evidence
  set metadata=coalesce(evidence.metadata,'{}'::jsonb) || jsonb_build_object(
        'scope','controlled_deletion_drill',
        'drillId',v_drill_id,
        'processId',p_process_id,
        'probeId',v_probe_id,
        'method','anonymization',
        'provider','Kumplio / Supabase Postgres',
        'target','controlled_synthetic_probe',
        'beforeHash',v_before_hash,
        'afterHash',v_after_hash,
        'syntheticIdentifiersRemoved',true,
        'productionSubjectDataTouched',false,
        'backup_purga_programada','not_applicable_to_controlled_probe',
        'backup_purga_confirmada','not_applicable_to_controlled_probe',
        'externalProcessorPropagation','not_tested',
        'limitation','Este drill valida el mecanismo sobre un probe sintético en la base primaria; no demuestra eliminación real de titulares ni backups/proveedores.'
      ),
      updated_at=now()
  where evidence.id=v_evidence_id
    and evidence.organization_id=p_organization_id;

  if v_request.status in ('open','changes_requested') then
    perform public.submit_evidence_request_record(
      p_actor_id,
      p_organization_id,
      v_request.id,
      v_evidence_id,
      'Drill controlado completado. Se entrega evidencia para revisión sin afirmar eliminación real de datos productivos.'
    );
  end if;

  update public.processing_deletion_drills
  set evidence_id=v_evidence_id,
      status='passed_controlled_test',
      before_hash=v_before_hash,
      after_hash=v_after_hash,
      verification=jsonb_build_object(
        'syntheticIdentifiersRemoved',true,
        'probeAnonymized',true,
        'requestSubmitted',true,
        'productionSubjectDataTouched',false
      ),
      limitations=jsonb_build_array(
        'No demuestra eliminación de datos reales de titulares.',
        'No prueba purga de backups.',
        'No prueba propagación a proveedores o subencargados externos.'
      ),
      executed_at=now(),
      updated_at=now()
  where id=v_drill_id;

  update public.organization_processes process
  set attributes=coalesce(process.attributes,'{}'::jsonb) || jsonb_build_object(
        'controlledDeletionDrillId',v_drill_id,
        'controlledDeletionEvidenceId',v_evidence_id,
        'controlledDeletionDrillStatus','passed_controlled_test',
        'deletionEvidenceStatus','controlled_test_passed'
      ),
      updated_at=now()
  where process.id=p_process_id
    and process.organization_id=p_organization_id;

  if v_mission_id is not null then
    update public.missions mission
    set metadata=coalesce(mission.metadata,'{}'::jsonb) || jsonb_build_object(
          'controlledDeletionDrillId',v_drill_id,
          'controlledDeletionEvidenceId',v_evidence_id,
          'controlledDeletionDrillStatus','passed_controlled_test',
          'deletionEvidenceStatus','controlled_test_passed'
        ), updated_at=now()
    where mission.id=v_mission_id
      and mission.organization_id=p_organization_id;
  end if;

  if v_case_id is not null and not exists (
    select 1 from public.compliance_case_events event
    where event.organization_id=p_organization_id
      and event.case_id=v_case_id
      and event.event_type='processing_controlled_deletion_drill_submitted'
      and event.changes->>'drill_id'=v_drill_id::text
  ) then
    insert into public.compliance_case_events(
      organization_id,case_id,actor_id,event_type,summary,changes
    ) values (
      p_organization_id,v_case_id,p_actor_id,
      'processing_controlled_deletion_drill_submitted',
      'Drill controlado de anonimización entregado para revisión',
      jsonb_build_object(
        'drill_id',v_drill_id,
        'process_id',p_process_id,
        'evidence_id',v_evidence_id,
        'request_id',v_request.id,
        'status','passed_controlled_test',
        'production_subject_data_touched',false,
        'external_processor_propagation','not_tested'
      )
    );
    v_event_created := true;
  end if;

  return jsonb_build_object(
    'drillId',v_drill_id,
    'probeId',v_probe_id,
    'evidenceId',v_evidence_id,
    'evidenceRequestId',v_request.id,
    'status','passed_controlled_test',
    'requestStatus','submitted',
    'beforeHash',v_before_hash,
    'afterHash',v_after_hash,
    'eventCreated',v_event_created,
    'resumed',false
  );
end;
$function$;

revoke all on function public.run_processing_controlled_deletion_drill_v1(uuid,uuid,uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.run_processing_controlled_deletion_drill_v1(uuid,uuid,uuid,uuid)
  to service_role, postgres;
