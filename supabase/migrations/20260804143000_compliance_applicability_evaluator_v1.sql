create schema if not exists private;

create or replace function private.evaluate_compliance_conditions(
  p_profile jsonb,
  p_conditions jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_key text;
  v_value jsonb;
  v_item jsonb;
  v_result jsonb;
  v_reasons jsonb := '[]'::jsonb;
  v_unknown boolean := false;
  v_match boolean := true;
  v_any_match boolean;
  v_any_unknown boolean;
  v_actual_numeric numeric;
  v_expected_numeric numeric;
begin
  if p_conditions is null or p_conditions = '{}'::jsonb then
    return jsonb_build_object('status', 'match', 'reasons', jsonb_build_array(jsonb_build_object('kind', 'no_conditions')));
  end if;

  if jsonb_typeof(p_conditions) <> 'object' then
    return jsonb_build_object('status', 'needs_review', 'reasons', jsonb_build_array(jsonb_build_object('kind', 'invalid_conditions_shape')));
  end if;

  for v_key, v_value in select key, value from jsonb_each(p_conditions)
  loop
    if v_key = 'all' then
      if jsonb_typeof(v_value) <> 'array' then
        v_unknown := true;
        v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'invalid_all_shape'));
      else
        for v_item in select value from jsonb_array_elements(v_value)
        loop
          v_result := private.evaluate_compliance_conditions(p_profile, v_item);
          v_reasons := v_reasons || coalesce(v_result->'reasons', '[]'::jsonb);
          if v_result->>'status' = 'no_match' then v_match := false; end if;
          if v_result->>'status' = 'needs_review' then v_unknown := true; end if;
        end loop;
      end if;

    elsif v_key = 'any' then
      if jsonb_typeof(v_value) <> 'array' then
        v_unknown := true;
        v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'invalid_any_shape'));
      else
        v_any_match := false;
        v_any_unknown := false;
        for v_item in select value from jsonb_array_elements(v_value)
        loop
          v_result := private.evaluate_compliance_conditions(p_profile, v_item);
          v_reasons := v_reasons || coalesce(v_result->'reasons', '[]'::jsonb);
          if v_result->>'status' = 'match' then v_any_match := true; end if;
          if v_result->>'status' = 'needs_review' then v_any_unknown := true; end if;
        end loop;
        if not v_any_match then
          if v_any_unknown then v_unknown := true; else v_match := false; end if;
        end if;
      end if;

    elsif v_key = 'industry_any' then
      if jsonb_typeof(v_value) <> 'array' then
        v_unknown := true;
      elsif not exists (
        select 1
        from jsonb_array_elements_text(coalesce(p_profile->'industry_codes', '[]'::jsonb)) actual
        join jsonb_array_elements_text(v_value) expected on lower(actual.value) = lower(expected.value)
      ) then
        v_match := false;
      end if;
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', v_key, 'expected', v_value, 'actual', coalesce(p_profile->'industry_codes', '[]'::jsonb)));

    elsif v_key = 'region_any' then
      if jsonb_typeof(v_value) <> 'array' then
        v_unknown := true;
      elsif not exists (
        select 1
        from jsonb_array_elements_text(coalesce(p_profile->'regions', '[]'::jsonb)) actual
        join jsonb_array_elements_text(v_value) expected on lower(actual.value) = lower(expected.value)
      ) then
        v_match := false;
      end if;
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', v_key, 'expected', v_value, 'actual', coalesce(p_profile->'regions', '[]'::jsonb)));

    elsif v_key in ('employee_count_min', 'employee_count_max', 'annual_revenue_clp_min', 'annual_revenue_clp_max') then
      begin
        v_expected_numeric := (v_value #>> '{}')::numeric;
      exception when others then
        v_unknown := true;
        v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', v_key, 'error', 'invalid_expected_number'));
        continue;
      end;

      if v_key like 'employee_count%' then
        if p_profile->>'employee_count' is null then
          v_unknown := true;
          v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', v_key, 'error', 'missing_profile_value'));
          continue;
        end if;
        v_actual_numeric := (p_profile->>'employee_count')::numeric;
      else
        if p_profile->>'annual_revenue_clp' is null then
          v_unknown := true;
          v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', v_key, 'error', 'missing_profile_value'));
          continue;
        end if;
        v_actual_numeric := (p_profile->>'annual_revenue_clp')::numeric;
      end if;

      if v_key like '%_min' and v_actual_numeric < v_expected_numeric then v_match := false; end if;
      if v_key like '%_max' and v_actual_numeric > v_expected_numeric then v_match := false; end if;
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', v_key, 'expected', v_expected_numeric, 'actual', v_actual_numeric));

    elsif v_key in ('activities_contains', 'processes_contains', 'permits_contains') then
      if jsonb_typeof(v_value) <> 'array' then
        v_unknown := true;
      elsif not coalesce(p_profile->replace(v_key, '_contains', ''), '[]'::jsonb) @> v_value then
        v_match := false;
      end if;
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', v_key, 'expected', v_value, 'actual', coalesce(p_profile->replace(v_key, '_contains', ''), '[]'::jsonb)));

    elsif v_key = 'attributes_contains' then
      if jsonb_typeof(v_value) <> 'object' then
        v_unknown := true;
      elsif not coalesce(p_profile->'attributes', '{}'::jsonb) @> v_value then
        v_match := false;
      end if;
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', v_key, 'expected', v_value, 'actual', coalesce(p_profile->'attributes', '{}'::jsonb)));

    else
      v_unknown := true;
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'unknown_condition', 'key', v_key));
    end if;
  end loop;

  if not v_match then
    return jsonb_build_object('status', 'no_match', 'reasons', v_reasons);
  elsif v_unknown then
    return jsonb_build_object('status', 'needs_review', 'reasons', v_reasons);
  end if;

  return jsonb_build_object('status', 'match', 'reasons', v_reasons);
end;
$$;

revoke all on function private.evaluate_compliance_conditions(jsonb, jsonb) from public, anon, authenticated;
grant execute on function private.evaluate_compliance_conditions(jsonb, jsonb) to service_role;

create or replace function public.run_regulatory_impact(
  p_impact_run_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_run public.regulatory_impact_runs%rowtype;
  v_profile public.organization_compliance_profiles%rowtype;
  v_rule public.compliance_applicability_rules%rowtype;
  v_eval jsonb;
  v_status text;
  v_assignment public.organization_obligation_assignments%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_assignment_key text;
  v_priority text;
  v_due_date date;
  v_recurrence text;
  v_created integer := 0;
  v_updated integer := 0;
  v_unchanged integer := 0;
  v_review integer := 0;
  v_not_applicable integer := 0;
begin
  select * into v_run
  from public.regulatory_impact_runs
  where id = p_impact_run_id
  for update;

  if not found then raise exception 'impact_run_not_found'; end if;
  if v_run.status in ('succeeded', 'unchanged') then return v_run.metrics; end if;
  if v_run.organization_id is null or v_run.profile_id is null then raise exception 'impact_run_scope_required'; end if;

  select * into v_profile
  from public.organization_compliance_profiles
  where id = v_run.profile_id
    and organization_id = v_run.organization_id
    and status = 'active'
    and effective_to is null;

  if not found then raise exception 'active_profile_not_found'; end if;

  update public.regulatory_impact_runs
  set status = 'running', started_at = coalesce(started_at, now()), error_code = null, error_detail = null
  where id = p_impact_run_id;

  for v_rule in
    select r.*
    from public.compliance_applicability_rules r
    left join public.regulatory_claims c on c.id = r.claim_id
    where r.validation_status = 'validated'
      and (r.effective_from is null or r.effective_from <= current_date)
      and (r.effective_to is null or r.effective_to >= current_date)
      and (r.claim_id is null or c.validation_status = 'validated')
    order by r.rule_key, r.rule_version
  loop
    v_eval := private.evaluate_compliance_conditions(to_jsonb(v_profile), v_rule.conditions);
    v_status := case v_eval->>'status'
      when 'match' then case when v_rule.requires_human_review then 'needs_review' else 'applicable' end
      when 'no_match' then 'not_applicable'
      else 'needs_review'
    end;

    v_assignment_key := encode(extensions.digest(v_profile.organization_id::text || ':' || v_rule.rule_key, 'sha256'), 'hex');
    v_priority := case when v_rule.outcome->>'priority' in ('low','medium','high','critical') then v_rule.outcome->>'priority' else 'medium' end;
    v_recurrence := nullif(v_rule.outcome->>'recurrence_rule', '');
    v_due_date := case
      when v_rule.outcome ? 'due_date' then (v_rule.outcome->>'due_date')::date
      when v_rule.outcome ? 'due_in_days' then current_date + greatest(0, (v_rule.outcome->>'due_in_days')::integer)
      else null
    end;

    select * into v_assignment
    from public.organization_obligation_assignments
    where organization_id = v_profile.organization_id and assignment_key = v_assignment_key
    for update;

    if found then
      v_before := to_jsonb(v_assignment);
      update public.organization_obligation_assignments
      set profile_id = v_profile.id,
          claim_id = v_rule.claim_id,
          applicability_rule_id = v_rule.id,
          applicability_status = v_status,
          compliance_status = case when v_status = 'not_applicable' then 'not_applicable' when compliance_status = 'not_applicable' then 'not_assessed' else compliance_status end,
          priority = v_priority,
          due_date = v_due_date,
          recurrence_rule = v_recurrence,
          applicability_reason = v_eval || jsonb_build_object('rule_key', v_rule.rule_key, 'rule_version', v_rule.rule_version),
          source_snapshot = jsonb_build_object('profile_version', v_profile.profile_version, 'rule_content_hash', v_rule.content_hash, 'claim_id', v_rule.claim_id),
          last_evaluated_at = now(),
          superseded_at = null,
          updated_at = now()
      where id = v_assignment.id
      returning * into v_assignment;
      v_after := to_jsonb(v_assignment);

      if v_before - array['last_evaluated_at','updated_at']::text[] is distinct from v_after - array['last_evaluated_at','updated_at']::text[] then
        insert into public.regulatory_impact_changes(impact_run_id, organization_id, assignment_id, change_kind, before_state, after_state, reason)
        values (p_impact_run_id, v_profile.organization_id, v_assignment.id,
          case when v_status = 'needs_review' then 'review_required' else 'assignment_updated' end,
          v_before, v_after, v_eval);
        v_updated := v_updated + 1;
      else
        v_unchanged := v_unchanged + 1;
      end if;
    else
      insert into public.organization_obligation_assignments(
        organization_id, profile_id, claim_id, applicability_rule_id, assignment_key,
        applicability_status, compliance_status, priority, due_date, recurrence_rule,
        applicability_reason, source_snapshot
      ) values (
        v_profile.organization_id, v_profile.id, v_rule.claim_id, v_rule.id, v_assignment_key,
        v_status, case when v_status = 'not_applicable' then 'not_applicable' else 'not_assessed' end,
        v_priority, v_due_date, v_recurrence,
        v_eval || jsonb_build_object('rule_key', v_rule.rule_key, 'rule_version', v_rule.rule_version),
        jsonb_build_object('profile_version', v_profile.profile_version, 'rule_content_hash', v_rule.content_hash, 'claim_id', v_rule.claim_id)
      ) returning * into v_assignment;

      insert into public.regulatory_impact_changes(impact_run_id, organization_id, assignment_id, change_kind, after_state, reason)
      values (p_impact_run_id, v_profile.organization_id, v_assignment.id,
        case when v_status = 'needs_review' then 'review_required' else 'assignment_created' end,
        to_jsonb(v_assignment), v_eval);
      v_created := v_created + 1;
    end if;

    if v_status = 'needs_review' then v_review := v_review + 1; end if;
    if v_status = 'not_applicable' then v_not_applicable := v_not_applicable + 1; end if;
  end loop;

  update public.regulatory_impact_runs
  set status = case when v_created = 0 and v_updated = 0 then 'unchanged' else 'succeeded' end,
      metrics = jsonb_build_object(
        'created', v_created,
        'updated', v_updated,
        'unchanged', v_unchanged,
        'needs_review', v_review,
        'not_applicable', v_not_applicable,
        'engine_version', engine_version
      ),
      finished_at = now()
  where id = p_impact_run_id
  returning metrics into v_after;

  return v_after;
exception when others then
  update public.regulatory_impact_runs
  set status = 'failed', error_code = sqlstate,
      error_detail = jsonb_build_object('message', sqlerrm), finished_at = now()
  where id = p_impact_run_id;
  raise;
end;
$$;

revoke all on function public.run_regulatory_impact(uuid) from public, anon, authenticated;
grant execute on function public.run_regulatory_impact(uuid) to service_role;
