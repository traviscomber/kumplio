-- Block 16: demonstrate primary-store deletion for the remaining two real
-- processing activities without touching production subject data.
--
-- 1) Account/authentication: create an isolated synthetic Auth user plus
--    identity, session, trigger-created profile and membership; delete the
--    operational records and verify complete primary-store absence.
-- 2) Cases/AI: create a synthetic compliance case plus workflow/run records;
--    delete the case and verify ON DELETE CASCADE removes the synthetic chain.
--
-- These exercises do NOT claim physical backup purge or external-provider
-- deletion. Final deletionEvidenceStatus therefore remains controlled_test_passed.

create or replace function public.run_processing_primary_deletion_exercise_remaining_v1(
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
  v_project_id uuid;
  v_case_scope_id uuid;
  v_control_id uuid;
  v_evidence_id uuid;
  v_existing_evidence_id uuid;
  v_existing_hash text;
  v_existing_request_key text;
  v_before_payload jsonb;
  v_after_payload jsonb;
  v_before_hash text;
  v_after_hash text;
  v_snapshot jsonb;
  v_snapshot_hash text;
  v_target text;
  v_remaining integer := 0;
  v_event_created boolean := false;

  -- Auth probe
  v_user_id uuid;
  v_identity_id uuid;
  v_session_id uuid;
  v_email text;

  -- Case/agent probe
  v_probe_case_id uuid;
  v_workflow_id uuid;
  v_run_id uuid;
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_actor_id
      and member.role in ('owner','admin','compliance')
  ) then
    raise exception using errcode='42501', message='Owner, admin or compliance membership required';
  end if;

  if p_request_key is null then
    raise exception using errcode='22023', message='Primary deletion exercise request key is required';
  end if;

  select process.*
  into v_process
  from public.organization_processes process
  where process.id = p_process_id
    and process.organization_id = p_organization_id
    and process.process_type = 'processing_activity'
    and process.lifecycle_status <> 'retired';

  if v_process.id is null then
    raise exception using errcode='23514', message='Processing activity must belong to the organization';
  end if;

  if v_process.code not in ('TRT-24200B1DEC5E','TRT-EBDC661160F2') then
    raise exception using errcode='23514', message='Primary deletion exercise remaining v1 is scoped to account/auth and case/AI activities';
  end if;

  if v_process.attributes ->> 'controlledDeletionReviewStatus' <> 'validated_controlled' then
    raise exception using errcode='23514', message='Validated controlled deletion mechanism is required first';
  end if;

  select review.project_id, review.case_id, review.control_id
  into v_project_id, v_case_scope_id, v_control_id
  from public.processing_activity_reviews review
  where review.organization_id = p_organization_id
    and review.process_id = p_process_id
  order by review.reviewed_at desc, review.created_at desc
  limit 1;

  if v_project_id is null then
    raise exception using errcode='23514', message='Reviewed processing activity is required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':primary-deletion-exercise:' || p_process_id::text, 21719)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':primary-deletion-exercise-key:' || p_request_key::text, 21719)
  );

  select evidence.id, evidence.integrity_hash, evidence.metadata ->> 'primaryDeletionExerciseRequestKey'
  into v_existing_evidence_id, v_existing_hash, v_existing_request_key
  from public.evidence evidence
  where evidence.organization_id = p_organization_id
    and evidence.project_id = v_project_id
    and evidence.metadata ->> 'scope' = 'processing_primary_deletion_exercise'
    and evidence.metadata ->> 'processId' = p_process_id::text
  order by evidence.created_at
  limit 1
  for update;

  if v_existing_evidence_id is not null then
    return jsonb_build_object(
      'requestKey', coalesce(v_existing_request_key, p_request_key::text),
      'processId', p_process_id,
      'evidenceId', v_existing_evidence_id,
      'snapshotHash', v_existing_hash,
      'status', 'demonstrated_controlled_primary',
      'resumed', true
    );
  end if;

  if v_process.code = 'TRT-24200B1DEC5E' then
    v_target := 'auth.users + auth.identities + auth.sessions + public.profiles + public.organization_members';
    v_user_id := gen_random_uuid();
    v_identity_id := gen_random_uuid();
    v_session_id := gen_random_uuid();
    v_email := 'kumplio-auth-deletion+' || replace(v_user_id::text,'-','') || '@example.invalid';

    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      v_email,
      '',
      now(),
      jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'syntheticProbe',true),
      jsonb_build_object('syntheticProbe',true,'first_name','Synthetic','last_name','Probe'),
      now(), now(), false, false
    );

    if not exists (select 1 from public.profiles profile where profile.id = v_user_id) then
      raise exception using errcode='23514', message='Auth user creation did not create the expected profile';
    end if;

    update public.profiles
    set organization_id = p_organization_id,
        company_name = 'Kumplio Synthetic Control'
    where id = v_user_id;

    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      v_identity_id,
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub',v_user_id::text,'email',v_email,'syntheticProbe',true),
      'email', now(), now(), now()
    );

    insert into auth.sessions (
      id, user_id, created_at, updated_at, user_agent, ip, tag
    ) values (
      v_session_id, v_user_id, now(), now(),
      'kumplio-auth-deletion-probe/1.0', '127.0.0.1', 'synthetic-probe'
    );

    insert into public.organization_members (organization_id,user_id,role)
    values (p_organization_id,v_user_id,'member');

    v_before_payload := jsonb_build_object(
      'synthetic', true,
      'userId', v_user_id,
      'emailHash', pg_catalog.encode(extensions.digest(v_email::bytea,'sha256'),'hex'),
      'authUser', exists(select 1 from auth.users where id=v_user_id),
      'identity', exists(select 1 from auth.identities where user_id=v_user_id),
      'session', exists(select 1 from auth.sessions where user_id=v_user_id),
      'profile', exists(select 1 from public.profiles where id=v_user_id),
      'membership', exists(select 1 from public.organization_members where user_id=v_user_id and organization_id=p_organization_id)
    );
    v_before_hash := pg_catalog.encode(extensions.digest(v_before_payload::text,'sha256'),'hex');

    delete from auth.sessions where id=v_session_id and user_id=v_user_id;
    delete from auth.identities where id=v_identity_id and user_id=v_user_id;
    delete from public.organization_members where organization_id=p_organization_id and user_id=v_user_id;
    delete from auth.users where id=v_user_id and email=v_email;

    select
      (select count(*) from auth.users where id=v_user_id)
      + (select count(*) from auth.identities where user_id=v_user_id)
      + (select count(*) from auth.sessions where user_id=v_user_id)
      + (select count(*) from public.profiles where id=v_user_id)
      + (select count(*) from public.organization_members where user_id=v_user_id)
    into v_remaining;

    if v_remaining <> 0 then
      raise exception using errcode='23514', message='Synthetic account remains observable after primary deletion';
    end if;

    v_after_payload := jsonb_build_object(
      'state','absent_from_primary_store',
      'userId',v_user_id,
      'remainingMatches',v_remaining,
      'verifiedAt',now()
    );

  else
    v_target := 'public.compliance_cases + agent_workflows + agent_runs';

    insert into public.compliance_cases (
      organization_id, project_id, title, description,
      status, priority, created_by, owner_id, metadata
    ) values (
      p_organization_id,
      v_project_id,
      'Synthetic deletion probe case',
      'Synthetic-only case for primary data-plane deletion verification.',
      'draft', 'low', p_actor_id, p_actor_id,
      jsonb_build_object('syntheticProbe',true,'requestKey',p_request_key)
    ) returning id into v_probe_case_id;

    insert into public.agent_workflows (
      organization_id, case_id, created_by, workflow_type,
      status, current_stage, total_stages, input_payload
    ) values (
      p_organization_id, v_probe_case_id, p_actor_id,
      'compliance_assessment', 'draft', 0, 5,
      jsonb_build_object('syntheticProbe',true,'requestKey',p_request_key)
    ) returning id into v_workflow_id;

    insert into public.agent_runs (
      organization_id, case_id, user_id, agent_id,
      status, task, context_text, input_payload
    ) values (
      p_organization_id, v_probe_case_id, p_actor_id, 'catalina',
      'queued', 'Synthetic deletion verification',
      'Synthetic-only context. No production subject data.',
      jsonb_build_object('syntheticProbe',true,'requestKey',p_request_key)
    ) returning id into v_run_id;

    v_before_payload := jsonb_build_object(
      'synthetic',true,
      'caseId',v_probe_case_id,
      'workflowId',v_workflow_id,
      'runId',v_run_id,
      'casePresent',exists(select 1 from public.compliance_cases where id=v_probe_case_id),
      'workflowPresent',exists(select 1 from public.agent_workflows where id=v_workflow_id),
      'runPresent',exists(select 1 from public.agent_runs where id=v_run_id)
    );
    v_before_hash := pg_catalog.encode(extensions.digest(v_before_payload::text,'sha256'),'hex');

    delete from public.compliance_cases
    where id=v_probe_case_id and organization_id=p_organization_id;

    select
      (select count(*) from public.compliance_cases where id=v_probe_case_id)
      + (select count(*) from public.agent_workflows where id=v_workflow_id)
      + (select count(*) from public.agent_runs where id=v_run_id)
    into v_remaining;

    if v_remaining <> 0 then
      raise exception using errcode='23514', message='Synthetic case/agent chain remains observable after primary deletion';
    end if;

    v_after_payload := jsonb_build_object(
      'state','absent_from_primary_store',
      'caseId',v_probe_case_id,
      'workflowId',v_workflow_id,
      'runId',v_run_id,
      'remainingMatches',v_remaining,
      'verifiedAt',now()
    );
  end if;

  v_after_hash := pg_catalog.encode(extensions.digest(v_after_payload::text,'sha256'),'hex');

  v_snapshot := jsonb_build_object(
    'schemaVersion',1,
    'requestKey',p_request_key,
    'organizationId',p_organization_id,
    'projectId',v_project_id,
    'caseId',v_case_scope_id,
    'controlId',v_control_id,
    'processId',p_process_id,
    'processCode',v_process.code,
    'processName',v_process.name,
    'target',v_target,
    'syntheticRecord',true,
    'productionSubjectDataTouched',false,
    'method','deletion',
    'provider',case when v_process.code='TRT-24200B1DEC5E' then 'Supabase Auth / Supabase Postgres' else 'Kumplio / Supabase Postgres' end,
    'beforeHash',v_before_hash,
    'afterHash',v_after_hash,
    'primaryStoreRemainingMatches',v_remaining,
    'primaryStoreDeletionDemonstrated',true,
    'backupPurgeDemonstrated',false,
    'externalProcessorPropagationDemonstrated',false,
    'limitation',case
      when v_process.code='TRT-24200B1DEC5E' then 'Demuestra eliminación de una cuenta sintética y sus registros primarios de identidad, sesión, perfil y membresía. No demuestra purga física de backups del proveedor.'
      else 'Demuestra eliminación de un expediente sintético y la cascada primaria de workflow/run. No invoca ni demuestra eliminación en OpenAI ni purga física de backups.'
    end
  );
  v_snapshot_hash := pg_catalog.encode(extensions.digest(v_snapshot::text,'sha256'),'hex');

  select public.create_evidence_record(
    p_actor_id,
    p_organization_id,
    v_project_id,
    left('Eliminación primaria operativa — ' || v_process.name,180),
    'Ejercicio controlado sobre el data plane productivo real con registros sintéticos. Demuestra ausencia posterior en el almacén primario y conserva límites explícitos sobre backups y terceros.',
    'attestation',
    'kumplio://primary-deletion-exercise/' || p_request_key::text,
    null,
    now(), current_date, current_date, now() + interval '90 days',
    v_snapshot_hash,
    'restricted',
    v_control_id
  ) into v_evidence_id;

  update public.evidence evidence
  set validation_status='accepted',
      integrity_status='verified',
      metadata=coalesce(evidence.metadata,'{}'::jsonb) || jsonb_build_object(
        'scope','processing_primary_deletion_exercise',
        'primaryDeletionExerciseRequestKey',p_request_key,
        'processId',p_process_id,
        'target',v_target,
        'method','deletion',
        'snapshotHash',v_snapshot_hash,
        'snapshot',v_snapshot,
        'primaryStoreDeletionDemonstrated',true,
        'backupPurgeDemonstrated',false,
        'externalProcessorPropagationDemonstrated',false,
        'productionSubjectDataTouched',false,
        'limitationsPreserved',true
      ),
      updated_at=now()
  where evidence.id=v_evidence_id
    and evidence.organization_id=p_organization_id;

  insert into public.processing_activity_evidence (
    organization_id,project_id,process_id,evidence_id,relationship_type,linked_by
  ) values (
    p_organization_id,v_project_id,p_process_id,v_evidence_id,'supporting',p_actor_id
  ) on conflict do nothing;

  update public.organization_processes process
  set attributes=coalesce(process.attributes,'{}'::jsonb) || jsonb_build_object(
        'primaryDeletionOperationalStatus','demonstrated_controlled_primary',
        'primaryDeletionOperationalEvidenceId',v_evidence_id,
        'primaryDeletionOperationalSnapshotHash',v_snapshot_hash,
        'primaryDeletionOperationalExecutedAt',now(),
        'primaryDeletionOperationalTarget',v_target,
        'deletionEvidenceStatus','controlled_test_passed'
      ),
      updated_at=now()
  where process.id=p_process_id
    and process.organization_id=p_organization_id;

  if v_case_scope_id is not null then
    insert into public.compliance_case_events (
      organization_id,case_id,actor_id,event_type,summary,changes
    ) values (
      p_organization_id,v_case_scope_id,p_actor_id,
      'processing_primary_deletion_exercise_passed',
      'Eliminación operativa demostrada en el almacén primario con datos sintéticos',
      jsonb_build_object(
        'process_id',p_process_id,
        'request_key',p_request_key,
        'evidence_id',v_evidence_id,
        'target',v_target,
        'primary_store_deletion_demonstrated',true,
        'backup_purge_demonstrated',false,
        'external_processor_propagation_demonstrated',false,
        'production_subject_data_touched',false,
        'snapshot_hash',v_snapshot_hash
      )
    );
    v_event_created := true;
  end if;

  return jsonb_build_object(
    'requestKey',p_request_key,
    'processId',p_process_id,
    'evidenceId',v_evidence_id,
    'target',v_target,
    'beforeHash',v_before_hash,
    'afterHash',v_after_hash,
    'snapshotHash',v_snapshot_hash,
    'remainingMatches',v_remaining,
    'status','demonstrated_controlled_primary',
    'backupPurgeDemonstrated',false,
    'externalProcessorPropagationDemonstrated',false,
    'eventCreated',v_event_created,
    'resumed',false
  );
end;
$function$;

revoke all on function public.run_processing_primary_deletion_exercise_remaining_v1(
  uuid,uuid,uuid,uuid
) from public,anon,authenticated;

grant execute on function public.run_processing_primary_deletion_exercise_remaining_v1(
  uuid,uuid,uuid,uuid
) to service_role,postgres;
