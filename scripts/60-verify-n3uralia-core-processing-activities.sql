-- Read-only production verification for the three supervised N3uralia activities.
-- This script never creates or mutates business records.

begin;
set transaction read only;

do $verify$
declare
  v_organization_id uuid;
  v_actor_id uuid;
  v_account_process_id uuid;
  v_ai_process_id uuid;
  v_account_review_id uuid;
  v_ai_review_id uuid;
  v_account_evidence_id uuid;
  v_ai_evidence_id uuid;
  v_count integer;
  v_total_tokens bigint;
begin
  select count(*)
  into v_count
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia';

  if v_count <> 1 then
    raise exception 'Expected exactly one N3uralia organization, found %.', v_count;
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

  if v_actor_id is null then
    raise exception 'N3uralia has no accountable owner/admin/compliance actor.';
  end if;

  select count(*)
  into v_count
  from public.organization_processes process
  where process.organization_id = v_organization_id
    and process.process_type = 'processing_activity'
    and process.name in (
      'Gestión de contactos comerciales y solicitudes de demostración',
      'Gestión de cuentas, autenticación y acceso al workspace',
      'Gestión de expedientes y análisis asistido por especialistas IA'
    );

  if v_count <> 3 then
    raise exception 'Expected exactly three supervised N3uralia processing activities, found %.', v_count;
  end if;

  select process.id
  into v_account_process_id
  from public.organization_processes process
  where process.organization_id = v_organization_id
    and process.process_type = 'processing_activity'
    and process.name = 'Gestión de cuentas, autenticación y acceso al workspace'
  limit 1;

  select process.id
  into v_ai_process_id
  from public.organization_processes process
  where process.organization_id = v_organization_id
    and process.process_type = 'processing_activity'
    and process.name = 'Gestión de expedientes y análisis asistido por especialistas IA'
  limit 1;

  if v_account_process_id is null or v_ai_process_id is null then
    raise exception 'A core N3uralia processing activity is missing.';
  end if;

  if not exists (
    select 1
    from public.organization_processes process
    where process.id = v_account_process_id
      and process.organization_id = v_organization_id
      and process.owner_user_id = v_actor_id
      and process.criticality = 'high'
      and process.lifecycle_status = 'active'
      and process.attributes ->> 'basisStatus' = 'proposed'
      and process.attributes ->> 'processingRequestKey' = (md5(v_organization_id::text || ':account-auth-access-v1')::uuid)::text
      and process.attributes -> 'source' ->> 'reference' like '%auth.users/auth.identities/auth.sessions/auth.refresh_tokens%'
      and process.attributes -> 'source' ->> 'reference' like '%Supabase security advisor snapshot 2026-08-07%'
  ) then
    raise exception 'Account processing activity source, owner, basis or request key is invalid.';
  end if;

  if not exists (
    select 1
    from public.organization_processes process
    where process.id = v_ai_process_id
      and process.organization_id = v_organization_id
      and process.owner_user_id = v_actor_id
      and process.criticality = 'high'
      and process.lifecycle_status = 'active'
      and process.attributes ->> 'basisStatus' = 'proposed'
      and process.attributes ->> 'processingRequestKey' = (md5(v_organization_id::text || ':guided-cases-ai-specialists-v1')::uuid)::text
      and process.attributes -> 'source' ->> 'reference' like '%lib/agents/openai-runtime.ts%'
      and process.attributes -> 'source' ->> 'reference' like '%lib/agents/workflow-stage-executor.ts%'
  ) then
    raise exception 'AI processing activity source, owner, basis or request key is invalid.';
  end if;

  select count(*)
  into v_count
  from public.processing_activity_reviews review
  where review.organization_id = v_organization_id
    and review.process_id = v_account_process_id;

  if v_count <> 1 then
    raise exception 'Account activity must have exactly one review, found %.', v_count;
  end if;

  select review.id, review.evidence_id
  into v_account_review_id, v_account_evidence_id
  from public.processing_activity_reviews review
  where review.organization_id = v_organization_id
    and review.process_id = v_account_process_id
  limit 1;

  select count(*)
  into v_count
  from public.processing_activity_reviews review
  where review.organization_id = v_organization_id
    and review.process_id = v_ai_process_id;

  if v_count <> 1 then
    raise exception 'AI activity must have exactly one review, found %.', v_count;
  end if;

  select review.id, review.evidence_id
  into v_ai_review_id, v_ai_evidence_id
  from public.processing_activity_reviews review
  where review.organization_id = v_organization_id
    and review.process_id = v_ai_process_id
  limit 1;

  if not exists (
    select 1
    from public.processing_activity_reviews review
    where review.id = v_account_review_id
      and review.organization_id = v_organization_id
      and review.project_id is not null
      and review.case_id is not null
      and review.control_id is not null
      and review.decision = 'approved'
      and review.completeness = 'partial'
      and review.reviewed_by = v_actor_id
      and review.snapshot_hash ~ '^[0-9a-f]{64}$'
      and cardinality(review.unknowns) >= 7
      and 'Verificar y habilitar Leaked Password Protection; el advisor de producción la reportó desactivada el 7 de agosto de 2026.' = any(review.unknowns)
      and 'Procedimiento de cierre, exportación y eliminación de cuenta no evidenciado.' = any(review.unknowns)
  ) then
    raise exception 'Account activity review does not preserve its partial scope and security unknowns.';
  end if;

  if not exists (
    select 1
    from public.processing_activity_reviews review
    where review.id = v_ai_review_id
      and review.organization_id = v_organization_id
      and review.project_id is not null
      and review.case_id is not null
      and review.control_id is not null
      and review.decision = 'approved'
      and review.completeness = 'partial'
      and review.reviewed_by = v_actor_id
      and review.snapshot_hash ~ '^[0-9a-f]{64}$'
      and cardinality(review.unknowns) >= 8
      and 'Política de minimización, redacción y exclusión de secretos antes de enviar contexto no aprobada.' = any(review.unknowns)
      and 'No se ha validado mediante piloto humano que la revisión impida exposición o aprobación indebida de datos.' = any(review.unknowns)
  ) then
    raise exception 'AI activity review does not preserve its partial scope and privacy unknowns.';
  end if;

  if not exists (
    select 1
    from public.evidence evidence_row
    join public.processing_activity_reviews review on review.id = v_account_review_id
    where evidence_row.id = v_account_evidence_id
      and evidence_row.organization_id = v_organization_id
      and evidence_row.validation_status = 'accepted'
      and evidence_row.integrity_status = 'verified'
      and evidence_row.integrity_hash ~ '^[0-9a-f]{64}$'
      and evidence_row.integrity_hash = review.snapshot_hash
  ) then
    raise exception 'Account activity evidence is not accepted and integrity-verified.';
  end if;

  if not exists (
    select 1
    from public.evidence evidence_row
    join public.processing_activity_reviews review on review.id = v_ai_review_id
    where evidence_row.id = v_ai_evidence_id
      and evidence_row.organization_id = v_organization_id
      and evidence_row.validation_status = 'accepted'
      and evidence_row.integrity_status = 'verified'
      and evidence_row.integrity_hash ~ '^[0-9a-f]{64}$'
      and evidence_row.integrity_hash = review.snapshot_hash
  ) then
    raise exception 'AI activity evidence is not accepted and integrity-verified.';
  end if;

  select count(*)
  into v_count
  from public.processing_activity_evidence link
  where link.organization_id = v_organization_id
    and link.process_id in (v_account_process_id, v_ai_process_id);

  if v_count <> 2 then
    raise exception 'Expected two processing-evidence links, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.organization_process_datasets process_dataset
  join public.organization_datasets dataset on dataset.id = process_dataset.dataset_id
  where process_dataset.process_id = v_account_process_id
    and dataset.organization_id = v_organization_id
    and dataset.sensitivity = 'restricted'
    and dataset.cross_border_transfer = true
    and dataset.lifecycle_status = 'active'
    and cardinality(dataset.data_subjects) >= 2
    and cardinality(dataset.data_categories) >= 5
    and dataset.retention_rule like 'Pendiente de definir y aprobar%';

  if v_count <> 1 then
    raise exception 'Account activity must have one complete tenant-scoped dataset, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.organization_process_datasets process_dataset
  join public.organization_datasets dataset on dataset.id = process_dataset.dataset_id
  where process_dataset.process_id = v_ai_process_id
    and dataset.organization_id = v_organization_id
    and dataset.sensitivity = 'restricted'
    and dataset.cross_border_transfer = true
    and dataset.lifecycle_status = 'active'
    and cardinality(dataset.data_subjects) >= 3
    and cardinality(dataset.data_categories) >= 6
    and dataset.retention_rule like 'Pendiente de definir y aprobar%';

  if v_count <> 1 then
    raise exception 'AI activity must have one complete tenant-scoped dataset, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.organization_process_assets process_asset
  join public.organization_assets asset on asset.id = process_asset.asset_id
  join public.organization_vendor_assets vendor_asset on vendor_asset.asset_id = asset.id
  join public.organization_vendors vendor on vendor.id = vendor_asset.vendor_id
  where process_asset.process_id = v_account_process_id
    and asset.organization_id = v_organization_id
    and asset.name = 'Supabase Auth, profiles y organization_members'
    and asset.asset_type = 'identity_access_management_database'
    and asset.hosting_country = 'Estados Unidos (us-east-1)'
    and asset.provider_name = 'Supabase'
    and asset.lifecycle_status = 'active'
    and vendor.organization_id = v_organization_id
    and vendor.name = 'Supabase'
    and vendor.processes_personal_data = true
    and vendor.cross_border_transfer = true
    and vendor.risk_tier = 'medium'
    and vendor.lifecycle_status = 'active';

  if v_count <> 1 then
    raise exception 'Account activity must have one tenant-scoped Supabase asset/vendor chain, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from public.organization_process_assets process_asset
  join public.organization_assets asset on asset.id = process_asset.asset_id
  join public.organization_vendor_assets vendor_asset on vendor_asset.asset_id = asset.id
  join public.organization_vendors vendor on vendor.id = vendor_asset.vendor_id
  where process_asset.process_id = v_ai_process_id
    and asset.organization_id = v_organization_id
    and asset.name = 'Motor de especialistas IA y OpenAI Responses API'
    and asset.asset_type = 'ai_reasoning_service'
    and asset.hosting_country = 'Pendiente de confirmar contractualmente'
    and asset.provider_name = 'OpenAI'
    and asset.lifecycle_status = 'active'
    and vendor.organization_id = v_organization_id
    and vendor.name = 'OpenAI'
    and vendor.processes_personal_data = true
    and vendor.cross_border_transfer = true
    and vendor.risk_tier = 'high'
    and vendor.country = 'Pendiente de confirmar contractualmente'
    and vendor.lifecycle_status = 'active';

  if v_count <> 1 then
    raise exception 'AI activity must have one tenant-scoped OpenAI asset/vendor chain, found %.', v_count;
  end if;

  select count(*)
  into v_count
  from auth.users auth_user
  where auth_user.id = v_actor_id
    and auth_user.email_confirmed_at is not null;

  if v_count <> 1 then
    raise exception 'Account evidence lost the confirmed user.';
  end if;

  select count(*) into v_count from auth.identities identity where identity.user_id = v_actor_id;
  if v_count < 1 then raise exception 'Account evidence lost its identity.'; end if;

  select count(*) into v_count from auth.sessions session_row where session_row.user_id = v_actor_id;
  if v_count < 1 then raise exception 'Account evidence lost all sessions.'; end if;

  select count(*) into v_count from auth.refresh_tokens token where token.user_id::text = v_actor_id::text;
  if v_count < 1 then raise exception 'Account evidence lost all refresh tokens.'; end if;

  select count(*)
  into v_count
  from public.agent_runs run
  where run.organization_id = v_organization_id
    and run.status = 'approved';

  if v_count < 1 then
    raise exception 'AI evidence has no approved run.';
  end if;

  select count(*)
  into v_count
  from public.agent_runs run
  where run.organization_id = v_organization_id
    and nullif(btrim(run.context_text), '') is not null
    and run.output_payload is not null
    and nullif(btrim(run.model), '') is not null
    and coalesce(run.total_tokens, 0) > 0;

  if v_count < 1 then
    raise exception 'AI evidence has no complete context/output/model/usage run.';
  end if;

  select coalesce(sum(run.total_tokens), 0)::bigint
  into v_total_tokens
  from public.agent_runs run
  where run.organization_id = v_organization_id;

  if v_total_tokens < 1 then
    raise exception 'AI evidence has no token usage.';
  end if;

  select count(*) into v_count from public.agent_artifacts artifact where artifact.organization_id = v_organization_id;
  if v_count < 1 then raise exception 'AI evidence has no artifact.'; end if;

  select count(*) into v_count from public.agent_reviews review where review.organization_id = v_organization_id;
  if v_count < 1 then raise exception 'AI evidence has no explicit review.'; end if;

  select count(*) into v_count from public.agent_tool_calls tool_call where tool_call.organization_id = v_organization_id;
  if v_count < 1 then raise exception 'AI evidence has no authorized tool call.'; end if;
end;
$verify$;

with n3uralia as (
  select organization.id
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia'
  limit 1
), activities as (
  select
    process.id,
    process.name,
    process.attributes ->> 'processingRequestKey' as request_key,
    review.decision,
    review.completeness,
    cardinality(review.unknowns) as unknowns,
    review.snapshot_hash,
    evidence_row.validation_status,
    evidence_row.integrity_status,
    dataset.sensitivity,
    dataset.cross_border_transfer,
    asset.name as asset,
    vendor.name as vendor,
    vendor.risk_tier
  from public.organization_processes process
  join public.processing_activity_reviews review on review.process_id = process.id
  join public.evidence evidence_row on evidence_row.id = review.evidence_id
  join public.organization_process_datasets process_dataset on process_dataset.process_id = process.id
  join public.organization_datasets dataset on dataset.id = process_dataset.dataset_id
  join public.organization_process_assets process_asset on process_asset.process_id = process.id
  join public.organization_assets asset on asset.id = process_asset.asset_id
  join public.organization_vendor_assets vendor_asset on vendor_asset.asset_id = asset.id
  join public.organization_vendors vendor on vendor.id = vendor_asset.vendor_id
  where process.organization_id = (select id from n3uralia)
    and process.process_type = 'processing_activity'
), actor as (
  select member.user_id
  from public.organization_members member
  where member.organization_id = (select id from n3uralia)
    and member.role in ('owner', 'admin', 'compliance')
  order by case member.role when 'owner' then 1 when 'admin' then 2 else 3 end, member.joined_at
  limit 1
)
select jsonb_build_object(
  'status', 'passed',
  'organizationId', (select id from n3uralia),
  'activityCount', (select count(*) from activities),
  'activities', (select jsonb_agg(to_jsonb(activities) order by name) from activities),
  'accountEvidence', jsonb_build_object(
    'confirmedUsers', (select count(*) from auth.users where id = (select user_id from actor) and email_confirmed_at is not null),
    'identities', (select count(*) from auth.identities where user_id = (select user_id from actor)),
    'sessions', (select count(*) from auth.sessions where user_id = (select user_id from actor)),
    'refreshTokens', (select count(*) from auth.refresh_tokens where user_id::text = (select user_id::text from actor))
  ),
  'aiEvidence', jsonb_build_object(
    'cases', (select count(*) from public.compliance_cases where organization_id = (select id from n3uralia)),
    'workflows', (select count(*) from public.agent_workflows where organization_id = (select id from n3uralia)),
    'runs', (select count(*) from public.agent_runs where organization_id = (select id from n3uralia)),
    'approvedRuns', (select count(*) from public.agent_runs where organization_id = (select id from n3uralia) and status = 'approved'),
    'artifacts', (select count(*) from public.agent_artifacts where organization_id = (select id from n3uralia)),
    'reviews', (select count(*) from public.agent_reviews where organization_id = (select id from n3uralia)),
    'toolCalls', (select count(*) from public.agent_tool_calls where organization_id = (select id from n3uralia)),
    'totalTokens', (select coalesce(sum(total_tokens), 0) from public.agent_runs where organization_id = (select id from n3uralia))
  )
) as verification;

rollback;
