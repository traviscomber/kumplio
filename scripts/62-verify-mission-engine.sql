-- KUMPLIO — Verificador del Motor de Misiones
-- Falla si falta cualquier tabla, política, índice, trigger, servicio o privilegio crítico.
do $$
declare
  v_missing text;
  v_count integer;
begin
  select string_agg(t,', ' order by t) into v_missing
  from unnest(array[
    'mission_playbooks','mission_capabilities','mission_playbook_capabilities','agent_capabilities',
    'missions','mission_capability_runs','mission_events','mission_results'
  ]) t
  where to_regclass('public.'||t) is null;
  if v_missing is not null then raise exception 'missing_mission_tables: %',v_missing; end if;

  select count(*) into v_count
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in (
    'mission_playbooks','mission_capabilities','mission_playbook_capabilities','agent_capabilities',
    'missions','mission_capability_runs','mission_events','mission_results'
  ) and c.relrowsecurity;
  if v_count<>8 then raise exception 'mission_rls_expected_8_found_%',v_count; end if;

  select count(*) into v_count from pg_policies
  where schemaname='public' and tablename in (
    'mission_playbooks','mission_capabilities','mission_playbook_capabilities','missions',
    'mission_capability_runs','mission_events','mission_results'
  );
  if v_count<7 then raise exception 'mission_policies_expected_at_least_7_found_%',v_count; end if;

  if has_table_privilege('authenticated','public.missions','INSERT')
     or has_table_privilege('authenticated','public.missions','UPDATE')
     or has_table_privilege('authenticated','public.missions','DELETE')
     or has_table_privilege('authenticated','public.mission_events','INSERT')
     or has_table_privilege('authenticated','public.mission_results','INSERT') then
    raise exception 'authenticated_has_forbidden_mission_write_privileges';
  end if;

  if not has_table_privilege('authenticated','public.missions','SELECT')
     or not has_table_privilege('authenticated','public.mission_events','SELECT')
     or not has_table_privilege('authenticated','public.mission_results','SELECT') then
    raise exception 'authenticated_missing_mission_read_privileges';
  end if;

  if has_function_privilege('authenticated','public.create_mission_from_playbook(uuid,uuid,uuid,text,text,uuid,text,uuid,timestamptz,jsonb)','EXECUTE')
     or has_function_privilege('authenticated','public.start_mission(uuid,uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.assign_mission_capability(uuid,text)','EXECUTE')
     or has_function_privilege('authenticated','public.record_mission_result(uuid,text,text,text,jsonb,uuid[],uuid,text,uuid,text)','EXECUTE')
     or has_function_privilege('authenticated','public.review_mission_result(uuid,uuid,text,text)','EXECUTE') then
    raise exception 'authenticated_can_execute_private_mission_services';
  end if;

  if not has_function_privilege('service_role','public.create_mission_from_playbook(uuid,uuid,uuid,text,text,uuid,text,uuid,timestamptz,jsonb)','EXECUTE')
     or not has_function_privilege('service_role','public.start_mission(uuid,uuid)','EXECUTE')
     or not has_function_privilege('service_role','public.assign_mission_capability(uuid,text)','EXECUTE')
     or not has_function_privilege('service_role','public.record_mission_result(uuid,text,text,text,jsonb,uuid[],uuid,text,uuid,text)','EXECUTE')
     or not has_function_privilege('service_role','public.review_mission_result(uuid,uuid,text,text)','EXECUTE') then
    raise exception 'service_role_missing_mission_service_privileges';
  end if;

  if not exists(select 1 from pg_trigger where tgrelid='public.mission_events'::regclass and tgname='mission_events_immutable' and not tgisinternal) then
    raise exception 'mission_events_immutable_trigger_missing';
  end if;
  if not exists(select 1 from pg_trigger where tgrelid='public.mission_results'::regclass and tgname='mission_results_protect_approved' and not tgisinternal) then
    raise exception 'mission_results_protection_trigger_missing';
  end if;

  select count(*) into v_count from public.mission_capabilities
  where capability_key in (
    'detect_obligations','monitor_regulatory_change','prioritize_risk_controls',
    'build_action_plan','review_decision','prepare_audit'
  ) and status='active';
  if v_count<>6 then raise exception 'expected_6_core_capabilities_found_%',v_count; end if;

  if not exists(select 1 from pg_indexes where schemaname='public' and indexname='missions_case_unique_idx') then
    raise exception 'missions_case_unique_idx_missing';
  end if;
  if not exists(select 1 from pg_indexes where schemaname='public' and indexname='mission_events_mission_idx') then
    raise exception 'mission_events_mission_idx_missing';
  end if;
  if not exists(select 1 from pg_indexes where schemaname='public' and indexname='mission_results_mission_idx') then
    raise exception 'mission_results_mission_idx_missing';
  end if;

  if exists(
    select 1
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in ('create_mission_from_playbook','start_mission','assign_mission_capability','record_mission_result','review_mission_result')
      and coalesce(array_to_string(p.proconfig,','),'') not like '%search_path=""%'
  ) then raise exception 'mission_service_without_empty_search_path'; end if;
end $$;

select
  (select count(*) from public.mission_capabilities where status='active') as active_capabilities,
  (select count(*) from pg_policies where schemaname='public' and tablename like 'mission%') as mission_policies,
  'verified' as status;
