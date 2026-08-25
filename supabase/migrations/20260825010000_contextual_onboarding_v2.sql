begin;

create or replace function public.initialize_contextual_workspace_v2(
  p_actor_user_id uuid,
  p_user_type text,
  p_problem text,
  p_intent text,
  p_urgency text,
  p_documents_available text,
  p_context jsonb,
  p_diagnosis jsonb,
  p_first_name text default null,
  p_last_name text default null
)
returns table(organization_id uuid, project_id uuid, case_id uuid, initialized boolean)
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_actor uuid := p_actor_user_id;
  v_workspace record;
  v_profile_id uuid;
  v_org_name text;
  v_industry text;
  v_size text;
  v_onboarding_key text;
begin
  if v_actor is null or not exists (select 1 from auth.users where id = v_actor) then raise exception 'authentication_required' using errcode = '42501'; end if;
  if p_user_type not in ('persona', 'profesional', 'empresa') then raise exception 'invalid_user_type' using errcode = '22023'; end if;
  if nullif(trim(p_problem), '') is null then raise exception 'problem_required' using errcode = '22023'; end if;
  if coalesce(p_diagnosis->>'evidenceStatus', '') <> 'not_verified' then raise exception 'invalid_evidence_boundary' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended('onboarding:v2:' || v_actor::text, 0));
  perform set_config('request.jwt.claim.sub', v_actor::text, true);
  v_org_name := coalesce(nullif(trim(p_context->>'organizationName'), ''), case p_user_type when 'persona' then 'Espacio personal' when 'profesional' then 'Espacio profesional' else 'Mi organización' end);
  v_industry := coalesce(nullif(p_context->>'industry', ''), 'general');
  v_size := coalesce(nullif(p_context->>'organizationSize', ''), 'micro');
  v_onboarding_key := 'onboarding:v2:' || v_actor::text;

  select * into v_workspace
  from private.initialize_workspace(v_org_name, v_industry, v_size, p_first_name, p_last_name, 'Primer diagnóstico Kumplio', left(p_diagnosis->>'caseTitle', 160));

  if not exists (select 1 from public.organization_members where organization_id = v_workspace.organization_id and user_id = v_actor and role in ('owner','admin','compliance')) then
    raise exception 'workspace_owner_required' using errcode = '42501';
  end if;

  select id into v_profile_id from public.organization_compliance_profiles where organization_id = v_workspace.organization_id and attributes->>'onboardingKey' = v_onboarding_key order by profile_version desc limit 1;
  if v_profile_id is not null then
    update public.organization_compliance_profiles set status = 'superseded', effective_to = now(), updated_at = now() where organization_id = v_workspace.organization_id and status = 'active' and id <> v_profile_id;
    update public.organization_compliance_profiles set status = 'active', effective_to = null, updated_at = now(), attributes = attributes || jsonb_build_object('problem', trim(p_problem), 'intent', p_intent, 'urgency', p_urgency, 'documentsAvailable', p_documents_available, 'context', p_context, 'diagnosis', p_diagnosis) where id = v_profile_id;
  else
    update public.organization_compliance_profiles set status = 'superseded', effective_to = now(), updated_at = now() where organization_id = v_workspace.organization_id and status = 'active';
    insert into public.organization_compliance_profiles(organization_id, profile_version, legal_name, industry_codes, regions, employee_count, attributes, source, status, created_by)
    values (v_workspace.organization_id, coalesce((select max(profile_version) + 1 from public.organization_compliance_profiles where organization_id = v_workspace.organization_id), 1), case when p_user_type = 'empresa' then v_org_name else null end, array[v_industry], case when nullif(p_context->>'region', '') is null then '{}'::text[] else array[p_context->>'region'] end, nullif(p_context->>'workerCount', '')::integer, jsonb_build_object('onboardingKey', v_onboarding_key, 'userType', p_user_type, 'problem', trim(p_problem), 'intent', p_intent, 'urgency', p_urgency, 'documentsAvailable', p_documents_available, 'context', p_context, 'diagnosis', p_diagnosis), 'contextual_onboarding_v2', 'active', v_actor);
  end if;

  update public.compliance_cases
  set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('onboardingKey', v_onboarding_key, 'initialDiagnosis', p_diagnosis, 'userType', p_user_type)
  where id = v_workspace.case_id and organization_id = v_workspace.organization_id;

  insert into public.organization_audit_events(organization_id, actor_user_id, action, resource_type, resource_id, after_state, metadata)
  select v_workspace.organization_id, v_actor, 'contextual_onboarding_initialized', 'compliance_case', v_workspace.case_id,
    jsonb_build_object('userType', p_user_type, 'evidenceStatus', 'not_verified'), jsonb_build_object('onboardingKey', v_onboarding_key)
  where not exists (select 1 from public.organization_audit_events where organization_id = v_workspace.organization_id and metadata->>'onboardingKey' = v_onboarding_key);

  return query select v_workspace.organization_id, v_workspace.project_id, v_workspace.case_id, v_workspace.initialized;
end;
$$;

revoke all on function public.initialize_contextual_workspace_v2(uuid,text,text,text,text,text,jsonb,jsonb,text,text) from public, anon, authenticated;
grant execute on function public.initialize_contextual_workspace_v2(uuid,text,text,text,text,text,jsonb,jsonb,text,text) to service_role;

commit;
